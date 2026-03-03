import dashboardHTML from './dashboard.html?raw';
import './dashboard.css';
import { isAuthenticated } from '../../utils/auth.js';

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
  // Initialize dashboard interactions
  console.log('Dashboard page initialized');
  
  // You can add event listeners for calculator cards here
  const calculatorCards = document.querySelectorAll('.calculator-card');
  calculatorCards.forEach(card => {
    card.addEventListener('click', (e) => {
      if (!e.target.matches('.btn')) {
        const link = card.querySelector('a');
        if (link) {
          link.click();
        }
      }
    });
  });
}
