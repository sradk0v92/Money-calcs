import { Chart } from 'chart.js/auto';
import { calculateInvestment } from '../utils/investmentCalc.js';

export const title = 'Investment Calculator';

let investmentChart = null;

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

function getTemplate() {
  return `
    <div class="container py-4 investment-calculator-page">
      <div class="row mb-4">
        <div class="col-12">
          <h1 class="mb-2">Investment Calculator</h1>
          <p class="text-muted mb-0">Estimate growth with monthly compounding and recurring contributions.</p>
        </div>
      </div>

      <div class="row g-4">
        <div class="col-lg-4">
          <div class="card h-100 shadow-sm">
            <div class="card-body">
              <h5 class="card-title mb-3">Inputs</h5>
              <form id="investmentForm" novalidate>
                <div class="mb-3">
                  <label for="initialAmount" class="form-label">Initial Amount</label>
                  <input type="number" class="form-control" id="initialAmount" min="0" step="0.01" value="1000" required>
                  <div class="invalid-feedback">Enter a value greater than or equal to 0.</div>
                </div>

                <div class="mb-3">
                  <label for="monthlyContribution" class="form-label">Monthly Contribution</label>
                  <input type="number" class="form-control" id="monthlyContribution" min="0" step="0.01" value="100" required>
                  <div class="invalid-feedback">Enter a value greater than or equal to 0.</div>
                </div>

                <div class="mb-3">
                  <label for="annualReturnRate" class="form-label">Annual Return Rate (%)</label>
                  <input type="number" class="form-control" id="annualReturnRate" min="0" max="50" step="0.01" value="7" required>
                  <div class="invalid-feedback">Enter a value between 0 and 50.</div>
                </div>

                <div class="mb-3">
                  <label for="years" class="form-label">Years</label>
                  <input type="number" class="form-control" id="years" min="1" max="60" step="1" value="20" required>
                  <div class="invalid-feedback">Enter a whole number between 1 and 60.</div>
                </div>

                <div class="mb-3">
                  <label for="contributionTiming" class="form-label">Contribution Timing</label>
                  <select id="contributionTiming" class="form-select">
                    <option value="endOfMonth" selected>End of month</option>
                    <option value="startOfMonth">Start of month</option>
                  </select>
                </div>

                <div class="form-check form-switch mb-2">
                  <input class="form-check-input" type="checkbox" id="inflationEnabled">
                  <label class="form-check-label" for="inflationEnabled">Adjust for inflation</label>
                </div>

                <div class="mb-3 d-none" id="inflationRateWrap">
                  <label for="inflationRate" class="form-label">Inflation Rate (%)</label>
                  <input type="number" class="form-control" id="inflationRate" min="0" max="20" step="0.01" value="2">
                  <div class="invalid-feedback">Enter a value between 0 and 20.</div>
                </div>

                <button id="saveCalculationBtn" type="button" class="btn btn-primary w-100" disabled>
                  Save Calculation
                </button>
              </form>
            </div>
          </div>
        </div>

        <div class="col-lg-8">
          <div class="row g-3 mb-3">
            <div class="col-md-6">
              <div class="card shadow-sm h-100">
                <div class="card-body">
                  <small class="text-muted d-block mb-1">Final Balance</small>
                  <h4 class="mb-0" id="finalBalance">$0.00</h4>
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="card shadow-sm h-100">
                <div class="card-body">
                  <small class="text-muted d-block mb-1">Total Contributions</small>
                  <h4 class="mb-0" id="totalContributions">$0.00</h4>
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="card shadow-sm h-100">
                <div class="card-body">
                  <small class="text-muted d-block mb-1">Total Earnings</small>
                  <h4 class="mb-0" id="totalEarnings">$0.00</h4>
                </div>
              </div>
            </div>
            <div class="col-md-6 d-none" id="realBalanceCard">
              <div class="card shadow-sm h-100">
                <div class="card-body">
                  <small class="text-muted d-block mb-1">Real Final Balance</small>
                  <h4 class="mb-0" id="realFinalBalance">$0.00</h4>
                </div>
              </div>
            </div>
          </div>

          <div class="card shadow-sm">
            <div class="card-body">
              <h5 class="card-title mb-3">Balance Over Time</h5>
              <div class="chart-wrap">
                <canvas id="investmentChart"></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function renderInvestmentCalculatorPage(container) {
  container.innerHTML = getTemplate();
  setupCalculator(container);
}

export async function render() {
  return getTemplate();
}

export async function init() {
  const container = document.getElementById('page-container');
  if (!container) return;

  setupCalculator(container);
}

export async function unmount() {
  if (investmentChart) {
    investmentChart.destroy();
    investmentChart = null;
  }
}

function setupCalculator(container) {
  const form = container.querySelector('#investmentForm');
  if (!form) return;

  const initialAmountInput = container.querySelector('#initialAmount');
  const monthlyContributionInput = container.querySelector('#monthlyContribution');
  const annualReturnRateInput = container.querySelector('#annualReturnRate');
  const yearsInput = container.querySelector('#years');
  const contributionTimingInput = container.querySelector('#contributionTiming');
  const inflationEnabledInput = container.querySelector('#inflationEnabled');
  const inflationRateInput = container.querySelector('#inflationRate');
  const inflationRateWrap = container.querySelector('#inflationRateWrap');
  const saveButton = container.querySelector('#saveCalculationBtn');

  const handleRecalculate = () => {
    const values = {
      initialAmount: Number(initialAmountInput.value),
      monthlyContribution: Number(monthlyContributionInput.value),
      annualReturnRate: Number(annualReturnRateInput.value),
      years: Number(yearsInput.value),
      contributionTiming: contributionTimingInput.value,
      inflationEnabled: inflationEnabledInput.checked,
      inflationRate: Number(inflationRateInput.value),
    };

    inflationRateWrap.classList.toggle('d-none', !values.inflationEnabled);

    const validation = validateInputs(values);

    setInputValidationState(initialAmountInput, validation.initialAmount);
    setInputValidationState(monthlyContributionInput, validation.monthlyContribution);
    setInputValidationState(annualReturnRateInput, validation.annualReturnRate);
    setInputValidationState(yearsInput, validation.years);
    setInputValidationState(inflationRateInput, validation.inflationRate, values.inflationEnabled);

    const isValid = Object.values(validation).every(Boolean);
    saveButton.disabled = !isValid;

    if (!isValid) {
      return;
    }

    const result = calculateInvestment(values);
    renderSummary(container, result, values.inflationEnabled);
    updateChart(container, result);
  };

  const watchedFields = [
    initialAmountInput,
    monthlyContributionInput,
    annualReturnRateInput,
    yearsInput,
    contributionTimingInput,
    inflationEnabledInput,
    inflationRateInput,
  ];

  watchedFields.forEach((field) => {
    field.addEventListener('input', handleRecalculate);
    field.addEventListener('change', handleRecalculate);
  });

  saveButton.addEventListener('click', () => {
    saveButton.blur();
  });

  handleRecalculate();
}

function validateInputs(values) {
  return {
    initialAmount: Number.isFinite(values.initialAmount) && values.initialAmount >= 0,
    monthlyContribution: Number.isFinite(values.monthlyContribution) && values.monthlyContribution >= 0,
    annualReturnRate: Number.isFinite(values.annualReturnRate) && values.annualReturnRate >= 0 && values.annualReturnRate <= 50,
    years: Number.isFinite(values.years) && Number.isInteger(values.years) && values.years >= 1 && values.years <= 60,
    inflationRate: !values.inflationEnabled || (Number.isFinite(values.inflationRate) && values.inflationRate >= 0 && values.inflationRate <= 20),
  };
}

function setInputValidationState(input, isValid, isActive = true) {
  if (!isActive) {
    input.classList.remove('is-invalid');
    return;
  }

  if (isValid) {
    input.classList.remove('is-invalid');
  } else {
    input.classList.add('is-invalid');
  }
}

function renderSummary(container, result, inflationEnabled) {
  container.querySelector('#finalBalance').textContent = currencyFormatter.format(result.finalBalance);
  container.querySelector('#totalContributions').textContent = currencyFormatter.format(result.totalContributions);
  container.querySelector('#totalEarnings').textContent = currencyFormatter.format(result.totalEarnings);

  const realBalanceCard = container.querySelector('#realBalanceCard');
  if (inflationEnabled && Number.isFinite(result.realFinalBalance)) {
    realBalanceCard.classList.remove('d-none');
    container.querySelector('#realFinalBalance').textContent = currencyFormatter.format(result.realFinalBalance);
  } else {
    realBalanceCard.classList.add('d-none');
  }
}

function updateChart(container, result) {
  const canvas = container.querySelector('#investmentChart');
  if (!canvas) return;

  const labels = result.yearlyBreakdown.map((point) => `Year ${point.year}`);
  const balanceData = result.yearlyBreakdown.map((point) => point.balance);
  const contributionsData = result.contributionsBreakdown.map((point) => point.totalContributions);

  if (!investmentChart) {
    investmentChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Balance',
            data: balanceData,
            borderColor: '#0d6efd',
            backgroundColor: 'rgba(13, 110, 253, 0.15)',
            fill: false,
            tension: 0.25,
          },
          {
            label: 'Total Contributions',
            data: contributionsData,
            borderColor: '#6c757d',
            backgroundColor: 'rgba(108, 117, 125, 0.12)',
            fill: false,
            tension: 0.2,
          },
        ],
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
        },
      },
    });
    return;
  }

  investmentChart.data.labels = labels;
  investmentChart.data.datasets[0].data = balanceData;
  investmentChart.data.datasets[1].data = contributionsData;
  investmentChart.update();
}
