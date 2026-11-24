import { storage, withMembershipNotificationLock } from "../storage";
import { isEmailConfigured, sendMembershipLifecycleEmail, sendMissingMembershipRewardAlert, sendRewardExpirationEmail } from "./email";
import { deadlineHasPassed } from "./membership-benefits";
import { retryPendingMembershipLifecycleEmails } from "./membership-lifecycle-email-queue";
import { retrieveMembershipTestClockTime } from "./stripe";
import { isOrphanedPendingMembership } from "./membership-checkout-state";
import { getMissingMembershipReward } from "./membership-reward-fallback";

const DAY = 24 * 60 * 60 * 1000;

async function retireOrphanedMembershipEnrollments(now: Date) {
  let retiredCount = 0;
  for (const membership of await storage.getAllMembershipSubscriptions()) {
    if (membership.status !== "pending_payment") continue;
    const [events, payments] = await Promise.all([
      storage.getMembershipEvents(membership.id),
      storage.getMembershipPaymentAssociations(membership.id),
    ]);
    const hasCheckoutSession = events.some((event) => event.eventType === "stripe_membership_checkout_created");
    if (!isOrphanedPendingMembership({
      status: membership.status,
      paymentProviderSubscriptionId: membership.paymentProviderSubscriptionId,
      createdAt: membership.createdAt,
      hasCheckoutSession,
      hasPaymentAssociation: payments.length > 0,
      now,
    })) continue;

    await storage.updateMembershipSubscription(membership.id, {
      status: "checkout_failed",
      paymentStatus: "failed",
      updatedAt: now,
    } as any);
    if (!events.some((event) => event.eventType === "enrollment_checkout_abandoned_worker")) {
      await storage.createMembershipEvent({
        subscriptionId: membership.id,
        eventType: "enrollment_checkout_abandoned_worker",
        details: JSON.stringify({ retiredAt: now.toISOString() }),
      });
    }
    retiredCount += 1;
  }
  return retiredCount;
}

async function eventExists(subscriptionId: number, eventType: string) {
  return (await storage.getMembershipEvents(subscriptionId)).some((event) => event.eventType === eventType);
}

async function sendMembershipLifecycleNotifications(now: Date) {
  if (!isEmailConfigured()) return 0;
  let sentCount = 0;
  for (const membership of await storage.getAllMembershipSubscriptions()) {
    const [user, plan] = await Promise.all([storage.getUser(membership.userId), storage.getMembershipPlan(membership.planId)]);
    if (!user || !plan) continue;
    let kind: "renewal" | "payment_failed" | "cancelled" | null = null;
    let eventType = "";
    let effectiveDate: Date | undefined;
    if (membership.status === "active") {
      const nextBilling = new Date(membership.nextBillingDate);
      const untilBilling = nextBilling.getTime() - now.getTime();
      if (untilBilling > 0 && untilBilling <= 3 * DAY) {
        kind = "renewal";
        effectiveDate = nextBilling;
        eventType = `membership_renewal_reminder_${nextBilling.toISOString().slice(0, 10)}`;
      }
    }
    if (!kind || await eventExists(membership.id, eventType)) continue;
    try {
      if (!await sendMembershipLifecycleEmail(user, plan, kind, effectiveDate)) continue;
      await storage.createMembershipEvent({ subscriptionId: membership.id, eventType, details: JSON.stringify({ recipient: user.email, sentAt: now.toISOString() }) });
      sentCount += 1;
    } catch (error) {
      console.error(`Membership lifecycle email pending retry for subscription ${membership.id}:`, error);
    }
  }
  return sentCount;
}

async function sendRewardExpirationNotifications(now: Date) {
  const emailConfigured = isEmailConfigured();
  let sentCount = 0;
  for (const user of (await storage.getAllUsers()).filter((item) => item.role === "customer")) {
    let records;
    try { records = await storage.getLoyaltyRecords(user.id); }
    catch { continue; }
    for (const reward of records.filter((record) => record.action === "reward_earned" && record.status === "valid" && record.redemptionDeadline)) {
      const deadline = new Date(reward.redemptionDeadline!);
      const timeLeft = deadline.getTime() - now.getTime();
      const metadata = reward.metadata && typeof reward.metadata === "object" ? reward.metadata as Record<string, unknown> : {};
      if (deadlineHasPassed(deadline, now)) {
        await storage.updateLoyaltyRecord(reward.id, {
          status: "expired",
          metadata: { ...metadata, expiredAt: now.toISOString() },
        });
        continue;
      }
      if (!emailConfigured || timeLeft > 7 * DAY || metadata.expirationReminderSentAt) continue;
      try {
        if (!await sendRewardExpirationEmail(user, "Music Lifer reward", deadline)) continue;
        await storage.updateLoyaltyRecord(reward.id, { metadata: { ...metadata, expirationReminderSentAt: now.toISOString() } });
        sentCount += 1;
      } catch (error) {
        console.error(`Reward reminder pending retry for loyalty record ${reward.id}:`, error);
      }
    }
  }
  for (const membership of await storage.getAllMembershipSubscriptions()) {
    const user = await storage.getUser(membership.userId);
    if (!user) continue;
    for (const reward of await storage.getMembershipLoyaltyRewards(membership.id)) {
      const deadlineValue = reward.redemptionDeadline || reward.expiresAt;
      if (!deadlineValue || !["issued", "expired"].includes(reward.status)) continue;
      const deadline = new Date(deadlineValue);
      const timeLeft = deadline.getTime() - now.getTime();
      const eventType = `membership_reward_expiration_${reward.id}`;
      if (deadlineHasPassed(deadline, now)) {
        const expiredEventType = `membership_reward_expired_${reward.id}`;
        const pendingEventType = `membership_reward_expired_email_pending_${reward.id}`;
        const sentEventType = `membership_reward_expired_email_sent_${reward.id}`;
        try {
          const sent = await withMembershipNotificationLock((reward.id * 2) + 1, async () => {
            const currentReward = await storage.getMembershipLoyaltyReward(reward.id);
            if (!currentReward || !["issued", "expired"].includes(currentReward.status)) return false;
            const events = await storage.getMembershipEvents(membership.id);
            let pending = events.some((event) => event.eventType === pendingEventType);
            if (currentReward.status === "issued") {
              await storage.updateMembershipLoyaltyReward(reward.id, { status: "expired" });
              if (!events.some((event) => event.eventType === expiredEventType)) {
                await storage.createMembershipEvent({ subscriptionId: membership.id, eventType: expiredEventType, details: JSON.stringify({ rewardId: reward.id, expiredAt: now.toISOString() }) });
              }
              if (!pending) {
                await storage.createMembershipEvent({ subscriptionId: membership.id, eventType: pendingEventType, details: JSON.stringify({ rewardId: reward.id, queuedAt: now.toISOString() }) });
                pending = true;
              }
            }
            // Legacy expired records have no pending marker. They may already
            // have delivered mail, so do not replay them during deployment.
            if (!pending || events.some((event) => event.eventType === sentEventType) || !emailConfigured) return false;
            if (!await sendRewardExpirationEmail(user, "Passport membership reward", deadline, "expired")) return false;
            await storage.createMembershipEvent({ subscriptionId: membership.id, eventType: sentEventType, details: JSON.stringify({ rewardId: reward.id, sentAt: now.toISOString() }) });
            return true;
          });
          if (sent) sentCount += 1;
        } catch (error) {
          console.error(`Membership reward expired email pending retry for reward ${reward.id}:`, error);
        }
        continue;
      }
      if (reward.status !== "issued") continue;
      if (!emailConfigured || timeLeft > 7 * DAY) continue;
      try {
        const sent = await withMembershipNotificationLock(reward.id * 2, async () => {
          if (await eventExists(membership.id, eventType)) return false;
          if (!await sendRewardExpirationEmail(user, "Passport membership reward", deadline)) return false;
          await storage.createMembershipEvent({ subscriptionId: membership.id, eventType, details: JSON.stringify({ rewardId: reward.id, sentAt: now.toISOString() }) });
          return true;
        });
        if (sent) sentCount += 1;
      } catch (error) {
        console.error(`Membership reward reminder pending retry for reward ${reward.id}:`, error);
      }
    }
  }
  return sentCount;
}

async function sendMissingRewardAlerts(now: Date) {
  if (!isEmailConfigured()) return 0;
  let sentCount = 0;
  for (const membership of await storage.getAllMembershipSubscriptions()) {
    const missing = await getMissingMembershipReward(storage, membership);
    if (!missing) continue;
    const eventType = `membership_reward_missing_alert_cycle_${missing.cycleNumber}`;
    if (await eventExists(membership.id, eventType)) continue;
    const [user, plan] = await Promise.all([
      storage.getUser(membership.userId),
      storage.getMembershipPlan(membership.planId),
    ]);
    if (!user || !plan) continue;
    try {
      const sent = await sendMissingMembershipRewardAlert(user, plan, membership, {
        cycleNumber: missing.cycleNumber,
        successfulPaymentCount: missing.successfulPaymentCount,
        rewards: missing.missingRewards,
      });
      if (!sent) continue;
      await storage.createMembershipEvent({
        subscriptionId: membership.id,
        eventType,
        details: JSON.stringify({
          cycleNumber: missing.cycleNumber,
          qualifyingPaymentId: missing.qualifyingPaymentId,
          alertedAt: now.toISOString(),
        }),
      });
      sentCount += 1;
    } catch (error) {
      console.error(`Missing membership reward alert pending retry for subscription ${membership.id}:`, error);
    }
  }
  return sentCount;
}

let running = false;
export async function scanMembershipLifecycles(now?: Date) {
  if (running) return { membershipEmails: 0, rewardEmails: 0, rewardAlerts: 0 };
  running = true;
  try {
    const operationalNow = new Date();
    const retiredEnrollments = await retireOrphanedMembershipEnrollments(operationalNow);
    if (retiredEnrollments > 0) {
      console.info(`Retired ${retiredEnrollments} orphaned membership enrollment(s).`);
    }
    const effectiveNow = now ?? await retrieveMembershipTestClockTime() ?? new Date();
    const queuedEmails = await retryPendingMembershipLifecycleEmails();
    return {
      membershipEmails: queuedEmails + await sendMembershipLifecycleNotifications(effectiveNow),
      rewardEmails: await sendRewardExpirationNotifications(effectiveNow),
      rewardAlerts: await sendMissingRewardAlerts(effectiveNow),
    };
  } finally { running = false; }
}

export function startMembershipLifecycleWorker() {
  const scan = () => void scanMembershipLifecycles().catch((error) => console.error("Unable to scan membership lifecycles:", error));
  scan();
  const configuredSeconds = Number(process.env.MEMBERSHIP_LIFECYCLE_SCAN_SECONDS || 6 * 60 * 60);
  const intervalSeconds = Number.isFinite(configuredSeconds) ? Math.max(30, Math.floor(configuredSeconds)) : 6 * 60 * 60;
  const timer = setInterval(scan, intervalSeconds * 1000);
  timer.unref();
  return () => clearInterval(timer);
}
