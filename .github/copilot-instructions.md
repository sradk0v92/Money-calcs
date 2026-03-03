# Money calculators

Money calculators is calculating the investment return, loan interest, and mortgage payments, and comparing different financial products app built with JS and Supabase. User register / login , then calculate what they want based on our calculators, and save the calculation history in the database. User can also view their calculation history and delete it if they want. The app is responsive and works well on both desktop and mobile devices.

## Architecture and Tech Stack

Classical client-server app:
  -  Front-end: JS app, Bootstrap, HTML, CSS
  -  Back-end: Supabase
  -  Database: PostgreSQL
  -  Authentication: Supabase Auth
  -  Build tools: Vite, npm
  -  API: Supabase REST API 
  -  Hosting: Netlify 
  -  Source code: GitHub

## Modular Design

Use a modular code structure, with separate files for different components, pages and features. Use ES6 modules to organize the code.

## UI Guidelines
  -  Use HTML, CSS, Bootstrapand vanilla JS for the front-end development.
  -  Use Bootstrap components and utilities to create a responsive and user-friendly interface.
  -  Implement modern, responsive UI design.
  -  Use consistent color schemes and typography throughout the app.
  -  Use appropriate icons, effects and visual cues to enhance usability.

## Page and Navigation
  -  Split the app into multiple pages: login, registration, calculator, and history, admin panel, etc.
  -  Implement pages as reusable components (HTML, CSS, JS code).
  -  Use routing to navigate between pages. 
  -  Use full URLs like: /, /login, /register, /investmentcalculator, /emergencyfundcalculator, /loancalculator, /history, /admin, etc.

## Backend and Database
  -  Use Supabase as the backend services and database for the app.
  -  Use PostgreSQL as the database, with  tables for users, user information, calculation history, and other relevant data.
  -  Use Supabase Storage for file uploads (e.g. calculation history export).
  -  When changing the database schema, always use Migrations to keep track of changes.
  -  After applying a migration in Supabase, keep a copy of the migration SQL file in the code.

## Authentication and Authorization
  -  Use Supabase Auth for user authentication and authorization.
  -  Implement RLS policies to restrict access to data based on user roles and permissions.
  -  Implement user roles with a separate DB table 'user_roles' + enum 'roles' (e.g. admin, user).
  