import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const { sendMail } = vi.hoisted(() => ({ sendMail: vi.fn(async () => ({ accepted: ["test@example.com"] })) }));
vi.mock("nodemailer", () => ({ default: { createTransport: () => ({ sendMail }) } }));
import { sendWelcomeEmail, sendClientConfirmationEmail, sendEmailVerificationEmail } from "../server/services/email";
import type { Booking } from "../shared/schema";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("ZOHO_SMTP_HOST", "smtp.example.com");
  vi.stubEnv("ZOHO_SMTP_USER", "bookings@example.com");
  vi.stubEnv("ZOHO_SMTP_PASSWORD", "fake-test-value");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
describe("transactional email content", () => {
  it("uses the ZeptoMail HTTPS API when the Zepto SMTP host is configured", async () => {
    vi.stubEnv("ZOHO_SMTP_HOST", "smtp.zeptomail.com");
    vi.stubEnv("EMAIL_FROM_ADDRESS", "bookings@musiclifestudios.work");
    const apiRequest = vi.fn(async () => ({
      ok: true,
      json: async () => ({ message: "OK" }),
    }));
    vi.stubGlobal("fetch", apiRequest);

    await sendEmailVerificationEmail(
      { email: "test@example.com", firstName: "Alex", username: "alex" },
      "https://example.com/verify",
    );

    expect(apiRequest).toHaveBeenCalledWith(
      "https://api.zeptomail.com/v1.1/email",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Zoho-enczapikey fake-test-value" }),
      }),
    );
    const request = apiRequest.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(request.body))).toEqual(expect.objectContaining({
      from: { address: "bookings@musiclifestudios.work", name: "Music Life Studios" },
      to: [{ email_address: { address: "test@example.com" } }],
      subject: "Verify your Music Life Studios email",
    }));
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("welcomes a new account without claiming email verification", async () => {
    await sendWelcomeEmail({ email: "test@example.com", firstName: "Alex", username: "alex" });
    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: "test@example.com", subject: "Welcome to Music Life Studios", text: expect.stringContaining("Your account is ready") }));
  });
  it("shows the actual deposit and remaining balance", async () => {
    await sendClientConfirmationEmail({ id: 1, name: "Alex", email: "test@example.com", date: new Date("2026-11-10T18:00:00Z"), duration: 120, amount: 20000, paymentStatus: "deposit_paid" } as Booking, "pi_test", 10000);
    const message = sendMail.mock.calls[0] as unknown as [{ text: string }];
    expect(message[0].text).toContain("Paid in this payment: $100.00");
    expect(message[0].text).toContain("Remaining booking balance: $100.00");
  });
});
