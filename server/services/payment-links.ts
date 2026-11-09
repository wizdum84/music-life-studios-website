import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export type PaymentLinkClaims = {
  bookingId: number;
  email: string;
  expiresAt: number;
  nonce: string;
};

function signingSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("Payment-link signing secret is not configured");
  return secret;
}

export function issuePaymentLinkToken(bookingId: number, email: string) {
  const claims: PaymentLinkClaims = {
    bookingId,
    email: email.trim().toLowerCase(),
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    nonce: randomBytes(24).toString("base64url"),
  };
  const encodedClaims = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const signature = createHmac("sha256", signingSecret()).update(encodedClaims).digest("base64url");
  return `${encodedClaims}.${signature}`;
}

export function verifyPaymentLinkToken(token: unknown) {
  if (typeof token !== "string") return null;
  const [encodedClaims, suppliedSignature] = token.split(".");
  if (!encodedClaims || !suppliedSignature) return null;
  try {
    const expectedSignature = createHmac("sha256", signingSecret()).update(encodedClaims).digest("base64url");
    const suppliedBuffer = Buffer.from(suppliedSignature);
    const expectedBuffer = Buffer.from(expectedSignature);
    if (suppliedBuffer.length !== expectedBuffer.length || !timingSafeEqual(suppliedBuffer, expectedBuffer)) return null;
    const claims = JSON.parse(Buffer.from(encodedClaims, "base64url").toString("utf8")) as PaymentLinkClaims;
    if (!Number.isInteger(claims.bookingId) || !claims.email || claims.expiresAt <= Date.now() || !claims.nonce) return null;
    return claims;
  } catch {
    return null;
  }
}
