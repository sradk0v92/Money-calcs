export function calculateInvestment({
  initialAmount,
  monthlyContribution,
  annualReturnRate,
  years,
  inflationRate = 0,
  inflationEnabled = false,
  contributionTiming = 'endOfMonth',
}) {
  const safeInitialAmount = Number(initialAmount) || 0;
  const safeMonthlyContribution = Number(monthlyContribution) || 0;
  const safeAnnualReturnRate = Number(annualReturnRate) || 0;
  const safeYears = Number(years) || 0;
  const safeInflationRate = Number(inflationRate) || 0;

  const months = safeYears * 12;
  const monthlyRate = Math.pow(1 + safeAnnualReturnRate / 100, 1 / 12) - 1;

  let balance = safeInitialAmount;
  let contributedAmount = safeInitialAmount;

  const yearlyBreakdown = [{ year: 0, balance: safeInitialAmount }];
  const contributionsBreakdown = [{ year: 0, totalContributions: safeInitialAmount }];

  for (let month = 1; month <= months; month += 1) {
    if (contributionTiming === 'startOfMonth') {
      balance += safeMonthlyContribution;
      contributedAmount += safeMonthlyContribution;
      balance *= (1 + monthlyRate);
    } else {
      balance *= (1 + monthlyRate);
      balance += safeMonthlyContribution;
      contributedAmount += safeMonthlyContribution;
    }

    if (month % 12 === 0) {
      const year = month / 12;
      yearlyBreakdown.push({ year, balance });
      contributionsBreakdown.push({ year, totalContributions: contributedAmount });
    }
  }

  const totalContributions = safeInitialAmount + (safeMonthlyContribution * months);
  const finalBalance = balance;
  const totalEarnings = finalBalance - totalContributions;

  let realFinalBalance;
  if (inflationEnabled) {
    realFinalBalance = finalBalance / Math.pow(1 + safeInflationRate / 100, safeYears);
  }

  return {
    finalBalance,
    totalContributions,
    totalEarnings,
    realFinalBalance,
    yearlyBreakdown,
    contributionsBreakdown,
  };
}
