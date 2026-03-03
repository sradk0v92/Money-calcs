import { Chart } from 'chart.js/auto';
import { calculateLoan } from '../utils/loanCalc.js';

export const title = 'Loan Calculator';

let loanChart = null;

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

function formatDate(isoDate) {
  if (!isoDate) return 'N/A';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return dateFormatter.format(date);
}

function getTemplate() {
  return `
    <div class="container py-4 loan-calculator-page">
      <div class="row mb-4">
        <div class="col-12">
          <h1 class="mb-2">Loan Calculator</h1>
          <p class="text-muted mb-0">Calculate monthly payment, payoff timeline, total interest, and impact of extra payments.</p>
        </div>
      </div>

      <div class="row g-4">
        <div class="col-lg-4">
          <div class="card h-100 shadow-sm">
            <div class="card-body">
              <h5 class="card-title mb-3">Inputs</h5>
              <form id="loanForm" novalidate>
                <div class="mb-3">
                  <label for="loanAmount" class="form-label">Loan Amount</label>
                  <input type="number" class="form-control" id="loanAmount" min="0.01" step="0.01" value="100000" required>
                  <div class="invalid-feedback">Enter a value greater than 0.</div>
                </div>

                <div class="mb-3">
                  <label for="annualInterestRate" class="form-label">Annual Interest Rate (%)</label>
                  <input type="number" class="form-control" id="annualInterestRate" min="0" max="50" step="0.01" value="6" required>
                  <div class="invalid-feedback">Enter a value between 0 and 50.</div>
                </div>

                <div class="mb-3">
                  <label for="loanTermYears" class="form-label">Loan Term (Years)</label>
                  <input type="number" class="form-control" id="loanTermYears" min="1" max="40" step="1" value="30" required>
                  <div class="invalid-feedback">Enter a whole number between 1 and 40.</div>
                </div>

                <div class="mb-3">
                  <label for="startDate" class="form-label">Start Date (Optional)</label>
                  <input type="date" class="form-control" id="startDate">
                </div>

                <div class="mb-3">
                  <label for="extraMonthlyPayment" class="form-label">Extra Monthly Payment</label>
                  <input type="number" class="form-control" id="extraMonthlyPayment" min="0" step="0.01" value="0" required>
                  <div class="invalid-feedback">Enter a value greater than or equal to 0.</div>
                </div>

                <small class="text-muted d-block">
                  Monthly payment shown excludes extra payment. Extra payments reduce payoff time and interest.
                </small>
              </form>
            </div>
          </div>
        </div>

        <div class="col-lg-8">
          <div class="row g-3 mb-3">
            <div class="col-md-6">
              <div class="card shadow-sm h-100">
                <div class="card-body">
                  <small class="text-muted d-block mb-1">Monthly Payment (Standard)</small>
                  <h4 class="mb-0" id="monthlyPayment">$0.00</h4>
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="card shadow-sm h-100">
                <div class="card-body">
                  <small class="text-muted d-block mb-1">Total Paid</small>
                  <h4 class="mb-0" id="totalPaid">$0.00</h4>
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="card shadow-sm h-100">
                <div class="card-body">
                  <small class="text-muted d-block mb-1">Total Interest</small>
                  <h4 class="mb-0" id="totalInterest">$0.00</h4>
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="card shadow-sm h-100">
                <div class="card-body">
                  <small class="text-muted d-block mb-1">Payoff Months</small>
                  <h4 class="mb-0" id="payoffMonths">0</h4>
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="card shadow-sm h-100">
                <div class="card-body">
                  <small class="text-muted d-block mb-1">Payoff Date</small>
                  <h4 class="mb-0" id="payoffDate">N/A</h4>
                </div>
              </div>
            </div>
            <div class="col-md-6 d-none" id="monthsSavedCard">
              <div class="card shadow-sm h-100">
                <div class="card-body">
                  <small class="text-muted d-block mb-1">Months Saved</small>
                  <h4 class="mb-0" id="monthsSaved">0</h4>
                </div>
              </div>
            </div>
            <div class="col-md-6 d-none" id="interestSavedCard">
              <div class="card shadow-sm h-100">
                <div class="card-body">
                  <small class="text-muted d-block mb-1">Interest Saved</small>
                  <h4 class="mb-0" id="interestSaved">$0.00</h4>
                </div>
              </div>
            </div>
          </div>

          <div class="card shadow-sm">
            <div class="card-body">
              <h5 class="card-title mb-3">Remaining Balance Over Time</h5>
              <div class="chart-wrap">
                <canvas id="loanChart"></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function renderLoanCalculatorPage(container) {
  container.innerHTML = getTemplate();
  setupLoanCalculator(container);
}

export async function render() {
  return getTemplate();
}

export async function init() {
  const container = document.getElementById('page-container');
  if (!container) return;

  setupLoanCalculator(container);
}

export async function unmount() {
  if (loanChart) {
    loanChart.destroy();
    loanChart = null;
  }
}

function setupLoanCalculator(container) {
  const form = container.querySelector('#loanForm');
  if (!form) return;

  const loanAmountInput = container.querySelector('#loanAmount');
  const annualInterestRateInput = container.querySelector('#annualInterestRate');
  const loanTermYearsInput = container.querySelector('#loanTermYears');
  const startDateInput = container.querySelector('#startDate');
  const extraMonthlyPaymentInput = container.querySelector('#extraMonthlyPayment');

  const handleRecalculate = () => {
    const values = {
      loanAmount: Number(loanAmountInput.value),
      annualInterestRate: Number(annualInterestRateInput.value),
      loanTermYears: Number(loanTermYearsInput.value),
      startDate: startDateInput.value || undefined,
      extraMonthlyPayment: Number(extraMonthlyPaymentInput.value),
    };

    const validation = validateInputs(values);

    setInputValidationState(loanAmountInput, validation.loanAmount);
    setInputValidationState(annualInterestRateInput, validation.annualInterestRate);
    setInputValidationState(loanTermYearsInput, validation.loanTermYears);
    setInputValidationState(extraMonthlyPaymentInput, validation.extraMonthlyPayment);

    const isValid = Object.values(validation).every(Boolean);
    if (!isValid) {
      return;
    }

    const result = calculateLoan(values);
    renderSummary(container, result, values);
    updateChart(container, result, values.extraMonthlyPayment > 0);
  };

  const watchedFields = [
    loanAmountInput,
    annualInterestRateInput,
    loanTermYearsInput,
    startDateInput,
    extraMonthlyPaymentInput,
  ];

  watchedFields.forEach((field) => {
    field.addEventListener('input', handleRecalculate);
    field.addEventListener('change', handleRecalculate);
  });

  handleRecalculate();
}

function validateInputs(values) {
  return {
    loanAmount: Number.isFinite(values.loanAmount) && values.loanAmount > 0,
    annualInterestRate: Number.isFinite(values.annualInterestRate) && values.annualInterestRate >= 0 && values.annualInterestRate <= 50,
    loanTermYears: Number.isFinite(values.loanTermYears) && Number.isInteger(values.loanTermYears) && values.loanTermYears >= 1 && values.loanTermYears <= 40,
    extraMonthlyPayment: Number.isFinite(values.extraMonthlyPayment) && values.extraMonthlyPayment >= 0,
  };
}

function setInputValidationState(input, isValid) {
  if (isValid) {
    input.classList.remove('is-invalid');
  } else {
    input.classList.add('is-invalid');
  }
}

function renderSummary(container, result, values) {
  const hasExtra = values.extraMonthlyPayment > 0 && Number.isFinite(result.payoffMonthsExtra);

  container.querySelector('#monthlyPayment').textContent = currencyFormatter.format(result.monthlyPayment);

  const totalPaid = hasExtra ? result.totalPaidExtra : result.totalPaidStandard;
  const totalInterest = hasExtra ? result.totalInterestExtra : result.totalInterestStandard;
  const payoffMonths = hasExtra ? result.payoffMonthsExtra : result.payoffMonthsStandard;
  const payoffDate = hasExtra ? result.payoffDateExtra : result.payoffDateStandard;

  container.querySelector('#totalPaid').textContent = currencyFormatter.format(totalPaid);
  container.querySelector('#totalInterest').textContent = currencyFormatter.format(totalInterest);
  container.querySelector('#payoffMonths').textContent = String(payoffMonths);
  container.querySelector('#payoffDate').textContent = formatDate(payoffDate);

  const monthsSavedCard = container.querySelector('#monthsSavedCard');
  const interestSavedCard = container.querySelector('#interestSavedCard');

  if (hasExtra) {
    monthsSavedCard.classList.remove('d-none');
    interestSavedCard.classList.remove('d-none');

    container.querySelector('#monthsSaved').textContent = String(result.monthsSaved || 0);
    container.querySelector('#interestSaved').textContent = currencyFormatter.format(result.interestSaved || 0);
  } else {
    monthsSavedCard.classList.add('d-none');
    interestSavedCard.classList.add('d-none');
  }
}

function updateChart(container, result, hasExtra) {
  const canvas = container.querySelector('#loanChart');
  if (!canvas) return;

  const maxLength = hasExtra && result.balanceBreakdownExtra
    ? Math.max(result.balanceBreakdownStandard.length, result.balanceBreakdownExtra.length)
    : result.balanceBreakdownStandard.length;

  const labels = Array.from({ length: maxLength }, (_, index) => index);

  const standardSeries = labels.map((month) => {
    const point = result.balanceBreakdownStandard.find((entry) => entry.month === month);
    return point ? point.balance : 0;
  });

  const extraSeries = hasExtra
    ? labels.map((month) => {
      const point = result.balanceBreakdownExtra.find((entry) => entry.month === month);
      return point ? point.balance : null;
    })
    : null;

  const datasets = [
    {
      label: 'Remaining Balance (Standard)',
      data: standardSeries,
      borderColor: '#0d6efd',
      backgroundColor: 'rgba(13, 110, 253, 0.15)',
      fill: false,
      tension: 0.2,
    },
  ];

  if (hasExtra && extraSeries) {
    datasets.push({
      label: 'Remaining Balance (With Extra)',
      data: extraSeries,
      borderColor: '#198754',
      backgroundColor: 'rgba(25, 135, 84, 0.12)',
      fill: false,
      tension: 0.2,
    });
  }

  if (!loanChart) {
    loanChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            display: true,
          },
          tooltip: {
            callbacks: {
              label(context) {
                return `${context.dataset.label}: ${currencyFormatter.format(context.parsed.y)}`;
              },
            },
          },
        },
        scales: {
          y: {
            ticks: {
              callback(value) {
                return currencyFormatter.format(value);
              },
            },
          },
          x: {
            title: {
              display: true,
              text: 'Month',
            },
          },
        },
      },
    });
    return;
  }

  loanChart.data.labels = labels;
  loanChart.data.datasets = datasets;
  loanChart.update();
}
