/**
 * Settings Page Handler
 * Manages settings forms and API interactions
 */

import auth from '../services/auth.js';
import api from '../services/api.js';
import { Navigation } from '../components/navigation.js';

document.addEventListener('DOMContentLoaded', () => {
  // Check if user is authenticated
  if (!auth.isAuthenticated()) {
    // Redirect to login page if not authenticated
    window.location.href = '/';
    return;
  }

  // Initialize navigation
  Navigation.init('app');

  // Initialize event listeners
  initializeEventListeners();
});

/**
 * Initialize event listeners
 */
function initializeEventListeners() {
  // Get form elements
  const passwordForm = document.getElementById('password-form');
  const saveApiKeyButtons = document.querySelectorAll('.save-api-key-btn');
  const saveEnvConfigButtons = document.querySelectorAll('.save-env-config-btn');
  const testConnectionButtons = document.querySelectorAll('.test-connection-btn');
  
  // Password form submission
  if (passwordForm) {
    passwordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const currentPassword = document.getElementById('current-password').value.trim();
      const newPassword = document.getElementById('new-password').value.trim();
      const confirmPassword = document.getElementById('confirm-password').value.trim();
      
      // Validate passwords match
      if (!currentPassword || !newPassword) {
        showNotification('error', 'All password fields are required');
        return;
      }
      
      if (newPassword !== confirmPassword) {
        showNotification('error', 'New passwords do not match');
        return;
      }
      
      try {
        const response = await api.put('/settings/password', { 
          currentPassword, 
          newPassword 
        });
        
        if (response && response.success) {
          showNotification('success', 'Password updated successfully');
          passwordForm.reset();
        } else {
          showNotification('error', response.message || 'Failed to update password');
        }
      } catch (error) {
        showNotification('error', error.message || 'An error occurred');
      }
    });
  }
  
  // API key save buttons
  if (saveApiKeyButtons) {
    saveApiKeyButtons.forEach(button => {
      button.addEventListener('click', async () => {
        const service = button.dataset.service;
        const inputId = service === 'cloudCommander' ? 'cloud-commander-key' : `${service}-key`;
        const apiKey = document.getElementById(inputId).value.trim();
        
        if (!apiKey) {
          showNotification('error', 'API key cannot be empty');
          return;
        }
        
        button.disabled = true;
        button.textContent = 'Saving...';
        
        try {
          const response = await api.put('/settings/api-keys', { 
            [service]: apiKey 
          });
          
          if (response && response.success) {
            showNotification('success', `${service} API key saved successfully`);
          } else {
            showNotification('error', `Failed to save ${service} API key: ${response.message || 'Unknown error'}`);
          }
        } catch (error) {
          showNotification('error', `Error saving ${service} API key: ${error.message}`);
        } finally {
          button.disabled = false;
          button.textContent = 'Save';
        }
      });
    });
  }
  
  // Environment config save buttons
  if (saveEnvConfigButtons) {
    saveEnvConfigButtons.forEach(button => {
      button.addEventListener('click', async () => {
        const configType = button.dataset.config;
        let configValue;
        
        if (configType === 'serverPort') {
          configValue = document.getElementById('server-port').value.trim();
          if (!configValue || isNaN(configValue) || configValue < 1 || configValue > 65535) {
            showNotification('error', 'Please enter a valid port number (1-65535)');
            return;
          }
        } else if (configType === 'dbPath') {
          configValue = document.getElementById('db-path').value.trim();
          if (!configValue) {
            showNotification('error', 'Database path cannot be empty');
            return;
          }
        }
        
        button.disabled = true;
        button.textContent = 'Saving...';
        
        try {
          const response = await api.put('/settings/env-config', { 
            [configType]: configValue 
          });
          
          if (response && response.success) {
            showNotification('success', `${configType} updated successfully`);
          } else {
            showNotification('error', `Failed to update ${configType}: ${response.message || 'Unknown error'}`);
          }
        } catch (error) {
          showNotification('error', `Error updating ${configType}: ${error.message}`);
        } finally {
          button.disabled = false;
          button.textContent = 'Save';
        }
      });
    });
  }
  
  // Test connection buttons
  if (testConnectionButtons) {
    testConnectionButtons.forEach(button => {
      button.addEventListener('click', async () => {
        const service = button.dataset.service;
        button.disabled = true;
        button.textContent = 'Testing...';
        
        try {
          const response = await api.get(`/settings/test-connection/${service}`);
          
          if (response && response.success) {
            showNotification('success', response.message || `Successfully connected to ${service}`);
          } else {
            showNotification('error', response.message || `Failed to connect to ${service}`);
          }
        } catch (error) {
          showNotification('error', error.message || 'Connection test failed');
        } finally {
          button.disabled = false;
          button.textContent = 'Test Connection';
        }
      });
    });
  }
  
  // Load existing API keys
  loadApiKeys();
  
  // Load environment configuration
  loadEnvironmentConfig();
}

/**
 * Load API keys from server
 */
function loadApiKeys() {
  api.get('/settings/api-keys')
    .then(response => {
      if (response && response.success) {
        const keys = response.data;
        
        if (keys.tmdb) document.getElementById('tmdb-key').value = keys.tmdb;
        if (keys.watchmode) document.getElementById('watchmode-key').value = keys.watchmode;
        if (keys.jackett) document.getElementById('jackett-key').value = keys.jackett;
        if (keys.jellyfin) document.getElementById('jellyfin-key').value = keys.jellyfin;
        if (keys.cloudCommander) document.getElementById('cloud-commander-key').value = keys.cloudCommander;
      }
    })
    .catch(error => {
      console.error('Failed to load API keys:', error);
    });
}

/**
 * Load environment configuration from server
 */
function loadEnvironmentConfig() {
  api.get('/settings/env-config')
    .then(response => {
      if (response && response.success) {
        const config = response.data;
        
        if (config.serverPort) document.getElementById('server-port').value = config.serverPort;
        if (config.dbPath) document.getElementById('db-path').value = config.dbPath;
      }
    })
    .catch(error => {
      console.error('Failed to load environment configuration:', error);
    });
}

/**
 * Show notification
 * @param {string} type - Notification type (success, error)
 * @param {string} message - Notification message
 */
function showNotification(type, message) {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Remove notification after 3 seconds
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 500);
  }, 3000);
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
// This closing bracket appears to be orphaned and should be removed
