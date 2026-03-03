import headerHTML from './header.html?raw';
import './header.css';
import { getCurrentUser, logout, onAuthStateChange } from '../../utils/auth.js';

let unsubscribeAuthListener = null;

export async function render() {
  return headerHTML;
}

export async function init() {
  updateActiveLink();
  await updateAuthState();

  if (!unsubscribeAuthListener) {
    unsubscribeAuthListener = onAuthStateChange(async () => {
      await updateAuthState();
    });
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.onclick = async (e) => {
      e.preventDefault();
      const { error } = await logout();
      if (!error) {
        window.history.pushState(null, '', '/login');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    };
  }
}

function updateActiveLink() {
  const links = document.querySelectorAll('.navbar-nav a[data-route]');
  const currentPath = window.location.pathname;

  links.forEach((link) => {
    link.classList.remove('active');
    const href = link.getAttribute('data-route');
    if (href === currentPath || (href === '/' && currentPath === '')) {
      link.classList.add('active');
    }
  });
}

async function updateAuthState() {
  const { user } = await getCurrentUser();

  const loginLink = document.getElementById('loginLink');
  const registerLink = document.getElementById('registerLink');
  const dashboardLink = document.getElementById('dashboardLink');
  const userDropdown = document.getElementById('userDropdown');
  const userEmail = document.getElementById('userEmail');

  if (user) {
    if (loginLink) loginLink.style.display = 'none';
    if (registerLink) registerLink.style.display = 'none';
    if (dashboardLink) dashboardLink.style.display = '';
    if (userDropdown) userDropdown.style.display = '';
    if (userEmail) userEmail.textContent = user.email || 'User';
  } else {
    if (loginLink) loginLink.style.display = '';
    if (registerLink) registerLink.style.display = '';
    if (dashboardLink) dashboardLink.style.display = 'none';
    if (userDropdown) userDropdown.style.display = 'none';
  }
}
