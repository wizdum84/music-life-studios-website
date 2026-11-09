import type { Booking } from "@shared/schema";
import { storage, withBookingPaymentLock } from "../storage";
import { isEmailConfigured, sendBalancePaymentEmail } from "./email";
import { issuePaymentLinkToken } from "./payment-links";

const REWARD_STAMP_TARGET = 5;

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function getBookingEndTime(booking: Pick<Booking, "date" | "duration">) {
  return new Date(new Date(booking.date).getTime() + booking.duration * 60_000);
}

export function hasBookingEnded(booking: Pick<Booking, "date" | "duration">, now = new Date()) {
  return getBookingEndTime(booking).getTime() <= now.getTime();
}

export async function reconcileBookingLifecycle(
  bookingId: number,
  options: { now?: Date; markCompletedNow?: boolean } = {},
) {
  return withBookingPaymentLock(bookingId, async () => {
    const now = options.now || new Date();
    const booking = await storage.getBooking(bookingId);
    if (!booking) return { outcome: "not_found" as const };
    if (booking.status === "cancelled") return { outcome: "cancelled" as const, booking };

    const sessionEnded = hasBookingEnded(booking, now);
    const shouldComplete = options.markCompletedNow || sessionEnded;
    let currentBooking = booking;

    if (shouldComplete && booking.status !== "completed") {
      currentBooking = await storage.updateBooking(booking.id, {
        status: "completed",
        retentionDeadline: addDays(now, booking.retentionDays || 30),
      } as any) || booking;
    }

    if (!sessionEnded) {
      return {
        outcome: shouldComplete ? "completed_stamp_pending" as const : "not_due" as const,
        booking: currentBooking,
        sessionEnd: getBookingEndTime(booking),
      };
    }

    if (booking.paymentStatus === "deposit_paid") {
      const metadata = booking.paymentMetadata && typeof booking.paymentMetadata === "object"
        ? booking.paymentMetadata as Record<string, unknown>
        : {};
      if (!metadata.balancePaymentLinkSentAt && isEmailConfigured()) {
        const origin = (process.env.APP_ORIGIN || "").replace(/\/$/, "");
        if (origin) {
          const token = issuePaymentLinkToken(booking.id, booking.email);
          const remainingAmount = booking.amount - Math.round(booking.amount * 0.5);
          try {
            const sent = await sendBalancePaymentEmail(
              booking,
              `${origin}/complete-payment?token=${encodeURIComponent(token)}`,
              remainingAmount,
            );
            if (sent) {
              currentBooking = await storage.updateBooking(booking.id, {
                paymentMetadata: { ...metadata, balancePaymentLinkSentAt: now.toISOString() },
              } as any) || currentBooking;
            }
          } catch (error) {
            console.error(`Unable to send balance link for booking ${booking.id}:`, error);
          }
        }
      }
      return { outcome: "completed_balance_due" as const, booking: currentBooking };
    }

    if (!booking.userId || booking.paymentStatus !== "paid" || booking.loyaltyApplied || booking.amount <= 0) {
      return { outcome: "completed_not_eligible" as const, booking: currentBooking };
    }

    const existingRecords = await storage.getLoyaltyRecords(booking.userId);
    if (existingRecords.some((record) => record.bookingId === booking.id && record.action === "stamp_earned")) {
      return { outcome: "already_counted" as const, booking: currentBooking };
    }

    const user = await storage.incrementUserSessionCount(booking.userId);
    await storage.updateUserLoyaltyPoints(booking.userId, 1);
    const stampNumber = user?.sessionCount ?? 1;
    const cycleNumber = Math.floor(stampNumber / REWARD_STAMP_TARGET);

    await storage.createLoyaltyRecord({
      userId: booking.userId,
      action: "stamp_earned",
      pointsChange: 1,
      description: `Music Lifer stamp earned for completed paid booking #${booking.id}.`,
      bookingId: booking.id,
      cycleNumber: cycleNumber || undefined,
      metadata: { source: "automatic_booking_lifecycle", paymentStatus: booking.paymentStatus },
    });

    let rewardEarned = false;
    if (stampNumber % REWARD_STAMP_TARGET === 0) {
      rewardEarned = true;
      await storage.createLoyaltyRecord({
        userId: booking.userId,
        action: "reward_earned",
        pointsChange: 0,
        description: `Music Lifer reward cycle ${cycleNumber} earned: 2 recording hours + 1 Starter Reward Beat License.`,
        cycleNumber,
        rewardType: "recording_hours_plus_starter_reward_beat",
        rewardQuantity: 1,
        earnedAt: now,
        redemptionDeadline: addDays(now, 90),
        metadata: { recordingHours: 2, starterRewardBeatLicenses: 1 },
      });
    }

    return {
      outcome: "stamp_awarded" as const,
      booking: currentBooking,
      stampNumber,
      stampsInCurrentCycle: stampNumber % REWARD_STAMP_TARGET,
      rewardEarned,
    };
  });
}

let lifecycleScanRunning = false;

export async function scanDueBookingLifecycles(now = new Date()) {
  if (lifecycleScanRunning) return { scanned: 0, updated: 0 };
  lifecycleScanRunning = true;
  let scanned = 0;
  let updated = 0;
  try {
    const bookings = await storage.getAllBookings();
    for (const booking of bookings) {
      if (booking.status === "cancelled" || !hasBookingEnded(booking, now)) continue;
      if (!["deposit_paid", "paid"].includes(booking.paymentStatus)) continue;
      scanned += 1;
      const result = await reconcileBookingLifecycle(booking.id, { now });
      if (["stamp_awarded", "completed_not_eligible"].includes(result.outcome)) updated += 1;
    }
    return { scanned, updated };
  } finally {
    lifecycleScanRunning = false;
  }
}

export function startBookingLifecycleWorker() {
  const scan = () => void scanDueBookingLifecycles().catch((error) => {
    console.error("Unable to reconcile booking lifecycles:", error);
  });
  scan();
  const timer = setInterval(scan, 60_000);
  timer.unref();
  return () => clearInterval(timer);
}
