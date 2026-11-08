import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const { sendMail } = vi.hoisted(() => ({ sendMail: vi.fn(async () => ({ accepted: ["test@example.com"] })) }));
vi.mock("nodemailer", () => ({ default: { createTransport: () => ({ sendMail }) } }));
import { sendWelcomeEmail, sendClientConfirmationEmail } from "../server/services/email";
import type { Booking } from "../shared/schema";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("ZOHO_SMTP_HOST", "smtp.example.com");
  vi.stubEnv("ZOHO_SMTP_USER", "bookings@example.com");
  vi.stubEnv("ZOHO_SMTP_PASSWORD", "fake-test-value");
});
afterEach(() => vi.unstubAllEnvs());
describe("transactional email content", () => {
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
