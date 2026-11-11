import { describe, expect, it } from "vitest";
import { productionConfigurationErrors } from "../server/runtime-config";

const validEnvironment = {
  APP_ORIGIN: "https://musiclifestudios.work",
  DATABASE_URL: "postgresql://example.invalid/music_life",
  SESSION_SECRET: "a-secure-session-secret-with-32-characters",
  STRIPE_SECRET_KEY: "sk_test_example",
  STRIPE_WEBHOOK_SECRET: "whsec_example",
};

describe("production configuration", () => {
  it("accepts the required production settings", () => {
    expect(productionConfigurationErrors(validEnvironment)).toEqual([]);
  });

  it("reports missing settings without including their values", () => {
    const errors = productionConfigurationErrors({});
    expect(errors).toHaveLength(5);
    expect(errors.join(" ")).toContain("DATABASE_URL is required");
  });

  it("rejects an insecure origin, short session secret, and non-Postgres database", () => {
    const errors = productionConfigurationErrors({
      ...validEnvironment,
      APP_ORIGIN: "http://musiclifestudios.work",
      SESSION_SECRET: "too-short",
      DATABASE_URL: "mysql://example.invalid/music_life",
    });
    expect(errors).toContain("APP_ORIGIN must be an HTTPS URL");
    expect(errors).toContain("SESSION_SECRET must contain at least 32 characters");
    expect(errors).toContain("DATABASE_URL must be a PostgreSQL connection URL");
  });
});
