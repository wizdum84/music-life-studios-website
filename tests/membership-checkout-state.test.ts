import { describe, expect, it } from "vitest";
import { isOrphanedPendingMembership } from "../server/services/membership-checkout-state";

const now = new Date("2027-01-01T12:10:00Z");

describe("membership checkout orphan detection", () => {
  it("retires an old pending membership that never received a Checkout session", () => {
    expect(isOrphanedPendingMembership({
      status: "pending_payment",
      paymentProviderSubscriptionId: null,
      createdAt: new Date("2027-01-01T12:00:00Z"),
      hasCheckoutSession: false,
      hasPaymentAssociation: false,
      now,
    })).toBe(true);
  });

  it("keeps a recent enrollment while Stripe Checkout is being created", () => {
    expect(isOrphanedPendingMembership({
      status: "pending_payment",
      paymentProviderSubscriptionId: null,
      createdAt: new Date("2027-01-01T12:08:00Z"),
      hasCheckoutSession: false,
      hasPaymentAssociation: false,
      now,
    })).toBe(false);
  });

  it("keeps pending memberships that have Stripe or payment evidence", () => {
    const base = {
      status: "pending_payment",
      paymentProviderSubscriptionId: null,
      createdAt: new Date("2027-01-01T12:00:00Z"),
      hasCheckoutSession: false,
      hasPaymentAssociation: false,
      now,
    };
    expect(isOrphanedPendingMembership({ ...base, hasCheckoutSession: true })).toBe(false);
    expect(isOrphanedPendingMembership({ ...base, hasPaymentAssociation: true })).toBe(false);
    expect(isOrphanedPendingMembership({ ...base, paymentProviderSubscriptionId: "sub_test" })).toBe(false);
  });
});
