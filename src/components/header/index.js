import headerHTML from './header.html?raw';
import './header.css';

export async function render() {
  return headerHTML;
}

export async function init() {
  // Set active link based on current path
  const links = document.querySelectorAll('.navbar-nav .nav-link');
  const currentPath = window.location.pathname;
  
  links.forEach(link => {
    link.classList.remove('active');
    const href = link.getAttribute('data-route');
    if (href === currentPath || (href === '/' && currentPath === '')) {
      link.classList.add('active');
    }
  });
}
