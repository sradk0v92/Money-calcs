import indexHTML from './index.html?raw';
import './index.css';

export const title = 'Home';

export async function render() {
  return indexHTML;
}

export async function init() {
  // Initialize any interactive elements for the index page
  console.log('Index page initialized');
}
