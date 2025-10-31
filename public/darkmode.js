// Global Dark Mode Manager for CityVoice
(function() {
  'use strict';
  
  // Apply saved theme immediately (before page renders to prevent flash)
  const savedTheme = localStorage.getItem('cv_theme');
  if (savedTheme === 'dark') {
    document.documentElement.dataset.theme = 'dark';
  }
  
  // Initialize dark mode toggle when DOM is ready
  function initDarkMode() {
    const darkModeBtn = document.getElementById('drop-darkmode');
    
    if (!darkModeBtn) {
      console.log('Dark mode button not found on this page');
      return;
    }
    
    // Set initial button text based on current theme
    const currentTheme = document.documentElement.dataset.theme;
    darkModeBtn.textContent = currentTheme === 'dark' ? 'Light Mode' : 'Dark Mode';
    
    // Add click event listener
    darkModeBtn.addEventListener('click', function() {
      const currentTheme = document.documentElement.dataset.theme;
      const newTheme = currentTheme === 'dark' ? '' : 'dark';
      
      // Apply theme
      document.documentElement.dataset.theme = newTheme;
      
      // Save to localStorage
      localStorage.setItem('cv_theme', newTheme || 'light');
      
      // Update button text
      darkModeBtn.textContent = newTheme === 'dark' ? 'Light Mode' : 'Dark Mode';
      
      // Close dropdown if it exists
      const dropdown = document.getElementById('dropdown-user');
      if (dropdown) {
        dropdown.classList.remove('open');
        dropdown.setAttribute('aria-hidden', 'true');
      }
      
      console.log('Theme changed to:', newTheme || 'light');
    });
  }
  
  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDarkMode);
  } else {
    initDarkMode();
  }
})();
