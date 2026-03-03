import { Chart } from 'chart.js/auto';
import calcDetailHTML from './calculation-detail.html?raw';
import './calculation-detail.css';
import { isAuthenticated, getCurrentUser } from '../../utils/auth.js';
import {
  calculatorLabelMaps,
  formatBool,
  formatCurrency,
  formatDate,
  formatPercent,
  renderArrayAsTable,
  renderKeyValueList,
  summaryEntries,
} from '../../utils/calculationPresentation.js';
import { createScenario, fetchCalculation } from '../../utils/database.js';

export const title = 'Calculation Details';

let detailChart = null;

const inputFormatterMaps = {
  investment: {
    annualReturnRate: formatPercent,
    inflationRate: formatPercent,
    inflationEnabled: formatBool,
  },
  emergency_fund: {
    bufferPercent: formatPercent,
  },
  loan: {
    annualInterestRate: formatPercent,
    startDate: formatDate,
  },
};

const resultFormatterMaps = {
  investment: {
    finalBalance: formatCurrency,
    totalContributions: formatCurrency,
    totalEarnings: formatCurrency,
    realFinalBalance: formatCurrency,
  },
  emergency_fund: {
    targetFundAmount: formatCurrency,
    gapAmount: formatCurrency,
  },
  loan: {
    monthlyPayment: formatCurrency,
    totalPaidStandard: formatCurrency,
    totalPaidExtra: formatCurrency,
    totalInterestStandard: formatCurrency,
    totalInterestExtra: formatCurrency,
    interestSaved: formatCurrency,
    payoffDateStandard: formatDate,
    payoffDateExtra: formatDate,
  },
};

export async function render() {
  if (!(await isAuthenticated())) {
    window.history.pushState(null, '', '/login');
    window.dispatchEvent(new PopStateEvent('popstate'));
    return '';
  }

  return calcDetailHTML;
}

export async function init() {
  const { user } = await getCurrentUser();
  if (!user) return;

  const calculationId = getCalculationIdFromPath();
  if (!calculationId) {
    showError('Calculation ID not found');
    return;
  }

  await displayCalculation(calculationId, user.id);

  const saveBtn = document.getElementById('saveScenarioBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const scenarioTitle = prompt('Enter scenario name:', 'My Scenario');
      if (scenarioTitle) {
        await handleSaveAsScenario(calculationId, user.id, scenarioTitle);
      }
    });
  }
}

export async function unmount() {
  if (detailChart) {
    detailChart.destroy();
    detailChart = null;
  }
}

function getCalculationIdFromPath() {
  const pathParts = window.location.pathname.split('/');
  return pathParts[pathParts.length - 1] || null;
}

async function displayCalculation(calculationId, userId) {
  const { calculation, error } = await fetchCalculation(calculationId);
  const container = document.getElementById('calculationContent');

  if (!container) return;

  if (error || !calculation) {
    container.innerHTML = '<div class="alert alert-danger">Failed to load calculation details</div>';
    return;
  }

  const calculatorName = calculation.calculator_types?.name || 'Unknown Calculator';
  const calculatorSlug = calculation.calculator_types?.slug || '';
  const inputLabelMap = calculatorLabelMaps[calculatorSlug] || {};
  const inputFormatterMap = inputFormatterMaps[calculatorSlug] || {};
  const resultFormatterMap = resultFormatterMaps[calculatorSlug] || {};

  const summary = summaryEntries(calculation.summary, calculatorSlug);
  const summaryHtml = summary.length > 0
    ? `<div class="detail-summary">${summary.map((item) => `<span class="summary-pill"><strong>${item.label}:</strong> ${item.value}</span>`).join('')}</div>`
    : '';

  const inputsHtml = renderKeyValueList(calculation.inputs, inputLabelMap, inputFormatterMap);
  const resultsHtml = renderKeyValueList(calculation.results, {}, resultFormatterMap);
  const breakdown = buildBreakdownContent(calculation);

  container.innerHTML = `
    <div class="detail-meta card border-0 shadow-sm mb-4">
      <div class="card-body">
        <h5 class="mb-1">${calculatorName}</h5>
        <div class="text-muted small">${formatDate(calculation.created_at)}</div>
        <div class="mt-1">${escapeHtml(calculation.title || 'Untitled calculation')}</div>
        ${summaryHtml}
      </div>
    </div>

    <div class="row g-4">
      <div class="col-lg-6">
        <div class="card h-100 border-0 shadow-sm">
          <div class="card-body">
            <h6 class="mb-3">Inputs</h6>
            ${inputsHtml}
          </div>
        </div>
      </div>
      <div class="col-lg-6">
        <div class="card h-100 border-0 shadow-sm">
          <div class="card-body">
            <h6 class="mb-3">Results</h6>
            ${resultsHtml}
          </div>
        </div>
      </div>
    </div>

    ${breakdown.html}
  `;

  if (detailChart) {
    detailChart.destroy();
    detailChart = null;
  }

  renderBreakdownChart(breakdown.chartConfig);

  const saveBtn = document.getElementById('saveScenarioBtn');
  if (saveBtn) {
    saveBtn.disabled = false;
    saveBtn.dataset.calcId = calculationId;
    saveBtn.dataset.typeId = calculation.calculator_type_id;
    saveBtn.dataset.userId = userId;
  }
}

function buildBreakdownContent(calculation) {
  const results = calculation.results || {};
  const slug = calculation.calculator_types?.slug;

  if (slug === 'investment' && Array.isArray(results.yearlyBreakdown)) {
    const yearly = results.yearlyBreakdown;
    const contributions = Array.isArray(results.contributionsBreakdown) ? results.contributionsBreakdown : [];

    const tableHtml = renderArrayAsTable(
      yearly,
      [
        { key: 'year', label: 'Year' },
        { key: 'balance', label: 'Balance', formatter: formatCurrency },
      ],
      { maxRows: 12, tableId: 'investmentBreakdownTable' },
    );

    return {
      html: `
        <div class="card border-0 shadow-sm mt-4">
          <div class="card-body">
            <h6 class="mb-3">Breakdown chart</h6>
            <div class="detail-chart-wrap mb-3">
              <canvas id="calculationBreakdownChart"></canvas>
            </div>
            ${tableHtml}
          </div>
        </div>
      `,
      chartConfig: {
        type: 'line',
        labels: yearly.map((item) => `Year ${item.year}`),
        datasets: [
          {
            label: 'Balance',
            data: yearly.map((item) => item.balance),
            borderColor: '#0d6efd',
            backgroundColor: 'rgba(13, 110, 253, 0.15)',
            tension: 0.25,
            fill: false,
          },
          {
            label: 'Total Contributions',
            data: contributions.map((item) => item.totalContributions),
            borderColor: '#6c757d',
            backgroundColor: 'rgba(108, 117, 125, 0.12)',
            tension: 0.2,
            fill: false,
          },
        ],
      },
    };
  }

  if (slug === 'emergency_fund' && Array.isArray(results.monthlyBreakdown)) {
    const monthly = results.monthlyBreakdown;

    const tableHtml = renderArrayAsTable(
      monthly,
      [
        { key: 'month', label: 'Month' },
        { key: 'balance', label: 'Balance', formatter: formatCurrency },
      ],
      { maxRows: 12, tableId: 'emergencyBreakdownTable' },
    );

    return {
      html: `
        <div class="card border-0 shadow-sm mt-4">
          <div class="card-body">
            <h6 class="mb-3">Breakdown chart</h6>
            <div class="detail-chart-wrap mb-3">
              <canvas id="calculationBreakdownChart"></canvas>
            </div>
            ${tableHtml}
          </div>
        </div>
      `,
      chartConfig: {
        type: 'line',
        labels: monthly.map((item) => String(item.month)),
        datasets: [
          {
            label: 'Fund Balance',
            data: monthly.map((item) => item.balance),
            borderColor: '#198754',
            backgroundColor: 'rgba(25, 135, 84, 0.15)',
            tension: 0.25,
            fill: false,
          },
          {
            label: 'Target Fund Amount',
            data: monthly.map(() => results.targetFundAmount),
            borderColor: '#dc3545',
            backgroundColor: 'rgba(220, 53, 69, 0.12)',
            borderDash: [6, 6],
            tension: 0,
            fill: false,
          },
        ],
      },
    };
  }

  if (slug === 'loan' && Array.isArray(results.balanceBreakdownStandard)) {
    const standard = results.balanceBreakdownStandard;
    const extra = Array.isArray(results.balanceBreakdownExtra) ? results.balanceBreakdownExtra : [];

    const tableHtml = renderArrayAsTable(
      standard,
      [
        { key: 'month', label: 'Month' },
        { key: 'balance', label: 'Remaining balance', formatter: formatCurrency },
      ],
      { maxRows: 12, tableId: 'loanBreakdownTable' },
    );

    return {
      html: `
        <div class="card border-0 shadow-sm mt-4">
          <div class="card-body">
            <h6 class="mb-3">Breakdown chart</h6>
            <div class="detail-chart-wrap mb-3">
              <canvas id="calculationBreakdownChart"></canvas>
            </div>
            ${tableHtml}
          </div>
        </div>
      `,
      chartConfig: {
        type: 'line',
        labels: standard.map((item) => String(item.month)),
        datasets: [
          {
            label: 'Remaining Balance (Standard)',
            data: standard.map((item) => item.balance),
            borderColor: '#0d6efd',
            backgroundColor: 'rgba(13, 110, 253, 0.15)',
            tension: 0.2,
            fill: false,
          },
          ...(extra.length > 0
            ? [{
              label: 'Remaining Balance (With Extra)',
              data: extra.map((item) => item.balance),
              borderColor: '#198754',
              backgroundColor: 'rgba(25, 135, 84, 0.12)',
              tension: 0.2,
              fill: false,
            }]
            : []),
        ],
      },
    };
  }

  return {
    html: '',
    chartConfig: null,
  };
}

function renderBreakdownChart(chartConfig) {
  if (!chartConfig) return;

  const canvas = document.getElementById('calculationBreakdownChart');
  if (!canvas) return;

  detailChart = new Chart(canvas, {
    type: chartConfig.type,
    data: {
      labels: chartConfig.labels,
      datasets: chartConfig.datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: { display: true },
      },
      scales: {
        y: {
          ticks: {
            callback(value) {
              return formatCurrency(Number(value));
            },
          },
        },
      },
    },
  });
}

async function handleSaveAsScenario(calculationId, userId, scenarioTitle) {
  const { calculation } = await fetchCalculation(calculationId);

  if (!calculation) {
    alert('Failed to save scenario');
    return;
  }

  const { scenario, error } = await createScenario(
    userId,
    calculation.calculator_type_id,
    scenarioTitle,
    calculation.inputs,
  );

  if (error) {
    alert(`Failed to save scenario: ${error}`);
  } else {
    alert('Scenario saved successfully!');
    window.history.pushState(null, '', `/scenarios/${scenario.id}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
}

function showError(message) {
  const container = document.getElementById('calculationContent');
  if (!container) return;
  container.innerHTML = `<div class="alert alert-danger">${message}</div>`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
