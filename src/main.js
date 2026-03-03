/**
 * Main application entry point
 * Initializes router, loads components, and manages page navigation
 */

import router from './utils/router.js';
import './styles/main.css';

// Import components
import * as header from './components/header/index.js';
import * as footer from './components/footer/index.js';

// Import pages
import * as indexPage from './pages/index/index.js';
import * as dashboardPage from './pages/dashboard/dashboard.js';
import * as loginPage from './pages/login/index.js';
import * as registerPage from './pages/register/index.js';

/**
 * Initialize the application
 */
async function initApp() {
    // Render header and footer
    await renderHeader();
    await renderFooter();

    // Register routes
    registerRoutes();

    // Initialize router
    router.init();
}

/**
 * Render header component
 */
async function renderHeader() {
    const headerContainer = document.getElementById('header-container');
    if (headerContainer) {
        const headerContent = await header.render();
        headerContainer.innerHTML = headerContent;
        await header.init();
    }
}

/**
 * Render footer component
 */
async function renderFooter() {
    const footerContainer = document.getElementById('footer-container');
    if (footerContainer) {
        const footerContent = await footer.render();
        footerContainer.innerHTML = footerContent;
        await footer.init();
    }
}

/**
 * Register all application routes
 */
function registerRoutes() {
    // Home/Index page
    router.register('/', indexPage);
    
    // Dashboard page
    router.register('/dashboard', dashboardPage);

    // Authentication pages
    router.register('/login', loginPage);
    router.register('/register', registerPage);

    // TODO: Add additional route pages
    // router.register('/login', loginPage);
    // router.register('/register', registerPage);
    // router.register('/calculators/:id/investmentcalculator', investmentCalculatorPage);
    // router.register('/calculators/:id/loancalculator', loanCalculatorPage);
    // router.register('/calculators/:id/debtpayoffcalculator', debtPayoffCalculatorPage);
    // router.register('/calculators/:id/emergencyfundcalculator', emergencyFundCalculatorPage);
}

/**
 * Handle router navigation updates
 */
window.addEventListener('spa-page-changed', async () => {
    // Re-initialize header to update active links
    await header.init();
});

// Initialize the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
