import type Stripe from "stripe";
import type { Booking } from "@shared/schema";

type Receipt = { id: string; amount: number; isDeposit: boolean; paymentStatus: string; clientSent: boolean; adminSent: boolean; refundedAmount?: number };
type RefundRecord = { id: string; paymentIntentId: string; amount: number; createdAt: string };
type PaymentMetadata = { receipts?: Receipt[]; refunds?: RefundRecord[]; [key: string]: unknown };
export type PaymentStore = {
  getBooking(id: number): Promise<Booking | undefined>;
  updateBookingTransactionInfo(id: number, data: any): Promise<Booking | undefined>;
};
export type BookingLock = <T>(id: number, work: () => Promise<T>) => Promise<T>;

export function getBookingChargeAmount(booking: { amount: number; paymentStatus?: string }, isDeposit: boolean, tipAmount = 0) {
  if (isDeposit) return Math.round(booking.amount * 0.5);
  return (booking.paymentStatus === "deposit_paid" ? booking.amount - Math.round(booking.amount * 0.5) : booking.amount) + Math.max(0, Math.round(tipAmount));
}

// The caller must supply a Stripe-retrieved or signature-verified PaymentIntent.
export async function recordBookingPayment(store: PaymentStore, lock: BookingLock, intent: Stripe.PaymentIntent) {
  const bookingId = Number(intent.metadata.bookingId);
  if (!Number.isSafeInteger(bookingId) || bookingId <= 0) throw new Error("Invalid booking reference");
  return lock(bookingId, async () => {
    const booking = await store.getBooking(bookingId);
    if (!booking) throw new Error("Booking not found");
    const metadata = (booking.paymentMetadata || {}) as PaymentMetadata;
    const receipts = [...(metadata.receipts || [])];
    if (intent.status !== "succeeded" || intent.currency !== "usd" || intent.amount_received !== intent.amount) throw new Error("Payment is not complete");
    if (receipts.some((receipt) => receipt.id === intent.id)) return booking;
    // Preserve payments recorded before receipt tracking was introduced.
    if (booking.transactionId === intent.id) return booking;
    const isDeposit = intent.metadata.isDeposit === "true";
    const tipAmount = Number(intent.metadata.tipAmount || 0);
    const catalogAmount = getBookingChargeAmount(booking, isDeposit, tipAmount);
    const liveTestOverride = intent.metadata.liveTestPriceOverride === "true";
    const validAmount = liveTestOverride
      ? Number(intent.metadata.catalogPriceCents) === catalogAmount && intent.amount >= 50 && intent.amount < catalogAmount
      : intent.amount === catalogAmount;
    if (!["true", "false"].includes(intent.metadata.isDeposit) || !Number.isSafeInteger(tipAmount) || tipAmount < 0 ||
        !["unpaid", "deposit_paid"].includes(booking.paymentStatus) || (isDeposit && booking.paymentStatus === "deposit_paid") ||
        !validAmount) throw new Error("Payment does not match booking amount or state");
    const paymentStatus = isDeposit ? "deposit_paid" : "paid";
    receipts.push({ id: intent.id, amount: intent.amount, isDeposit, paymentStatus, clientSent: false, adminSent: false });
    const updated = await store.updateBookingTransactionInfo(booking.id, {
      transactionId: intent.id, paymentStatus, paymentMethod: "stripe",
      status: booking.status === "completed" ? "completed" : "confirmed",
      tipAmount: isDeposit ? 0 : tipAmount,
      paymentMetadata: { ...metadata, receipts },
    });
    if (!updated) throw new Error("Booking payment could not be saved");
    return updated;
  });
}

export async function recordBookingRefund(store: PaymentStore, lock: BookingLock, input: {
  bookingId: number;
  paymentIntentId: string;
  refundId: string;
  amount: number;
}) {
  if (!Number.isSafeInteger(input.amount) || input.amount <= 0) throw new Error("Refund amount is invalid");
  return lock(input.bookingId, async () => {
    const booking = await store.getBooking(input.bookingId);
    if (!booking) throw new Error("Booking not found");
    const metadata = structuredClone((booking.paymentMetadata || {}) as PaymentMetadata);
    const receipts = metadata.receipts || [];
    const receipt = receipts.find((item) => item.id === input.paymentIntentId);
    if (!receipt) throw new Error("The refunded payment is not attached to this booking");
    const refunds = metadata.refunds || [];
    if (refunds.some((refund) => refund.id === input.refundId)) return booking;
    const priorRefunded = receipt.refundedAmount || 0;
    if (priorRefunded + input.amount > receipt.amount) throw new Error("Refund exceeds the recorded payment");
    receipt.refundedAmount = priorRefunded + input.amount;
    refunds.push({ id: input.refundId, paymentIntentId: input.paymentIntentId, amount: input.amount, createdAt: new Date().toISOString() });
    metadata.receipts = receipts;
    metadata.refunds = refunds;
    const received = receipts.reduce((sum, item) => sum + item.amount, 0);
    const refunded = receipts.reduce((sum, item) => sum + (item.refundedAmount || 0), 0);
    const paymentStatus = refunded >= received ? "refunded" : "partially_refunded";
    const updated = await store.updateBookingTransactionInfo(booking.id, {
      transactionId: booking.transactionId || input.paymentIntentId,
      paymentStatus,
      paymentMethod: booking.paymentMethod || "stripe",
      tipAmount: booking.tipAmount || 0,
      paymentMetadata: metadata,
    });
    if (!updated) throw new Error("Booking refund could not be saved");
    return updated;
  });
}

export function hasPendingBookingEmails(booking: Booking) {
  const receipts = (booking.paymentMetadata as PaymentMetadata | null)?.receipts || [];
  if (booking.paymentStatus === "paid") {
    const finalReceipt = [...receipts].reverse().find((receipt) => receipt.paymentStatus === "paid");
    return finalReceipt ? !finalReceipt.clientSent || !finalReceipt.adminSent : receipts.some((receipt) => !receipt.clientSent || !receipt.adminSent);
  }
  return receipts.some((receipt) => !receipt.clientSent || !receipt.adminSent);
}

export async function deliverBookingEmails(store: PaymentStore, lock: BookingLock, bookingId: number, send: {
  client: (booking: Booking, id: string, amount: number) => Promise<boolean>;
  admin: (booking: Booking, id: string, amount: number) => Promise<boolean>;
}) {
  return lock(bookingId, async () => {
    const booking = await store.getBooking(bookingId);
    if (!booking) return;
    const metadata = structuredClone((booking.paymentMetadata || {}) as PaymentMetadata);
    for (const receipt of metadata.receipts || []) {
      for (const audience of ["client", "admin"] as const) {
        const field = audience === "client" ? "clientSent" : "adminSent";
        if (receipt[field]) continue;
        try {
          const sent = await send[audience]({ ...booking, paymentStatus: receipt.paymentStatus }, receipt.id, receipt.amount);
          if (!sent) continue;
        } catch {
          console.error(`Booking email pending retry: booking ${booking.id}, ${audience}`);
          continue;
        }
        receipt[field] = true;
        // Persist each successful recipient independently, keeping failed sends retryable.
        const saved = await store.updateBookingTransactionInfo(booking.id, {
          transactionId: booking.transactionId!, paymentStatus: booking.paymentStatus,
          paymentMethod: booking.paymentMethod || "stripe", tipAmount: booking.tipAmount || 0, paymentMetadata: metadata,
        });
        if (!saved) throw new Error("Email delivery state could not be saved");
      }
    }
  });
}
