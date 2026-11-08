# Automatic email setup

Implemented November 5, 2026.

## Events

- Successful customer registration: welcome email through Zoho. This is a welcome message, not email-address verification. Delivery is currently best effort; a failed welcome email does not block registration and is logged without credentials.
- Verified booking PaymentIntent success: customer payment confirmation and admin notification. Both the browser callback and `payment_intent.succeeded` use the same payment processor.
- Deposits, full payments, and remaining-balance payments show the actual amount paid. Deposit confirmations show the remaining booking balance.

Booking notifications are recorded in the existing booking `payment_metadata` JSON, so no schema migration is required. Each payment and recipient is tracked separately. Failed sends retry every minute and after application restart, provided database storage is enabled and the Node process is running. Webhooks acknowledge after saving the payment; SMTP runs in the background. Database failures return a retryable HTTP 500. Invalid signatures return HTTP 400.

Concurrent callbacks, webhook replays, and worker attempts use a per-booking database advisory lock. In-memory development storage has a process-local lock and loses retry state on restart. A separate small connection pool keeps lock waits from starving ordinary queries.

SMTP does not provide exactly-once delivery: if a process dies after Zoho accepts a message but before its delivery marker is saved, a retry can send a duplicate. Ordinary replays skip recipients already marked sent. Payments recorded before this implementation are not automatically emailed again.

## Connect Stripe

The site is still local; a public Stripe destination has not been created by this change.

1. Deploy the Node application with HTTPS and set `APP_ORIGIN=https://musiclifestudios.work`.
2. In Stripe Workbench, create a webhook event destination for your account at `https://musiclifestudios.work/api/stripe/webhook`.
3. Select `payment_intent.succeeded` for booking payments. The existing membership handler also supports `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `charge.refunded`, `charge.dispute.created`, and `customer.subscription.deleted`; keep enrollment unavailable until membership launch requirements are complete.
4. Store this destination's signing secret securely as `STRIPE_WEBHOOK_SECRET` in the hosting environment. Do not paste it into chat. Test and live destinations have separate signing secrets and must match the environment's Stripe keys.
5. Restart the deployed app after setting secrets. Complete a Stripe test-mode booking, verify the webhook delivery returns HTTP 200, and confirm both emails reach the inbox. Replay the event and confirm no additional messages arrive. Test the deposit followed by balance payment as well.

For local testing, Stripe CLI forwarding can target `http://localhost:5005/api/stripe/webhook`; its listener signing secret must be installed securely in the local environment. A Dashboard destination cannot reach localhost directly. Do not use a generic fixture event as proof of a real booking flow: the payment needs the actual booking ID, amount, and metadata created by this application.

Official reference: https://docs.stripe.com/webhooks

## Scope and validation

This implementation covers account welcome messages and booking payment emails. It does not enable beat downloads, membership lifecycle emails, password reset, or email verification.

Automated tests cover payment validation, concurrent replay, partial email failure and retry, deposit/balance history, refund replay, disabled email configuration, and message content. Real Stripe-to-local forwarding and inbox delivery for these flows still require end-to-end verification. The preceding SMTP test verified authentication and provider acceptance only.
