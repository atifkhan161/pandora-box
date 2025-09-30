// Search page functionality

import auth from './services/auth.js';
import themeManager from './services/theme.js';
import { Navigation } from './components/navigation.js';
import { SearchComponent } from './components/search.js';

document.addEventListener('DOMContentLoaded', () => {
  // Check if user is authenticated
  if (!auth.isAuthenticated()) {
    // Redirect to login page if not authenticated
    window.location.href = '/';
    return;
  }

  // Initialize theme manager
  themeManager.init();
  
  // Initialize navigation
  Navigation.init('app');
  
  // Initialize search component
  const mainContent = document.querySelector('.main-content') || document.getElementById('app');
  if (mainContent) {
    const search = new SearchComponent();
    search.render(mainContent);
  }
});