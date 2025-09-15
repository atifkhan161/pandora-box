// Dashboard page functionality

import auth from './services/auth.js';

document.addEventListener('DOMContentLoaded', () => {
  // Check if user is authenticated
  if (!auth.isAuthenticated()) {
    // Redirect to login page if not authenticated
    window.location.href = '/';
    return;
  }

  // Get user data
  const user = auth.getUser();
  
  // Handle logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      auth.logout();
    });
  }
});