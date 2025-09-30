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
  const saveQbittorrentButtons = document.querySelectorAll('.save-qbittorrent-btn');
  const testQbittorrentButton = document.querySelector('.test-qbittorrent-btn');
  const saveJackettButton = document.querySelector('.save-jackett-btn');
  const testJackettButton = document.querySelector('.test-jackett-btn');
  const saveFilebrowserButton = document.querySelector('.save-filebrowser-btn');
  const testFilebrowserButton = document.querySelector('.test-filebrowser-btn');
  
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
        console.log('Save API Key button clicked for service:', button.dataset.service); // Added console.log
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
        console.log('Test Connection button clicked for service:', button.dataset.service); // Added console.log
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
  
  // qBittorrent save button
  if (saveQbittorrentButtons.length > 0) {
    const saveButton = saveQbittorrentButtons[0];
    saveButton.addEventListener('click', async () => {
      const url = document.getElementById('qbittorrent-url').value.trim();
      const username = document.getElementById('qbittorrent-username').value.trim();
      const password = document.getElementById('qbittorrent-password').value.trim();
      
      if (!url || !username || !password) {
        showNotification('error', 'All fields are required');
        return;
      }
      
      if (!url.match(/^https?:\/\/.+/)) {
        showNotification('error', 'Please enter a valid URL (e.g., http://192.168.1.100:8080)');
        return;
      }
      
      saveButton.disabled = true;
      saveButton.textContent = 'Saving...';
      
      try {
        const response = await api.put('/settings/qbittorrent', { 
          url, username, password
        });
        
        if (response && response.success) {
          showNotification('success', 'qBittorrent configuration saved successfully');
        } else {
          showNotification('error', `Failed to save qBittorrent configuration: ${response.message || 'Unknown error'}`);
        }
      } catch (error) {
        showNotification('error', `Error saving qBittorrent configuration: ${error.message}`);
      } finally {
        saveButton.disabled = false;
        saveButton.textContent = 'Save';
      }
    });
  }
  
  // qBittorrent test connection button
  if (testQbittorrentButton) {
    testQbittorrentButton.addEventListener('click', async () => {
      testQbittorrentButton.disabled = true;
      testQbittorrentButton.textContent = 'Testing...';
      
      try {
        const response = await api.get('/settings/test-connection/qbittorrent');
        
        if (response && response.success) {
          showNotification('success', response.message || 'Successfully connected to qBittorrent');
        } else {
          showNotification('error', response.message || 'Failed to connect to qBittorrent');
        }
      } catch (error) {
        showNotification('error', error.message || 'qBittorrent connection test failed');
      } finally {
        testQbittorrentButton.disabled = false;
        testQbittorrentButton.textContent = 'Test Connection';
      }
    });
  }
  
  // Load qBittorrent configuration
  loadQbittorrentConfig();
  
  // Jackett save button
  if (saveJackettButton) {
    saveJackettButton.addEventListener('click', async () => {
      const url = document.getElementById('jackett-url').value.trim();
      const apiKey = document.getElementById('jackett-api-key').value.trim();
      
      if (!url || !apiKey) {
        showNotification('error', 'All fields are required');
        return;
      }
      
      if (!url.match(/^https?:\/\/.+/)) {
        showNotification('error', 'Please enter a valid URL (e.g., http://192.168.1.100:9117)');
        return;
      }
      
      saveJackettButton.disabled = true;
      saveJackettButton.textContent = 'Saving...';
      
      try {
        const response = await api.put('/settings/jackett', { url, apiKey });
        
        if (response && response.success) {
          showNotification('success', 'Jackett configuration saved successfully');
        } else {
          showNotification('error', `Failed to save Jackett configuration: ${response.message || 'Unknown error'}`);
        }
      } catch (error) {
        showNotification('error', `Error saving Jackett configuration: ${error.message}`);
      } finally {
        saveJackettButton.disabled = false;
        saveJackettButton.textContent = 'Save';
      }
    });
  }
  
  // Jackett test connection button
  if (testJackettButton) {
    testJackettButton.addEventListener('click', async () => {
      testJackettButton.disabled = true;
      testJackettButton.textContent = 'Testing...';
      
      try {
        const response = await api.get('/settings/test-connection/jackett-config');
        
        if (response && response.success) {
          showNotification('success', response.message || 'Successfully connected to Jackett');
        } else {
          showNotification('error', response.message || 'Failed to connect to Jackett');
        }
      } catch (error) {
        showNotification('error', error.message || 'Jackett connection test failed');
      } finally {
        testJackettButton.disabled = false;
        testJackettButton.textContent = 'Test Connection';
      }
    });
  }
  
  // Load Jackett configuration
  loadJackettConfig();
  
  // Filebrowser save button
  if (saveFilebrowserButton) {
    saveFilebrowserButton.addEventListener('click', async () => {
      const url = document.getElementById('filebrowser-url').value.trim();
      const username = document.getElementById('filebrowser-username').value.trim();
      const password = document.getElementById('filebrowser-password').value.trim();
      
      if (!url || !username || !password) {
        showNotification('error', 'All fields are required');
        return;
      }
      
      if (!url.match(/^https?:\/\/.+/)) {
        showNotification('error', 'Please enter a valid URL (e.g., http://192.168.1.100:8080)');
        return;
      }
      
      saveFilebrowserButton.disabled = true;
      saveFilebrowserButton.textContent = 'Saving...';
      
      try {
        const response = await api.put('/settings/filebrowser', { url, username, password });
        
        if (response && response.success) {
          showNotification('success', 'Filebrowser configuration saved successfully');
        } else {
          showNotification('error', `Failed to save filebrowser configuration: ${response.message || 'Unknown error'}`);
        }
      } catch (error) {
        showNotification('error', `Error saving filebrowser configuration: ${error.message}`);
      } finally {
        saveFilebrowserButton.disabled = false;
        saveFilebrowserButton.textContent = 'Save';
      }
    });
  }
  
  // Filebrowser test connection button
  if (testFilebrowserButton) {
    testFilebrowserButton.addEventListener('click', async () => {
      testFilebrowserButton.disabled = true;
      testFilebrowserButton.textContent = 'Testing...';
      
      try {
        const response = await api.get('/settings/test-connection/filebrowser');
        
        if (response && response.success) {
          showNotification('success', response.message || 'Successfully connected to filebrowser');
        } else {
          showNotification('error', response.message || 'Failed to connect to filebrowser');
        }
      } catch (error) {
        showNotification('error', error.message || 'Filebrowser connection test failed');
      } finally {
        testFilebrowserButton.disabled = false;
        testFilebrowserButton.textContent = 'Test Connection';
      }
    });
  }
  
  // Load filebrowser configuration
  loadFilebrowserConfig();
}

/**
 * Load API keys from server
 */
function loadApiKeys() {
  api.get('/settings/api-keys')
    .then(response => {
      if (response && response.keys) {
        const keys = response.keys;
        console.log('API Keys loaded:', keys); // Added console.log
        
        if (keys.tmdb) {
          document.getElementById('tmdb-key').value = keys.tmdb;
          console.log('TMDB Key assigned:', keys.tmdb); // Added console.log
        }
        if (keys.watchmode) {
          document.getElementById('watchmode-key').value = keys.watchmode;
          console.log('Watchmode Key assigned:', keys.watchmode); // Added console.log
        }
        if (keys.jackett) {
          document.getElementById('jackett-key').value = keys.jackett;
          console.log('Jackett Key assigned:', keys.jackett); // Added console.log
        }
        if (keys.jellyfin) {
          document.getElementById('jellyfin-key').value = keys.jellyfin;
          console.log('Jellyfin Key assigned:', keys.jellyfin); // Added console.log
        }
        if (keys.cloudCommander) {
          document.getElementById('cloud-commander-key').value = keys.cloudCommander;
          console.log('Cloud Commander Key assigned:', keys.cloudCommander); // Added console.log
        }
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
 * Load Jackett configuration from server
 */
function loadJackettConfig() {
  api.get('/settings/jackett')
    .then(response => {
      if (response && response.success) {
        const config = response.data;
        
        if (config.url) document.getElementById('jackett-url').value = config.url;
        if (config.apiKey) document.getElementById('jackett-api-key').value = config.apiKey;
      }
    })
    .catch(error => {
      console.error('Failed to load Jackett configuration:', error);
    });
}

/**
 * Load qBittorrent configuration from server
 */
function loadQbittorrentConfig() {
  api.get('/settings/qbittorrent')
    .then(response => {
      if (response && response.success) {
        const config = response.data;
        
        if (config.url) document.getElementById('qbittorrent-url').value = config.url;
        if (config.username) document.getElementById('qbittorrent-username').value = config.username;
        if (config.password) document.getElementById('qbittorrent-password').value = config.password;
      }
    })
    .catch(error => {
      console.error('Failed to load qBittorrent configuration:', error);
    });
}

/**
 * Load filebrowser configuration from server
 */
function loadFilebrowserConfig() {
  api.get('/settings/filebrowser')
    .then(response => {
      if (response && response.success) {
        const config = response.data;
        
        if (config.url) document.getElementById('filebrowser-url').value = config.url;
        if (config.username) document.getElementById('filebrowser-username').value = config.username;
        if (config.password) document.getElementById('filebrowser-password').value = config.password;
      }
    })
    .catch(error => {
      console.error('Failed to load filebrowser configuration:', error);
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
