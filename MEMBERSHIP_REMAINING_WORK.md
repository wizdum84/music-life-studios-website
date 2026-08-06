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

## Payment Provider Work

- Connect Braintree recurring billing for month-to-month memberships.
- Add optional prepaid three-month checkout flow.
- Store provider subscription IDs and transaction IDs in membership payment association records.
- Activate memberships only after verified server-side payment success.
- Add idempotent webhook handling for:
  - enrollment payment success
  - renewal success
  - failed payment
  - retry success
  - cancellation
  - refunds
  - disputes
  - chargebacks
- Ensure duplicate webhooks cannot duplicate benefit credits.
- Record payment status separately from membership status.
- Define refund and chargeback benefit reversal behavior.

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

- Implement consecutive paid-month tracking.
- Issue one bonus recording hour after three consecutive paid monthly renewals.
- Expire bonus hour after two billing cycles.
- Make failed-payment streak behavior configurable.
- Prevent loyalty reward transfer and double redemption.
- Add admin controls for milestone length, reward type, quantity, expiration, and eligibility.

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

- Route membership enrollments through the membership agreement.
- Snapshot signed membership terms immutably.
- Include selected tier, monthly or prepaid price, benefits, renewal terms, cancel-anytime terms, paid-through date, rollover rules, pause rules, booking limitations, discount restrictions, failed-payment treatment, no-show treatment, upgrade-credit logic, prepaid terms, loyalty terms, recurring authorization, and electronic signature.
- Ensure no mandatory three-month commitment language exists in any generated membership agreement.

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
  - loyalty milestone issuance and expiration
  - admin manual adjustment audit trail
  - signed contract snapshot immutability

## Launch Decisions

- Confirm whether upgrades take effect immediately with prorated payment or on the next billing date.
- Confirm downgrade handling for rollover above the new tier cap.
- Confirm refund policy language with legal review.
- Confirm failed-payment grace period.
- Confirm whether failed payments break loyalty streaks.
- Confirm whether paused months break loyalty streaks.
- Confirm capacity limits per tier before enabling public enrollment.
