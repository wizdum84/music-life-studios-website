export const ORPHANED_MEMBERSHIP_CHECKOUT_AGE_MS = 5 * 60 * 1000;

export function isOrphanedPendingMembership(input: {
  status: string;
  paymentProviderSubscriptionId: string | null;
  createdAt: Date;
  hasCheckoutSession: boolean;
  hasPaymentAssociation: boolean;
  now: Date;
}) {
  if (input.status !== "pending_payment") return false;
  if (input.paymentProviderSubscriptionId || input.hasCheckoutSession || input.hasPaymentAssociation) return false;
  return input.now.getTime() - input.createdAt.getTime() >= ORPHANED_MEMBERSHIP_CHECKOUT_AGE_MS;
}
