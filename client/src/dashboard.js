// Dashboard page functionality

import auth from './services/auth.js';
import themeManager from './services/theme.js';
import { Navigation } from './components/navigation.js';
import { DashboardComponent } from './components/dashboard.js';

document.addEventListener('DOMContentLoaded', async () => {
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
  
  // Initialize dashboard component
  const mainContent = document.querySelector('.main-content') || document.getElementById('app');
  if (mainContent) {
    const dashboard = new DashboardComponent();
    await dashboard.render(mainContent);
    dashboard.initEventListeners();
  }
});