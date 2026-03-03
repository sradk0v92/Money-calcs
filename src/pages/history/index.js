import historyHTML from './history.html?raw';
import './history.css';
import { isAuthenticated, getCurrentUser } from '../../utils/auth.js';
import { formatDate, summaryEntries } from '../../utils/calculationPresentation.js';
import { fetchCalculationHistory } from '../../utils/database.js';

export const title = 'Calculation History';

export async function render() {
  if (!(await isAuthenticated())) {
    window.history.pushState(null, '', '/login');
    window.dispatchEvent(new PopStateEvent('popstate'));
    return '';
  }

  return historyHTML;
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
      <div class="history-item">
        <div class="row align-items-start">
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
}
