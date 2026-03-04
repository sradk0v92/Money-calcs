/**
 * Comparison Chart Renderer
 * Renders a line chart comparing two calculations using Chart.js.
 * Handles chart lifecycle (destroy previous chart before creating new one).
 */

import { Chart, registerables } from 'chart.js/auto';

Chart.register(...registerables);

let comparisonChart = null;

/**
 * Render a comparison chart with two datasets
 * @param {string} canvasElementId - ID of the canvas element to render into
 * @param {string} label1 - Label for first dataset (calculation title or date)
 * @param {string} label2 - Label for second dataset (calculation title or date)
 * @param {array} dataA - Array of values for first calculation
 * @param {array} dataB - Array of values for second calculation
 * @param {string} xAxisLabel - Label for x-axis (e.g., "Year", "Month")
 * @param {string} yAxisLabel - Label for y-axis (e.g., "Balance", "Amount")
 * @param {object} options - Optional Chart.js configuration overrides
 * @returns {void}
 */
export function renderComparisonChart(
  canvasElementId,
  label1,
  label2,
  dataA,
  dataB,
  xAxisLabel = 'Period',
  yAxisLabel = 'Value',
  options = {}
) {
  const canvas = document.getElementById(canvasElementId);
  if (!canvas) return;

  // Destroy previous chart if it exists
  if (comparisonChart) {
    comparisonChart.destroy();
    comparisonChart = null;
  }

  // Validate data arrays
  if (!Array.isArray(dataA) || !Array.isArray(dataB)) {
    console.warn('Invalid data arrays for comparison chart');
    return;
  }

  // Ensure arrays have the same length (pad with null if needed)
  const maxLength = Math.max(dataA.length, dataB.length);
  const paddedA = [...dataA, ...Array(Math.max(0, maxLength - dataA.length)).fill(null)];
  const paddedB = [...dataB, ...Array(Math.max(0, maxLength - dataB.length)).fill(null)];

  // Create labels (0, 1, 2, ... or Year 1, Year 2, etc.)
  const labels = Array.from({ length: maxLength }, (_, i) => i + 1);

  // Default chart config
  const config = {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: label1,
          data: paddedA,
          borderColor: '#0d6efd',
          backgroundColor: 'rgba(13, 110, 253, 0.1)',
          tension: 0.1,
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: '#0d6efd',
          pointBorderColor: '#fff',
          pointBorderWidth: 1,
        },
        {
          label: label2,
          data: paddedB,
          borderColor: '#198754',
          backgroundColor: 'rgba(25, 135, 84, 0.1)',
          tension: 0.1,
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: '#198754',
          pointBorderColor: '#fff',
          pointBorderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
        },
        title: {
          display: false,
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: xAxisLabel,
          },
        },
        y: {
          title: {
            display: true,
            text: yAxisLabel,
          },
          beginAtZero: true,
        },
      },
      ...options,
    },
  };

  // Create chart
  comparisonChart = new Chart(canvas, config);
}

/**
 * Destroy the comparison chart (cleanup)
 * @returns {void}
 */
export function destroyComparisonChart() {
  if (comparisonChart) {
    comparisonChart.destroy();
    comparisonChart = null;
  }
}
