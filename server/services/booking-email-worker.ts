import { storage, withBookingPaymentLock } from "../storage";
import { deliverBookingEmails, hasPendingBookingEmails } from "./booking-payment";
import { sendClientConfirmationEmail, sendAdminNotificationEmail } from "./email";

const active = new Set<number>();
export function queueBookingEmails(id: number) {
  if (active.has(id)) return;
  active.add(id);
  void deliverBookingEmails(storage, withBookingPaymentLock, id, {
    client: sendClientConfirmationEmail, admin: sendAdminNotificationEmail,
  }).catch(() => console.error(`Booking email retry failed for booking ${id}`))
    .finally(() => active.delete(id));
}

export function startBookingEmailWorker() {
  let scanning = false;
  const scan = async () => {
    if (scanning) return;
    scanning = true;
    try {
      for (const booking of await storage.getAllBookings()) {
        if (hasPendingBookingEmails(booking)) queueBookingEmails(booking.id);
      }
    } catch { console.error("Unable to scan pending booking emails"); }
    finally { scanning = false; }
  };
  void scan();
  const timer = setInterval(() => void scan(), 60000);
  timer.unref();
  return () => clearInterval(timer);
}
