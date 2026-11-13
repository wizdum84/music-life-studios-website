import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;

export const stripe = secretKey
  ? new Stripe(secretKey, { apiVersion: "2026-07-29.dahlia" })
  : null;

const checkoutIntegrationIdentifier = "music_life_studios_kqmtzvpa";

function liveTestCharge(customerEmail: string, catalogPriceCents: number) {
  const configuredPrice = Number(process.env.LIVE_TEST_PRICE_CENTS || 0);
  const allowedEmails = String(process.env.LIVE_TEST_CUSTOMER_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  const eligible = Number.isSafeInteger(configuredPrice) && configuredPrice >= 50 &&
    allowedEmails.includes(customerEmail.trim().toLowerCase());
  const metadata: Record<string, string> = eligible ? {
    liveTestPriceOverride: "true",
    catalogPriceCents: String(catalogPriceCents),
  } : {};
  return {
    amountCents: eligible ? configuredPrice : catalogPriceCents,
    metadata,
  };
}

export function assertStripeConfigured() {
  if (!stripe) {
    throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY on the server.");
  }
  return stripe;
}

export async function createPaymentIntent(input: {
  amountCents: number;
  bookingId: number;
  customerEmail: string;
  isDeposit: boolean;
  tipAmount: number;
  idempotencyKey?: string;
}) {
  const client = assertStripeConfigured();
  const charge = liveTestCharge(input.customerEmail, input.amountCents);
  return client.paymentIntents.create({
    amount: charge.amountCents,
    currency: "usd",
    receipt_email: input.customerEmail,
    metadata: {
      bookingId: String(input.bookingId),
      isDeposit: String(input.isDeposit),
      tipAmount: String(input.tipAmount),
      ...charge.metadata,
    },
    automatic_payment_methods: { enabled: true },
  }, input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : undefined);
}

export async function retrievePaymentIntent(paymentIntentId: string) {
  return assertStripeConfigured().paymentIntents.retrieve(paymentIntentId);
}

export async function createMembershipCheckoutSession(input: {
  customerEmail: string;
  userId: number;
  subscriptionId: number;
  planId: number;
  planName: string;
  priceCents: number;
  successUrl: string;
  cancelUrl: string;
}) {
  const client = assertStripeConfigured();
  const charge = liveTestCharge(input.customerEmail, input.priceCents);
  return client.checkout.sessions.create({
    integration_identifier: checkoutIntegrationIdentifier,
    mode: "subscription",
    customer_email: input.customerEmail,
    line_items: [{
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: charge.amountCents,
        recurring: { interval: "month" },
        product_data: { name: `Music Life Passport - ${input.planName}` },
      },
    }],
    metadata: {
      userId: String(input.userId),
      subscriptionId: String(input.subscriptionId),
      planId: String(input.planId),
      ...charge.metadata,
    },
    subscription_data: {
      metadata: {
        userId: String(input.userId),
        subscriptionId: String(input.subscriptionId),
        planId: String(input.planId),
        ...charge.metadata,
      },
    },
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
  });
}

export async function retrieveCheckoutSession(sessionId: string) {
  return assertStripeConfigured().checkout.sessions.retrieve(sessionId, { expand: ["subscription"] });
}

export async function createBeatLicenseCheckoutSession(input: {
  purchaseId: number;
  beatId: number;
  beatTitle: string;
  licenseType: string;
  customerEmail: string;
  priceCents: number;
  recoveryDiscountPercent?: number;
  successUrl: string;
  cancelUrl: string;
}) {
  const client = assertStripeConfigured();
  const recoveryDiscountPercent = Math.max(0, Math.min(100, Math.round(input.recoveryDiscountPercent || 0)));
  const checkoutPriceCents = recoveryDiscountPercent
    ? Math.max(50, Math.round(input.priceCents * (100 - recoveryDiscountPercent) / 100))
    : input.priceCents;
  const charge = liveTestCharge(input.customerEmail, checkoutPriceCents);
  const purchaseMetadata = {
    ...charge.metadata,
    beatPurchaseId: String(input.purchaseId),
    beatId: String(input.beatId),
    licenseType: input.licenseType,
    catalogPriceCents: String(input.priceCents),
    checkoutPriceCents: String(checkoutPriceCents),
    ...(recoveryDiscountPercent ? { recoveryDiscountPercent: String(recoveryDiscountPercent) } : {}),
  };
  return client.checkout.sessions.create({
    integration_identifier: checkoutIntegrationIdentifier,
    mode: "payment",
    customer_email: input.customerEmail,
    line_items: [{
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: charge.amountCents,
        product_data: { name: `${input.beatTitle} - ${input.licenseType} beat license` },
      },
    }],
    metadata: purchaseMetadata,
    payment_intent_data: {
      receipt_email: input.customerEmail,
      metadata: purchaseMetadata,
    },
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
  }, { idempotencyKey: `beat-license:${input.purchaseId}:${recoveryDiscountPercent ? "recovery" : "initial"}` });
}

export async function expireCheckoutSession(sessionId: string) {
  return assertStripeConfigured().checkout.sessions.expire(sessionId);
}

export function constructWebhookEvent(payload: Buffer, signature: string | undefined) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("Stripe webhook is not configured. Set STRIPE_WEBHOOK_SECRET on the server.");
  }
  if (!signature) {
    throw new Error("Missing Stripe-Signature header.");
  }

  return assertStripeConfigured().webhooks.constructEvent(payload, signature, webhookSecret);
}
