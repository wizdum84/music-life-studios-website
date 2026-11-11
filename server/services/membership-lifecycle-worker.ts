import { storage } from "../storage";
import { isEmailConfigured, sendMembershipLifecycleEmail, sendRewardExpirationEmail } from "./email";

const DAY = 24 * 60 * 60 * 1000;

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
    if (["past_due", "payment_failed"].includes(membership.status) || membership.paymentStatus === "failed") {
      kind = "payment_failed";
      eventType = "membership_payment_failed_email_sent";
    } else if (membership.status === "cancelled") {
      kind = "cancelled";
      eventType = "membership_cancellation_email_sent";
      effectiveDate = membership.cancellationEffectiveAt || membership.paidThroughDate;
    } else if (membership.status === "active") {
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
  if (!isEmailConfigured()) return 0;
  let sentCount = 0;
  for (const user of (await storage.getAllUsers()).filter((item) => item.role === "customer")) {
    let records;
    try { records = await storage.getLoyaltyRecords(user.id); }
    catch { continue; }
    for (const reward of records.filter((record) => record.action === "reward_earned" && record.status === "valid" && record.redemptionDeadline)) {
      const deadline = new Date(reward.redemptionDeadline!);
      const timeLeft = deadline.getTime() - now.getTime();
      const metadata = reward.metadata && typeof reward.metadata === "object" ? reward.metadata as Record<string, unknown> : {};
      if (timeLeft <= 0 || timeLeft > 7 * DAY || metadata.expirationReminderSentAt) continue;
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
      if (!deadlineValue || reward.status !== "issued") continue;
      const deadline = new Date(deadlineValue);
      const timeLeft = deadline.getTime() - now.getTime();
      const eventType = `membership_reward_expiration_${reward.id}`;
      if (timeLeft <= 0 || timeLeft > 7 * DAY || await eventExists(membership.id, eventType)) continue;
      try {
        if (!await sendRewardExpirationEmail(user, "Passport membership reward", deadline)) continue;
        await storage.createMembershipEvent({ subscriptionId: membership.id, eventType, details: JSON.stringify({ rewardId: reward.id, sentAt: now.toISOString() }) });
        sentCount += 1;
      } catch (error) {
        console.error(`Membership reward reminder pending retry for reward ${reward.id}:`, error);
      }
    }
  }
  return sentCount;
}

let running = false;
export async function scanMembershipLifecycles(now = new Date()) {
  if (running) return { membershipEmails: 0, rewardEmails: 0 };
  running = true;
  try {
    return {
      membershipEmails: await sendMembershipLifecycleNotifications(now),
      rewardEmails: await sendRewardExpirationNotifications(now),
    };
  } finally { running = false; }
}

export function startMembershipLifecycleWorker() {
  const scan = () => void scanMembershipLifecycles().catch((error) => console.error("Unable to scan membership lifecycles:", error));
  scan();
  const timer = setInterval(scan, 6 * 60 * 60 * 1000);
  timer.unref();
  return () => clearInterval(timer);
}
