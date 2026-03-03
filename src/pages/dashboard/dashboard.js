import dashboardHTML from './dashboard.html?raw';
import './dashboard.css';
import { isAuthenticated, getCurrentUser } from '../../utils/auth.js';
import { formatDate, summaryEntries } from '../../utils/calculationPresentation.js';
import { 
  deleteCalculation,
  fetchCalculatorTypes, 
  fetchUserCalculations, 
  fetchUserScenarios,
} from '../../utils/database.js';

export const title = 'Dashboard';

export async function render() {
  if (!(await isAuthenticated())) {
    window.history.pushState(null, '', '/login');
    window.dispatchEvent(new PopStateEvent('popstate'));
    return '';
  }

  return dashboardHTML;
}

export async function init() {
  const { user } = await getCurrentUser();
  
  if (!user) return;

  // Fetch and render calculator types
  await renderCalculators();
  
  // Fetch and render user's recent calculations
  await renderRecentCalculations(user.id);
  
  // Fetch and render user's scenarios
  await renderScenarios(user.id);
}

/**
 * Render available calculators
 */
async function renderCalculators() {
  const { calculators, error } = await fetchCalculatorTypes();
  const container = document.getElementById('calculatorsContainer');
  
  if (error) {
    container.innerHTML = `<div class="alert alert-danger">Failed to load calculators</div>`;
    return;
  }

  if (!calculators || calculators.length === 0) {
    container.innerHTML = `<div class="alert alert-info">No calculators available</div>`;
    return;
  }

  const calculatorCards = calculators.map(calc => {
    const iconMap = {
      'investment': '💹',
      'loan': '🏦',
      'emergency_fund': '🏠'
    };

    const routeMap = {
      investment: '/investmentcalculator',
      loan: '/loancalculator',
      loancalculator: '/loancalculator',
      emergency_fund: '/emergencyfundcalculator',
      emergencyfundcalculator: '/emergencyfundcalculator',
    };
    
    const icon = iconMap[calc.slug] || '📊';
    const route = routeMap[calc.slug] || '/dashboard';
    
    return `
      <div class="col-md-6 col-lg-4">
        <div class="calculator-card card h-100 shadow-sm border-0 cursor-pointer">
          <div class="card-body">
            <div class="display-5 mb-3">${icon}</div>
            <h5 class="card-title">${calc.name}</h5>
            <p class="card-text text-muted small">${calc.description || ''}</p>
            <a href="${route}" data-route="${route}" class="btn btn-sm btn-primary">
              Open Calculator
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = calculatorCards;
}

/**
 * Render recent calculations
 */
async function renderRecentCalculations(userId) {
  const { calculations, error } = await fetchUserCalculations(userId, 5);
  const container = document.getElementById('calculationsContainer');
  
  if (error) {
    container.innerHTML = `<div class="alert alert-danger">Failed to load calculations</div>`;
    return;
  }

  if (!calculations || calculations.length === 0) {
    container.innerHTML = `
      <div class="alert alert-info">
        <i class="bi bi-info-circle me-2"></i> You haven't performed any calculations yet. Start by choosing a calculator above!
      </div>
    `;
    return;
  }

  const calculationsList = calculations.map(calc => {
    const calculatorName = calc.calculator_types?.name || 'Unknown Calculator';
    const date = formatDate(calc.created_at);
    const itemTitle = calc.title || 'Untitled calculation';
    const summary = summaryEntries(calc.summary, calc.calculator_types?.slug);

    const summaryHtml = summary.length > 0
      ? `<div class="summary-list mt-2">${summary.map((item) => `<span class="summary-pill"><strong>${item.label}:</strong> ${item.value}</span>`).join('')}</div>`
      : '<small class="text-muted d-block mt-2">No summary available.</small>';

    return `
      <div class="calculation-item border-bottom py-3">
        <div class="row align-items-center">
          <div class="col">
            <h6 class="mb-1 fw-bold">${calculatorName}</h6>
            <div class="small text-muted">${date}</div>
            <div class="small">${itemTitle}</div>
            ${summaryHtml}
          </div>
          <div class="col-auto">
            <div class="d-flex gap-2 recent-actions">
              <a href="/calculations/${calc.id}" data-route="/calculations/${calc.id}" class="btn btn-sm btn-outline-primary">
              View details
              </a>
              <button type="button" class="btn btn-sm btn-outline-danger js-delete-calc" data-id="${calc.id}" aria-label="Delete calculation">
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `<div class="calculations-list">${calculationsList}</div>`;
  setupRecentCalculationActions(userId);
}

function setupRecentCalculationActions(userId) {
  const container = document.getElementById('calculationsContainer');
  if (!container) return;

  container.querySelectorAll('.js-delete-calc').forEach((button) => {
    button.addEventListener('click', async () => {
      const calculationId = button.dataset.id;
      const shouldDelete = confirm('Are you sure you want to delete this calculation?');
      if (!shouldDelete) return;

      button.disabled = true;
      const { error } = await deleteCalculation(calculationId);
      button.disabled = false;

      if (error) {
        alert(`Failed to delete calculation: ${error}`);
        return;
      }

      await renderRecentCalculations(userId);
    });
  });
}

/**
 * Render user's saved scenarios
 */
async function renderScenarios(userId) {
  const { scenarios, error } = await fetchUserScenarios(userId, 5);
  const container = document.getElementById('scenariosContainer');
  
  if (error) {
    container.innerHTML = `<div class="alert alert-danger">Failed to load scenarios</div>`;
    return;
  }

  if (!scenarios || scenarios.length === 0) {
    container.innerHTML = `
      <div class="alert alert-info">
        <i class="bi bi-info-circle me-2"></i> You haven't saved any scenarios yet. Perform a calculation and save it as a scenario!
      </div>
    `;
    return;
  }

  const scenariosList = scenarios.map(scenario => {
    const calculatorName = scenario.calculator_types?.name || 'Unknown Calculator';
    const date = new Date(scenario.updated_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
      <div class="scenario-item border-bottom py-3">
        <div class="row align-items-center">
          <div class="col">
            <h6 class="mb-1 fw-bold">${scenario.title}</h6>
            <small class="text-muted">${calculatorName} • Updated ${date}</small>
          </div>
          <div class="col-auto">
            <a href="/scenarios/${scenario.id}" data-route="/scenarios/${scenario.id}" class="btn btn-sm btn-outline-primary">
              View Scenario
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `<div class="scenarios-list">${scenariosList}</div>`;
}
