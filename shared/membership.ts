export type MembershipTier = "artist_access" | "consistent_artist" | "release_artist";

export type MembershipBenefitCode =
  | "recording_hours"
  | "quick_finish"
  | "master_only"
  | "planning_session"
  | "project_file_review";

export type MembershipPlanCatalogItem = {
  tier: MembershipTier;
  name: string;
  monthlyPriceCents: number;
  prepaidThreeMonthPriceCents: number;
  description: string;
  bestFor: string;
  benefits: string[];
  benefitDefinitions: Array<{
    code: MembershipBenefitCode;
    description: string;
    quantity: number;
    rolloverAllowed: boolean;
    rolloverLimit: number;
    expiresAfterCycles: number;
  }>;
  discounts: Array<{
    discountType: "percentage";
    discountValue: number;
    eligibleServices: string[];
    stackable: boolean;
  }>;
};

export const MEMBERSHIP_POSITIONING =
  "Stay consistent when it makes sense for you. No long-term contract, no cancellation penalty, and no pressure.";

export const MEMBERSHIP_CANCELLATION_LANGUAGE =
  "Cancel anytime before your next billing date. Your membership remains active through the end of your current paid billing period. There are no long-term commitments or cancellation penalties.";

export const MEMBERSHIP_LAUNCH_RULES = {
  pauseLimitPerSixMonths: 1,
  pauseLengthCycles: 1,
  loyaltyMilestoneMonths: 3,
  loyaltyRewardType: "recording_hours",
  loyaltyRewardQuantity: 1,
  loyaltyRewardExpiresAfterCycles: 2,
  upgrades: "Admin approved; may take effect immediately after payment approval or next billing date.",
  downgrades: "Next billing date only. No proration is automated in this launch build.",
};

export const MEMBERSHIP_PLAN_CATALOG: MembershipPlanCatalogItem[] = [
  {
    tier: "artist_access",
    name: "Artist Access",
    monthlyPriceCents: 14900,
    prepaidThreeMonthPriceCents: 42500,
    description: "Predictable monthly studio access for artists recording occasionally.",
    bestFor: "Artists who record occasionally but want consistent access and predictable monthly costs.",
    benefits: [
      "Three recording hours per billing cycle",
      "One Master Only service per billing cycle",
      "Additional recording hours at $45 per hour",
      "10% off eligible Quick Finish services",
      "10% off eligible catalog beat licenses",
      "Priority access to available booking times",
      "One short monthly project-planning check-in",
      "Up to one unused recording hour may roll over for one additional billing cycle",
    ],
    benefitDefinitions: [
      {
        code: "recording_hours",
        description: "Included recording hours",
        quantity: 3,
        rolloverAllowed: true,
        rolloverLimit: 1,
        expiresAfterCycles: 1,
      },
      {
        code: "master_only",
        description: "Included Master Only service",
        quantity: 1,
        rolloverAllowed: false,
        rolloverLimit: 0,
        expiresAfterCycles: 0,
      },
      {
        code: "planning_session",
        description: "Short monthly project-planning check-in",
        quantity: 1,
        rolloverAllowed: false,
        rolloverLimit: 0,
        expiresAfterCycles: 0,
      },
    ],
    discounts: [
      { discountType: "percentage", discountValue: 10, eligibleServices: ["quick_finish", "catalog_beat_license"], stackable: false },
    ],
  },
  {
    tier: "consistent_artist",
    name: "Consistent Artist",
    monthlyPriceCents: 32500,
    prepaidThreeMonthPriceCents: 92500,
    description: "Monthly recording and finishing support for artists completing records regularly.",
    bestFor: "Artists who record regularly and want to complete one or two finished records per month.",
    benefits: [
      "Six recording hours per billing cycle",
      "Two eligible Quick Finishes per billing cycle",
      "Additional recording hours at $45 per hour",
      "10% off Standard Mix and Master",
      "10% off eligible catalog beat licenses",
      "Priority booking",
      "One 30-minute monthly artist-development or release-planning session",
      "Up to two unused recording hours may roll over for one additional billing cycle",
    ],
    benefitDefinitions: [
      {
        code: "recording_hours",
        description: "Included recording hours",
        quantity: 6,
        rolloverAllowed: true,
        rolloverLimit: 2,
        expiresAfterCycles: 1,
      },
      {
        code: "quick_finish",
        description: "Eligible Quick Finish services",
        quantity: 2,
        rolloverAllowed: false,
        rolloverLimit: 0,
        expiresAfterCycles: 0,
      },
      {
        code: "planning_session",
        description: "30-minute artist-development or release-planning session",
        quantity: 1,
        rolloverAllowed: false,
        rolloverLimit: 0,
        expiresAfterCycles: 0,
      },
    ],
    discounts: [
      { discountType: "percentage", discountValue: 10, eligibleServices: ["standard_mix_master", "catalog_beat_license"], stackable: false },
    ],
  },
  {
    tier: "release_artist",
    name: "Release Artist",
    monthlyPriceCents: 49900,
    prepaidThreeMonthPriceCents: 142500,
    description: "Expanded monthly access for artists actively releasing singles or building larger projects.",
    bestFor: "Artists actively releasing singles, building an EP, or maintaining a consistent release schedule.",
    benefits: [
      "Eight recording hours per billing cycle",
      "Three eligible Quick Finishes per billing cycle",
      "One Master Only service per billing cycle",
      "Additional recording hours at $45 per hour",
      "15% off Standard Mix and Master",
      "15% off Advanced Mix and Master",
      "15% off eligible catalog beat licenses",
      "Priority booking",
      "One monthly creative or release-strategy session",
      "One project-file review",
      "Early access to selected new catalog beats",
      "Up to three unused recording hours may roll over for one additional billing cycle",
    ],
    benefitDefinitions: [
      {
        code: "recording_hours",
        description: "Included recording hours",
        quantity: 8,
        rolloverAllowed: true,
        rolloverLimit: 3,
        expiresAfterCycles: 1,
      },
      {
        code: "quick_finish",
        description: "Eligible Quick Finish services",
        quantity: 3,
        rolloverAllowed: false,
        rolloverLimit: 0,
        expiresAfterCycles: 0,
      },
      {
        code: "master_only",
        description: "Included Master Only service",
        quantity: 1,
        rolloverAllowed: false,
        rolloverLimit: 0,
        expiresAfterCycles: 0,
      },
      {
        code: "planning_session",
        description: "Creative or release-strategy session",
        quantity: 1,
        rolloverAllowed: false,
        rolloverLimit: 0,
        expiresAfterCycles: 0,
      },
      {
        code: "project_file_review",
        description: "Project-file review",
        quantity: 1,
        rolloverAllowed: false,
        rolloverLimit: 0,
        expiresAfterCycles: 0,
      },
    ],
    discounts: [
      { discountType: "percentage", discountValue: 15, eligibleServices: ["standard_mix_master", "advanced_mix_master", "catalog_beat_license"], stackable: false },
    ],
  },
];

export function getMembershipCatalogByTier(tier: string | null | undefined) {
  return MEMBERSHIP_PLAN_CATALOG.find((plan) => plan.tier === tier);
}

export function formatCents(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}
