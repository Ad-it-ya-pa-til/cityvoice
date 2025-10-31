/**
 * PUBLIC COMPLAINT MAP - Interactive Features
 * Includes upvoting, filtering, search, and animations
 */

// Initialize map
const map = L.map('map', {
  zoomControl: true,
  scrollWheelZoom: true
}).setView([28.6139, 77.2090], 12); // Default: New Delhi

// Custom tile layer with dark theme
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  subdomains: 'abcd',
  maxZoom: 19
}).addTo(map);

// Sample complaint data (in production, fetch from API)
const complaints = [
  {
    id: 1,
    title: 'Overflowing Garbage Bin',
    category: 'garbage',
    description: 'Large garbage bin overflowing for 3 days near the market',
    location: [28.6139, 77.2090],
    status: 'submitted',
    upvotes: 23,
    date: '2025-01-28',
    icon: '🗑️'
  },
  {
    id: 2,
    title: 'Deep Pothole on Main Road',
    category: 'pothole',
    description: 'Dangerous pothole causing accidents',
    location: [28.6239, 77.2190],
    status: 'in-progress',
    upvotes: 45,
    date: '2025-01-25',
    icon: '🕳️'
  },
  {
    id: 3,
    title: 'Broken Street Light',
    category: 'streetlight',
    description: 'Street light not working for 2 weeks',
    location: [28.6039, 77.1990],
    status: 'submitted',
    upvotes: 12,
    date: '2025-01-27',
    icon: '💡'
  },
  {
    id: 4,
    title: 'Water Leakage',
    category: 'water',
    description: 'Continuous water leakage from main pipe',
    location: [28.6339, 77.2290],
    status: 'resolved',
    upvotes: 67,
    date: '2025-01-20',
    icon: '💧'
  },
  {
    id: 5,
    title: 'Illegal Dumping Site',
    category: 'garbage',
    description: 'People dumping waste in empty plot',
    location: [28.6189, 77.2140],
    status: 'submitted',
    upvotes: 34,
    date: '2025-01-26',
    icon: '🗑️'
  },
  {
    id: 6,
    title: 'Multiple Potholes',
    category: 'pothole',
    description: 'Series of potholes making road dangerous',
    location: [28.6089, 77.2040],
    status: 'in-progress',
    upvotes: 56,
    date: '2025-01-24',
    icon: '🕳️'
  },
  {
    id: 7,
    title: 'No Water Supply',
    category: 'water',
    description: 'No water supply for 48 hours',
    location: [28.6289, 77.2240],
    status: 'submitted',
    upvotes: 89,
    date: '2025-01-28',
    icon: '💧'
  },
  {
    id: 8,
    title: 'Street Lights Out',
    category: 'streetlight',
    description: 'Entire street has no lighting at night',
    location: [28.6139, 77.2340],
    status: 'in-progress',
    upvotes: 41,
    date: '2025-01-26',
    icon: '💡'
  }
];

// Store markers
let markers = [];
let currentFilter = 'all';
let userUpvotes = JSON.parse(localStorage.getItem('cv_upvotes') || '[]');

// Category colors
const categoryClasses = {
  garbage: 'marker-garbage',
  pothole: 'marker-pothole',
  streetlight: 'marker-streetlight',
  water: 'marker-water',
  other: 'marker-other'
};

// Status labels
const statusLabels = {
  submitted: 'Submitted',
  'in-progress': 'In Progress',
  resolved: 'Resolved'
};

// Create custom marker icon
function createMarkerIcon(category, icon) {
  return L.divIcon({
    className: 'custom-icon',
    html: `<div class="custom-marker ${categoryClasses[category]}">${icon}</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });
}

// Create popup content
function createPopup(complaint) {
  const hasUpvoted = userUpvotes.includes(complaint.id);
  const statusClass = `status-${complaint.status}`;
  
  return `
    <div class="popup-card">
      <div class="popup-header">
        <span class="popup-category">${complaint.category}</span>
        <span class="popup-status ${statusClass}">${statusLabels[complaint.status]}</span>
      </div>
      <h3 class="popup-title">${complaint.title}</h3>
      <p class="popup-desc">${complaint.description}</p>
      <div class="popup-meta">
        <span><i class="fas fa-calendar"></i> ${formatDate(complaint.date)}</span>
        <span><i class="fas fa-map-marker-alt"></i> ID: CV-${String(complaint.id).padStart(3, '0')}</span>
      </div>
      <div class="popup-actions">
        <button class="popup-btn ${hasUpvoted ? 'popup-btn-primary' : ''}" onclick="upvoteComplaint(${complaint.id})">
          <i class="fas fa-thumbs-up"></i>
          <span class="upvote-count">${complaint.upvotes}</span>
        </button>
        <button class="popup-btn" onclick="viewDetails(${complaint.id})">
          <i class="fas fa-eye"></i> View
        </button>
        <button class="popup-btn" onclick="shareComplaint(${complaint.id})">
          <i class="fas fa-share"></i>
        </button>
      </div>
    </div>
  `;
}

// Add markers to map
function addMarkers(filter = 'all') {
  // Clear existing markers
  markers.forEach(marker => map.removeLayer(marker));
  markers = [];
  
  // Filter complaints
  const filtered = filter === 'all' 
    ? complaints 
    : complaints.filter(c => c.category === filter);
  
  // Add new markers with animation delay
  filtered.forEach((complaint, index) => {
    setTimeout(() => {
      const marker = L.marker(complaint.location, {
        icon: createMarkerIcon(complaint.category, complaint.icon)
      });
      
      marker.bindPopup(createPopup(complaint), {
        maxWidth: 320,
        className: 'custom-popup'
      });
      
      marker.addTo(map);
      markers.push(marker);
      
      // Add bounce animation on hover
      marker.on('mouseover', function() {
        this.getElement().style.animation = 'bounce 0.6s ease';
      });
      
      marker.on('mouseout', function() {
        this.getElement().style.animation = '';
      });
    }, index * 50); // Stagger animation
  });
  
  // Fit bounds to show all markers
  if (filtered.length > 0) {
    const group = new L.featureGroup(markers);
    map.fitBounds(group.getBounds().pad(0.1));
  }
}

// Upvote complaint
function upvoteComplaint(id) {
  const complaint = complaints.find(c => c.id === id);
  if (!complaint) return;
  
  const hasUpvoted = userUpvotes.includes(id);
  
  if (hasUpvoted) {
    // Remove upvote
    userUpvotes = userUpvotes.filter(uid => uid !== id);
    complaint.upvotes--;
    showToast('Upvote removed', 'info');
  } else {
    // Add upvote
    userUpvotes.push(id);
    complaint.upvotes++;
    showToast('👍 Upvoted! Helping prioritize this issue.', 'success');
  }
  
  // Save to localStorage
  localStorage.setItem('cv_upvotes', JSON.stringify(userUpvotes));
  
  // Refresh markers
  addMarkers(currentFilter);
}

// View complaint details
function viewDetails(id) {
  window.location.href = `/complaint_detail.html?id=${id}`;
}

// Share complaint
function shareComplaint(id) {
  const url = `${window.location.origin}/complaint_detail.html?id=${id}`;
  
  if (navigator.share) {
    navigator.share({
      title: 'CityVoice Complaint',
      text: 'Check out this civic issue that needs attention',
      url: url
    }).catch(() => {});
  } else {
    navigator.clipboard.writeText(url);
    showToast('📋 Link copied to clipboard!', 'success');
  }
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  return date.toLocaleDateString();
}

// Show toast notification
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    // Update active state
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Get filter value
    currentFilter = btn.dataset.filter;
    
    // Apply filter
    addMarkers(currentFilter);
  });
});

// Search functionality
const searchInput = document.getElementById('map-search');
let searchTimeout;

searchInput.addEventListener('input', (e) => {
  clearTimeout(searchTimeout);
  
  searchTimeout = setTimeout(() => {
    const query = e.target.value.toLowerCase().trim();
    
    if (!query) {
      addMarkers(currentFilter);
      return;
    }
    
    // Filter by search query
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    
    const filtered = complaints.filter(c => {
      if (currentFilter !== 'all' && c.category !== currentFilter) return false;
      return c.title.toLowerCase().includes(query) || 
             c.description.toLowerCase().includes(query);
    });
    
    filtered.forEach((complaint, index) => {
      setTimeout(() => {
        const marker = L.marker(complaint.location, {
          icon: createMarkerIcon(complaint.category, complaint.icon)
        });
        marker.bindPopup(createPopup(complaint), {
          maxWidth: 320,
          className: 'custom-popup'
        });
        marker.addTo(map);
        markers.push(marker);
      }, index * 50);
    });
    
    if (filtered.length > 0) {
      const group = new L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.1));
    }
  }, 300);
});

// Initialize map with markers
addMarkers();

// Counter animation for stats
document.querySelectorAll('[data-counter]').forEach(el => {
  const target = parseInt(el.dataset.counter);
  const duration = 2000;
  const step = target / (duration / 16);
  let current = 0;
  
  const timer = setInterval(() => {
    current += step;
    if (current >= target) {
      el.textContent = target;
      clearInterval(timer);
    } else {
      el.textContent = Math.floor(current);
    }
  }, 16);
});

// Add CSS for toast slideOut animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideOut {
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
`;
document.head.appendChild(style);
