# Music Life Membership Remaining Work

This document tracks what is still needed after the current membership scaffold.

## Current State

The project now has:

- Approved membership plan catalog for Artist Access, Consistent Artist, and Release Artist.
- Membership tables and TypeScript schema types.
- Storage methods for plans, versions, subscriptions, billing periods, benefit definitions, benefit ledger entries, discounts, events, pauses, loyalty milestones, and rewards.
- Startup seeding for approved plans, benefits, discounts, loyalty milestone, and flexible month-to-month agreement text.
- Customer account membership dashboard.
- Admin membership manager for reviewing pending enrollments, activating memberships after external payment verification, and writing documented ledger adjustments.
- Server-side booking pricing validation and manual quote routing.

## Implemented Against The August 7 Prompt

- Booking deposits are server-authoritative at 50% and are processed through Stripe PaymentIntents.
- Membership enrollment can create a Stripe monthly Checkout Session and verifies the completed session before activation.
- Active checkout and booking payment code no longer uses Braintree, and the package lock has been cleaned of the retired direct dependencies.
- Booking retention policies are stored with the booking: guest projects 30 days, Music Lifer projects 90 days, and Passport projects at least 90 days at launch.
- Free Music Lifer session stamps are awarded only for eligible completed paid bookings, with a repeatable five-stamp reward cycle.
- Passport payment stamps are tracked separately from free-account session stamps, with the current tier-specific two- or three-payment reward cycles.
- Rewards receive a 90-day redemption deadline and duplicate payment or cycle issuance is guarded server-side.
- Beat availability, reward product type, nonexclusive disclosure, Content ID restriction, license version, and rights snapshots are represented in the schema and purchase request flow.
- Contract signatures record a terms snapshot and signed-document hash for auditability.
- Passport enrollment now generates a selected-tier agreement, requires the agreement signature before enrollment, and binds the signed terms to the selected plan and billing term.

## Payment Provider Work Remaining

- Stripe signed webhook handling now covers checkout completion, recurring invoice success, failed invoice state, and provider cancellation.
- Add refund, dispute, and chargeback event handling with benefit and reward reversal rules.
- Add optional prepaid three-month checkout flow.
- Store provider subscription IDs and transaction IDs in membership payment association records.
- Activate memberships only after verified server-side payment success.
- Extend idempotent webhook handling to cover:
  - enrollment payment success
  - renewal success
  - failed payment
  - retry success
  - cancellation
  - refunds
  - disputes
  - chargebacks
- Continue verifying duplicate events cannot duplicate benefit credits.
- Record payment status separately from membership status.
- Define refund and chargeback benefit reversal behavior.

The initial Stripe Checkout completion path and core renewal lifecycle events are implemented. Configure `STRIPE_WEBHOOK_SECRET` in the deployment and register `/api/stripe/webhook` in Stripe before enabling recurring public enrollment. Refund, dispute, chargeback, and reconciliation behavior still need to be finalized.

## Beat Licensing Work Remaining

- Add a customer redemption flow for earned Starter and Commercial beat rewards.
- Generate immutable license records and customer-facing license documents from the stored rights snapshot.
- Add explicit Starter-to-Commercial upgrade handling.
- Add admin review and fulfillment states for pending, available, and exclusively sold beats.
- Prevent redemption after the 90-day deadline while preserving the audit record.
- Connect paid beat requests to Stripe payment confirmation before marking a license active.

## Email And Notifications

- Add transactional emails for:
  - membership enrollment started
  - payment receipt
  - upcoming renewal reminder
  - successful renewal
  - failed payment
  - payment method update needed
  - pause confirmation
  - reactivation reminder
  - reactivation confirmation
  - cancellation confirmation
  - paid-through expiration reminder
  - loyalty milestone earned
  - reward expiration reminder
  - benefit rollover
  - benefit expiration
- Decide whether these send through the existing email service or a separate provider workflow.

## Booking Benefit Redemption

- Show active membership benefits in the booking flow.
- Let members choose whether to redeem benefits or pay normally.
- Temporarily hold a benefit during checkout.
- Prevent simultaneous double-use of the same benefit.
- Finalize redemption only after booking confirmation.
- Release holds when checkout expires or fails.
- Deduct benefits for late cancellation or no-show according to studio policy.
- Consume oldest rollover hours before current-cycle hours.
- Apply member discounts only when membership is active and not paused, past due, expired, or terminated.
- Prevent member discounts from stacking with promo codes unless promo is explicitly stackable.

## Rollover And Expiration Jobs

- Add scheduled processing for billing cycle close.
- Roll over only unused included recording hours.
- Enforce tier rollover caps:
  - Artist Access: 1 hour
  - Consistent Artist: 2 hours
  - Release Artist: 3 hours
- Expire rollover after one additional billing cycle.
- Freeze eligible rollover hours during an approved pause.
- Resume frozen rollover after reactivation.
- Expire non-rollover benefits at the end of the billing period.
- Write ledger and event rows for every rollover, freeze, resume, expiration, and correction.

## Loyalty Rewards

### Proposed Music Lifer Loyalty Model

- Keep a free Music Lifer account available to occasional artists; membership is optional.
- Award one loyalty stamp for each completed paid session for free account holders.
- Award the free-account reward after five completed sessions: 2 studio hours plus 1 beat lease.
- Name the paid recurring membership product the **Passport Program**.
- Treat one successful monthly payment as one Passport stamp for active members.
- Use the existing three membership plans as the Passport ladder:
  - Passport Starter / Artist Access: reward after 3 paid months; 2 studio hours plus 1 beat lease.
  - Passport Builder / Consistent Artist: reward after 2 paid months; 3 studio hours plus 1 beat lease plus a Quick Finish discount.
  - Passport Release / Release Artist: reward after 2 paid months; 3 studio hours plus 2 beat leases plus a larger discount on Quick Finish, mastering, or another defined service.
- Keep the member reward more valuable and faster to earn than the free five-session path.
- Track session stamps and Passport stamps separately so customers can understand how each reward was earned.
- Do not represent a customer as a paid Passport member unless the membership is active and payment is verified.
- Prevent reward transfer, duplicate issuance, and duplicate redemption.
- Define reward expiration, redemption limits, beat eligibility, service discount percentages, and whether unused rewards roll over.
- Decide whether failed payments, pauses, cancellations, refunds, chargebacks, and downgrades break or preserve a Passport stamp streak.
- Add admin controls for milestone length, reward type, quantity, expiration, service discount, and eligibility.

### Legal Review Questions

- Is a free Music Lifer account and loyalty program available in every service area and to all eligible customers?
- What exact booking status qualifies as a completed session for a stamp?
- Are taxes, deposits, late cancellations, no-shows, refunds, and chargebacks excluded from stamp eligibility?
- What are the exact terms for the 2-hour or 3-hour studio reward, including scheduling, blackout dates, expiration, and availability limits?
- What beat leases qualify, and what rights does each included lease grant?
- Can Passport rewards be combined with member discounts, promo codes, deposits, bundles, or other credits?
- What happens to earned stamps and unredeemed rewards after cancellation or plan downgrade?
- Should a successful renewal count as a stamp immediately or only after the paid period is completed?
- What disclosures are required for recurring billing, reward expiration, service availability, and promotional claims?

## Pause, Cancel, Reactivation

- Connect pause behavior to billing provider once recurring billing is enabled.
- Ensure no membership charge occurs during a paused cycle.
- Ensure no new benefits issue during pause.
- Send pause confirmation and reactivation reminders.
- Ensure cancellation stops future provider billing.
- Keep benefits active through paid-through date after cancellation.
- Finalize cancellation after paid-through date and prevent new benefit issuance.
- Allow reactivation after verified payment with current plan version.

## Admin Controls

- Add editable admin configuration for:
  - active plans
  - prepaid options
  - pause rules
  - loyalty milestones
  - reward expiration
  - tier capacity limits
  - weekly member-hour capacity
  - booking windows
  - blackout dates
  - prime-time limits
  - max active future bookings
- Add utilization views by tier.
- Add canceled, paused, pending payment, and past-due member filters.
- Add documented admin benefit adjustment reasons and review history.
- Disable new enrollment without mutating historical plan versions.

## Contract Generator

- Route membership enrollments through the generated membership agreement.
- Route ordinary bookings through a server-generated transaction agreement with a module manifest and server-calculated Schedule A price.
- Require explicit production beat-rights selection; carry commercial/nonexclusive rights into the agreement and send exclusive or portfolio requests to review.
- Store the ten lawyer-prepared PDFs in `docs/legal/source` as the reference library for future module expansion.
- Snapshot signed membership terms immutably with the contract version and SHA-256 document hash.
- Include selected tier, monthly or prepaid price, benefits, renewal terms, cancel-anytime terms, paid-through date, rollover rules, pause rules, booking limitations, discount restrictions, failed-payment treatment, no-show treatment, upgrade-credit logic, prepaid terms, loyalty terms, recurring authorization, and electronic signature.
- Ensure no mandatory three-month commitment language exists in any generated membership agreement.
- Add PDF export/download and a customer-accessible signed-agreement history after legal review.

## Testing

- Add automated tests for pricing thresholds and server-side total validation.
- Add membership tests for:
  - pending enrollment before payment verification
  - activation after verified payment
  - benefit ledger issuance
  - no duplicate credits from duplicate payment events
  - cancellation through paid-through date
  - no cancellation penalty
  - pause limit and pause cycle behavior
  - rollover caps and expiration
  - benefit holds and redemption
  - failed checkout hold release
  - failed payment blocks new benefits
  - free-account session stamp issuance and five-session reward
  - Passport stamp issuance after verified monthly payment
  - tier-specific two- or three-month reward thresholds
  - tier-specific reward contents and expiration
  - loyalty milestone issuance and expiration
  - admin manual adjustment audit trail
  - signed contract snapshot immutability

The current repository has no dedicated automated test suite for these flows. Until those tests are added, manually verify contract generation, signature gating, selected-plan binding, Stripe test-mode payment completion, duplicate completion requests, failed payment behavior, reward cycle boundaries, and beat-license disclosure before launch.

## Launch Decisions

- Confirm whether upgrades take effect immediately with prorated payment or on the next billing date.
- Confirm downgrade handling for rollover above the new tier cap.
- Confirm refund policy language with legal review.
- Confirm failed-payment grace period.
- Confirm whether failed payments break loyalty streaks.
- Confirm whether paused months break loyalty streaks.
- Confirm capacity limits per tier before enabling public enrollment.
- Add Stripe test-mode keys and configure the production webhook or reconciliation strategy before enabling recurring public enrollment.
