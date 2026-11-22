export type RenewalBenefitTransition = {
  balanceBefore: number;
  expiredQuantity: number;
  carriedQuantity: number;
  creditQuantity: number;
  balanceAfter: number;
};

export function calculateRenewalBenefitTransition(input: {
  currentBalance: number;
  cycleQuantity: number;
  rolloverAllowed: boolean;
  rolloverLimit: number;
}): RenewalBenefitTransition {
  const balanceBefore = Math.max(0, input.currentBalance);
  const creditQuantity = Math.max(0, input.cycleQuantity);
  const carriedQuantity = input.rolloverAllowed
    ? Math.min(balanceBefore, Math.max(0, input.rolloverLimit))
    : 0;

  return {
    balanceBefore,
    expiredQuantity: balanceBefore - carriedQuantity,
    carriedQuantity,
    creditQuantity,
    balanceAfter: carriedQuantity + creditQuantity,
  };
}

export function benefitBalanceExpiresAt(currentPeriodEnd: Date, expiresAfterCycles: number) {
  const expiresAt = new Date(currentPeriodEnd);
  if (expiresAfterCycles > 0) expiresAt.setMonth(expiresAt.getMonth() + expiresAfterCycles);
  return expiresAt;
}

export function deadlineHasPassed(deadline: Date | string, now: Date) {
  const timestamp = new Date(deadline).getTime();
  return Number.isFinite(timestamp) && timestamp <= now.getTime();
}
