import { and, eq } from "drizzle-orm";
import {
  membershipPaymentAssociations,
  membershipPlans,
  membershipSubscriptions,
  users,
} from "@shared/schema";
import { db, pool } from "../server/db";
import {
  assertMembershipQaRecoveryEnvironment,
  createMembershipCheckoutSession,
} from "../server/services/stripe";

function requiredPositiveInteger(name: string) {
  const value = Number(process.env[name]);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${name} must be an explicit positive integer.`);
  }
  return value;
}

async function main() {
  const { appOrigin, testClockId } = assertMembershipQaRecoveryEnvironment();
  const userId = requiredPositiveInteger("MEMBERSHIP_QA_RECOVERY_USER_ID");
  const membershipId = requiredPositiveInteger("MEMBERSHIP_QA_RECOVERY_SUBSCRIPTION_ID");
  const expectedSucceededPayments = requiredPositiveInteger("MEMBERSHIP_QA_RECOVERY_EXPECTED_SUCCEEDED_PAYMENTS");

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new Error(`QA user ${userId} was not found.`);
  if (user.email.trim().toLowerCase() !== "wizdum84@gmail.com") {
    throw new Error(`QA user ${userId} does not match the approved recovery email.`);
  }

  const [membership] = await db.select().from(membershipSubscriptions)
    .where(and(eq(membershipSubscriptions.id, membershipId), eq(membershipSubscriptions.userId, userId)))
    .limit(1);
  if (!membership) throw new Error(`Membership ${membershipId} does not belong to QA user ${userId}.`);
  if (!["active", "past_due"].includes(membership.status)) {
    throw new Error(`Membership ${membershipId} must be active or past_due before recovery.`);
  }
  if (!membership.paymentProviderSubscriptionId) {
    throw new Error(`Membership ${membershipId} has no provider subscription to replace.`);
  }

  const [plan] = await db.select().from(membershipPlans).where(eq(membershipPlans.id, membership.planId)).limit(1);
  if (!plan || !plan.active) throw new Error(`Membership ${membershipId} has no active plan.`);

  const succeededPayments = await db.select({ id: membershipPaymentAssociations.id })
    .from(membershipPaymentAssociations)
    .where(and(
      eq(membershipPaymentAssociations.subscriptionId, membershipId),
      eq(membershipPaymentAssociations.status, "succeeded"),
    ));
  if (succeededPayments.length !== expectedSucceededPayments) {
    throw new Error(
      `Membership ${membershipId} has ${succeededPayments.length} successful payment associations; expected ${expectedSucceededPayments}.`,
    );
  }

  const checkout = await createMembershipCheckoutSession({
    customerEmail: user.email,
    userId,
    subscriptionId: membershipId,
    planId: plan.id,
    planName: plan.name,
    priceCents: plan.priceCents,
    successUrl: `${appOrigin}/account?tab=membership&checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${appOrigin}/account?tab=membership&checkout=cancelled`,
    idempotencyKey: `qa-membership-recovery:${testClockId}:${userId}:${membershipId}:${expectedSucceededPayments}`,
  });

  if (!checkout.url) throw new Error("Stripe created the recovery Checkout Session without a URL.");
  console.log(JSON.stringify({
    checkoutSessionId: checkout.id,
    checkoutUrl: checkout.url,
    membershipId,
    userId,
    preservedSucceededPayments: succeededPayments.length,
  }));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
