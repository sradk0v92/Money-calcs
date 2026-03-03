import notFoundHTML from './not-found.html?raw';
import './not-found.css';

export const title = '404 - Page Not Found';

export async function render() {
  return notFoundHTML;
}

export async function init() {
  // No special initialization needed for 404 page
  console.log('404 Not Found page displayed');
}
