import { describe, expect, it } from "vitest";
import type { Booking } from "../shared/schema";
import { getBookingPaidAmount } from "../shared/bookingPayments";

const booking = (patch: Partial<Booking>) => ({
  amount: 10000, tipAmount: 0, paymentStatus: "unpaid", paymentMetadata: null, ...patch,
}) as Booking;

describe("getBookingPaidAmount", () => {
  it("counts a deposit instead of the full booking total", () => {
    expect(getBookingPaidAmount(booking({ paymentStatus: "deposit_paid" }))).toBe(5000);
  });

  it("sums verified receipts including a later balance and tip", () => {
    expect(getBookingPaidAmount(booking({
      paymentStatus: "paid",
      paymentMetadata: { receipts: [{ id: "deposit", amount: 5000 }, { id: "balance", amount: 5500 }] },
    }))).toBe(10500);
  });

  it("uses the booking total and tip for legacy paid records", () => {
    expect(getBookingPaidAmount(booking({ paymentStatus: "paid", tipAmount: 700 }))).toBe(10700);
  });

  it("does not count unpaid or refunded bookings without receipt history", () => {
    expect(getBookingPaidAmount(booking({ paymentStatus: "unpaid" }))).toBe(0);
    expect(getBookingPaidAmount(booking({ paymentStatus: "refunded" }))).toBe(0);
  });

  it("subtracts verified refunds from receipt history", () => {
    expect(getBookingPaidAmount(booking({
      paymentStatus: "partially_refunded",
      paymentMetadata: { receipts: [{ id: "deposit", amount: 5000, refundedAmount: 1250 }] },
    }))).toBe(3750);
  });
});
