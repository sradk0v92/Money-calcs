function addMonths(dateString, monthsToAdd) {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;
  date.setMonth(date.getMonth() + monthsToAdd);
  return date;
}

function calculateMonthlyPayment(loanAmount, monthlyRate, totalPayments) {
  if (monthlyRate === 0) {
    return loanAmount / totalPayments;
  }

  const factor = Math.pow(1 + monthlyRate, totalPayments);
  return loanAmount * (monthlyRate * factor) / (factor - 1);
}

function simulateSchedule({
  startingBalance,
  monthlyRate,
  monthlyPayment,
  extraMonthlyPayment = 0,
  maxMonths,
}) {
  let balance = startingBalance;
  let month = 0;
  let totalPaid = 0;
  let totalInterest = 0;

  const breakdown = [{ month: 0, balance: startingBalance }];

  while (balance > 0 && month < maxMonths) {
    const interest = balance * monthlyRate;
    const plannedPayment = monthlyPayment + extraMonthlyPayment;
    const maxNeededPayment = balance + interest;
    const actualPayment = Math.min(plannedPayment, maxNeededPayment);

    const principal = actualPayment - interest;
    balance = Math.max(balance - principal, 0);

    month += 1;
    totalPaid += actualPayment;
    totalInterest += interest;

    breakdown.push({ month, balance });
  }

  return {
    payoffMonths: month,
    totalPaid,
    totalInterest,
    balanceBreakdown: breakdown,
  };
}

export function calculateLoan({
  loanAmount,
  annualInterestRate,
  loanTermYears,
  startDate,
  extraMonthlyPayment = 0,
}) {
  const principal = Number(loanAmount) || 0;
  const annualRate = Number(annualInterestRate) || 0;
  const termYears = Number(loanTermYears) || 0;
  const extra = Number(extraMonthlyPayment) || 0;

  const monthlyRate = annualRate / 100 / 12;
  const paymentCount = termYears * 12;

  const monthlyPayment = calculateMonthlyPayment(principal, monthlyRate, paymentCount);

  const standardSchedule = simulateSchedule({
    startingBalance: principal,
    monthlyRate,
    monthlyPayment,
    extraMonthlyPayment: 0,
    maxMonths: paymentCount,
  });

  const payoffDateStandardRaw = addMonths(startDate, standardSchedule.payoffMonths);
  const payoffDateStandard = payoffDateStandardRaw ? payoffDateStandardRaw.toISOString() : undefined;

  const result = {
    monthlyPayment,
    totalPaidStandard: standardSchedule.totalPaid,
    totalInterestStandard: standardSchedule.totalInterest,
    payoffMonthsStandard: standardSchedule.payoffMonths,
    payoffDateStandard,
    balanceBreakdownStandard: standardSchedule.balanceBreakdown,
  };

  if (extra > 0) {
    const extraSchedule = simulateSchedule({
      startingBalance: principal,
      monthlyRate,
      monthlyPayment,
      extraMonthlyPayment: extra,
      maxMonths: 2400,
    });

    const payoffDateExtraRaw = addMonths(startDate, extraSchedule.payoffMonths);
    const payoffDateExtra = payoffDateExtraRaw ? payoffDateExtraRaw.toISOString() : undefined;

    result.totalPaidExtra = extraSchedule.totalPaid;
    result.totalInterestExtra = extraSchedule.totalInterest;
    result.payoffMonthsExtra = extraSchedule.payoffMonths;
    result.payoffDateExtra = payoffDateExtra;
    result.monthsSaved = Math.max(standardSchedule.payoffMonths - extraSchedule.payoffMonths, 0);
    result.interestSaved = Math.max(standardSchedule.totalInterest - extraSchedule.totalInterest, 0);
    result.balanceBreakdownExtra = extraSchedule.balanceBreakdown;
  }

  return result;
}
