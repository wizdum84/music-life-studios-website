# Security and Testing Checkpoint

Updated: 2026-08-10

## Completed

- Added Helmet security headers and disabled Express power-by disclosure.
- Added API and authentication rate limits.
- Added request IDs and removed response-body logging so customer data and payment details are not written to logs.
- Added bounded JSON and form request bodies.
- Added same-origin checks for browser state-changing requests.
- Removed the known development session-secret fallback in production; production now requires a 32-character secret.
- Made session cookies explicitly `httpOnly`, `sameSite=lax`, and secure in production.
- Registration now accepts only approved customer fields and cannot set its own admin role.
- Increased new-account password minimum to 12 characters.
- Restricted admin mutations and admin data routes to admin users.
- Required the booking email when checking payment status or creating/completing a Stripe payment.
- Fixed the balance-payment screen so it does not call the removed `update-payment` endpoint after Stripe has already verified the payment.
- Stopped public entity-contract verification from returning stored signature data.
- Added pricing validation and five automated pricing regression tests.
- Removed duplicate feedback and loyalty route definitions so the intended protected/public behavior is no longer decided by route order.
- Restricted public feedback responses to active, non-contact fields and validated feedback submissions.
- Added 15-minute, one-time signing tokens for generated booking, Passport, and beat agreements.
- Added authenticated password changes with current-password verification and session rotation.
- Added a production startup check requiring an HTTPS `APP_ORIGIN`.
- Added signed, 30-day balance-payment links that are tied to one booking and customer email.
- Added a customer payment-link lookup that returns only the minimum booking and balance information needed to pay.
- Bound post-deposit Stripe payment intents to the signed balance link and added Stripe idempotency keys to prevent duplicate intents.
- Preserved the initial full-payment path while requiring a secure link for later balance payments.
- Added admin controls to generate a balance link, copy it, open a pre-filled email draft, and display a scannable QR code.
- Refreshed compatible dependency versions and confirmed `npm audit` reports 0 vulnerabilities.

## Verification

- `npx tsc --noEmit --incremental false` passes.
- `npm test` passes: 7 tests.
- `npm run build` passes.
- `npm audit` reports 0 vulnerabilities.
- Hardened local server verified on `http://localhost:5003` with security headers and rate-limit headers.
- Port 5000 was left untouched because another older dev process was using it.

## Still Needed Before Launch

- Set a strong `SESSION_SECRET` and exact production `APP_ORIGIN` in hosting environment variables.
- Use a real HTTPS domain for Stripe webhooks and configure `STRIPE_WEBHOOK_SECRET` there.
- Test deposit, full payment, balance payment, refund, and webhook replay in Stripe test mode from a clean browser session.
- Add account recovery, email verification, MFA for administrators, and persistent audit-log review before public launch.
- Replace the in-memory rate limiter with a shared store if the app runs on more than one server instance.
- Zoho sender setup, domain/DNS verification, and automatic outbound email remain external launch steps.
- Automatic SMS delivery still needs an SMS provider; the app already supports copying the secure link and opening an email draft.
- Audio upload storage and email webhooks remain intentionally out of scope for this checkpoint.
