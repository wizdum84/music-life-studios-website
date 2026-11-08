# Music Life Studios - Next Chat Handoff

Updated: November 7, 2026

## Active Continuation Checklist

- [ ] Return to the saved `cawl` beat draft.
- [ ] Generate its cover in Codex, download it, and upload it through Beat Catalog.
- [ ] Upload the full beat and verify the site creates a playable 45-second public preview while keeping the full file private.
- [ ] Upload the Premium WAV/MP3 package and Exclusive WAV/MP3/stems package.
- [ ] Publish `cawl` and verify its title, artwork, preview, prices, and license choices in the public catalog.
- [ ] Complete a Stripe test purchase for `cawl`; verify license activation, customer/studio emails, account status, and the correct secure tier download.

The in-site OpenAI cover generator was removed because it required separately billed API credits. Cover generation will be done in Codex and uploaded through the admin page. The obsolete Sample Library was removed, Beat Catalog is the default content tab, and the automatic 45-second preview workflow remains enabled.

After the `cawl` test, continue with the booking-first launch work in this order:

1. Completed: customer audio uploads and newly signed agreement snapshots now use the private R2 bucket. Admins can download both through 10-minute signed links; customers can access only records they own.
2. Completed: booking balance payments, refunds, and replay/idempotency safeguards. On November 7, 2026, booking #6 completed a $70 Stripe test balance and sent both emails; booking #10 completed a full test refund. Replaying each result produced no duplicate receipt, refund, or email state.
3. Completed: password recovery, expiring single-use reset links, email verification/resend, and authenticator-based admin MFA setup/login are implemented. The MFA secret is encrypted at rest and never returned by the user API. Existing accounts must verify their email, and the owner must enable MFA from Admin Dashboard > Security.
4. In progress: the 205 local catalog entries were migrated to public R2 on November 7, 2026. All 401 remote cover/preview URLs were verified, and the current tracked deployment tree dropped from roughly 735 MB to 25 MB. Next, reauthorize Stripe Projects, choose hosting, and deploy a staging build.
5. Connect the production domain, HTTPS, environment variables, Stripe webhook, backups, logging, and uptime monitoring.
6. Run desktop/mobile checks and the complete production booking flow before launch.

## Start Here

Continue work in:

`C:\Users\wizdu\Documents\Codex\2026-08-04\do\work\music-life-studios-website`

The immediate next task is to verify the Zoho SMTP connection and send a real test email from `bookings@musiclifestudios.work`. Do not request or print passwords, Stripe keys, database credentials, or the contents of `.env`.

## Current Status

- Git working tree was clean before this handoff document was added.
- Production build passes.
- TypeScript check passes.
- Automated tests pass: 2 test files, 7 tests.
- Stripe booking deposits, balance links, contract signing, and admin booking controls are implemented.
- The beat catalog contains more than 200 entries with artwork and 45-second previews.
- The website is currently developed locally, normally at `http://localhost:5005`.
- The site has not yet been deployed publicly.
- The current branch is `main`.

Recent commits:

- `3b9b81c Add Zoho transactional email foundation`
- `a231234 Checkpoint beat catalog and launch hardening`
- `3aa90d3 Checkpoint Stripe checkout and booking flow`

These commits are local unless a later chat confirms they were pushed.

## Domain And Email

Domain: `musiclifestudios.work`

Mailbox: `bookings@musiclifestudios.work`

Completed in Zoho:

- Domain added and ownership verified.
- Bookings mailbox created.
- MX configured and verified.
- SPF configured and verified.
- DKIM configured and verified.
- DMARC configured in monitoring mode with `p=none`.
- DMARC reports go to the bookings mailbox.
- Zoho account is on the free plan.

Local `.env` status:

- Zoho SMTP host, port, user, password, sender name, reply-to, and admin recipient are set.
- Stripe keys and webhook secret are set.
- Database URL and session secret are set.
- `APP_ORIGIN` is still blank because public hosting is not configured.
- `.env` is ignored by Git. Never commit it.

The code uses Zoho SMTP through Nodemailer. After Stripe verifies a booking payment, it attempts to send:

1. A booking confirmation to the customer.
2. A new paid-booking notification to the admin mailbox.

Email sends are non-blocking. A Zoho failure is logged but cannot turn a successful Stripe payment into a checkout failure.

Relevant files:

- `server/services/email.ts`
- `server/routes.ts`
- `.env.example`
- `.env` (secret local file; do not display)

## Immediate Next Steps

1. Verify Zoho SMTP connectivity without displaying credentials.
2. Send a controlled test message to the owner.
3. Confirm the message arrives and is not in spam.
4. Test a complete Stripe test-mode booking and confirm both customer and admin emails arrive.
5. If the free Zoho plan blocks SMTP, keep the mailbox and use Zoho ZeptoMail or another transactional provider as the sending transport.
6. Commit the verified email-test changes if code changes are required.
7. Push the existing local commits to GitHub after confirming repository size limits.

Suggested verification commands:

```powershell
npm run check
npm test
npm run build
```

Windows sandboxing can cause Vitest `EPERM` rename errors. If that happens, rerun tests outside the sandbox; the assertions previously passed.

## Remaining Go-Live Work

### Required

- Choose a hosting provider for the Node/Express application.
- Deploy the application and connect `musiclifestudios.work`.
- Enable HTTPS.
- Set production `APP_ORIGIN=https://musiclifestudios.work`.
- Copy production environment variables into the hosting provider securely.
- Point Stripe's production webhook to:
  `https://musiclifestudios.work/api/stripe/webhook`
- Test Stripe deposit, full payment, remaining balance, refund, and webhook replay flows.
- Test Zoho email delivery from the deployed site.
- Configure backups, logging, uptime monitoring, and database recovery.

### Storage

- Customer audio uploads, signed agreement snapshots, paid beat masters/packages, covers, and previews use Cloudflare R2.
- The 401 public cover/preview objects were verified after migration; local catalog media is excluded from the deployment tree.
- Source WAVs/stems still need to be uploaded per beat before Premium or Exclusive fulfillment is offered.

### Beat Sales

- The catalog and previews work.
- Beat purchase records and contracts exist, but full Stripe payment verification plus secure WAV/stem delivery is not complete.
- Do not promise automatic paid downloads until storage and delivery are implemented.
- A booking-first launch can keep the catalog visible while changing purchase actions to inquiries.

### Memberships

- Stripe subscription checkout and core webhook lifecycle handling exist.
- Benefit redemption, holds, rollover/expiration jobs, dispute closure, lifecycle emails, and broader membership tests remain incomplete.
- Keep new membership enrollment unavailable for launch unless these flows are completed and tested.

### Account Security

- Existing protections include Helmet, request limits, same-origin checks, secure production cookies, admin route protection, secure signing tokens, and signed balance-payment links.
- Password recovery, email verification, admin MFA, and shared rate limiting for multi-instance hosting remain open.
- An npm audit reported existing dependency advisories. A non-forced repair attempt hit a Windows package-lock/network issue. Re-audit and update carefully; do not use `npm audit fix --force` without reviewing breaking changes.

## Recommended Launch Scope

The safest first release is a booking-first soft launch:

1. Public website and portfolio.
2. Booking calendar.
3. Contract signing and download.
4. Stripe deposit or full payment.
5. Zoho customer/admin confirmation emails.
6. Secure balance-payment link.
7. Admin booking and schedule controls.

Keep beat sales and new memberships limited until their payment, storage, delivery, and lifecycle requirements are complete.

## Important Operating Rules

- Do not expose `.env` values in chat, logs, screenshots, or commits.
- Do not overwrite unrelated user changes.
- Use the existing site design language and current beat-page format.
- Preserve the current beat catalog unless the owner explicitly names a beat to remove.
- Do not upload beats tied to existing songs when the owner identifies them as excluded.
- Before deployment, verify mobile and desktop layouts and run the complete booking flow end to end.

## Useful Project Documents

- `SECURITY_AND_TESTING_CHECKPOINT.md`
- `BALANCE_PAYMENT_SETUP.md`
- `BEAT_LIBRARY_SETUP.md`
- `MEMBERSHIP_REMAINING_WORK.md`
- `PROJECT_REPORT.md`
- `BOUNCED_AUDIO_FILENAME_MATCHES.md`
- `PRO_TOOLS_MINE_VS_OTHER_ARTISTS.md`

## Suggested First Message In The New Chat

> Read `NEXT_CHAT_HANDOFF.md` in the project root and continue from it. First verify the Zoho SMTP connection and send a safe test email without displaying any credentials. Then report the result and the next go-live step.
