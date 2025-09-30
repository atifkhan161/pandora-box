/**
 * Jellyfin Page Handler
 * Manages Jellyfin library operations
 */

import auth from '../services/auth.js';
import api from '../services/api.js';
import { Navigation } from '../components/navigation.js';
import themeManager from '../services/theme.js';

document.addEventListener('DOMContentLoaded', () => {
  // Check if user is authenticated
  if (!auth.isAuthenticated()) {
    window.location.href = '/';
    return;
  }

  // Initialize theme manager
  themeManager.init();
  
  // Initialize navigation
  Navigation.init('app');

  // Initialize event listeners
  initializeEventListeners();
});

/**
 * Initialize event listeners
 */
function initializeEventListeners() {
  const updateAllBtn = document.getElementById('update-all-btn');
  const refreshLibrariesBtn = document.getElementById('refresh-libraries-btn');

  if (updateAllBtn) {
    updateAllBtn.addEventListener('click', async () => {
      updateAllBtn.disabled = true;
      updateAllBtn.textContent = 'Updating...';
      
      try {
        const response = await api.post('/jellyfin/update-library');
        
        if (response && response.success) {
          showNotification('success', response.message || 'All libraries update initiated');
        } else {
          showNotification('error', response.message || 'Failed to update libraries');
        }
      } catch (error) {
        showNotification('error', error.message || 'Library update failed');
      } finally {
        updateAllBtn.disabled = false;
        updateAllBtn.textContent = 'Update All Libraries';
      }
    });
  }

  if (refreshLibrariesBtn) {
    refreshLibrariesBtn.addEventListener('click', loadLibraries);
  }

  // Load libraries on page load
  loadLibraries();
}

/**
 * Show notification
 * @param {string} type - Notification type ('success' or 'error')
 * @param {string} message - Notification message
 */
function showNotification(type, message) {
  const notificationContainer = document.getElementById('notification-container');
  if (!notificationContainer) return;
  
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  notificationContainer.appendChild(notification);
  
  // Auto-remove notification after 5 seconds
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => {
      notificationContainer.removeChild(notification);
    }, 500);
  }, 5000);
}