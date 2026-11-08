import { describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";
import type { Booking } from "../shared/schema";
import { deliverBookingEmails, hasPendingBookingEmails, recordBookingPayment, recordBookingRefund, type BookingLock } from "../server/services/booking-payment";

function fixture() {
  let booking = { id: 1, amount: 10001, paymentStatus: "unpaid", paymentMetadata: null, transactionId: null } as Booking;
  const store = {
    getBooking: vi.fn(async () => structuredClone(booking)),
    updateBookingTransactionInfo: vi.fn(async (_id: number, patch: object) => {
      booking = { ...booking, ...structuredClone(patch) };
      return structuredClone(booking);
    }),
  };
  let tail: Promise<unknown> = Promise.resolve();
  const lock: BookingLock = (_id, work) => {
    const next = tail.catch(() => undefined).then(work);
    tail = next;
    return next;
  };
  const intent = (id = "pi_deposit", isDeposit = true, amount = 5001) => ({
    id, status: "succeeded", currency: "usd", amount, amount_received: amount,
    metadata: { bookingId: "1", isDeposit: String(isDeposit), tipAmount: "0" },
  }) as Stripe.PaymentIntent;
  return { store, lock, intent, current: () => booking };
}

describe("booking payment notifications", () => {
  it("records concurrent browser/webhook delivery once and sends each recipient once", async () => {
    const f = fixture();
    await Promise.all([recordBookingPayment(f.store, f.lock, f.intent()), recordBookingPayment(f.store, f.lock, f.intent())]);
    expect(f.store.updateBookingTransactionInfo).toHaveBeenCalledTimes(1);
    expect(f.current().status).toBe("confirmed");
    const send = { client: vi.fn(async () => true), admin: vi.fn(async () => true) };
    await Promise.all([deliverBookingEmails(f.store, f.lock, 1, send), deliverBookingEmails(f.store, f.lock, 1, send)]);
    expect(send.client).toHaveBeenCalledTimes(1);
    expect(send.admin).toHaveBeenCalledTimes(1);
    expect(hasPendingBookingEmails(f.current())).toBe(false);
  });

  it("retries only the failed recipient from persisted state", async () => {
    const f = fixture();
    await recordBookingPayment(f.store, f.lock, f.intent());
    const send = { client: vi.fn(async () => true), admin: vi.fn().mockRejectedValueOnce(new Error("SMTP unavailable")).mockResolvedValue(true) };
    await deliverBookingEmails(f.store, f.lock, 1, send);
    expect(f.current().paymentStatus).toBe("deposit_paid");
    expect(hasPendingBookingEmails(f.current())).toBe(true);
    await deliverBookingEmails(f.store, f.lock, 1, send);
    expect(send.client).toHaveBeenCalledTimes(1);
    expect(send.admin).toHaveBeenCalledTimes(2);
    expect(hasPendingBookingEmails(f.current())).toBe(false);
  });

  it("records the remaining balance with tip and tolerates late deposit replays", async () => {
    const f = fixture();
    await recordBookingPayment(f.store, f.lock, f.intent());
    const balance = f.intent("pi_balance", false, 5500);
    balance.metadata.tipAmount = "500";
    await recordBookingPayment(f.store, f.lock, balance);
    await recordBookingPayment(f.store, f.lock, f.intent());
    await recordBookingPayment(f.store, f.lock, balance);
    expect(f.current().paymentStatus).toBe("paid");
    expect(f.current().transactionId).toBe("pi_balance");
    expect(f.current().tipAmount).toBe(500);
    const send = { client: vi.fn(async () => true), admin: vi.fn(async () => true) };
    await deliverBookingEmails(f.store, f.lock, 1, send);
    expect(send.client).toHaveBeenNthCalledWith(1, expect.objectContaining({ paymentStatus: "deposit_paid" }), "pi_deposit", 5001);
    expect(send.client).toHaveBeenNthCalledWith(2, expect.objectContaining({ paymentStatus: "paid" }), "pi_balance", 5500);
  });

  it("accepts a full payment and does not reverse a later refund on replay", async () => {
    const f = fixture();
    const intent = f.intent("pi_full", false, 10001);
    await recordBookingPayment(f.store, f.lock, intent);
    await f.store.updateBookingTransactionInfo(1, { paymentStatus: "refunded" });
    await recordBookingPayment(f.store, f.lock, intent);
    expect(f.current().paymentStatus).toBe("refunded");
  });

  it("records a refund once when the API and webhook report the same refund", async () => {
    const f = fixture();
    await recordBookingPayment(f.store, f.lock, f.intent());
    const refund = { bookingId: 1, paymentIntentId: "pi_deposit", refundId: "re_once", amount: 5001 };
    await recordBookingRefund(f.store, f.lock, refund);
    await recordBookingRefund(f.store, f.lock, refund);
    expect(f.current().paymentStatus).toBe("refunded");
    expect((f.current().paymentMetadata as any).refunds).toHaveLength(1);
    expect((f.current().paymentMetadata as any).receipts[0].refundedAmount).toBe(5001);
  });

  it("keeps a partially refunded booking distinct from a full refund", async () => {
    const f = fixture();
    await recordBookingPayment(f.store, f.lock, f.intent());
    await recordBookingRefund(f.store, f.lock, { bookingId: 1, paymentIntentId: "pi_deposit", refundId: "re_partial", amount: 1000 });
    expect(f.current().paymentStatus).toBe("partially_refunded");
    await expect(recordBookingRefund(f.store, f.lock, { bookingId: 1, paymentIntentId: "pi_deposit", refundId: "re_too_much", amount: 5000 })).rejects.toThrow("exceeds");
  });

  it.each([
    { status: "processing" }, { currency: "eur" }, { amount: 100 }, { amount_received: 0 },
    { metadata: { bookingId: "1", isDeposit: "true", tipAmount: "NaN" } },
  ])("rejects an unverified or mismatched payment %j", async (patch) => {
    const f = fixture();
    await expect(recordBookingPayment(f.store, f.lock, { ...f.intent(), ...patch } as Stripe.PaymentIntent)).rejects.toThrow();
    expect(f.store.updateBookingTransactionInfo).not.toHaveBeenCalled();
  });

  it("keeps notifications pending when email is not configured", async () => {
    const f = fixture();
    await recordBookingPayment(f.store, f.lock, f.intent());
    await deliverBookingEmails(f.store, f.lock, 1, { client: async () => false, admin: async () => false });
    expect(hasPendingBookingEmails(f.current())).toBe(true);
  });
});
