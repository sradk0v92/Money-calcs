/**
 * Compare Page - Side-by-side comparison of two calculations
 */

import compareHTML from './compare.html?raw';
import './compare.css';
import { isAuthenticated, getCurrentUser } from '../../utils/auth.js';
import {
  calculatorLabelMaps,
  formatBool,
  formatCurrency,
  formatDate,
  formatPercent,
  summaryEntries,
} from '../../utils/calculationPresentation.js';
import { fetchComparisonPair, saveComparison } from '../../utils/database.js';
import { renderComparisonChart, destroyComparisonChart } from '../../charts/renderComparisonChart.js';

export const title = 'Compare Calculations';

/**
 * Extract calculation IDs from URL path (e.g. /compare/id1/id2)
 */
function extractIdsFromPath(path) {
  const match = path.match(/^\/compare\/([^/]+)\/([^/]+)$/);
  if (!match) return { id1: null, id2: null };
  return { id1: match[1], id2: match[2] };
}

/**
 * Format value based on key for input comparison
 */
function formatInputValue(key, value, calculatorSlug) {
  if (value === null || value === undefined) return '—';
  
  const slug = calculatorSlug.replace(/-/g, '_');
  const inputFormatters = {
    investment: {
      annualReturnRate: formatPercent,
      inflationRate: formatPercent,
      inflationEnabled: formatBool,
      years: (v) => `${v}`,
      initialAmount: formatCurrency,
      monthlyContribution: formatCurrency,
    },
    emergency_fund: {
      monthlyEssentialExpenses: formatCurrency,
      currentSavings: formatCurrency,
      monthlyContribution: formatCurrency,
      bufferPercent: formatPercent,
      targetMonths: (v) => `${v}`,
    },
    loan: {
      loanAmount: formatCurrency,
      annualInterestRate: formatPercent,
      loanTermYears: (v) => `${v}`,
      extraMonthlyPayment: formatCurrency,
      startDate: formatDate,
    },
  };

  const formatter = inputFormatters[slug]?.[key] || formatPrimitive;
  return formatter(value);
}

/**
 * Format value for results based on key
 */
function formatResultValue(key, value, calculatorSlug) {
  if (value === null || value === undefined) return '—';

  const slug = calculatorSlug.replace(/-/g, '_');
  const resultFormatters = {
    investment: {
      finalBalance: formatCurrency,
      totalContributions: formatCurrency,
      totalEarnings: formatCurrency,
      realFinalBalance: formatCurrency,
    },
    emergency_fund: {
      targetFundAmount: formatCurrency,
      gapAmount: formatCurrency,
      monthsCoveredNow: (v) => `${v}`,
      monthsToGoal: (v) => `${v}`,
    },
    loan: {
      monthlyPayment: formatCurrency,
      totalInterestStandard: formatCurrency,
      payoffMonthsStandard: (v) => `${v}`,
      totalPaidStandard: formatCurrency,
    },
  };

  const formatter = resultFormatters[slug]?.[key] || formatPrimitive;
  return formatter(value);
}

/**
 * Format a primitive value
 */
function formatPrimitive(value) {
  if (typeof value === 'boolean') return formatBool(value);
  if (typeof value === 'number') return formatCurrency(value);
  return String(value || '—');
}

/**
 * Get all unique input keys from both calculations
 */
function getUniqueInputKeys(calc1, calc2) {
  const keys1 = calc1?.inputs ? Object.keys(calc1.inputs) : [];
  const keys2 = calc2?.inputs ? Object.keys(calc2.inputs) : [];
  return [...new Set([...keys1, ...keys2])].sort();
}

/**
 * Get all unique result keys from both calculations
 */
function getUniqueResultKeys(calc1, calc2) {
  const keys1 = calc1?.results ? Object.keys(calc1.results) : [];
  const keys2 = calc2?.results ? Object.keys(calc2.results) : [];

  // Filter out array keys (yearlyBreakdown, monthlyBreakdown, etc)
  const arrayKeys = ['yearlyBreakdown', 'monthlyBreakdown', 'balanceBreakdown', 'balanceBreakdownStandard', 'balanceBreakdownExtra', 'contributionsBreakdown'];
  const filtered1 = keys1.filter((k) => !arrayKeys.includes(k));
  const filtered2 = keys2.filter((k) => !arrayKeys.includes(k));

  return [...new Set([...filtered1, ...filtered2])].sort();
}

/**
 * Find the best chart data array from calculations
 */
function findChartDataArray(calc1, calc2) {
  const arrayKeys = ['yearlyBreakdown', 'monthlyBreakdown', 'balanceBreakdown', 'balanceBreakdownStandard'];
  
  for (const key of arrayKeys) {
    const arr1 = calc1?.results?.[key];
    const arr2 = calc2?.results?.[key];
    
    if (Array.isArray(arr1) && Array.isArray(arr2)) {
      return { key, calc1Data: arr1, calc2Data: arr2 };
    }
  }
  
  return null;
}

/**
 * Extract numeric values from array of objects (for chart)
 */
function extractChartValues(arrayData, valueKey) {
  if (!Array.isArray(arrayData)) return [];
  return arrayData.map((item) => {
    if (typeof item === 'object' && item !== null) {
      // Find the numeric value in the object (e.g., 'balance', 'contribution')
      const value = item[valueKey] || Object.values(item).find((v) => typeof v === 'number');
      return value || 0;
    }
    return Number(item) || 0;
  });
}

/**
 * Render the comparison
 */
async function renderComparison(calc1, calc2) {
  const errorContainer = document.getElementById('errorContainer');
  const contentDiv = document.getElementById('comparisonContent');

  // Validate calculations
  if (!calc1 || !calc2) {
    errorContainer.innerHTML = '<div class="alert alert-danger">Failed to load one or both calculations.</div>';
    return;
  }

  if (calc1.calculator_type_id !== calc2.calculator_type_id) {
    errorContainer.innerHTML = '<div class="alert alert-warning">Please select two calculations from the same calculator.</div>';
    return;
  }

  // Show content
  contentDiv.style.display = 'block';
  const calcType = calc1.calculator_types?.slug || 'unknown';
  const labelMap = calculatorLabelMaps[calcType.replace(/-/g, '_')] || {};

  // ============ Render meta cards ============
  document.getElementById('calc1Title').textContent = calc1.title || 'Untitled calculation';
  document.getElementById('calc1Date').textContent = formatDate(calc1.created_at);
  document.getElementById('calc2Title').textContent = calc2.title || 'Untitled calculation';
  document.getElementById('calc2Date').textContent = formatDate(calc2.created_at);

  // Render summary pills
  const summary1 = summaryEntries(calc1.summary, calcType);
  const summary2 = summaryEntries(calc2.summary, calcType);

  const renderSummaryPills = (entries) => {
    if (entries.length === 0) return '<small class="text-muted">No summary available</small>';
    return entries.map((item) => `<span class="summary-pill"><strong>${item.label}:</strong> ${item.value}</span>`).join('');
  };

  document.getElementById('calc1Summary').innerHTML = renderSummaryPills(summary1);
  document.getElementById('calc2Summary').innerHTML = renderSummaryPills(summary2);

  // ============ Render inputs table ============
  const inputKeys = getUniqueInputKeys(calc1, calc2);
  const inputsTableBody = document.getElementById('inputsTableBody');

  if (inputKeys.length === 0) {
    inputsTableBody.innerHTML = '<tr><td colspan="3" class="text-center text-muted py-3">No inputs to compare.</td></tr>';
  } else {
    inputsTableBody.innerHTML = inputKeys
      .map((key) => {
        const label = labelMap[key] || key;
        const val1 = formatInputValue(key, calc1.inputs?.[key], calcType);
        const val2 = formatInputValue(key, calc2.inputs?.[key], calcType);
        return `
          <tr>
            <td>${label}</td>
            <td>${val1}</td>
            <td>${val2}</td>
          </tr>
        `;
      })
      .join('');
  }

  // ============ Render results cards ============
  const resultKeys = getUniqueResultKeys(calc1, calc2);
  const resultsContainer = document.getElementById('resultsContainer');

  if (resultKeys.length === 0) {
    resultsContainer.innerHTML = '<div class="col text-center text-muted py-3">No results to compare.</div>';
  } else {
    resultsContainer.innerHTML = resultKeys
      .map((key) => {
        const label = labelMap[key] || key;
        const val1 = formatResultValue(key, calc1.results?.[key], calcType);
        const val2 = formatResultValue(key, calc2.results?.[key], calcType);
        return `
          <div class="col-md-6 col-lg-4">
            <div class="result-card">
              <div class="result-label">${label}</div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: 0.75rem;">
                <div>
                  <small class="text-muted" style="font-size: 0.75rem;">Calc A</small>
                  <div class="result-value">${val1}</div>
                </div>
                <div>
                  <small class="text-muted" style="font-size: 0.75rem;">Calc B</small>
                  <div class="result-value">${val2}</div>
                </div>
              </div>
            </div>
          </div>
        `;
      })
      .join('');
  }

  // ============ Render chart (if applicable) ============
  const chartData = findChartDataArray(calc1, calc2);
  if (chartData) {
    const { key: dataKey, calc1Data, calc2Data } = chartData;
    const chartContainer = document.getElementById('chartContainer');
    const chartTitle = document.getElementById('chartTitle');

    // Determine value key based on array key
    let valueKey = 'balance';
    if (dataKey === 'yearlyBreakdown') valueKey = 'balance';
    if (dataKey === 'monthlyBreakdown') valueKey = 'balance';
    if (dataKey === 'balanceBreakdown') valueKey = 'balance';
    if (dataKey === 'balanceBreakdownStandard') valueKey = 'balance';
    if (dataKey === 'contributionsBreakdown') valueKey = 'contributions';

    const values1 = extractChartValues(calc1Data, valueKey);
    const values2 = extractChartValues(calc2Data, valueKey);

    if (values1.length > 0 && values2.length > 0) {
      chartContainer.style.display = 'block';
      chartTitle.textContent = dataKey.replace(/Breakdown/, '').replace(/([A-Z])/g, ' $1').trim() + ' Comparison';

      const xLabel = dataKey.includes('Monthly') ? 'Month' : 'Year';
      const yLabel = valueKey === 'balance' ? 'Balance' : 'Contributions';

      renderComparisonChart(
        'comparisonChartCanvas',
        calc1.title || 'Calculation A',
        calc2.title || 'Calculation B',
        values1,
        values2,
        xLabel,
        yLabel
      );
    } else {
      chartContainer.style.display = 'none';
    }
  } else {
    document.getElementById('chartContainer').style.display = 'none';
  }
}

/**
 * Show a toast notification
 */
function showToast(message, type = 'success') {
  const container = document.getElementById('saveToastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.style.cssText = 'padding: 1rem; margin: 0; min-width: 300px;';
  toast.innerHTML = `<div>${message}</div>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

/**
 * Render the page
 */
export async function render() {
  if (!(await isAuthenticated())) {
    window.history.pushState(null, '', '/login');
    window.dispatchEvent(new PopStateEvent('popstate'));
    return '';
  }

  return compareHTML;
}

/**
 * Initialize the page
 */
export async function init() {
  const { user } = await getCurrentUser();
  if (!user) return;

  // Extract IDs from URL
  const path = window.location.pathname;
  const { id1, id2 } = extractIdsFromPath(path);

  if (!id1 || !id2) {
    document.getElementById('errorContainer').innerHTML = '<div class="alert alert-danger">Invalid comparison URL.</div>';
    return;
  }

  // Fetch both calculations
  const { calc1, calc2, error } = await fetchComparisonPair(id1, id2);

  if (error) {
    document.getElementById('errorContainer').innerHTML = `<div class="alert alert-danger">Error loading calculations: ${error}</div>`;
    return;
  }

  // Render comparison
  await renderComparison(calc1, calc2);

  // Setup save comparison button
  const saveBtn = document.getElementById('saveComparisonBtn');
  if (saveBtn && calc1 && calc2) {
    saveBtn.addEventListener('click', async () => {
      saveBtn.disabled = true;
      const spinner = document.getElementById('saveBtnSpinner');
      spinner?.classList.remove('d-none');

      const title = `Compare: ${calc1.title || formatDate(calc1.created_at)} vs ${calc2.title || formatDate(calc2.created_at)}`;
      const { comparison, error: saveError } = await saveComparison(
        user.id,
        calc1.calculator_type_id,
        title,
        calc1.id,
        calc2.id
      );

      if (saveError) {
        showToast(`Failed to save comparison: ${saveError}`, 'error');
      } else {
        showToast('Comparison saved successfully!', 'success');
      }

      saveBtn.disabled = false;
      spinner?.classList.add('d-none');
    });
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', destroyComparisonChart);
}
