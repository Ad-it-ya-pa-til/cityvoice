// Admin Dashboard JavaScript

// State Management
const state = {
  complaints: [],
  filteredComplaints: [],
  currentPage: 1,
  itemsPerPage: 10,
  currentComplaint: null,
  filters: {
    status: '',
    category: '',
    search: ''
  }
};

// Authentication
const storage = {
  get token() { return localStorage.getItem('cv_token'); },
  clear() { localStorage.removeItem('cv_token'); }
};

// Check authentication on page load
function checkAuth() {
  if (!storage.token) {
    window.location.href = '/auth.html';
    return false;
  }
  return true;
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  if (!checkAuth()) return;
  
  initializeEventListeners();
  loadComplaints();
  updateStats();
});

// Event Listeners
function initializeEventListeners() {
  // Sidebar toggle
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('admin-sidebar');
  sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });
  
  // Sidebar navigation
  const sidebarLinks = document.querySelectorAll('.sidebar-link');
  sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.dataset.page;
      switchPage(page);
      
      // Update active state
      sidebarLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      
      // Close sidebar on mobile
      if (window.innerWidth <= 768) {
        sidebar.classList.remove('open');
      }
    });
  });
  
  // Admin menu dropdown
  const adminMenuBtn = document.getElementById('admin-menu-btn');
  const adminDropdown = document.getElementById('admin-dropdown');
  adminMenuBtn.addEventListener('click', () => {
    adminDropdown.classList.toggle('open');
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.admin-user')) {
      adminDropdown.classList.remove('open');
    }
  });
  
  // Logout
  document.getElementById('logout-btn').addEventListener('click', () => {
    storage.clear();
    window.location.href = '/auth.html';
  });
  
  // Search
  document.getElementById('search-btn').addEventListener('click', handleSearch);
  document.getElementById('search-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
  });
  
  // Filters
  document.getElementById('status-filter').addEventListener('change', handleFilterChange);
  document.getElementById('category-filter').addEventListener('change', handleFilterChange);
  
  // Refresh button
  document.getElementById('refresh-btn').addEventListener('click', () => {
    loadComplaints();
    showToast('Refreshed!', 'success');
  });
  
  // Pagination
  document.getElementById('prev-page').addEventListener('click', () => {
    if (state.currentPage > 1) {
      state.currentPage--;
      renderTable();
    }
  });
  
  document.getElementById('next-page').addEventListener('click', () => {
    const totalPages = Math.ceil(state.filteredComplaints.length / state.itemsPerPage);
    if (state.currentPage < totalPages) {
      state.currentPage++;
      renderTable();
    }
  });
  
  // Modal
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-backdrop').addEventListener('click', closeModal);
  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  document.getElementById('modal-save').addEventListener('click', saveComplaint);
  document.getElementById('modal-delete').addEventListener('click', deleteComplaint);
}

// Page Switching
function switchPage(pageName) {
  const pages = document.querySelectorAll('.admin-page');
  pages.forEach(page => page.classList.remove('active'));
  
  const activePage = document.getElementById(`page-${pageName}`);
  if (activePage) {
    activePage.classList.add('active');
  }
  
  // Load data for specific pages
  if (pageName === 'complaints') {
    renderTable();
  }
}

// Load Complaints from API
async function loadComplaints() {
  try {
    const response = await fetch('/api/admin/complaints', {
      headers: {
        'Authorization': `Bearer ${storage.token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to load complaints');
    }
    
    state.complaints = await response.json();
    state.filteredComplaints = [...state.complaints];
    
    renderTable();
    updateStats();
    renderRecentComplaints();
    updateNotificationBadge();
  } catch (error) {
    console.error('Error loading complaints:', error);
    showToast('Failed to load complaints', 'error');
  }
}

// Update Dashboard Stats
function updateStats() {
  const total = state.complaints.length;
  const pending = state.complaints.filter(c => c.status === 'submitted').length;
  const inProgress = state.complaints.filter(c => c.status === 'in-progress').length;
  const resolved = state.complaints.filter(c => c.status === 'resolved').length;
  
  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-pending').textContent = pending;
  document.getElementById('stat-progress').textContent = inProgress;
  document.getElementById('stat-resolved').textContent = resolved;
}

// Update Notification Badge
function updateNotificationBadge() {
  const newComplaints = state.complaints.filter(c => c.status === 'submitted').length;
  const badge = document.getElementById('notification-badge');
  badge.textContent = newComplaints;
  badge.style.display = newComplaints > 0 ? 'block' : 'none';
}

// Render Recent Complaints on Dashboard
function renderRecentComplaints() {
  const container = document.getElementById('recent-complaints-list');
  const recent = state.complaints.slice(0, 5);
  
  if (recent.length === 0) {
    container.innerHTML = '<p class="no-data">No complaints yet</p>';
    return;
  }
  
  container.innerHTML = recent.map(complaint => `
    <div class="complaint-card" style="padding: 12px; border-bottom: 1px solid #e5e7eb; cursor: pointer;" onclick="viewComplaint('${complaint.complaintId}')">
      <div style="display: flex; justify-content: space-between; align-items: start;">
        <div>
          <span class="complaint-id">${complaint.complaintId}</span>
          <h4 style="margin: 4px 0; font-size: 14px;">${complaint.title}</h4>
          <p style="font-size: 12px; color: #6b7280; margin: 2px 0;">${formatDate(complaint.createdAt)}</p>
        </div>
        <span class="status-badge ${complaint.status}">${complaint.status}</span>
      </div>
    </div>
  `).join('');
}

// Handle Search
function handleSearch() {
  const searchTerm = document.getElementById('search-input').value.toLowerCase();
  state.filters.search = searchTerm;
  applyFilters();
}

// Handle Filter Change
function handleFilterChange() {
  state.filters.status = document.getElementById('status-filter').value;
  state.filters.category = document.getElementById('category-filter').value;
  applyFilters();
}

// Apply Filters
function applyFilters() {
  state.filteredComplaints = state.complaints.filter(complaint => {
    const matchesSearch = !state.filters.search || 
      complaint.complaintId.toLowerCase().includes(state.filters.search) ||
      complaint.title.toLowerCase().includes(state.filters.search) ||
      complaint.description.toLowerCase().includes(state.filters.search) ||
      (complaint.userId && complaint.userId.toLowerCase().includes(state.filters.search));
    
    const matchesStatus = !state.filters.status || complaint.status === state.filters.status;
    const matchesCategory = !state.filters.category || complaint.category === state.filters.category;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });
  
  state.currentPage = 1;
  renderTable();
}

// Render Complaints Table
function renderTable() {
  const tbody = document.getElementById('complaints-tbody');
  const noComplaints = document.getElementById('no-complaints');
  
  if (state.filteredComplaints.length === 0) {
    tbody.innerHTML = '';
    noComplaints.style.display = 'block';
    updatePagination();
    return;
  }
  
  noComplaints.style.display = 'none';
  
  const start = (state.currentPage - 1) * state.itemsPerPage;
  const end = start + state.itemsPerPage;
  const pageComplaints = state.filteredComplaints.slice(start, end);
  
  tbody.innerHTML = pageComplaints.map(complaint => `
    <tr>
      <td><span class="complaint-id">${complaint.complaintId}</span></td>
      <td>
        <div class="complaint-user">${complaint.userId || 'Unknown'}</div>
        <div class="complaint-email">${complaint.userId || 'N/A'}</div>
      </td>
      <td>${complaint.title}</td>
      <td><span style="text-transform: capitalize;">${complaint.category || 'General'}</span></td>
      <td>${complaint.location?.address || 'Not specified'}</td>
      <td><span class="status-badge ${complaint.status}">${complaint.status}</span></td>
      <td>${formatDate(complaint.createdAt)}</td>
      <td>
        <div class="action-buttons">
          <button class="action-btn view" onclick="viewComplaint('${complaint.complaintId}')">View</button>
          <button class="action-btn delete" onclick="confirmDelete('${complaint.complaintId}')">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
  
  updatePagination();
}

// Update Pagination
function updatePagination() {
  const totalPages = Math.ceil(state.filteredComplaints.length / state.itemsPerPage);
  
  document.getElementById('prev-page').disabled = state.currentPage === 1;
  document.getElementById('next-page').disabled = state.currentPage === totalPages || totalPages === 0;
  document.getElementById('pagination-info').textContent = `Page ${state.currentPage} of ${totalPages || 1}`;
}

// View Complaint (global function for onclick)
window.viewComplaint = async function(complaintId) {
  try {
    const response = await fetch(`/api/complaints/${complaintId}`, {
      headers: {
        'Authorization': `Bearer ${storage.token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to load complaint');
    }
    
    const complaint = await response.json();
    state.currentComplaint = complaint;
    
    // Populate modal
    document.getElementById('detail-id').textContent = complaint.complaintId;
    document.getElementById('detail-user').textContent = complaint.userId || 'Unknown';
    document.getElementById('detail-email').textContent = complaint.userId || 'N/A';
    document.getElementById('detail-title').textContent = complaint.title;
    document.getElementById('detail-description').textContent = complaint.description;
    document.getElementById('detail-category').textContent = complaint.category || 'General';
    document.getElementById('detail-location').textContent = complaint.location?.address || 'Not specified';
    document.getElementById('detail-status').value = complaint.status;
    document.getElementById('detail-date').textContent = formatDate(complaint.createdAt);
    
    // Show evidence if available
    const evidenceRow = document.getElementById('evidence-row');
    if (complaint.evidence) {
      document.getElementById('detail-evidence').src = complaint.evidence;
      evidenceRow.style.display = 'grid';
    } else {
      evidenceRow.style.display = 'none';
    }
    
    // Show modal
    document.getElementById('complaint-modal').classList.add('active');
  } catch (error) {
    console.error('Error viewing complaint:', error);
    showToast('Failed to load complaint details', 'error');
  }
};

// Save Complaint (Update Status)
async function saveComplaint() {
  if (!state.currentComplaint) return;
  
  const newStatus = document.getElementById('detail-status').value;
  
  try {
    const response = await fetch(`/api/complaints/${state.currentComplaint.complaintId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${storage.token}`
      },
      body: JSON.stringify({ status: newStatus })
    });
    
    if (!response.ok) {
      throw new Error('Failed to update complaint');
    }
    
    showToast('Complaint updated successfully!', 'success');
    closeModal();
    loadComplaints();
  } catch (error) {
    console.error('Error updating complaint:', error);
    showToast('Failed to update complaint', 'error');
  }
}

// Confirm Delete
window.confirmDelete = function(complaintId) {
  if (confirm('Are you sure you want to delete this complaint? This action cannot be undone.')) {
    deleteComplaintById(complaintId);
  }
};

// Delete Complaint from Modal
async function deleteComplaint() {
  if (!state.currentComplaint) return;
  
  if (confirm('Are you sure you want to delete this complaint?')) {
    await deleteComplaintById(state.currentComplaint.complaintId);
    closeModal();
  }
}

// Delete Complaint by ID
async function deleteComplaintById(complaintId) {
  try {
    const response = await fetch(`/api/admin/complaints/${complaintId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${storage.token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete complaint');
    }
    
    showToast('Complaint deleted successfully!', 'success');
    loadComplaints();
  } catch (error) {
    console.error('Error deleting complaint:', error);
    showToast('Failed to delete complaint', 'error');
  }
}

// Close Modal
function closeModal() {
  document.getElementById('complaint-modal').classList.remove('active');
  state.currentComplaint = null;
}

// Format Date
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    // Handle Firestore Timestamp
    if (dateString._seconds) {
      return new Date(dateString._seconds * 1000).toLocaleDateString();
    }
    return 'Invalid Date';
  }
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Show Toast Notification
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Close sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
  const sidebar = document.getElementById('admin-sidebar');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  
  if (window.innerWidth <= 768 && 
      !sidebar.contains(e.target) && 
      !sidebarToggle.contains(e.target) &&
      sidebar.classList.contains('open')) {
    sidebar.classList.remove('open');
  }
});
