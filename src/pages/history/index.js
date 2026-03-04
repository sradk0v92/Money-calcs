import historyHTML from './history.html?raw';
import './history.css';
import { isAuthenticated, getCurrentUser } from '../../utils/auth.js';
import { formatDate, summaryEntries } from '../../utils/calculationPresentation.js';
import { fetchCalculationHistory } from '../../utils/database.js';

export const title = 'Calculation History';

// Track selected calculations
let selectedCalculations = new Map();

export async function render() {
  if (!(await isAuthenticated())) {
    window.history.pushState(null, '', '/login');
    window.dispatchEvent(new PopStateEvent('popstate'));
    return '';
  }

  return historyHTML;
}

/**
 * Update compare button state
 */
function updateCompareButtonState() {
  const compareBtn = document.getElementById('compareBtn');
  const compareBtnText = document.getElementById('compareBtnText');
  const typeAlert = document.getElementById('typeAlert');
  const selections = Array.from(selectedCalculations.values());

  compareBtnText.textContent = `Compare (${selections.length})`;

  if (selections.length === 2) {
    // Check if both calculations are from the same calculator type
    const type1 = selections[0].calculator_type_id;
    const type2 = selections[1].calculator_type_id;

    if (type1 === type2) {
      compareBtn.disabled = false;
      typeAlert.style.display = 'none';
    } else {
      compareBtn.disabled = true;
      typeAlert.style.display = 'block';
    }
  } else {
    compareBtn.disabled = true;
    typeAlert.style.display = 'none';
  }
}

/**
 * Handle checkbox change
 */
function handleCheckboxChange(calculationId, isChecked, calculation) {
  if (isChecked) {
    selectedCalculations.set(calculationId, calculation);
  } else {
    selectedCalculations.delete(calculationId);
  }

  updateCompareButtonState();
}

/**
 * Handle compare button click
 */
function handleCompareClick() {
  const selections = Array.from(selectedCalculations.values());
  if (selections.length === 2) {
    const id1 = selections[0].id;
    const id2 = selections[1].id;
    window.history.pushState(null, '', `/compare/${id1}/${id2}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
}

export async function init() {
  const { user } = await getCurrentUser();
  if (!user) return;

  const { calculations, error } = await fetchCalculationHistory(user.id, 50);
  const container = document.getElementById('historyContainer');
  if (!container) return;

  if (error) {
    container.innerHTML = `<div class="card-body"><div class="alert alert-danger mb-0">Failed to load history</div></div>`;
    return;
  }

  if (!calculations || calculations.length === 0) {
    container.innerHTML = `<div class="card-body"><div class="alert alert-info mb-0">No saved calculations yet.</div></div>`;
    return;
  }

  const rows = calculations.map((calc) => {
    const calculatorName = calc.calculator_types?.name || 'Unknown Calculator';
    const date = formatDate(calc.created_at);
    const itemTitle = calc.title || 'Untitled calculation';
    const summary = summaryEntries(calc.summary, calc.calculator_types?.slug);

    const summaryHtml = summary.length > 0
      ? `<div class="history-summary">${summary.map((item) => `<span class="history-pill"><strong>${item.label}:</strong> ${item.value}</span>`).join('')}</div>`
      : '<small class="text-muted d-block mt-2">No summary available.</small>';

    return `
      <div class="history-item" data-calc-id="${calc.id}">
        <div class="row align-items-start">
          <div class="col-auto pt-1">
            <input type="checkbox" class="form-check-input history-checkbox" value="${calc.id}" data-calc-id="${calc.id}">
          </div>
          <div class="col">
            <h6 class="mb-1 fw-bold">${calculatorName}</h6>
            <div class="small text-muted">${date}</div>
            <div class="small">${itemTitle}</div>
            ${summaryHtml}
          </div>
          <div class="col-auto">
            <a href="/calculations/${calc.id}" data-route="/calculations/${calc.id}" class="btn btn-sm btn-outline-primary">View details</a>
          </div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `<div class="card-body">${rows}</div>`;

  // Setup checkbox event listeners
  document.querySelectorAll('.history-checkbox').forEach((checkbox) => {
    checkbox.addEventListener('change', (e) => {
      const calcId = e.target.getAttribute('data-calc-id');
      const calculation = calculations.find((c) => c.id === calcId);
      handleCheckboxChange(calcId, e.target.checked, calculation);
    });
  });

  // Setup compare button
  const compareBtn = document.getElementById('compareBtn');
  if (compareBtn) {
    compareBtn.addEventListener('click', handleCompareClick);
  }
}
