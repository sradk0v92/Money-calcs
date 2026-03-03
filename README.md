# Money Calculators

A modern, responsive web app for calculating investment returns, loan interest, mortgage payments, and comparing financial products. Built with Vite, vanilla JavaScript, Bootstrap, and Supabase.

## Features

- 📊 Multiple financial calculators
- 💾 Save and view calculation history
- 👤 User authentication and registration
- 📱 Fully responsive design
- ⚡ Fast performance with Vite
- 🎨 Modern UI with Bootstrap

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript (vanilla)
- **UI Framework**: Bootstrap 5
- **Build Tool**: Vite
- **Backend**: Supabase
- **Database**: PostgreSQL
- **Authentication**: Supabase Auth
- **Hosting**: Netlify

## Project Structure

```
├── src/
│   ├── components/          # Reusable components
│   │   ├── header/         # Header component
│   │   └── footer/         # Footer component
│   ├── pages/              # Page components
│   │   ├── index/          # Home page (/)
│   │   └── dashboard/      # Dashboard page (/dashboard)
│   ├── styles/             # Global styles
│   │   └── main.css        # Global CSS
│   ├── utils/              # Utility functions
│   │   └── router.js       # Client-side router
│   └── main.js             # App entry point
├── index.html              # HTML entry point
├── vite.config.js          # Vite configuration
├── package.json            # Dependencies and scripts
└── .gitignore              # Git ignore rules
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Routes

Currently configured:
- `/` - Home page
- `/dashboard` - Dashboard with calculator selection

Future routes (to be implemented):
- `/login` - User login page
- `/register` - User registration page
- `/calculators/:id/investmentcalculator` - Investment calculator
- `/calculators/:id/loancalculator` - Loan calculator
- `/calculators/:id/emergencyfundcalculator` - Emergency fund calculator

## Configuration

### Vite Configuration

The `vite.config.js` file includes:
- Development server on port 5173
- Build output to `dist/` directory
- Asset organization for scripts and styles

### Environment Variables

Create a `.env` (or `.env.local`) file for environment-specific settings:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_or_publishable_key
```

## Architecture

### Multi-Page Architecture

The app uses a client-side router to manage page navigation without full page reloads. Each page is implemented as a modular component with:
- HTML template
- CSS styles
- JavaScript logic

### Component Structure

Each component (page or shared component) follows this pattern:

```javascript
// Render content
export async function render() {
  return htmlContent;
}

// Initialize component
export async function init() {
  // Setup event listeners and logic
}
```

### Router

The custom router in `src/utils/router.js` handles:
- Route registration
- Page transitions
- Browser history management
- Link click interception

## Navigation

Click navigation links with the `data-route` attribute:

```html
<a href="/" data-route="/">Home</a>
```

Or use the router programmatically:

```javascript
import router from './utils/router.js';
router.navigate('/dashboard');
```

## Component Development

### Adding a New Page

1. Create a new folder in `src/pages/` (e.g., `src/pages/mypage/`)
2. Create three files:
   - `mypage.html` - HTML template
   - `mypage.css` - Styles
   - `index.js` - Component logic

3. In `index.js`:

```javascript
import htmlTemplate from './mypage.html?raw';
import './mypage.css';

export async function render() {
  return htmlTemplate;
}

export async function init() {
  // Initialize page
}
```

4. Register the route in `src/main.js`:

```javascript
import * as myPage from './pages/mypage/index.js';
router.register('/mypage', myPage);
```

### Adding a New Component

Follow the same pattern but place it in `src/components/` instead.

## Development Workflow

1. Start development server: `npm run dev`
2. Open browser to `http://localhost:5173`
3. Make changes - browser will auto-refresh
4. Test navigation between pages
5. Build when ready: `npm run build`

## Best Practices

- ✅ Keep components focused and reusable
- ✅ Use semantic HTML
- ✅ Organize styles by component
- ✅ Use ES6 modules
- ✅ Keep page templates in separate HTML files
- ✅ Use Bootstrap utilities for responsive design
- ✅ Test on mobile devices

## Troubleshooting

### Routes not working
- Ensure links have `data-route` attribute
- Check that routes are registered in `registerRoutes()`
- Check browser console for errors

### Styles not loading
- Verify CSS import paths in component `index.js`
- Check that Vite is running in development mode
- Clear browser cache

### Bootstrap not working
- Verify Bootstrap CDN is loaded in `index.html`
- Check Bootstrap JS bundle import

## Performance

The app is optimized for performance:
- Vite provides fast HMR (Hot Module Replacement)
- Code splitting for components
- Minimal dependencies
- CSS is scoped to components
- Bootstrap CSS loaded via CDN

## Future Enhancements

- [ ] Implement remaining calculator pages
- [ ] Add Supabase authentication
- [ ] Implement calculation history storage
- [ ] Add data export functionality
- [ ] Implement admin panel
- [ ] Add unit tests
- [ ] Add PWA capabilities
- [ ] Implement dark mode

## License

This project is private and for use only within the Money Calculators project.

## Support

For issues or questions, please contact the development team.
