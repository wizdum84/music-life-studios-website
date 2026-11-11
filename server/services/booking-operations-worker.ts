import { storage, withBookingPaymentLock } from "../storage";
import { isEmailConfigured, sendAppointmentReminderEmail, sendFeedbackRequestEmail } from "./email";
import { issueFeedbackToken } from "./feedback-links";

const ABANDONED_BOOKING_MINUTES = 45;

function metadataFor(value: unknown) {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

async function cancelAbandonedBooking(bookingId: number, now: Date) {
  return withBookingPaymentLock(bookingId, async () => {
    const booking = await storage.getBooking(bookingId);
    if (!booking || booking.status !== "pending" || booking.paymentStatus !== "unpaid" || booking.amount <= 0) return false;
    const ageMinutes = (now.getTime() - new Date(booking.createdAt).getTime()) / 60_000;
    if (ageMinutes < ABANDONED_BOOKING_MINUTES || new Date(booking.date) <= now) return false;
    const metadata = metadataFor(booking.paymentMetadata);
    await storage.updateBooking(booking.id, {
      status: "cancelled",
      paymentMetadata: {
        ...metadata,
        autoCancelledAt: now.toISOString(),
        autoCancellationReason: "Checkout was not completed within 45 minutes.",
      },
    } as any);
    const slots = await storage.getAllTimeSlots();
    for (const slot of slots) {
      if (slot.bookingId === booking.id) await storage.releaseTimeSlot(slot.id);
    }
    return true;
  });
}

async function sendDueReminder(bookingId: number, now: Date) {
  return withBookingPaymentLock(bookingId, async () => {
    const booking = await storage.getBooking(bookingId);
    if (!booking || booking.status !== "confirmed" || !["deposit_paid", "paid"].includes(booking.paymentStatus)) return false;
    const minutesUntil = (new Date(booking.date).getTime() - now.getTime()) / 60_000;
    if (minutesUntil <= 0 || minutesUntil > 24 * 60 || !isEmailConfigured()) return false;
    const metadata = metadataFor(booking.paymentMetadata);
    const isTwoHour = minutesUntil <= 120;
    const field = isTwoHour ? "appointmentReminder2hSentAt" : "appointmentReminder24hSentAt";
    if (metadata[field]) return false;
    try {
      const sent = await sendAppointmentReminderEmail(booking, isTwoHour ? "2-hour" : "24-hour");
      if (!sent) return false;
      await storage.updateBooking(booking.id, {
        paymentMetadata: { ...metadata, [field]: now.toISOString() },
      } as any);
      return true;
    } catch (error) {
      console.error(`Appointment reminder pending retry for booking ${booking.id}:`, error);
      return false;
    }
  });
}

async function sendFeedbackRequest(bookingId: number, now: Date) {
  return withBookingPaymentLock(bookingId, async () => {
    const booking = await storage.getBooking(bookingId);
    if (!booking || booking.status !== "completed" || booking.paymentStatus !== "paid" || !isEmailConfigured()) return false;
    const metadata = metadataFor(booking.paymentMetadata);
    if (metadata.feedbackRequestSentAt || (await storage.getFeedbacksByBooking(booking.id)).length > 0) return false;
    const origin = (process.env.APP_ORIGIN || "").replace(/\/$/, "");
    if (!origin) return false;
    try {
      const token = issueFeedbackToken(booking.id, booking.email);
      const sent = await sendFeedbackRequestEmail(booking, `${origin}/feedback?token=${encodeURIComponent(token)}`);
      if (!sent) return false;
      await storage.updateBooking(booking.id, { paymentMetadata: { ...metadata, feedbackRequestSentAt: now.toISOString() } } as any);
      return true;
    } catch (error) {
      console.error(`Feedback request pending retry for booking ${booking.id}:`, error);
      return false;
    }
  });
}

let scanRunning = false;

export async function scanBookingOperations(now = new Date()) {
  if (scanRunning) return { cancelled: 0, reminders: 0, feedbackRequests: 0 };
  scanRunning = true;
  let cancelled = 0;
  let reminders = 0;
  let feedbackRequests = 0;
  try {
    const bookings = await storage.getAllBookings();
    for (const booking of bookings) {
      if (booking.status === "pending" && booking.paymentStatus === "unpaid" && booking.amount > 0) {
        if (await cancelAbandonedBooking(booking.id, now)) cancelled += 1;
      } else if (booking.status === "confirmed" && ["deposit_paid", "paid"].includes(booking.paymentStatus)) {
        if (await sendDueReminder(booking.id, now)) reminders += 1;
      } else if (booking.status === "completed" && booking.paymentStatus === "paid") {
        if (await sendFeedbackRequest(booking.id, now)) feedbackRequests += 1;
      }
    }
    return { cancelled, reminders, feedbackRequests };
  } finally {
    scanRunning = false;
  }
}

export function startBookingOperationsWorker() {
  const scan = () => void scanBookingOperations().catch((error) => console.error("Unable to scan booking operations:", error));
  scan();
  const timer = setInterval(scan, 60_000);
  timer.unref();
  return () => clearInterval(timer);
}
