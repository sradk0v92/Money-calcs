import calcDetailHTML from './calculation-detail.html?raw';
import './calculation-detail.css';
import { isAuthenticated, getCurrentUser } from '../../utils/auth.js';
import { fetchCalculation, createScenario } from '../../utils/database.js';

export const title = 'Calculation Details';

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

  // Extract calculation ID from URL
  const pathParts = window.location.pathname.split('/');
  const calculationId = pathParts[pathParts.length - 1];

  if (!calculationId) {
    showError('Calculation ID not found');
    return;
  }

  // Fetch and display calculation
  await displayCalculation(calculationId, user.id);

  // Setup save as scenario button
  const saveBtn = document.getElementById('saveScenarioBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const title = prompt('Enter scenario name:', 'My Scenario');
      if (title) {
        await handleSaveAsScenario(calculationId, user.id, title);
      }
    });
  }
}

/**
 * Display calculation details
 */
async function displayCalculation(calculationId, userId) {
  const { calculation, error } = await fetchCalculation(calculationId);
  const container = document.getElementById('calculationContent');

  if (error || !calculation) {
    container.innerHTML = `<div class="alert alert-danger">Failed to load calculation details</div>`;
    return;
  }

  // Format date
  const date = new Date(calculation.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const calculatorName = calculation.calculator_types?.name || 'Unknown Calculator';

  // Build inputs/outputs display
  let inputsHtml = '<div class="calculation-inputs"><h5>Inputs</h5>';
  if (calculation.inputs) {
    Object.entries(calculation.inputs).forEach(([key, value]) => {
      const displayKey = key.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
      inputsHtml += `
        <div class="calculation-input-row">
          <span class="calculation-label">${displayKey}</span>
          <span class="calculation-value">${formatValue(value)}</span>
        </div>
      `;
    });
  }
  inputsHtml += '</div>';

  let resultsHtml = '<div class="calculation-results"><h5>Results</h5>';
  if (calculation.results) {
    Object.entries(calculation.results).forEach(([key, value]) => {
      const displayKey = key.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
      resultsHtml += `
        <div class="calculation-result-row">
          <span class="calculation-label">${displayKey}</span>
          <span class="calculation-value">${formatValue(value)}</span>
        </div>
      `;
    });
  }
  resultsHtml += '</div>';

  const html = `
    <div class="calculation-meta">
      <strong>${calculatorName}</strong><br>
      <small class="text-muted">${date}</small>
    </div>
    ${inputsHtml}
    ${resultsHtml}
  `;

  container.innerHTML = html;

  // Enable save button
  const saveBtn = document.getElementById('saveScenarioBtn');
  if (saveBtn) {
    saveBtn.disabled = false;
    saveBtn.dataset.calcId = calculationId;
    saveBtn.dataset.typeId = calculation.calculator_type_id;
  }
}

/**
 * Save calculation as scenario
 */
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
    calculation.inputs
  );

  if (error) {
    alert('Failed to save scenario: ' + error);
  } else {
    alert('Scenario saved successfully!');
    window.history.pushState(null, '', `/scenarios/${scenario.id}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
}

function showError(message) {
  const container = document.getElementById('calculationContent');
  container.innerHTML = `<div class="alert alert-danger">${message}</div>`;
}

function formatValue(value) {
  if (typeof value === 'number') {
    return value.toLocaleString('en-US', { 
      maximumFractionDigits: 2, 
      minimumFractionDigits: 0 
    });
  }
  return String(value);
}
