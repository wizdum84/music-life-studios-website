import { beforeEach, describe, expect, it, vi } from "vitest";

const f = vi.hoisted(() => ({ events: [] as any[], rewards: [] as any[], send: vi.fn(), configured: vi.fn(), clock: vi.fn() }));
vi.mock("../server/storage", () => ({ storage: {
  getAllMembershipSubscriptions: async () => [{ id: 1, userId: 2, planId: 3, status: "active", nextBillingDate: "2028-01-01" }],
  getAllUsers: async () => [],
  getUser: async () => ({ id: 2, email: "qa@example.com" }),
  getMembershipPlan: async () => ({ id: 3 }),
  getMembershipEvents: async () => f.events,
  createMembershipEvent: async (event: any) => { f.events.push(event); return event; },
  getMembershipLoyaltyRewards: async () => f.rewards,
  updateMembershipLoyaltyReward: async (id: number, update: any) => Object.assign(f.rewards.find(r => r.id === id), update),
} }));
vi.mock("../server/services/email", () => ({ isEmailConfigured: f.configured, sendRewardExpirationEmail: f.send, sendMembershipLifecycleEmail: vi.fn(), sendMissingMembershipRewardAlert: vi.fn() }));
vi.mock("../server/services/stripe", () => ({ retrieveMembershipTestClockTime: f.clock }));
vi.mock("../server/services/membership-lifecycle-email-queue", () => ({ retryPendingMembershipLifecycleEmails: async () => 0 }));
vi.mock("../server/services/membership-reward-fallback", () => ({ getMissingMembershipReward: async () => null }));
import { scanMembershipLifecycles } from "../server/services/membership-lifecycle-worker";

describe("membership reward notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    f.events = [];
    f.rewards = [{ id: 4, status: "issued", redemptionDeadline: new Date("2027-02-23T00:00:00Z") }];
    f.configured.mockReturnValue(true);
    f.send.mockResolvedValue(true);
    f.clock.mockResolvedValue(new Date("2027-02-20T00:00:00Z"));
  });
  it("uses QA clock time and sends one reminder across repeated scans", async () => {
    await scanMembershipLifecycles();
    await scanMembershipLifecycles();
    expect(f.send).toHaveBeenCalledTimes(1);
    expect(f.events[0].eventType).toBe("membership_reward_expiration_4");
  });
  it("sends expiration once when a clock jump skips the reminder window", async () => {
    f.clock.mockResolvedValue(new Date("2027-02-24T00:00:00Z"));
    await scanMembershipLifecycles();
    await scanMembershipLifecycles();
    expect(f.rewards[0].status).toBe("expired");
    expect(f.send).toHaveBeenCalledTimes(1);
    expect(f.send.mock.calls[0][3]).toBe("expired");
    expect(f.events.map(e => e.eventType)).toEqual(["membership_reward_expired_4", "membership_reward_expired_email_sent_4"]);
  });
  it("retries an already expired reward after email configuration becomes available", async () => {
    f.clock.mockResolvedValue(new Date("2027-02-24T00:00:00Z"));
    f.configured.mockReturnValue(false);
    await scanMembershipLifecycles();
    expect(f.send).not.toHaveBeenCalled();
    f.configured.mockReturnValue(true);
    f.send.mockResolvedValueOnce(false);
    await scanMembershipLifecycles();
    expect(f.events).toHaveLength(1);
    await scanMembershipLifecycles();
    await scanMembershipLifecycles();
    expect(f.send).toHaveBeenCalledTimes(2);
    expect(f.events).toHaveLength(2);
  });
  it("never emails a redeemed reward", async () => {
    f.rewards[0].status = "redeemed";
    await scanMembershipLifecycles(new Date("2027-02-24T00:00:00Z"));
    expect(f.send).not.toHaveBeenCalled();
  });
  it("retries a transport failure without treating the expiration event as delivery", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    f.send.mockRejectedValueOnce(new Error("Transport unavailable"));
    const now = new Date("2027-02-24T00:00:00Z");
    try {
      await scanMembershipLifecycles(now);
      expect(f.events).toHaveLength(1);
      await scanMembershipLifecycles(now);
      await scanMembershipLifecycles(now);
      expect(f.send).toHaveBeenCalledTimes(2);
      expect(f.events).toHaveLength(2);
    } finally { log.mockRestore(); }
  });
});
