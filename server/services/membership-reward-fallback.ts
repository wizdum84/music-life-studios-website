import type { MembershipSubscription } from "@shared/schema";
import { MEMBERSHIP_LAUNCH_RULES, getMembershipCatalogByTier } from "@shared/membership";
import type { IStorage } from "../storage";

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export async function getMissingMembershipReward(store: IStorage, subscription: MembershipSubscription) {
  const [payments, milestones, plan, rewards] = await Promise.all([
    store.getMembershipPaymentAssociations(subscription.id),
    store.getMembershipLoyaltyMilestones(subscription.planId),
    store.getMembershipPlan(subscription.planId),
    store.getMembershipLoyaltyRewards(subscription.id),
  ]);
  const successfulPayments = payments
    .filter((payment) => payment.status === "succeeded")
    .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());
  const catalog = getMembershipCatalogByTier(plan?.tier);
  if (!catalog) return null;

  const eligibleMilestones = milestones.filter((milestone) =>
    milestone.active
    && milestone.thresholdMonths === catalog.rewardCycle.thresholdMonths
    && catalog.rewardCycle.rewards.some((reward) =>
      reward.type === milestone.rewardType && reward.quantity === milestone.rewardQuantity),
  );
  if (eligibleMilestones.length === 0) return null;

  const completedCycles = Math.floor(successfulPayments.length / catalog.rewardCycle.thresholdMonths);
  for (let cycleNumber = 1; cycleNumber <= completedCycles; cycleNumber += 1) {
    const missingMilestones = eligibleMilestones.filter((milestone) =>
      !rewards.some((reward) => reward.cycleNumber === cycleNumber && reward.rewardType === milestone.rewardType),
    );
    if (missingMilestones.length === 0) continue;
    const qualifyingPayment = successfulPayments[(cycleNumber * catalog.rewardCycle.thresholdMonths) - 1];
    if (!qualifyingPayment) continue;
    return {
      cycleNumber,
      thresholdMonths: catalog.rewardCycle.thresholdMonths,
      successfulPaymentCount: successfulPayments.length,
      qualifyingPaymentId: qualifyingPayment.id,
      missingRewards: missingMilestones.map((milestone) => ({
        milestoneId: milestone.id,
        rewardType: milestone.rewardType,
        rewardQuantity: milestone.rewardQuantity,
      })),
    };
  }
  return null;
}

const issuanceLocks = new Map<number, Promise<unknown>>();

export async function issueMissingMembershipReward(store: IStorage, subscription: MembershipSubscription) {
  const previous = issuanceLocks.get(subscription.id) ?? Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>((resolve) => { release = resolve; });
  const queued = previous.then(() => current);
  issuanceLocks.set(subscription.id, queued);
  await previous;
  try {
    const missing = await getMissingMembershipReward(store, subscription);
    if (!missing) return { issued: [], missing: null };
    const now = new Date();
    const redemptionDeadline = addDays(now, MEMBERSHIP_LAUNCH_RULES.rewardRedemptionDeadlineDays);
    const issued = [];
    for (const expected of missing.missingRewards) {
      issued.push(await store.createMembershipLoyaltyReward({
        userId: subscription.userId,
        milestoneId: expected.milestoneId,
        subscriptionId: subscription.id,
        rewardType: expected.rewardType,
        rewardQuantity: expected.rewardQuantity,
        cycleNumber: missing.cycleNumber,
        thresholdMonths: missing.thresholdMonths,
        redemptionDeadline,
        sourcePaymentAssociationId: missing.qualifyingPaymentId,
        expiresAt: redemptionDeadline,
        status: "issued",
        redeemedAt: null,
      }));
    }
    return { issued, missing };
  } finally {
    release();
    if (issuanceLocks.get(subscription.id) === queued) issuanceLocks.delete(subscription.id);
  }
}
