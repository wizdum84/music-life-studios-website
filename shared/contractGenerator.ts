import type { MembershipPlanCatalogItem } from "./membership";
import { getBeatRightsSnapshot, type BeatLicenseProduct } from "./beatLicensing";

export type ContractAccountStatus = "guest" | "music_lifer" | "passport_starter" | "passport_builder" | "passport_release";

export type ContractModule = {
  key: string;
  version: string;
  title: string;
};

export type ContractAssembly = {
  title: string;
  content: string;
  modules: ContractModule[];
  requiresManualReview: boolean;
  reviewReason?: string;
};

const LIBRARY_VERSION = "2026-08-08.1";

const MASTER_AGREEMENT = `MUSIC LIFE STUDIOS SERVICES AGREEMENT

This agreement is between Music Life Studios, operated by Maurice Edward Smith (Wiz), and the Customer named in the Order Summary.

Only the sections selected for this order apply. Your transaction record includes this agreement, the Order Summary, your selected service, any applicable membership or loyalty terms, beat license, add-ons, and policies.

Signing means you accept the terms shown. Signing does not mean payment has been made. If payment is required, the agreement takes effect after you sign and the required payment goes through. Music Life Studios keeps the signed version, date and time, payment status, and transaction details.

Unless your Order Summary says otherwise, the reservation deposit is 50%. Give at least 24 hours notice to cancel or reschedule. Late arrival does not add time to the booking. Keep your own backup copies of project files.

File storage depends on your account type and is shown in the Order Summary.`;

const ELECTRONIC_SIGNATURE_CONSENT = `ELECTRONIC RECORDS AND SIGNATURE CONSENT

The Customer agrees to conduct this transaction electronically and consents to receive agreements, schedules, policies, licenses, notices, receipts, and transaction records electronically. Before acceptance, the Customer is given a reasonable opportunity to review the applicable materials. The Customer may retain or download the displayed agreement through the available account or transaction records.`;

const BOOKING_POLICY = `BOOKING, CANCELLATION, AND REFUND POLICY

Unless your Order Summary says otherwise, the reservation deposit is 50%. Before you sign, the Order Summary will show how the deposit and remaining balance are handled.

Give at least 24 hours notice to cancel or reschedule. A late cancellation or no-show may result in loss of the deposit, reserved Passport hours, loyalty hours, or another benefit when that consequence was shown before booking.

Refunds depend on the service purchased, work already completed, approvals, the applicable policy, and the law. Receiving a digital file does not by itself decide whether a refund is available.

Canceling Passport stops future billing. A paid billing period is generally not refundable after its benefits become available or are used, subject to applicable law.`;

const FREE_LOYALTY_SCHEDULE = `MUSIC LIFER LOYALTY SCHEDULE

The free Music Lifer program does not require paid membership. Each eligible completed paid session earns one stamp after payment, occurrence, and completion. Unpaid, fully refunded, charged-back, complimentary, no-show, late-canceled, and entirely reward-funded sessions do not earn a stamp unless expressly approved.

After five eligible completed paid sessions, the Customer earns 2 recording hours and 1 Starter Reward Beat License. The reward has no cash value and is non-transferable unless expressly stated otherwise. The beat reward must be redeemed within 90 days, does not reserve a specific beat, and becomes a license only after beat selection, redemption, and acceptance.`;

const PASSPORT_SCHEDULE = `PASSPORT MEMBERSHIP AND LOYALTY SCHEDULE

Passport is optional, month-to-month, and has no mandatory long-term commitment or cancellation penalty. Cancellation before the next billing date stops future renewal while the membership generally remains active through the paid billing period. A pause may last one billing cycle once during a six-month period. During a pause, no charge or new benefits issue, discounts are inactive, rollover hours and reward progress are frozen, and existing confirmed bookings remain subject to ordinary booking rules.

Only unused included recording hours roll over for one additional billing cycle. Rollover caps are 1 hour for Starter, 2 hours for Builder, and 3 hours for Release. Quick Finish credits, Master Only credits, planning sessions, discounts, and project reviews do not roll over.

Loyalty discounts and rewards do not automatically stack. Reward recording hours are initially for recording-session time only unless the applicable reward expressly says otherwise. Failed payments make the membership past due and stop new benefits until verified payment resumes.`;

const SERVICE_MODULES: Record<string, { key: string; title: string; content: string }> = {
  hourly: {
    key: "recording_session",
    title: "Recording Session Module",
    content: `RECORDING SESSION MODULE

The Customer purchases reserved Studio time at the displayed hourly rate, with a two-hour minimum. A four-hour block may be priced at $180 when selected. The booking does not guarantee a number of songs or finished recordings.

Booked time includes the engineer, recording, established vocal chain, basic balancing and panning, normal session effects, creative drops completed during the session, a polished Studio Reference Mix, and a reference MP3. Detailed editing, full professional mixing, final mastering, release-ready WAV delivery, and later revisions are separate unless Schedule A states otherwise.

Setup, file loading, creative discussion, recording, playback, exports, and closeout count toward the session clock. Late arrival does not extend the scheduled end time.`
  },
  "release-ready": {
    key: "release_ready_song",
    title: "Release-Ready Song Module",
    content: `RELEASE-READY SONG MODULE

The package starts at $225 per song and includes up to 2 recording hours, professional mixing, professional mastering, WAV, MP3, and 1 revision. Additional recording is $50/hour for ordinary customers or $45/hour for an eligible Passport member. A material scope expansion requires approval before additional paid work begins.`
  },
  "quick-finish": {
    key: "quick_finish",
    title: "Quick Finish Module",
    content: `QUICK FINISH MODULE

Quick Finish is a limited-scope service for recordings in suitable condition for light finishing. It includes basic cleanup, standard leveling, light tuning where appropriate, effects refinement, final mix adjustment, stereo master, WAV, MP3, and 1 minor revision per song. It does not include full stem mixing, major repair, heavy tuning, major timing repair, extensive sound design, or production reconstruction.

If the project exceeds Quick Finish scope, Music Life Studios stops before additional paid work, explains the upgrade, provides the price, and obtains approval.`
  },
  standard: {
    key: "standard_mix_master",
    title: "Standard Mix and Master Module",
    content: `STANDARD MIX AND MASTER MODULE

The service starts at $125 per song and includes detailed cleanup, comping, standard tuning, reasonable timing work, balancing, panning, effects, automation, mix, master, WAV, MP3, and 2 revisions. Customer files must be reasonably organized and usable.`
  },
  advanced: {
    key: "advanced_mix_master",
    title: "Advanced Mix and Master Module",
    content: `ADVANCED MIX AND MASTER MODULE

Advanced work may apply to full stems, large track counts, multiple vocalists, extensive harmonies, heavy tuning, detailed automation, significant sound design, production changes, or disorganized external sessions. The starting price is not necessarily the final price. Any increase requires approval before additional paid work begins. Revision count remains the configured business value and must not be silently invented.`
  },
  "master-only": {
    key: "master_only",
    title: "Master Only Module",
    content: `MASTER ONLY MODULE

The service is $50 per song and applies to a supplied stereo mix that is reasonably ready for mastering. It does not include multitrack mixing, stem balancing, substantial editing, or correction of problems requiring mix access. Playback varies across platforms and devices.`
  },
  "custom-beat": {
    key: "custom_beat_production",
    title: "Custom Beat Production Module",
    content: `CUSTOM BEAT PRODUCTION MODULE

The service starts at $200 and may include a creative brief, reference review, original beat production, arrangement, WAV, MP3, trackout stems, and 2 revisions. Purchasing production services alone does not transfer copyright or publishing ownership. The applicable nonexclusive, Commercial Beat Lease, Exclusive License, negotiated license, or buyout must be selected in Schedule A.`
  },
  "build-song": {
    key: "build_a_song",
    title: "Build-a-Song Module",
    content: `BUILD-A-SONG MODULE

The service starts at $250 and includes up to 3 combined hours of production and recording using the same time clock. The Customer purchases creative time and is not guaranteed a fully completed beat and vocal record within three hours. The included output is a polished Reference Mix; final mixing and mastering are separate unless selected.`
  },
  "complete-single": {
    key: "complete_custom_single",
    title: "Complete Custom Single Module",
    content: `COMPLETE CUSTOM SINGLE MODULE

The service starts at $325 and may include a custom beat, up to 3 combined hours of production and recording, Quick Finish, master, WAV, MP3, and 1 revision. The applicable beat rights and ownership status must be selected separately. This package does not automatically transfer copyright or publishing ownership.`
  },
  "signature-single": {
    key: "signature_custom_single",
    title: "Signature Custom Single Module",
    content: `SIGNATURE CUSTOM SINGLE MODULE

The service starts at $450 and may include a custom beat, up to 4 hours of production and recording, detailed vocal production, full mix, final master, trackout stems, and 2 revisions. Beat/composition license, publishing split, producer credit, master ownership, and songwriter splits must be stated in the transaction documents.`
  },
  "media-quote": {
    key: "media_composition_license",
    title: "Media Composition and License Module",
    content: `MEDIA COMPOSITION AND LICENSE MODULE - MANUAL REVIEW REQUIRED

Media composition requires approved scope and price before signing. The transaction must identify the creative brief, milestones, final price, revisions, formats, stems, alternate versions, synchronization rights, media, channels, territory, term, monetization, paid advertising, exclusivity, credit, portfolio use, implementation obligations, and cancellation or kill-fee treatment. No media license becomes effective until scope, price, acceptance, and required payment are complete.`
  },
};

function formatMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatAgreementDate(value?: string) {
  if (!value) return "To be scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatDurationHours(durationMinutes: number) {
  const hours = durationMinutes / 60;
  if (!Number.isFinite(hours)) return "To be confirmed";
  const formattedHours = Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
  return `${formattedHours} ${hours === 1 ? "hour" : "hours"}`;
}

function accountLabel(status: ContractAccountStatus) {
  return {
    guest: "Guest / Nonmember",
    music_lifer: "Free Music Lifer",
    passport_starter: "Passport Starter",
    passport_builder: "Passport Builder",
    passport_release: "Passport Release",
  }[status];
}

function scheduleA(input: {
  accountStatus: ContractAccountStatus;
  serviceName: string;
  servicePath: string;
  amountCents: number;
  durationMinutes: number;
  date?: string;
  customerName?: string;
  customerEmail?: string;
  beatLicenseProduct?: BeatLicenseProduct;
  requestedAddOns?: string;
}) {
  const deposit = Math.round(input.amountCents * 0.5);
  const base = `SCHEDULE A - ORDER, PRICE, BENEFITS, LICENSE, AND DELIVERABLES SUMMARY

Account status: ${accountLabel(input.accountStatus)}
Customer: ${input.customerName || "To be completed"}
Email: ${input.customerEmail || "To be completed"}
Service selected: ${input.serviceName}
Service path: ${input.servicePath}
Duration: ${formatDurationHours(input.durationMinutes)}
Date: ${formatAgreementDate(input.date)}
Normal retail price: ${formatMoney(input.amountCents)}
Standard reservation deposit: ${formatMoney(deposit)}
Amount due now: ${formatMoney(deposit)}
Remaining balance: ${formatMoney(Math.max(0, input.amountCents - deposit))}
Remaining balance timing: Confirmed at checkout.
File storage: Your account's standard file policy applies.
Deliverables: Only those listed in the selected service module and this Schedule A apply.`;
  const options = [
    input.beatLicenseProduct && `Beat rights requested: ${input.beatLicenseProduct}`,
    input.requestedAddOns && `Requested add-ons or delivery options (not included until confirmed): ${input.requestedAddOns}`,
  ].filter(Boolean);
  return `${base}${options.length ? `\n${options.join("\n")}` : ""}`;
}

export function assembleBookingAgreement(input: {
  accountStatus: ContractAccountStatus;
  serviceName: string;
  servicePath: string;
  amountCents: number;
  durationMinutes: number;
  date?: string;
  customerName?: string;
  customerEmail?: string;
  beatLicenseProduct?: BeatLicenseProduct;
  requestedAddOns?: string;
  portfolioReleaseRequested?: boolean;
}): ContractAssembly {
  const serviceModule = SERVICE_MODULES[input.servicePath] ?? SERVICE_MODULES.hourly;
  const beatRights = input.beatLicenseProduct ? getBeatRightsSnapshot(input.beatLicenseProduct) : null;
  const beatRightsSection = beatRights
    ? `BEAT RIGHTS REQUEST\n\nRequested product: ${beatRights.product}\nAllowed uses: ${beatRights.allowedUses.join(", ")}\nExcluded uses: ${beatRights.excludedUses.join(", ")}\n${beatRights.contentIdRestriction}`
    : "";
  const modules: ContractModule[] = [
    { key: "services_agreement", version: LIBRARY_VERSION, title: "Music Life Studios Services Agreement" },
    { key: "schedule_a", version: LIBRARY_VERSION, title: "Order and Pricing Schedule" },
    { key: serviceModule.key, version: LIBRARY_VERSION, title: serviceModule.title },
    { key: "booking_refund_policy", version: LIBRARY_VERSION, title: "Booking and Refund Policies" },
    ...(input.accountStatus === "music_lifer" ? [{ key: "music_lifer_loyalty", version: LIBRARY_VERSION, title: "Music Lifer Loyalty Schedule" }] : []),
    ...(input.accountStatus.startsWith("passport_") ? [{ key: "passport_membership", version: LIBRARY_VERSION, title: "Passport Membership and Loyalty Schedule" }] : []),
    ...(input.beatLicenseProduct ? [{ key: `${input.beatLicenseProduct}_beat_license`, version: LIBRARY_VERSION, title: "Beat Rights Module" }] : []),
    ...(input.requestedAddOns || input.portfolioReleaseRequested ? [{ key: "rights_and_add_ons", version: LIBRARY_VERSION, title: "Rights and Add-On Library" }] : []),
    { key: "electronic_signature_consent", version: LIBRARY_VERSION, title: "Electronic Records and Signature Consent" },
  ];
  const reviewReasons = [
    input.servicePath === "media-quote" ? "Media composition and licensing requires admin approval." : "",
    input.beatLicenseProduct === "exclusive" ? "Exclusive beat rights require prior-license review and a separate approved agreement." : "",
    input.portfolioReleaseRequested ? "Portfolio use requires separate approval and assent." : "",
  ].filter(Boolean);
  const requiresManualReview = reviewReasons.length > 0;
  const reviewNotice = requiresManualReview
    ? `\n\nMANUAL REVIEW NOTICE\nThis transaction cannot be finalized until an administrator approves scope, price, rights, and any required separate assent.\n${reviewReasons.map((reason) => `- ${reason}`).join("\n")}`
    : "";

  const optionalProgram = input.accountStatus === "music_lifer"
    ? FREE_LOYALTY_SCHEDULE
    : input.accountStatus.startsWith("passport_") ? PASSPORT_SCHEDULE : "";

  const content = [
    MASTER_AGREEMENT,
    scheduleA(input),
    serviceModule.content,
    beatRights ? `${beatRightsSection}\n\nThis beat license applies to this order only and follows the rights and limits shown above.` : "",
    input.portfolioReleaseRequested ? "PORTFOLIO USE REQUEST\n\nPortfolio use was requested for discussion only. No portfolio release or publicity consent is granted unless a separate assent is presented and accepted." : "",
    BOOKING_POLICY,
    optionalProgram,
    ELECTRONIC_SIGNATURE_CONSENT,
    `MODULE MANIFEST\n${modules.map((module) => `- ${module.title} (${module.key}) version ${module.version}`).join("\n")}`,
    reviewNotice,
  ].filter(Boolean).join("\n\n");

  return {
    title: `Music Life Studios Transaction Agreement - ${input.serviceName}`,
    content,
    modules,
    requiresManualReview,
    reviewReason: requiresManualReview ? reviewReasons.join(" ") : undefined,
  };
}

export function assembleMembershipAgreement(input: {
  plan: Pick<MembershipPlanCatalogItem, "name" | "tier" | "monthlyPriceCents" | "prepaidThreeMonthPriceCents" | "benefits" | "rewardCycle">;
  termMonths: number;
}): ContractAssembly {
  const { plan, termMonths } = input;
  const priceCents = termMonths === 3 ? plan.prepaidThreeMonthPriceCents : plan.monthlyPriceCents;
  const rewardText = plan.rewardCycle.rewards.map((reward) => `- ${reward.description}`).join("\n");
  const billingText = termMonths === 3
    ? `Optional prepaid three-month enrollment price: ${formatMoney(priceCents)}. The prepaid term does not create a mandatory renewal commitment.`
    : `Month-to-month enrollment price: ${formatMoney(priceCents)} per month. Renewal continues monthly until canceled.`;
  const modules: ContractModule[] = [
    { key: "services_agreement", version: LIBRARY_VERSION, title: "Music Life Studios Services Agreement" },
    { key: "schedule_a", version: LIBRARY_VERSION, title: "Membership Order and Pricing Schedule" },
    { key: "passport_membership", version: LIBRARY_VERSION, title: "Passport Membership and Loyalty Schedule" },
    { key: "booking_refund_policy", version: LIBRARY_VERSION, title: "Booking and Refund Policies" },
    { key: "electronic_signature_consent", version: LIBRARY_VERSION, title: "Electronic Records and Signature Consent" },
  ];
  const content = [
    MASTER_AGREEMENT,
    `PASSPORT ENROLLMENT AGREEMENT\n\nSelected Passport tier: ${plan.name}\nAgreement version: PASSPORT-${plan.tier.toUpperCase()}-${LIBRARY_VERSION}\n${billingText}\n\nIncluded benefits:\n${plan.benefits.map((benefit) => `- ${benefit}`).join("\n")}\n\nReward cycle after ${plan.rewardCycle.thresholdMonths} verified successful paid month(s):\n${rewardText}\n\nPassport is optional, month-to-month, and has no mandatory long-term commitment or cancellation penalty. Membership activates only after verified payment. Earned beat rewards have a 90-day redemption deadline, are nonexclusive, transfer no ownership, and are subject to beat availability and Content ID restrictions.`,
    PASSPORT_SCHEDULE,
    BOOKING_POLICY,
    ELECTRONIC_SIGNATURE_CONSENT,
    `MODULE MANIFEST\n${modules.map((module) => `- ${module.title} (${module.key}) version ${module.version}`).join("\n")}`,
  ].join("\n\n");

  return {
    title: `Passport Enrollment Agreement - ${plan.name}`,
    content,
    modules,
    requiresManualReview: false,
  };
}

export const CONTRACT_GENERATOR_LIBRARY_VERSION = LIBRARY_VERSION;
