import { describe, expect, it, vi } from "vitest";
import {
  pauseMembershipBilling,
  resumeMembershipBilling,
  scheduleMembershipCancellation,
} from "../server/services/stripe";

function stripeClient() {
  const update = vi.fn().mockResolvedValue({ id: "sub_test" });
  return { client: { subscriptions: { update } } as any, update };
}

describe("membership Stripe controls", () => {
  it("schedules cancellation at the paid-through boundary", async () => {
    const { client, update } = stripeClient();
    await scheduleMembershipCancellation("sub_123", client);
    expect(update).toHaveBeenCalledWith("sub_123", { cancel_at_period_end: true });
  });

  it("pauses collection until the configured resume date", async () => {
    const { client, update } = stripeClient();
    const resumesAt = new Date("2027-01-15T18:00:00.000Z");
    await pauseMembershipBilling("sub_123", resumesAt, client);
    expect(update).toHaveBeenCalledWith("sub_123", {
      pause_collection: { behavior: "void", resumes_at: Math.floor(resumesAt.getTime() / 1000) },
    });
  });

  it("removes Stripe pause collection when membership resumes", async () => {
    const { client, update } = stripeClient();
    await resumeMembershipBilling("sub_123", client);
    expect(update).toHaveBeenCalledWith("sub_123", { pause_collection: "" });
  });
});
