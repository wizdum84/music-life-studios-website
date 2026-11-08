import type { Booking } from "./schema";

type PaymentReceipt = { id?: string; amount?: number; refundedAmount?: number };

/** Returns verified money received for a booking, including tips when receipt history is available. */
export function getBookingPaidAmount(booking: Pick<Booking, "amount" | "tipAmount" | "paymentStatus" | "paymentMetadata">) {
  const metadata = booking.paymentMetadata as { receipts?: PaymentReceipt[] } | null;
  if (Array.isArray(metadata?.receipts) && metadata.receipts.length > 0) {
    return metadata.receipts.reduce((total, receipt) => {
      const received = Number.isSafeInteger(receipt.amount) && receipt.amount! > 0 ? receipt.amount! : 0;
      const refunded = Number.isSafeInteger(receipt.refundedAmount) && receipt.refundedAmount! > 0 ? receipt.refundedAmount! : 0;
      return total + Math.max(0, received - refunded);
    }, 0);
  }

  // Compatibility for payments recorded before per-payment receipt tracking.
  if (booking.paymentStatus === "paid") return booking.amount + Math.max(0, booking.tipAmount || 0);
  if (booking.paymentStatus === "deposit_paid") return Math.round(booking.amount * 0.5);
  return 0;
}
