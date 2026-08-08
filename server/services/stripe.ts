import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;

export const stripe = secretKey
  ? new Stripe(secretKey, { apiVersion: "2025-03-31.basil" })
  : null;

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
}) {
  const client = assertStripeConfigured();
  return client.paymentIntents.create({
    amount: input.amountCents,
    currency: "usd",
    receipt_email: input.customerEmail,
    metadata: {
      bookingId: String(input.bookingId),
      isDeposit: String(input.isDeposit),
      tipAmount: String(input.tipAmount),
    },
    automatic_payment_methods: { enabled: true },
  });
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
  return client.checkout.sessions.create({
    mode: "subscription",
    customer_email: input.customerEmail,
    line_items: [{
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: input.priceCents,
        recurring: { interval: "month" },
        product_data: { name: `Music Life Passport - ${input.planName}` },
      },
    }],
    metadata: {
      userId: String(input.userId),
      subscriptionId: String(input.subscriptionId),
      planId: String(input.planId),
    },
    subscription_data: {
      metadata: {
        userId: String(input.userId),
        subscriptionId: String(input.subscriptionId),
        planId: String(input.planId),
      },
    },
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
  });
}

export async function retrieveCheckoutSession(sessionId: string) {
  return assertStripeConfigured().checkout.sessions.retrieve(sessionId, { expand: ["subscription"] });
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
