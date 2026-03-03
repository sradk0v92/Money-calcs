import registerHTML from './register.html?raw';
import './register.css';
import { register, isAuthenticated } from '../../utils/auth.js';

export const title = 'Register';

export async function render() {
  // Redirect to dashboard if already logged in
  if (await isAuthenticated()) {
    window.history.pushState(null, '', '/dashboard');
    window.dispatchEvent(new PopStateEvent('popstate'));
    return '';
  }
  return registerHTML;
}

export async function init() {
  const form = document.getElementById('registerForm');
  const alertContainer = document.getElementById('alertContainer');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const firstName = document.getElementById('firstName').value.trim();
      const lastName = document.getElementById('lastName').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;

      // Clear previous alerts
      alertContainer.innerHTML = '';

      // Validate input
      if (!email || !password || !confirmPassword) {
        showAlert(alertContainer, 'Please fill in all required fields', 'warning');
        return;
      }

      if (password.length < 6) {
        showAlert(alertContainer, 'Password must be at least 6 characters', 'warning');
        return;
      }

      if (password !== confirmPassword) {
        showAlert(alertContainer, 'Passwords do not match', 'warning');
        return;
      }

      // Show loading state
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Registering...';

      // Attempt registration
      const { user, error } = await register(email, password, {
        firstName,
        lastName,
      });

      if (error) {
        showAlert(alertContainer, error, 'danger');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      } else {
        showAlert(alertContainer, 'Registration successful! Please login.', 'success');
        // Redirect to login after a short delay
        setTimeout(() => {
          window.history.pushState(null, '', '/login');
          window.dispatchEvent(new PopStateEvent('popstate'));
        }, 1500);
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
