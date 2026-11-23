import { describe, expect, it, vi } from "vitest";
import type { IStorage } from "../server/storage";
import { getMissingMembershipReward, issueMissingMembershipReward } from "../server/services/membership-reward-fallback";

function fixture() {
  const rewards: any[] = [];
  const store = {
    getMembershipPaymentAssociations: vi.fn().mockResolvedValue([
      { id: 13, status: "succeeded", createdAt: new Date("2027-03-14T12:00:00Z") },
      { id: 12, status: "succeeded", createdAt: new Date("2027-02-14T12:00:00Z") },
      { id: 11, status: "succeeded", createdAt: new Date("2027-01-14T12:00:00Z") },
    ]),
    getMembershipLoyaltyMilestones: vi.fn().mockResolvedValue([
      { id: 21, active: true, thresholdMonths: 3, rewardType: "recording_hours", rewardQuantity: 2 },
      { id: 22, active: true, thresholdMonths: 3, rewardType: "starter_reward_beat", rewardQuantity: 1 },
    ]),
    getMembershipPlan: vi.fn().mockResolvedValue({ id: 3, tier: "artist_access", name: "Artist Access" }),
    getMembershipLoyaltyRewards: vi.fn().mockImplementation(async () => rewards),
    createMembershipLoyaltyReward: vi.fn().mockImplementation(async (reward) => {
      const created = { id: 30 + rewards.length, createdAt: new Date(), ...reward };
      rewards.push(created);
      return created;
    }),
  } as unknown as IStorage;
  const membership = { id: 5, userId: 4, planId: 3 } as any;
  return { store, membership, rewards };
}

describe("membership reward fallback", () => {
  it("detects the exact missing reward cycle from verified successful payments", async () => {
    const { store, membership } = fixture();
    const missing = await getMissingMembershipReward(store, membership);
    expect(missing).toMatchObject({
      cycleNumber: 1,
      thresholdMonths: 3,
      successfulPaymentCount: 3,
      qualifyingPaymentId: 13,
    });
    expect(missing?.missingRewards).toHaveLength(2);
  });

  it("issues each missing reward once and becomes idempotent", async () => {
    const { store, membership, rewards } = fixture();
    const first = await issueMissingMembershipReward(store, membership);
    expect(first.issued).toHaveLength(2);
    expect(rewards.every((reward) => reward.cycleNumber === 1 && reward.sourcePaymentAssociationId === 13)).toBe(true);

    const second = await issueMissingMembershipReward(store, membership);
    expect(second.issued).toHaveLength(0);
    expect(rewards).toHaveLength(2);
  });
});
