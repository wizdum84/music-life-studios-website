import type { IStorage } from "../storage";
import {
  assertMembershipQaRecoveryEnvironment,
  createMembershipCheckoutSession,
} from "./stripe";

export const MEMBERSHIP_QA_RECOVERY = {
  userId: 4,
  membershipId: 5,
  email: "wizdum84@gmail.com",
  expectedSucceededPayments: 2,
} as const;

type CreateCheckout = typeof createMembershipCheckoutSession;

export async function createMembershipQaRecoveryCheckout(
  store: IStorage,
  createCheckout: CreateCheckout = createMembershipCheckoutSession,
) {
  const { appOrigin, testClockId } = assertMembershipQaRecoveryEnvironment();
  const expected = MEMBERSHIP_QA_RECOVERY;

  const user = await store.getUser(expected.userId);
  if (!user || user.email.trim().toLowerCase() !== expected.email) {
    throw new Error(`QA user ${expected.userId} does not match the approved recovery account.`);
  }

  const membership = (await store.getMembershipSubscriptionsByUser(expected.userId))
    .find((item) => item.id === expected.membershipId);
  if (!membership) {
    throw new Error(`Membership ${expected.membershipId} does not belong to QA user ${expected.userId}.`);
  }
  if (!["active", "past_due"].includes(membership.status)) {
    throw new Error(`Membership ${expected.membershipId} must be active or past_due before recovery.`);
  }
  if (!membership.paymentProviderSubscriptionId) {
    throw new Error(`Membership ${expected.membershipId} has no provider subscription to replace.`);
  }

  const plan = await store.getMembershipPlan(membership.planId);
  if (!plan || !plan.active) {
    throw new Error(`Membership ${expected.membershipId} has no active plan.`);
  }

  const succeededPayments = (await store.getMembershipPaymentAssociations(expected.membershipId))
    .filter((payment) => payment.status === "succeeded");
  if (succeededPayments.length !== expected.expectedSucceededPayments) {
    throw new Error(
      `Membership ${expected.membershipId} has ${succeededPayments.length} successful payment associations; expected ${expected.expectedSucceededPayments}.`,
    );
  }

  const checkout = await createCheckout({
    customerEmail: user.email,
    userId: expected.userId,
    subscriptionId: expected.membershipId,
    planId: plan.id,
    planName: plan.name,
    priceCents: plan.priceCents,
    successUrl: `${appOrigin}/account?tab=membership&checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${appOrigin}/account?tab=membership&checkout=cancelled`,
    idempotencyKey: `qa-membership-recovery:${testClockId}:${expected.userId}:${expected.membershipId}:${expected.expectedSucceededPayments}`,
  });

  if (!checkout.url) {
    throw new Error("Stripe created the recovery Checkout Session without a URL.");
  }

  return {
    checkoutSessionId: checkout.id,
    checkoutUrl: checkout.url,
    membershipId: expected.membershipId,
    userId: expected.userId,
    preservedSucceededPayments: succeededPayments.length,
  };
}
