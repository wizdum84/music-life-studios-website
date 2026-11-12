import { beforeAll, describe, expect, it } from "vitest";

beforeAll(() => {
  process.env.SESSION_SECRET = "test-session-secret-that-is-long-enough-for-security";
});

describe("account security tokens and MFA", () => {
  it("rejects a tampered token and a token used for the wrong purpose", async () => {
    const { accountSecurityInternals: security } = await import("../server/auth");
    const token = security.issueSecurityToken({ purpose: "reset-password", uid: 4 }, 60);
    expect(security.readSecurityToken(token, "reset-password")?.uid).toBe(4);
    expect(security.readSecurityToken(token, "verify-email")).toBeNull();
    expect(security.readSecurityToken(`${token}x`, "reset-password")).toBeNull();
  });

  it("generates and verifies time-based authenticator codes", async () => {
    const { accountSecurityInternals: security } = await import("../server/auth");
    const secret = security.createTotpSecret();
    expect(secret).toMatch(/^[A-Z2-7]+$/);
    expect(security.verifyTotp(secret, security.totpCode(secret))).toBe(true);
    expect(security.verifyTotp(secret, "000000") && security.totpCode(secret) !== "000000").toBe(false);
  });

  it("encrypts MFA secrets before storage", async () => {
    const { accountSecurityInternals: security } = await import("../server/auth");
    const secret = security.createTotpSecret();
    const encrypted = security.encryptMfaSecret(secret);
    expect(encrypted).not.toContain(secret);
    expect(security.decryptMfaSecret(encrypted)).toBe(secret);
  });

  it("normalizes email addresses for case-insensitive sign-in", async () => {
    const { accountSecurityInternals: security } = await import("../server/auth");
    expect(security.normalizeEmail("  Wizdum84@Hotmail.COM ")).toBe("wizdum84@hotmail.com");
  });
});
