import { Chart } from 'chart.js/auto';
import { getCurrentUser } from '../utils/auth.js';
import { calculateEmergencyFund } from '../utils/emergencyFundCalc.js';
import { fetchCalculatorTypeBySlugs, saveCalculation } from '../utils/database.js';

export const title = 'Emergency Fund Calculator';

let emergencyFundChart = null;

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

function getTemplate() {
  return `
    <div class="container py-4 emergency-fund-calculator-page">
      <div class="row mb-4">
        <div class="col-12">
          <h1 class="mb-2">Emergency Fund Calculator</h1>
          <p class="text-muted mb-0">Calculate your emergency fund target and estimate progress month by month.</p>
        </div>
      </div>

      <div class="row g-4">
        <div class="col-lg-4">
          <div class="card h-100 shadow-sm">
            <div class="card-body">
              <h5 class="card-title mb-3">Inputs</h5>
              <form id="emergencyFundForm" novalidate>
                <div class="mb-3">
                  <label for="monthlyEssentialExpenses" class="form-label">Monthly Essential Expenses</label>
                  <input type="number" class="form-control" id="monthlyEssentialExpenses" min="0.01" step="0.01" value="1500" required>
                  <div class="invalid-feedback">Enter a value greater than 0.</div>
                </div>

                <div class="mb-1">
                  <label for="incomeStability" class="form-label">Income Stability</label>
                  <select id="incomeStability" class="form-select">
                    <option value="">Select (optional)</option>
                    <option value="Stable">Stable</option>
                    <option value="Medium">Medium</option>
                    <option value="Unstable">Unstable</option>
                  </select>
                </div>
                <small class="text-muted d-block mb-3" id="targetMonthsSuggestion"></small>

                <div class="mb-3">
                  <label for="targetMonths" class="form-label">Target Months of Coverage</label>
                  <input type="number" class="form-control" id="targetMonths" min="1" max="24" step="1" value="6" required>
                  <div class="invalid-feedback">Enter a whole number between 1 and 24.</div>
                </div>

                <div class="mb-3">
                  <label for="currentSavings" class="form-label">Current Emergency Savings</label>
                  <input type="number" class="form-control" id="currentSavings" min="0" step="0.01" value="0" required>
                  <div class="invalid-feedback">Enter a value greater than or equal to 0.</div>
                </div>

                <div class="mb-3">
                  <label for="monthlyContribution" class="form-label">Monthly Contribution</label>
                  <input type="number" class="form-control" id="monthlyContribution" min="0" step="0.01" value="200" required>
                  <div class="invalid-feedback">Enter a value greater than or equal to 0.</div>
                </div>

                <div class="mb-3">
                  <label for="bufferPercent" class="form-label">Safety Buffer (%)</label>
                  <input type="number" class="form-control" id="bufferPercent" min="0" max="30" step="0.1" value="0" required>
                  <div class="invalid-feedback">Enter a value between 0 and 30.</div>
                </div>

                <button id="saveEmergencyCalculationBtn" type="button" class="btn btn-primary w-100" disabled>
                  Save calculation
                </button>
                <small id="saveEmergencyHint" class="text-muted d-block mt-2"></small>
              </form>
            </div>
          </div>
        </div>

        <div class="col-lg-8">
          <div class="row g-3 mb-3">
            <div class="col-md-6">
              <div class="card shadow-sm h-100">
                <div class="card-body">
                  <small class="text-muted d-block mb-1">Target Fund Amount</small>
                  <h4 class="mb-0" id="targetFundAmount">$0.00</h4>
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="card shadow-sm h-100">
                <div class="card-body">
                  <small class="text-muted d-block mb-1">Gap Amount</small>
                  <h4 class="mb-0" id="gapAmount">$0.00</h4>
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="card shadow-sm h-100">
                <div class="card-body">
                  <small class="text-muted d-block mb-1">Months Covered Now</small>
                  <h4 class="mb-0" id="monthsCoveredNow">0.0</h4>
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="card shadow-sm h-100">
                <div class="card-body">
                  <small class="text-muted d-block mb-1">Months to Goal</small>
                  <h4 class="mb-0" id="monthsToGoal">N/A</h4>
                </div>
              </div>
            </div>
          </div>

          <div class="card shadow-sm">
            <div class="card-body">
              <h5 class="card-title mb-3">Emergency Fund Growth Over Time (Monthly)</h5>
              <div class="chart-wrap">
                <canvas id="emergencyFundChart"></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function renderEmergencyFundCalculatorPage(container) {
  container.innerHTML = getTemplate();
  setupEmergencyCalculator(container);
}

export async function render() {
  return getTemplate();
}

export async function init() {
  const container = document.getElementById('page-container');
  if (!container) return;

  await setupEmergencyCalculator(container);
}

export async function unmount() {
  if (emergencyFundChart) {
    emergencyFundChart.destroy();
    emergencyFundChart = null;
  }
}

async function setupEmergencyCalculator(container) {
  const form = container.querySelector('#emergencyFundForm');
  if (!form) return;

  const monthlyEssentialExpensesInput = container.querySelector('#monthlyEssentialExpenses');
  const targetMonthsInput = container.querySelector('#targetMonths');
  const currentSavingsInput = container.querySelector('#currentSavings');
  const monthlyContributionInput = container.querySelector('#monthlyContribution');
  const bufferPercentInput = container.querySelector('#bufferPercent');
  const incomeStabilityInput = container.querySelector('#incomeStability');
  const targetMonthsSuggestion = container.querySelector('#targetMonthsSuggestion');
  const saveButton = container.querySelector('#saveEmergencyCalculationBtn');
  const saveHint = container.querySelector('#saveEmergencyHint');

  const { user } = await getCurrentUser();
  let calculatorTypeId = null;

  if (user) {
    const { calculatorType } = await fetchCalculatorTypeBySlugs(['emergencyfundcalculator', 'emergency_fund']);
    calculatorTypeId = calculatorType?.id || null;
  }

  let latestInputs = null;
  let latestResults = null;

  const handleIncomeStabilitySuggestion = () => {
    const stability = incomeStabilityInput.value;
    if (stability === 'Stable') {
      targetMonthsSuggestion.textContent = 'Suggestion: 3 months can be sufficient for stable income.';
    } else if (stability === 'Medium') {
      targetMonthsSuggestion.textContent = 'Suggestion: 6 months is a common target for medium stability.';
    } else if (stability === 'Unstable') {
      targetMonthsSuggestion.textContent = 'Suggestion: Aim for 9 to 12 months for unstable income.';
    } else {
      targetMonthsSuggestion.textContent = '';
    }
  };

  const handleRecalculate = () => {
    const values = {
      monthlyEssentialExpenses: Number(monthlyEssentialExpensesInput.value),
      targetMonths: Number(targetMonthsInput.value),
      currentSavings: Number(currentSavingsInput.value),
      monthlyContribution: Number(monthlyContributionInput.value),
      bufferPercent: Number(bufferPercentInput.value),
      incomeStability: incomeStabilityInput.value,
    };

    const validation = validateInputs(values);

    setInputValidationState(monthlyEssentialExpensesInput, validation.monthlyEssentialExpenses);
    setInputValidationState(targetMonthsInput, validation.targetMonths);
    setInputValidationState(currentSavingsInput, validation.currentSavings);
    setInputValidationState(monthlyContributionInput, validation.monthlyContribution);
    setInputValidationState(bufferPercentInput, validation.bufferPercent);

    const isValid = Object.values(validation).every(Boolean);
    handleIncomeStabilitySuggestion();

    if (!isValid) {
      saveButton.disabled = true;
      if (!user) {
        saveHint.textContent = 'Log in to save calculations to history.';
      } else {
        saveHint.textContent = 'Fix input errors to enable saving.';
      }
      return;
    }

    const result = calculateEmergencyFund(values);
    latestInputs = values;
    latestResults = result;

    renderSummary(container, result);
    updateChart(container, result);

    const canSave = Boolean(user && calculatorTypeId);
    saveButton.disabled = !canSave;

    if (!user) {
      saveHint.textContent = 'Log in to save calculations to history.';
    } else if (!calculatorTypeId) {
      saveHint.textContent = 'Calculator type not found; saving is unavailable.';
    } else {
      saveHint.textContent = '';
    }
  };

  const watchedFields = [
    monthlyEssentialExpensesInput,
    targetMonthsInput,
    currentSavingsInput,
    monthlyContributionInput,
    bufferPercentInput,
    incomeStabilityInput,
  ];

  watchedFields.forEach((field) => {
    field.addEventListener('input', handleRecalculate);
    field.addEventListener('change', handleRecalculate);
  });

  saveButton.addEventListener('click', async () => {
    if (!user || !calculatorTypeId || !latestInputs || !latestResults) {
      return;
    }

    saveButton.disabled = true;
    const originalText = saveButton.textContent;
    saveButton.textContent = 'Saving...';

    const { error } = await saveCalculation(user.id, calculatorTypeId, latestInputs, latestResults);

    if (error) {
      saveHint.textContent = `Save failed: ${error}`;
      saveButton.textContent = originalText;
      saveButton.disabled = false;
      return;
    }

    saveHint.textContent = 'Saved to history.';
    saveButton.textContent = originalText;
    saveButton.disabled = false;

    window.history.pushState(null, '', '/dashboard');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });

  handleRecalculate();
}

function validateInputs(values) {
  return {
    monthlyEssentialExpenses: Number.isFinite(values.monthlyEssentialExpenses) && values.monthlyEssentialExpenses > 0,
    targetMonths: Number.isFinite(values.targetMonths) && Number.isInteger(values.targetMonths) && values.targetMonths >= 1 && values.targetMonths <= 24,
    currentSavings: Number.isFinite(values.currentSavings) && values.currentSavings >= 0,
    monthlyContribution: Number.isFinite(values.monthlyContribution) && values.monthlyContribution >= 0,
    bufferPercent: Number.isFinite(values.bufferPercent) && values.bufferPercent >= 0 && values.bufferPercent <= 30,
  };
}

function setInputValidationState(input, isValid) {
  if (isValid) {
    input.classList.remove('is-invalid');
  } else {
    input.classList.add('is-invalid');
  }
}

function renderSummary(container, result) {
  container.querySelector('#targetFundAmount').textContent = currencyFormatter.format(result.targetFundAmount);
  container.querySelector('#gapAmount').textContent = currencyFormatter.format(result.gapAmount);
  container.querySelector('#monthsCoveredNow').textContent = result.monthsCoveredNow.toFixed(1);
  container.querySelector('#monthsToGoal').textContent = Number.isFinite(result.monthsToGoal) ? String(result.monthsToGoal) : 'N/A';
}

function updateChart(container, result) {
  const canvas = container.querySelector('#emergencyFundChart');
  if (!canvas) return;

  const labels = result.monthlyBreakdown.map((point) => String(point.month));
  const balanceData = result.monthlyBreakdown.map((point) => point.balance);
  const targetData = result.monthlyBreakdown.map(() => result.targetFundAmount);

  if (!emergencyFundChart) {
    emergencyFundChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Fund Balance',
            data: balanceData,
            borderColor: '#198754',
            backgroundColor: 'rgba(25, 135, 84, 0.15)',
            fill: false,
            tension: 0.25,
          },
          {
            label: 'Target Fund Amount',
            data: targetData,
            borderColor: '#dc3545',
            backgroundColor: 'rgba(220, 53, 69, 0.12)',
            borderDash: [6, 6],
            fill: false,
            tension: 0,
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

  emergencyFundChart.data.labels = labels;
  emergencyFundChart.data.datasets[0].data = balanceData;
  emergencyFundChart.data.datasets[1].data = targetData;
  emergencyFundChart.update();
}
