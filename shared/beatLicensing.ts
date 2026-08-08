export type BeatLicenseProduct = "starter_reward" | "commercial_lease" | "paid_nonexclusive" | "exclusive";
export type BeatAvailabilityStatus = "available_nonexclusive" | "pending_exclusive" | "exclusively_sold";

export const NONEXCLUSIVE_DISCLOSURE =
  "This is a nonexclusive license. Other artists may also license and release music using the same instrumental. Your license grants only the rights stated in your agreement and does not transfer ownership of the underlying beat.";

export const CONTENT_ID_RESTRICTION =
  "Nonexclusive licensees may not register the underlying beat or resulting song in Content ID or a comparable fingerprinting system in a way that claims, blocks, monetizes, or interferes with other authorized licensees without written permission.";

export function getBeatRightsSnapshot(product: BeatLicenseProduct) {
  if (product === "starter_reward") {
    return {
      product,
      nonexclusive: true,
      allowedUses: ["one original song", "YouTube and social promotion", "demo or portfolio use", "ordinary live promotion subject to final terms"],
      excludedUses: ["broad DSP distribution", "exclusive rights", "ownership", "work-for-hire", "resale or sublicensing", "commercial synchronization"],
      contentIdRestriction: CONTENT_ID_RESTRICTION,
    };
  }

  if (product === "commercial_lease" || product === "paid_nonexclusive") {
    return {
      product,
      nonexclusive: true,
      allowedUses: ["commercial release according to the versioned license", "DSP distribution according to final terms", "social and promotional use"],
      excludedUses: ["ownership of the underlying beat", "exclusive control", "resale or sublicensing"],
      contentIdRestriction: CONTENT_ID_RESTRICTION,
    };
  }

  return {
    product,
    nonexclusive: false,
    allowedUses: ["exclusive use according to the versioned purchase agreement"],
    excludedUses: ["rights previously granted to prior licensees are not erased"],
    contentIdRestriction: "Subject to the applicable exclusive agreement and any surviving prior licenses.",
  };
}
