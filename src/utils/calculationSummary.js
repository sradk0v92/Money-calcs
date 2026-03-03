/**
 * Build lightweight summary payloads for calculation history listing.
 */
export function buildCalculationSummary(calculatorSlug, results = {}) {
  if (!results || typeof results !== 'object') {
    return null;
  }

  if (calculatorSlug === 'investment') {
    return {
      finalBalance: results.finalBalance,
      totalContributions: results.totalContributions,
      totalEarnings: results.totalEarnings,
    };
  }

  if (calculatorSlug === 'emergency_fund') {
    return {
      targetFundAmount: results.targetFundAmount,
      gapAmount: results.gapAmount,
      monthsCoveredNow: results.monthsCoveredNow,
      monthsToGoal: results.monthsToGoal,
    };
  }

  if (calculatorSlug === 'loan') {
    return {
      monthlyPayment: results.monthlyPayment,
      totalInterestStandard: results.totalInterestStandard,
      payoffMonthsStandard: results.payoffMonthsStandard,
      interestSaved: results.interestSaved,
    };
  }

  return null;
}

/**
 * Create a default user-friendly title for saved calculations.
 */
export function buildCalculationTitle(calculatorName = 'Calculation') {
  const now = new Date();
  const stamp = now.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `${calculatorName} - ${stamp}`;
}
