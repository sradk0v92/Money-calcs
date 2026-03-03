import scenarioDetailHTML from './scenario-detail.html?raw';
import './scenario-detail.css';
import { isAuthenticated, getCurrentUser } from '../../utils/auth.js';
import { fetchScenario, updateScenario, deleteScenario } from '../../utils/database.js';

export const title = 'Scenario Details';

export async function render() {
  if (!(await isAuthenticated())) {
    window.history.pushState(null, '', '/login');
    window.dispatchEvent(new PopStateEvent('popstate'));
    return '';
  }

  return scenarioDetailHTML;
}

export async function init() {
  const { user } = await getCurrentUser();
  if (!user) return;

  // Extract scenario ID from URL
  const pathParts = window.location.pathname.split('/');
  const scenarioId = pathParts[pathParts.length - 1];

  if (!scenarioId) {
    showError('Scenario ID not found');
    return;
  }

  // Fetch and display scenario
  await displayScenario(scenarioId);

  // Setup action buttons
  const editBtn = document.getElementById('editBtn');
  const deleteBtn = document.getElementById('deleteBtn');

  if (editBtn) {
    editBtn.addEventListener('click', async () => {
      const newTitle = prompt('Enter new scenario name:', document.getElementById('scenarioTitle').textContent);
      if (newTitle && newTitle.trim()) {
        await handleUpdateScenario(scenarioId, { title: newTitle });
      }
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      if (confirm('Are you sure you want to delete this scenario?')) {
        await handleDeleteScenario(scenarioId);
      }
    });
  }
}

/**
 * Display scenario details
 */
async function displayScenario(scenarioId) {
  const { scenario, error } = await fetchScenario(scenarioId);
  
  if (error || !scenario) {
    showError('Failed to load scenario details');
    return;
  }

  // Update title and meta
  const titleEl = document.getElementById('scenarioTitle');
  const metaEl = document.getElementById('scenarioMeta');
  const contentEl = document.getElementById('scenarioContent');

  if (titleEl) titleEl.textContent = scenario.title;
  
  const calculatorName = scenario.calculator_types?.name || 'Unknown Calculator';
  const date = new Date(scenario.updated_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  if (metaEl) metaEl.innerHTML = `${calculatorName} • Updated ${date}`;

  // Build inputs display
  let inputsHtml = '<div class="scenario-inputs"><h5>Scenario Parameters</h5>';
  if (scenario.inputs) {
    Object.entries(scenario.inputs).forEach(([key, value]) => {
      const displayKey = key.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
      inputsHtml += `
        <div class="scenario-input-row">
          <span class="scenario-label">${displayKey}</span>
          <span class="scenario-value">${formatValue(value)}</span>
        </div>
      `;
    });
  }
  inputsHtml += '</div>';

  const html = `
    <div class="scenario-meta">
      <strong>${calculatorName}</strong><br>
      <small class="text-muted">Created: ${new Date(scenario.created_at).toLocaleDateString()}</small>
    </div>
    ${inputsHtml}
  `;

  contentEl.innerHTML = html;
}

/**
 * Update scenario
 */
async function handleUpdateScenario(scenarioId, updates) {
  const { error } = await updateScenario(scenarioId, updates);
  
  if (error) {
    alert('Failed to update scenario: ' + error);
  } else {
    alert('Scenario updated successfully!');
    // Reload page
    window.location.reload();
  }
}

/**
 * Delete scenario
 */
async function handleDeleteScenario(scenarioId) {
  const { error } = await deleteScenario(scenarioId);
  
  if (error) {
    alert('Failed to delete scenario: ' + error);
  } else {
    alert('Scenario deleted successfully!');
    window.history.pushState(null, '', '/dashboard');
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
}

function showError(message) {
  const container = document.getElementById('scenarioContent');
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
