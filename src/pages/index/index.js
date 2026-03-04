import { getCurrentUser } from '../../utils/auth.js';
import indexHTML from './index.html?raw';
import './index.css';

export const title = 'Home';

export async function render() {
  return indexHTML;
}

export async function init() {
  const { user } = await getCurrentUser();
  
  const authButtonsContainer = document.getElementById('authButtonsContainer');
  const dashboardButton = document.getElementById('dashboardButton');
  
  if (user) {
    // User is logged in - show dashboard button
    if (authButtonsContainer) {
      authButtonsContainer.style.display = 'none';
    }
    if (dashboardButton) {
      dashboardButton.style.display = 'inline-block';
    }
  } else {
    // User not logged in - show auth buttons
    if (authButtonsContainer) {
      authButtonsContainer.style.display = 'flex';
    }
    if (dashboardButton) {
      dashboardButton.style.display = 'none';
    }
  }
  
  console.log('Index page initialized');
}
