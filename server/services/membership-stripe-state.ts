import type { MembershipSubscription } from "@shared/schema";

export function membershipPatchFromStripeSubscription(
  payload: any,
  current: MembershipSubscription,
) {
  const updatedAt = new Date();
  if (payload.status === "canceled") {
    return { status: "cancelled", paymentStatus: "cancelled", updatedAt };
  }
  if (["past_due", "unpaid", "incomplete_expired"].includes(payload.status)) {
    return { status: "past_due", paymentStatus: "failed", updatedAt };
  }
  if (payload.pause_collection) {
    return {
      status: "paused",
      pauseStatus: "paused",
      pauseStartDate: current.pauseStartDate || updatedAt,
      pauseEndDate: payload.pause_collection.resumes_at
        ? new Date(payload.pause_collection.resumes_at * 1000)
        : current.pauseEndDate,
      updatedAt,
    };
  }
  if (payload.cancel_at_period_end) {
    const effectiveSeconds = payload.cancel_at || payload.current_period_end;
    return {
      status: "cancel_pending",
      cancellationRequestedAt: current.cancellationRequestedAt || updatedAt,
      cancellationEffectiveAt: effectiveSeconds ? new Date(effectiveSeconds * 1000) : current.currentPeriodEnd,
      updatedAt,
    };
  }
  if (payload.status === "active" || payload.status === "trialing") {
    return {
      status: "active",
      paymentStatus: "paid",
      pauseStatus: "none",
      pauseStartDate: null,
      pauseEndDate: null,
      cancellationRequestedAt: null,
      cancellationEffectiveAt: null,
      updatedAt,
    };
  }
  return { updatedAt };
}
