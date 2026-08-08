# Music Life Studios Passport Program

## Purpose

This document describes the proposed business rules for the Music Life Studios loyalty and recurring-membership programs. It is a product and policy draft for legal review, not final legal terms.

## Program Names

- **Music Lifer account:** A free customer account available to artists who want to book occasionally and track loyalty progress.
- **Music Lifer loyalty program:** The free session-based loyalty program attached to an account.
- **Passport Program:** The paid, recurring month-to-month membership program.
- **Passport tier:** The membership level selected by the customer.

## Free Music Lifer Loyalty

Customers may create an account without purchasing a membership. A free account holder may book single sessions, bundles, or other available services.

Each completed paid session earns one loyalty stamp. After five eligible completed sessions, the customer earns:

- 2 studio hours; and
- 1 Starter Reward Beat License.

The five-stamp cycle repeats after each eligible group of five stamps.

The legal terms should define what counts as a completed eligible session. Proposed exclusions or special rules may apply to unpaid bookings, refunded transactions, chargebacks, late cancellations, no-shows, complimentary sessions, and bookings using a loyalty reward.

## Passport Program

Passport membership is optional. Membership provides recurring access, tier benefits, member pricing, and a faster loyalty reward path.

One successful monthly payment earns one Passport stamp for the active member. The reward threshold and contents depend on the selected tier.

### Passport Starter

Mapped to the Artist Access membership plan.

- Reward threshold: 3 successful paid months
- Reward: 2 studio hours plus 1 Starter Reward Beat License

### Passport Builder

Mapped to the Consistent Artist membership plan.

- Reward threshold: 2 successful paid months
- Reward: 3 studio hours, 1 Commercial Beat Lease, and 25% off one eligible Quick Finish

### Passport Release

Mapped to the Release Artist membership plan.

- Reward threshold: 2 successful paid months
- Reward: 3 studio hours, 2 Commercial Beat Leases, and 50% off one eligible Quick Finish or one Master Only service

Each Passport tier repeats its reward cycle after the threshold is reached. A verified successful monthly payment counts as one Passport stamp.

## Beat License Distinction

- Starter Reward Beat Licenses and Commercial Beat Leases are separate products and should not be described as interchangeable.
- Reward beat licenses are nonexclusive, do not transfer ownership of the beat, and include the applicable Content ID restriction.
- A beat must be marked available for the requested product before it can be issued.
- Pending or exclusively sold beats cannot be promised as rewards until availability is confirmed.
- A customer has 90 days from reward issuance to redeem an eligible beat reward. Expiration prevents redemption; it does not authorize an automatic takedown of previously delivered materials.
- Any upgrade from a Starter Reward Beat License to a Commercial Beat Lease should be recorded as a new, separately priced license transaction.

## Reward Administration

The final customer terms should define:

- Whether a monthly payment earns a stamp immediately after payment verification or only after the paid period ends.
- Whether a failed payment, pause, cancellation, refund, dispute, or chargeback breaks the payment streak.
- Whether stamps remain available after cancellation or downgrade.
- Reward expiration and redemption deadlines.
- Whether rewards may be transferred, sold, exchanged for cash, or combined with other offers.
- Whether studio-hour rewards have blackout dates, booking windows, capacity limits, minimum booking increments, or availability restrictions.
- Whether reward studio hours may be used for recording, mixing, mastering, production, or only specified services.
- Which beat leases qualify and the exact usage rights granted by each lease.
- Whether rewards can be combined with member rates, promotional codes, bundles, deposits, credits, or other discounts.
- What happens if a customer upgrades or downgrades before earning or redeeming a reward.

## Payment And Membership Status

Membership should be treated as active only after the applicable payment is verified. A pending enrollment should not issue member benefits or Passport stamps.

The final agreement should address recurring authorization, billing dates, renewal, failed payments, grace periods, pauses, cancellations, refunds, chargebacks, paid-through dates, and termination.

## Customer-Facing Positioning

Suggested messaging:

> Become a Music Lifer for free. Upgrade to the Passport Program when you are ready for monthly access, savings, and faster rewards.

> The more seriously you build, the faster your Passport pays you back.

The wording should make clear that a free account is available and that paid membership is optional.

## Legal Review Requests

Please review and convert these business rules into appropriate customer-facing terms, recurring billing disclosures, loyalty-program terms, reward restrictions, privacy disclosures, and cancellation language. Please also identify any state-specific requirements related to memberships, promotional credits, loyalty rewards, expiration, automatic renewal, beat-lease rights, and service availability.

## Implementation Notes

The application now tracks free session stamps and Passport payment stamps separately, applies the current tier thresholds, stores reward deadlines, records beat-rights snapshots, and generates a selected-tier agreement that must be signed before enrollment. Remaining implementation work includes PDF/export history, reward redemption, immutable license issuance, payment reversals, and automated tests. The application should issue rewards only once, maintain an auditable history, prevent duplicate redemption, and require verified payment and eligible booking status before awarding progress.
