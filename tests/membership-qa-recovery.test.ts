import { describe, expect, it } from "vitest";
import { assertMembershipQaRecoveryEnvironment } from "../server/services/stripe";

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
});
