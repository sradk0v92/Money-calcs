import dashboardHTML from './dashboard.html?raw';
import './dashboard.css';

export const title = 'Dashboard';

export async function render() {
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
