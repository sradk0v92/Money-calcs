const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/**
 * Shared label map definitions per calculator type.
 */
export const calculatorLabelMaps = {
  investment: {
    initialAmount: 'Initial amount',
    monthlyContribution: 'Monthly contribution',
    annualReturnRate: 'Annual return rate',
    years: 'Years',
    contributionTiming: 'Contribution timing',
    inflationEnabled: 'Adjust for inflation',
    inflationRate: 'Inflation rate',
  },
  emergency_fund: {
    monthlyEssentialExpenses: 'Monthly essential expenses',
    targetMonths: 'Target months',
    currentSavings: 'Current savings',
    monthlyContribution: 'Monthly contribution',
    bufferPercent: 'Safety buffer',
    incomeStability: 'Income stability',
  },
  loan: {
    loanAmount: 'Loan amount',
    annualInterestRate: 'Annual interest rate',
    loanTermYears: 'Loan term years',
    extraMonthlyPayment: 'Extra monthly payment',
    startDate: 'Start date',
  },
};

const defaultSummaryLabelMap = {
  finalBalance: 'Final balance',
  totalContributions: 'Total contributions',
  totalEarnings: 'Total earnings',
  targetFundAmount: 'Target fund',
  gapAmount: 'Gap amount',
  monthsCoveredNow: 'Months covered',
  monthsToGoal: 'Months to goal',
  monthlyPayment: 'Monthly payment',
  totalInterestStandard: 'Total interest',
  payoffMonthsStandard: 'Payoff months',
  interestSaved: 'Interest saved',
};

/**
 * Format number as currency.
 */
export function formatCurrency(value) {
  return Number.isFinite(value) ? currencyFormatter.format(value) : '—';
}

/**
 * Format number as percent.
 */
export function formatPercent(value) {
  return Number.isFinite(value) ? `${numberFormatter.format(value)}%` : '—';
}

/**
 * Format boolean as Yes/No.
 */
export function formatBool(value) {
  if (typeof value !== 'boolean') return '—';
  return value ? 'Yes' : 'No';
}

/**
 * Format date values consistently.
 */
export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return dateFormatter.format(date);
}

/**
 * Convert object keys into human-friendly labels.
 */
export function humanizeKey(key) {
  if (!key) return '';
  return String(key)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/^\w/, (letter) => letter.toUpperCase());
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Generic primitive value formatter with sensible defaults.
 */
export function formatPrimitive(value, key = '') {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return formatBool(value);
  if (typeof value === 'number') {
    if (key.toLowerCase().includes('percent') || key.toLowerCase().includes('rate')) {
      return formatPercent(value);
    }
    if (
      key.toLowerCase().includes('amount')
      || key.toLowerCase().includes('balance')
      || key.toLowerCase().includes('contribution')
      || key.toLowerCase().includes('interest')
      || key.toLowerCase().includes('payment')
      || key.toLowerCase().includes('fund')
      || key.toLowerCase().includes('savings')
      || key.toLowerCase().includes('gap')
    ) {
      return formatCurrency(value);
    }
    return numberFormatter.format(value);
  }
  if (typeof value === 'string' && key.toLowerCase().includes('date')) {
    return formatDate(value);
  }
  return String(value);
}

/**
 * Render object values as a key-value list, skipping arrays and nested objects.
 */
export function renderKeyValueList(obj = {}, labelMap = {}, formatterMap = {}) {
  if (!obj || typeof obj !== 'object') {
    return '<div class="text-muted">No data available.</div>';
  }

  const rows = Object.entries(obj)
    .filter(([, value]) => !Array.isArray(value) && (value === null || typeof value !== 'object'))
    .map(([key, value]) => {
      const label = labelMap[key] || humanizeKey(key);
      const formatter = formatterMap[key];
      const formattedValue = typeof formatter === 'function'
        ? formatter(value)
        : formatPrimitive(value, key);

      return `
        <div class="kv-row">
          <span class="kv-label">${escapeHtml(label)}</span>
          <span class="kv-value">${escapeHtml(formattedValue)}</span>
        </div>
      `;
    });

  if (rows.length === 0) {
    return '<div class="text-muted">No scalar values available.</div>';
  }

  return `<div class="kv-list">${rows.join('')}</div>`;
}

/**
 * Render an array of objects as a Bootstrap table with optional show-more collapse.
 */
export function renderArrayAsTable(array = [], columns = [], options = {}) {
  if (!Array.isArray(array) || array.length === 0 || !Array.isArray(columns) || columns.length === 0) {
    return '';
  }

  const maxRows = Number.isInteger(options.maxRows) ? options.maxRows : 12;
  const tableId = options.tableId || `table-${Math.random().toString(36).slice(2, 10)}`;

  const renderRows = (rows) => rows.map((row) => {
    const cells = columns.map((column) => {
      const value = row?.[column.key];
      const formatted = typeof column.formatter === 'function'
        ? column.formatter(value)
        : formatPrimitive(value, column.key);

      return `<td>${escapeHtml(formatted)}</td>`;
    }).join('');

    return `<tr>${cells}</tr>`;
  }).join('');

  const head = columns.map((column) => `<th>${escapeHtml(column.label || humanizeKey(column.key))}</th>`).join('');
  const visibleRows = array.slice(0, maxRows);
  const hiddenRows = array.slice(maxRows);

  let hiddenHtml = '';
  let toggleHtml = '';

  if (hiddenRows.length > 0) {
    hiddenHtml = `
      <div class="collapse" id="${tableId}-more">
        <div class="table-responsive mt-2">
          <table class="table table-sm table-striped mb-0">
            <tbody>
              ${renderRows(hiddenRows)}
            </tbody>
          </table>
        </div>
      </div>
    `;

    toggleHtml = `
      <button class="btn btn-sm btn-outline-secondary mt-2" type="button" data-bs-toggle="collapse" data-bs-target="#${tableId}-more" aria-expanded="false" aria-controls="${tableId}-more">
        Show more (${hiddenRows.length})
      </button>
    `;
  }

  return `
    <div class="table-responsive">
      <table class="table table-sm table-striped mb-0" id="${tableId}">
        <thead>
          <tr>${head}</tr>
        </thead>
        <tbody>
          ${renderRows(visibleRows)}
        </tbody>
      </table>
    </div>
    ${hiddenHtml}
    ${toggleHtml}
  `;
}

/**
 * Prepare 3-5 readable summary items for history lists.
 */
export function summaryEntries(summary = {}, slug = '') {
  if (!summary || typeof summary !== 'object') {
    return [];
  }

  const orderedKeysBySlug = {
    investment: ['finalBalance', 'totalContributions', 'totalEarnings'],
    emergency_fund: ['targetFundAmount', 'gapAmount', 'monthsCoveredNow', 'monthsToGoal'],
    loan: ['monthlyPayment', 'totalInterestStandard', 'payoffMonthsStandard', 'interestSaved'],
  };

  const preferredKeys = orderedKeysBySlug[slug] || Object.keys(summary);

  return preferredKeys
    .filter((key) => key in summary)
    .slice(0, 5)
    .map((key) => ({
      key,
      label: defaultSummaryLabelMap[key] || humanizeKey(key),
      value: formatPrimitive(summary[key], key),
    }));
}
