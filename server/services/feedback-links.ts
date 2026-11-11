import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

type FeedbackClaims = { bookingId: number; email: string; expiresAt: number; nonce: string };

function secret() {
  if (!process.env.SESSION_SECRET) throw new Error("Feedback-link signing secret is not configured");
  return process.env.SESSION_SECRET;
}

export function issueFeedbackToken(bookingId: number, email: string) {
  const claims: FeedbackClaims = {
    bookingId,
    email: email.trim().toLowerCase(),
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    nonce: randomBytes(24).toString("base64url"),
  };
  const encoded = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const signature = createHmac("sha256", secret()).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

export function verifyFeedbackToken(token: unknown) {
  if (typeof token !== "string") return null;
  const [encoded, supplied] = token.split(".");
  if (!encoded || !supplied) return null;
  try {
    const expected = createHmac("sha256", secret()).update(encoded).digest("base64url");
    const suppliedBuffer = Buffer.from(supplied);
    const expectedBuffer = Buffer.from(expected);
    if (suppliedBuffer.length !== expectedBuffer.length || !timingSafeEqual(suppliedBuffer, expectedBuffer)) return null;
    const claims = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as FeedbackClaims;
    if (!Number.isInteger(claims.bookingId) || !claims.email || claims.expiresAt <= Date.now()) return null;
    return claims;
  } catch {
    return null;
  }
}
