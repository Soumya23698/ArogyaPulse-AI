/**
 * charts.js
 * Chart.js visualizer for Demand Forecasting, Bed Occupancy, and Federated Convergence
 */

let forecastChartInstance = null;
let federatedChartInstance = null;
let bedsChartInstance = null;

function renderForecastChart(canvasId, data) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  if (forecastChartInstance) {
    forecastChartInstance.destroy();
  }

  const labels = data.dates;
  const projectedStock = data.projected_stock;
  const upperBand = data.confidence_upper;
  const lowerBand = data.confidence_lower;
  const dailyDemand = data.forecast_daily_demand;

  forecastChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Projected Stock Decay',
          data: projectedStock,
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56, 189, 248, 0.1)',
          borderWidth: 3,
          tension: 0.3,
          fill: false,
          pointBackgroundColor: '#38bdf8',
          pointRadius: 4,
          pointHoverRadius: 6,
          yAxisID: 'y'
        },
        {
          label: '95% Confidence Upper Band',
          data: upperBand,
          borderColor: 'transparent',
          backgroundColor: 'rgba(56, 189, 248, 0.12)',
          fill: '+1',
          pointRadius: 0,
          tension: 0.3,
          yAxisID: 'y'
        },
        {
          label: '95% Confidence Lower Band',
          data: lowerBand,
          borderColor: 'transparent',
          backgroundColor: 'transparent',
          fill: false,
          pointRadius: 0,
          tension: 0.3,
          yAxisID: 'y'
        },
        {
          label: 'Daily Projected Consumption',
          data: dailyDemand,
          type: 'bar',
          backgroundColor: 'rgba(245, 158, 11, 0.35)',
          borderColor: '#f59e0b',
          borderWidth: 1,
          borderRadius: 4,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          labels: {
            color: '#334155',
            font: { family: 'Inter', size: 11, weight: 600 },
            filter: function(item) {
              return !item.text.includes('Confidence Lower');
            }
          }
        },
        tooltip: {
          backgroundColor: '#0f172a',
          titleColor: '#f8fafc',
          bodyColor: '#cbd5e1',
          borderColor: '#334155',
          borderWidth: 1,
          padding: 10
        }
      },
      scales: {
        x: {
          grid: { color: '#e2e8f0' },
          ticks: { color: '#475569', font: { family: 'Inter', size: 11 } }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          grid: { color: '#e2e8f0' },
          ticks: { color: '#0284c7', font: { family: 'Inter', size: 11, weight: 700 } },
          title: {
            display: true,
            text: 'Remaining Stock Units',
            color: '#0284c7',
            font: { weight: 700 }
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          grid: { drawOnChartArea: false },
          ticks: { color: '#d97706', font: { family: 'Inter', size: 11, weight: 700 } },
          title: {
            display: true,
            text: 'Daily Demand (Units/Day)',
            color: '#d97706',
            font: { weight: 700 }
          }
        }
      }
    }
  });
}

function renderFederatedConvergenceChart(canvasId, roundsHistory) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  if (federatedChartInstance) {
    federatedChartInstance.destroy();
  }

  const labels = roundsHistory.map(r => `Round ${r.round_number}`);
  const lossData = roundsHistory.map(r => r.global_loss);
  const accuracyData = roundsHistory.map(r => r.global_accuracy);

  federatedChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Global Test Loss (Cross-State)',
          data: lossData,
          borderColor: '#dc2626',
          backgroundColor: 'rgba(220, 38, 38, 0.08)',
          borderWidth: 3,
          tension: 0.3,
          yAxisID: 'y'
        },
        {
          label: 'Global Accuracy (%)',
          data: accuracyData,
          borderColor: '#059669',
          backgroundColor: 'rgba(5, 150, 105, 0.08)',
          borderWidth: 3,
          tension: 0.3,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#334155', font: { family: 'Inter', size: 11, weight: 600 } }
        }
      },
      scales: {
        x: {
          grid: { color: '#e2e8f0' },
          ticks: { color: '#475569', font: { family: 'Inter', size: 11 } }
        },
        y: {
          position: 'left',
          grid: { color: '#e2e8f0' },
          ticks: { color: '#dc2626', font: { weight: 700 } },
          title: { display: true, text: 'Loss', color: '#dc2626', font: { weight: 700 } }
        },
        y1: {
          position: 'right',
          grid: { drawOnChartArea: false },
          ticks: { color: '#059669', font: { weight: 700 } },
          title: { display: true, text: 'Accuracy (%)', color: '#059669', font: { weight: 700 } }
        }
      }
    }
  });
}

function renderBedsDonutChart(canvasId, summary) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  if (bedsChartInstance) {
    bedsChartInstance.destroy();
  }

  const occupied = summary.occupied_beds;
  const available = summary.available_beds;

  bedsChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Occupied Beds', 'Available Beds'],
      datasets: [{
        data: [occupied, available],
        backgroundColor: ['#d97706', '#059669'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#334155', font: { family: 'Inter', size: 11, weight: 600 } }
        }
      },
      cutout: '72%'
    }
  });
}
