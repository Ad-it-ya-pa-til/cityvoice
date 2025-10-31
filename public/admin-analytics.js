/**
 * ADMIN ANALYTICS DASHBOARD
 * Charts, Heatmap, and Data Visualization
 */

// Initialize when analytics page is viewed
function initializeAnalytics() {
  initializeCharts();
  initializeHeatmap();
  animateMetrics();
}

// Chart.js Configuration
Chart.defaults.color = '#cbd5e0';
Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)';
Chart.defaults.font.family = 'Inter, sans-serif';

// Status Distribution Chart (Doughnut)
let statusChart;
function initStatusChart() {
  const ctx = document.getElementById('statusChart');
  if (!ctx) return;
  
  if (statusChart) statusChart.destroy();
  
  statusChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Submitted', 'In Progress', 'Under Review', 'Resolved'],
      datasets: [{
        data: [42, 35, 18, 189],
        backgroundColor: [
          'rgba(100, 116, 139, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(16, 185, 129, 0.8)'
        ],
        borderColor: [
          '#64748b',
          '#3b82f6',
          '#f59e0b',
          '#10b981'
        ],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 15,
            usePointStyle: true,
            font: {
              size: 13,
              weight: '600'
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(10, 22, 40, 0.95)',
          padding: 12,
          titleFont: {
            size: 14,
            weight: 'bold'
          },
          bodyFont: {
            size: 13
          },
          borderColor: 'rgba(6, 214, 160, 0.5)',
          borderWidth: 1
        }
      }
    }
  });
}

// Category Distribution Chart (Bar)
let categoryChart;
function initCategoryChart() {
  const ctx = document.getElementById('categoryChart');
  if (!ctx) return;
  
  if (categoryChart) categoryChart.destroy();
  
  categoryChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Garbage', 'Potholes', 'Streetlights', 'Water', 'Other'],
      datasets: [{
        label: 'Number of Complaints',
        data: [89, 67, 54, 43, 31],
        backgroundColor: [
          'rgba(255, 107, 107, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(139, 92, 246, 0.8)'
        ],
        borderColor: [
          '#ff6b6b',
          '#f59e0b',
          '#fbbf24',
          '#3b82f6',
          '#8b5cf6'
        ],
        borderWidth: 2,
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(10, 22, 40, 0.95)',
          padding: 12,
          titleFont: {
            size: 14,
            weight: 'bold'
          },
          bodyFont: {
            size: 13
          },
          borderColor: 'rgba(6, 214, 160, 0.5)',
          borderWidth: 1
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(255, 255, 255, 0.05)'
          },
          ticks: {
            font: {
              size: 12,
              weight: '600'
            }
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              size: 12,
              weight: '600'
            }
          }
        }
      }
    }
  });
}

// Timeline Chart (Line)
let timelineChart;
function initTimelineChart() {
  const ctx = document.getElementById('timelineChart');
  if (!ctx) return;
  
  if (timelineChart) timelineChart.destroy();
  
  const labels = [];
  const data = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    data.push(Math.floor(Math.random() * 15) + 5);
  }
  
  timelineChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'New Complaints',
        data: data,
        borderColor: '#06d6a0',
        backgroundColor: 'rgba(6, 214, 160, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#06d6a0',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(10, 22, 40, 0.95)',
          padding: 12,
          titleFont: {
            size: 14,
            weight: 'bold'
          },
          bodyFont: {
            size: 13
          },
          borderColor: 'rgba(6, 214, 160, 0.5)',
          borderWidth: 1
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(255, 255, 255, 0.05)'
          },
          ticks: {
            font: {
              size: 12,
              weight: '600'
            }
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              size: 11,
              weight: '600'
            },
            maxRotation: 0,
            maxTicksLimit: 10
          }
        }
      }
    }
  });
}

// Initialize all charts
function initializeCharts() {
  setTimeout(() => {
    initStatusChart();
    initCategoryChart();
    initTimelineChart();
  }, 100);
}

// Initialize Heatmap
let heatmapInstance;
function initializeHeatmap() {
  const container = document.getElementById('heatmap');
  if (!container) return;
  
  // Create map
  heatmapInstance = L.map('heatmap', {
    zoomControl: true,
    scrollWheelZoom: true
  }).setView([28.6139, 77.2090], 12);
  
  // Dark tile layer
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(heatmapInstance);
  
  // Generate heatmap data
  const heatData = generateHeatmapData();
  
  // Add heatmap layer
  const heat = L.heatLayer(heatData, {
    radius: 25,
    blur: 35,
    maxZoom: 13,
    max: 1.0,
    gradient: {
      0.0: '#0066ff',
      0.5: '#00ff00',
      0.75: '#ffff00',
      1.0: '#ff0000'
    }
  }).addTo(heatmapInstance);
  
  // Heatmap intensity controls
  document.querySelectorAll('.heatmap-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.heatmap-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const intensity = btn.dataset.intensity;
      let radius, blur;
      
      switch(intensity) {
        case 'low':
          radius = 15;
          blur = 20;
          break;
        case 'medium':
          radius = 25;
          blur = 35;
          break;
        case 'high':
          radius = 35;
          blur = 50;
          break;
      }
      
      heat.setOptions({ radius, blur });
    });
  });
}

// Generate sample heatmap data
function generateHeatmapData() {
  const centerLat = 28.6139;
  const centerLng = 77.2090;
  const data = [];
  
  // Create some hotspots
  const hotspots = [
    { lat: 28.6139, lng: 77.2090, intensity: 1.0 },
    { lat: 28.6239, lng: 77.2190, intensity: 0.8 },
    { lat: 28.6039, lng: 77.1990, intensity: 0.9 },
    { lat: 28.6339, lng: 77.2290, intensity: 0.7 },
    { lat: 28.6189, lng: 77.2140, intensity: 0.85 },
    { lat: 28.6089, lng: 77.2040, intensity: 0.75 },
    { lat: 28.6289, lng: 77.2240, intensity: 0.95 },
    { lat: 28.6139, lng: 77.2340, intensity: 0.65 }
  ];
  
  // Add points around hotspots
  hotspots.forEach(hotspot => {
    for (let i = 0; i < 50; i++) {
      const lat = hotspot.lat + (Math.random() - 0.5) * 0.02;
      const lng = hotspot.lng + (Math.random() - 0.5) * 0.02;
      const intensity = hotspot.intensity * (0.5 + Math.random() * 0.5);
      data.push([lat, lng, intensity]);
    }
  });
  
  return data;
}

// Animate metrics on load
function animateMetrics() {
  const metrics = [
    { id: 'avg-resolution-time', target: 4.2, decimals: 1 },
    { id: 'resolution-rate', target: 76, decimals: 0 },
    { id: 'active-users', target: 1243, decimals: 0 },
    { id: 'hotspots', target: 8, decimals: 0 }
  ];
  
  metrics.forEach(metric => {
    const el = document.getElementById(metric.id);
    if (!el) return;
    
    const duration = 2000;
    const steps = 60;
    const increment = metric.target / steps;
    let current = 0;
    let step = 0;
    
    const timer = setInterval(() => {
      current += increment;
      step++;
      
      if (step >= steps) {
        el.textContent = metric.decimals > 0 
          ? metric.target.toFixed(metric.decimals)
          : metric.target.toLocaleString();
        clearInterval(timer);
      } else {
        el.textContent = metric.decimals > 0
          ? current.toFixed(metric.decimals)
          : Math.floor(current).toLocaleString();
      }
    }, duration / steps);
  });
}

// Export for use in admin.js
window.initializeAnalytics = initializeAnalytics;
