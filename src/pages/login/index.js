import loginHTML from './login.html?raw';
import './login.css';
import { login, isAuthenticated } from '../../utils/auth.js';

export const title = 'Login';

export async function render() {
  // Redirect to dashboard if already logged in
  if (await isAuthenticated()) {
    window.history.pushState(null, '', '/dashboard');
    window.dispatchEvent(new PopStateEvent('popstate'));
    return '';
  }
  return loginHTML;
}

export async function init() {
  const form = document.getElementById('loginForm');
  const alertContainer = document.getElementById('alertContainer');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value.trim();

      // Clear previous alerts
      alertContainer.innerHTML = '';

      // Validate input
      if (!email || !password) {
        showAlert(alertContainer, 'Please fill in all fields', 'warning');
        return;
      }

      // Show loading state
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Logging in...';

      // Attempt login
      const { user, error } = await login(email, password);

      if (error) {
        showAlert(alertContainer, error, 'danger');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      } else {
        showAlert(alertContainer, 'Login successful! Redirecting...', 'success');
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          window.history.pushState(null, '', '/dashboard');
          window.dispatchEvent(new PopStateEvent('popstate'));
        }, 1000);
      }
    });
  }
}

/**
 * Show alert message
 * @param {HTMLElement} container - Container to display alert in
 * @param {string} message - Alert message
 * @param {string} type - Alert type (success, danger, warning, info)
 */
function showAlert(container, message, type = 'info') {
  const alertHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;
  container.innerHTML = alertHTML;
}
