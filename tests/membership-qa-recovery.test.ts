import { describe, expect, it, vi } from "vitest";
import { assertMembershipQaRecoveryEnvironment } from "../server/services/stripe";
import { createMembershipQaRecoveryCheckout } from "../server/services/membership-qa-recovery";
import type { IStorage } from "../server/storage";

const validEnvironment = {
  APP_ORIGIN: "https://music-life-studios-membership-qa.onrender.com",
  STRIPE_SECRET_KEY: "sk_test_example",
  MEMBERSHIP_QA_TEST_CLOCK_ID: "clock_example",
} as NodeJS.ProcessEnv;

describe("membership QA recovery guards", () => {
  it("accepts only the exact QA origin with test credentials and a test clock", () => {
    expect(assertMembershipQaRecoveryEnvironment(validEnvironment)).toEqual({
      appOrigin: "https://music-life-studios-membership-qa.onrender.com",
      testClockId: "clock_example",
    });
  });

  it("rejects production and lookalike origins", () => {
    expect(() => assertMembershipQaRecoveryEnvironment({
      ...validEnvironment,
      APP_ORIGIN: "https://musiclifestudios.work",
    })).toThrow(/restricted to.*QA/i);
    expect(() => assertMembershipQaRecoveryEnvironment({
      ...validEnvironment,
      APP_ORIGIN: "https://music-life-studios-membership-qa.onrender.com.attacker.example",
    })).toThrow(/restricted to.*QA/i);
  });

  it("rejects live credentials and a missing test clock", () => {
    expect(() => assertMembershipQaRecoveryEnvironment({
      ...validEnvironment,
      STRIPE_SECRET_KEY: "sk_live_example",
    })).toThrow(/test credentials/i);
    expect(() => assertMembershipQaRecoveryEnvironment({
      ...validEnvironment,
      MEMBERSHIP_QA_TEST_CLOCK_ID: "",
    })).toThrow(/TEST_CLOCK_ID/i);
  });

  it("creates an idempotent Checkout for the fixed QA membership without creating a membership", async () => {
    const previous = {
      APP_ORIGIN: process.env.APP_ORIGIN,
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      MEMBERSHIP_QA_TEST_CLOCK_ID: process.env.MEMBERSHIP_QA_TEST_CLOCK_ID,
    };
    Object.assign(process.env, validEnvironment);
    const createMembershipSubscription = vi.fn();
    const store = {
      getUser: vi.fn().mockResolvedValue({ id: 4, email: "wizdum84@gmail.com" }),
      getMembershipSubscriptionsByUser: vi.fn().mockResolvedValue([{
        id: 5,
        userId: 4,
        planId: 3,
        status: "active",
        paymentProviderSubscriptionId: "sub_old",
      }]),
      getMembershipPlan: vi.fn().mockResolvedValue({ id: 3, name: "Artist Access", priceCents: 5000, active: true }),
      getMembershipPaymentAssociations: vi.fn().mockResolvedValue([
        { id: 1, status: "succeeded" },
        { id: 2, status: "succeeded" },
      ]),
      createMembershipSubscription,
    } as unknown as IStorage;
    const createCheckout = vi.fn().mockResolvedValue({ id: "cs_recovery", url: "https://checkout.stripe.test/recovery" });

    try {
      const result = await createMembershipQaRecoveryCheckout(store, createCheckout as any);
      expect(result).toMatchObject({ membershipId: 5, userId: 4, preservedSucceededPayments: 2 });
      expect(createCheckout).toHaveBeenCalledWith(expect.objectContaining({
        userId: 4,
        subscriptionId: 5,
        idempotencyKey: "qa-membership-recovery:clock_example:4:5:2",
      }));
      expect(createMembershipSubscription).not.toHaveBeenCalled();
    } finally {
      for (const [key, value] of Object.entries(previous)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
  });

  it("refuses recovery when the preserved successful-payment count changed", async () => {
    const previous = {
      APP_ORIGIN: process.env.APP_ORIGIN,
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      MEMBERSHIP_QA_TEST_CLOCK_ID: process.env.MEMBERSHIP_QA_TEST_CLOCK_ID,
    };
    Object.assign(process.env, validEnvironment);
    const store = {
      getUser: vi.fn().mockResolvedValue({ id: 4, email: "wizdum84@gmail.com" }),
      getMembershipSubscriptionsByUser: vi.fn().mockResolvedValue([{
        id: 5,
        userId: 4,
        planId: 3,
        status: "active",
        paymentProviderSubscriptionId: "sub_old",
      }]),
      getMembershipPlan: vi.fn().mockResolvedValue({ id: 3, name: "Artist Access", priceCents: 5000, active: true }),
      getMembershipPaymentAssociations: vi.fn().mockResolvedValue([{ id: 1, status: "succeeded" }]),
    } as unknown as IStorage;
    const createCheckout = vi.fn();

    try {
      await expect(createMembershipQaRecoveryCheckout(store, createCheckout as any))
        .rejects.toThrow(/1 successful payment associations; expected 2/);
      expect(createCheckout).not.toHaveBeenCalled();
    } finally {
      for (const [key, value] of Object.entries(previous)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
  });
});
