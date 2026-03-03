export function calculateEmergencyFund({
  monthlyEssentialExpenses,
  targetMonths,
  currentSavings,
  monthlyContribution = 0,
  bufferPercent = 0,
  incomeStability = '',
}) {
  const expenses = Number(monthlyEssentialExpenses) || 0;
  const months = Number(targetMonths) || 0;
  const savings = Number(currentSavings) || 0;
  const contribution = Number(monthlyContribution) || 0;
  const buffer = Number(bufferPercent) || 0;

  const targetFundAmount = expenses * months * (1 + (buffer / 100));
  const gapAmount = Math.max(targetFundAmount - savings, 0);
  const monthsCoveredNow = expenses > 0 ? (savings / expenses) : 0;

  let monthsToGoal = null;
  if (contribution > 0) {
    monthsToGoal = Math.ceil(gapAmount / contribution);
  }

  let horizonMonths;
  if (gapAmount === 0) {
    horizonMonths = months;
  } else if (contribution > 0 && Number.isFinite(monthsToGoal)) {
    horizonMonths = Math.min(monthsToGoal, 240);
  } else {
    horizonMonths = months;
  }

  const monthlyBreakdown = [{ month: 0, balance: savings }];
  for (let month = 1; month <= horizonMonths; month += 1) {
    const projected = savings + (contribution * month);
    const balance = Math.min(projected, targetFundAmount);
    monthlyBreakdown.push({ month, balance });
  }

  return {
    targetFundAmount,
    gapAmount,
    monthsCoveredNow,
    monthsToGoal,
    monthlyBreakdown,
    meta: {
      incomeStability,
      horizonMonths,
    },
  };
}
