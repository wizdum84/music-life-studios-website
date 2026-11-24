# Membership QA follow-up — November 24, 2026

Branch: `codex/membership-qa`; baseline commit: `132e793`.

## Findings

- Browser inventory failed once with “The browser access host is unavailable”. No browser was opened or restarted.
- Gmail search in the connected wizdum84 account, including spam and trash, found no QA reward reminder or expired email.
- The baseline worker never sends a reward-expired email. It changes status and creates `membership_reward_expired_<rewardId>`; that event is NOT a delivery record. This email was never queued by this implementation.
- Reminders are attempted directly during scans, not through the membership lifecycle email queue. The default scan interval is six hours of real time. Advancing a Stripe test clock does not trigger a scan. Jumping through the seven-day window between scans skips the reminder entirely.
- Scans use `MEMBERSHIP_QA_TEST_CLOCK_ID` frozen time when configured with a test key. A clock retrieval error aborts the scan. Worker startup is wired into server startup.
- Missing email configuration silently skips reminders. Allowlist rejection throws and is logged as `Membership reward reminder pending retry for reward ...`. Transport errors follow the same path. Successful reminders create `membership_reward_expiration_<rewardId>` only after the transport accepts the message.
- Live configuration, database events and Render logs could not be inspected in this session. The actual reminder cause remains unconfirmed; a missed window is a hypothesis, not a verified delivery failure.
- Stripe Projects status succeeds and lists the QA database and two media buckets, but does not list the QA web service. No account switch, environment pull, secret inspection or deployment occurred.

## Local changes, not deployed

Added an expired-email template and delivery for expired membership rewards. `membership_reward_expired_email_sent_<rewardId>` is separate from the expiration event. Already expired records are retried until transport acceptance is recorded, including records expired before this fix. Redeemed rewards are excluded. Deploying this change can therefore send notices for existing expired rewards; verify QA allowlist and label before deployment.

Tests cover clock-based reminders, repeated scans, clock jumps past the reminder window, missing configuration, transport failure, redeemed rewards, and fallback refusal after existing rewards expire. Event-based email deduplication is not transactional with the external mail transport; a crash between transport acceptance and event persistence can still duplicate delivery.

## Manual live verification in the existing regular browser

1. Confirm Music Life Studios’s workspace and service `music-life-studios-membership-qa` (`srv-dbsb6ujl550s73fvv4tg`). Keep Stripe in Test/Sandbox and use the existing wizdum84 customer.
2. Refresh Admin > Memberships. Confirm Cycle 1 still has exactly two reward records, both Expired, with neither “Reward missing” nor “Issue reward” for this membership.
3. To exercise the endpoint despite the hidden action, use DevTools Console on the QA admin origin only. Replace MEMBER_ID with the membership ID observed in the admin data, then run:

   ```js
   fetch('/api/admin/memberships/MEMBER_ID/issue-reward', {
     method: 'POST', credentials: 'same-origin',
     headers: { 'Content-Type': 'application/json' }, body: '{}'
   }).then(async r => ({ status: r.status, body: await r.json() })).then(console.log)
   ```

   Expected: HTTP 200, `issued: []`, `idempotent: true`. Refresh and confirm the count remains two. Do not run on production.
4. In QA environment settings, verify only presence/correctness of email configuration, QA subject label, recipient allowlist, test-clock ID and lifecycle scan interval; never copy secret values. In QA logs inspect `Unable to scan membership lifecycles`, `Membership reward reminder pending retry`, and provider errors around clock advances. Inspect membership event names above to distinguish expiration state from accepted mail.
5. Before replaying a reminder, establish a valid future reward deadline and hold the QA clock inside its seven-day window until a scan and reminder event are observed. Do not rewind an existing clock or duplicate Cycle 1. The existing expired rewards cannot demonstrate a historical reminder. Plan a separate eligible QA cycle if needed.
6. Deploy the reviewed fix to QA only after workspace/service and allowlist verification. Verify expired-email events and actual Gmail arrival, then repeated scans without additional delivery. Transport acceptance alone does not prove inbox delivery.

## Cleanup remains gated

No recovery route, tooling or variables were removed. No email variables were removed. No deployment was made. Complete live email and fallback checks before removing temporary recovery tooling and recovery-only variables; retain test-clock settings while clock-based QA continues. Remove copied QA email variables only after email testing passes or the owner accepts a documented fallback. Then redeploy QA and smoke-test. Production promotion still requires explicit approval.
