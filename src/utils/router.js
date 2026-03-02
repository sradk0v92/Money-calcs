/**
 * Simple client-side router for multi-page SPA
 */

class Router {
  constructor() {
    this.routes = new Map();
    this.currentPage = null;
    this.init();
  }

  register(path, component) {
    this.routes.set(path, component);
  }

  init() {
    // Handle initial page load
    window.addEventListener('popstate', () => this.navigate(window.location.pathname));
    
    // Handle link clicks
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[data-route]');
      if (link) {
        e.preventDefault();
        const path = link.getAttribute('data-route');
        this.navigate(path);
      }
    });

    // Navigate to initial path
    this.navigate(window.location.pathname);
  }

  async navigate(path) {
    // Normalize path
    if (!path.startsWith('/')) path = '/' + path;

    const route = this.routes.get(path);
    
    if (!route) {
      console.warn(`Route not found: ${path}`);
      return;
    }

    // Update browser history
    window.history.pushState(null, '', path);
    
    // Load and render the page
    await this.renderPage(route);
  }

  async renderPage(component) {
    const pageContainer = document.getElementById('page-container');
    
    if (!pageContainer) {
      console.error('Page container not found');
      return;
    }

    try {
      // Clear previous content
      pageContainer.innerHTML = '';
      
      // Import and render component
      const { render, title } = await component;
      const content = await render();
      
      // Update page title
      if (title) {
        document.title = `${title} - Money Calculators`;
      } else {
        document.title = 'Money Calculators';
      }
      
      // Append new content
      pageContainer.innerHTML = content;
      
      // Execute any component-specific scripts
      if (component.init) {
        await component.init();
      }

      // Scroll to top
      window.scrollTo(0, 0);
    } catch (error) {
      console.error('Error rendering page:', error);
      pageContainer.innerHTML = '<div class="alert alert-danger">Error loading page</div>';
    }
  }

  getCurrentPath() {
    return window.location.pathname;
  }
}

export default new Router();
