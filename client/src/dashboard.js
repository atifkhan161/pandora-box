// Dashboard page functionality

import auth from './services/auth.js';
import { Navigation } from './components/navigation.js';

document.addEventListener('DOMContentLoaded', () => {
  // Check if user is authenticated
  if (!auth.isAuthenticated()) {
    // Redirect to login page if not authenticated
    window.location.href = '/';
    return;
  }

  // Initialize navigation
  Navigation.init('app');
});