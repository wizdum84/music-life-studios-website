# Music Life Studios Deployment Operations

This runbook covers the booking-first Render deployment. Never paste secrets into tickets, logs, screenshots, or this file.

## Health and uptime monitoring

- Liveness: `GET /api/health` confirms that the Node process can answer requests.
- Readiness: `GET /api/ready` confirms that the process can query PostgreSQL. It returns HTTP 503 when the database is unavailable.
- Configure Render's health-check path as `/api/ready`.
- Configure an external uptime monitor to request `https://musiclifestudios.work/api/health` every five minutes and alert after two consecutive failures.
- Monitor the staging URL until the production domain is connected.

## Required production settings

Startup stops with a list of setting names—not their values—when any required setting is missing or malformed:

- `APP_ORIGIN` (HTTPS)
- `DATABASE_URL` (PostgreSQL)
- `SESSION_SECRET` (at least 32 characters)
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

Stripe's publishable key is embedded during the frontend build and must also be set in Render before deploying. R2 and transactional-email settings remain required for their respective media and email workflows.

## Logging and incident checks

Production request and lifecycle logs are emitted as one-line JSON records. Search Render logs by `event`, `requestId`, `statusCode`, or Stripe event ID. Do not log request bodies, authorization headers, passwords, payment secrets, or environment values.

For an incident:

1. Check `/api/health`, then `/api/ready`.
2. Check the latest Render deploy and runtime logs.
3. Check Neon availability and connection usage.
4. For payments, compare the Stripe event delivery and its HTTP response with the matching application log time.
5. Roll back to the last known-good Render deploy when the failure began with a release.

## Database backup and recovery

Neon is the system of record. Before production launch, enable the available Neon restore/history retention for the production branch and confirm its retention window in the Neon dashboard.

Before a schema change or bulk data operation:

1. Create a protected Neon branch or restore point from production.
2. Record the branch creation time and intended change without copying credentials.
3. Apply the change to staging first and run the application checks.
4. Apply it to production only after staging passes.

Recovery drill:

1. Create a temporary database branch from a known timestamp.
2. connect a temporary staging service to that branch.
3. Verify account login, bookings, contracts, payments, memberships, and catalog reads.
4. Delete the temporary service and branch after verification.

Never test restoration by overwriting the active production database. For R2, preserve the public/private bucket separation and enable an appropriate retention or object-versioning policy before storing irreplaceable customer deliverables.

## Release checklist

1. Run `npm run check`, `npm test`, and `npm run build`.
2. Deploy the exact tested commit to staging.
3. Verify `/api/health` and `/api/ready` return HTTP 200.
4. Complete a test-mode booking and verify Stripe webhook HTTP 200.
5. Verify admin and customer views on desktop and mobile.
6. Deploy the same commit to production.
7. Verify the custom domain, HTTPS, production Stripe webhook, email delivery, logging, and uptime alert.
