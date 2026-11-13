import { describe, expect, it } from "vitest";
import { assembleBeatLicenseAgreement, assembleMembershipAgreement } from "../shared/contractGenerator";
import { MEMBERSHIP_PLAN_CATALOG } from "../shared/membership";

describe("generated checkout agreements", () => {
  it.each(["basic", "premium", "exclusive"] as const)("creates a selected %s beat license instead of studio rules", (licenseType) => {
    const agreement = assembleBeatLicenseAgreement({
      beatTitle: "Test Beat", catalogNumber: "ML-TEST", producerName: "Wiz",
      licenseType, priceCents: licenseType === "exclusive" ? 50000 : 5000,
      customerName: "Test Artist", customerEmail: "artist@example.com",
    });
    expect(agreement.title.toLowerCase()).toContain(licenseType === "exclusive" ? "exclusive" : licenseType);
    expect(agreement.content).toContain("MUSIC LIFE STUDIOS BEAT LICENSE AGREEMENT");
    expect(agreement.content).toContain("full license price is due");
    expect(agreement.content).not.toMatch(/25% deposit|48-hour|48 hour/i);
    expect(agreement.content).not.toContain("STUDIO RULES & POLICIES");
  });

  it("states that an exclusive-use license is not an ownership transfer", () => {
    const agreement = assembleBeatLicenseAgreement({
      beatTitle: "Test Beat", licenseType: "exclusive", priceCents: 50000,
      customerName: "Test Artist", customerEmail: "artist@example.com",
    });
    expect(agreement.content).toContain("not a copyright assignment or work-for-hire transfer");
    expect(agreement.content).toContain("Previously issued licenses remain valid");
  });

  it("discloses when a paid beat package must be prepared before activation", () => {
    const agreement = assembleBeatLicenseAgreement({
      beatTitle: "Test Beat", licenseType: "premium", priceCents: 6999,
      customerName: "Test Artist", customerEmail: "artist@example.com",
      deliveryPreparationRequired: true,
    });
    expect(agreement.content).toContain("made-to-order");
    expect(agreement.content).toContain("notify the customer by email");
    expect(agreement.content).toContain("activate the secure account download");
  });

  it("generates membership billing language accepted case-insensitively by enrollment validation", () => {
    const plan = MEMBERSHIP_PLAN_CATALOG[0];
    const monthly = assembleMembershipAgreement({ plan, termMonths: 1 });
    const prepaid = assembleMembershipAgreement({ plan, termMonths: 3 });
    expect(monthly.content.toLowerCase()).toContain("month-to-month enrollment");
    expect(prepaid.content.toLowerCase()).toContain("optional prepaid three-month enrollment");
  });
});
