import { describe, expect, it } from "vitest";
import { membershipPatchFromStripeSubscription } from "../server/services/membership-stripe-state";

const membership = {
  currentPeriodEnd: new Date("2027-01-15T00:00:00.000Z"),
  pauseStartDate: null,
  pauseEndDate: null,
  cancellationRequestedAt: null,
} as any;

describe("Stripe membership state mapping", () => {
  it("keeps a cancellation active until period end", () => {
    const patch = membershipPatchFromStripeSubscription({
      status: "active", cancel_at_period_end: true, current_period_end: 1799971200,
    }, membership);
    expect(patch.status).toBe("cancel_pending");
    expect(patch.cancellationEffectiveAt).toEqual(new Date(1799971200 * 1000));
  });

  it("maps a Stripe collection pause and resume date", () => {
    const patch = membershipPatchFromStripeSubscription({
      status: "active", pause_collection: { behavior: "void", resumes_at: 1802649600 },
    }, membership);
    expect(patch.status).toBe("paused");
    expect(patch.pauseEndDate).toEqual(new Date(1802649600 * 1000));
  });

  it("restores active state after a pause is removed", () => {
    const patch = membershipPatchFromStripeSubscription({ status: "active", pause_collection: null }, {
      ...membership, pauseStartDate: new Date(), pauseEndDate: new Date(),
    });
    expect(patch).toMatchObject({ status: "active", paymentStatus: "paid", pauseStatus: "none", pauseStartDate: null, pauseEndDate: null });
  });

  it("maps failed and cancelled provider states", () => {
    expect(membershipPatchFromStripeSubscription({ status: "past_due" }, membership)).toMatchObject({ status: "past_due", paymentStatus: "failed" });
    expect(membershipPatchFromStripeSubscription({ status: "canceled" }, membership)).toMatchObject({ status: "cancelled", paymentStatus: "cancelled" });
  });
});
