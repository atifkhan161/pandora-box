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
 * Load libraries from Jellyfin
 */
async function loadLibraries() {
  const container = document.getElementById('libraries-container');
  if (!container) return;

  container.innerHTML = '<div class="loading-message">Loading libraries...</div>';

  try {
    const response = await api.get('/jellyfin/libraries');
    
    if (response && response.success && response.data) {
      displayLibraries(response.data);
    } else {
      container.innerHTML = '<div class="error-message">Failed to load libraries. Please check your Jellyfin configuration.</div>';
    }
  } catch (error) {
    container.innerHTML = '<div class="error-message">Error loading libraries. Please try again.</div>';
  }
}

/**
 * Display libraries in the UI
 * @param {Array} libraries - Array of library objects
 */
function displayLibraries(libraries) {
  const container = document.getElementById('libraries-container');
  if (!container) return;

  if (!libraries || libraries.length === 0) {
    container.innerHTML = '<div class="no-libraries">No libraries found.</div>';
    return;
  }

  const librariesHtml = libraries.map(library => `
    <div class="library-item">
      <div class="library-info">
        <h3>${library.Name}</h3>
        <p class="library-type">${library.CollectionType || 'Mixed Content'}</p>
        <p class="library-locations">${library.Locations ? library.Locations.join(', ') : 'No locations'}</p>
      </div>
      <div class="library-actions">
        <button class="btn btn-primary update-library-btn" data-id="${library.ItemId}">
          Update Library
        </button>
      </div>
    </div>
  `).join('');

  container.innerHTML = librariesHtml;

  // Add event listeners to update buttons
  container.querySelectorAll('.update-library-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const libraryId = e.target.dataset.id;
      const originalText = e.target.textContent;
      
      e.target.disabled = true;
      e.target.textContent = 'Updating...';
      
      try {
        const response = await api.post(`/jellyfin/update-library/${libraryId}`);
        
        if (response && response.success) {
          showNotification('success', response.message || 'Library update initiated');
        } else {
          showNotification('error', response.message || 'Failed to update library');
        }
      } catch (error) {
        showNotification('error', error.message || 'Library update failed');
      } finally {
        e.target.disabled = false;
        e.target.textContent = originalText;
      }
    });
  });
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