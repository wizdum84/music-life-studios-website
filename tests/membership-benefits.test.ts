import { describe, expect, it } from "vitest";
import {
  benefitBalanceExpiresAt,
  calculateRenewalBenefitTransition,
  deadlineHasPassed,
} from "../server/services/membership-benefits";

describe("membership benefit renewal transitions", () => {
  it("carries only the configured recording-hour rollover allowance", () => {
    expect(calculateRenewalBenefitTransition({
      currentBalance: 6,
      cycleQuantity: 3,
      rolloverAllowed: true,
      rolloverLimit: 1,
    })).toEqual({
      balanceBefore: 6,
      expiredQuantity: 5,
      carriedQuantity: 1,
      creditQuantity: 3,
      balanceAfter: 4,
    });
  });

  it("expires non-rollover benefits before issuing the new cycle", () => {
    expect(calculateRenewalBenefitTransition({
      currentBalance: 2,
      cycleQuantity: 1,
      rolloverAllowed: false,
      rolloverLimit: 0,
    })).toEqual({
      balanceBefore: 2,
      expiredQuantity: 2,
      carriedQuantity: 0,
      creditQuantity: 1,
      balanceAfter: 1,
    });
  });

  it("sets a one-cycle benefit expiration one full billing cycle after period end", () => {
    expect(benefitBalanceExpiresAt(new Date("2027-01-14T12:00:00Z"), 1).toISOString())
      .toBe("2027-02-14T12:00:00.000Z");
    expect(benefitBalanceExpiresAt(new Date("2027-01-14T12:00:00Z"), 0).toISOString())
      .toBe("2027-01-14T12:00:00.000Z");
  });

  it("treats a deadline as expired at the deadline", () => {
    const now = new Date("2027-01-14T12:00:00Z");
    expect(deadlineHasPassed(now, now)).toBe(true);
    expect(deadlineHasPassed("2027-01-15T12:00:00Z", now)).toBe(false);
  });
});
