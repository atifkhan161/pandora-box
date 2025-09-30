/**
 * Settings Page Handler
 * Manages settings forms and API interactions
 */

import auth from '../services/auth.js';
import api from '../services/api.js';
import { Navigation } from '../components/navigation.js';
import themeManager from '../services/theme.js';
import toast from '../services/toast.js';

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

  // Initialize event listeners
  initializeEventListeners();
  
  // Initialize theme selector
  initializeThemeSelector();
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
  const savePortainerButton = document.querySelector('.save-portainer-btn');
  const testPortainerButton = document.querySelector('.test-portainer-btn');
  const saveJellyfinButton = document.querySelector('.save-jellyfin-btn');
  const testJellyfinButton = document.querySelector('.test-jellyfin-btn');

  
  // Password form submission
  if (passwordForm) {
    passwordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const currentPassword = document.getElementById('current-password').value.trim();
      const newPassword = document.getElementById('new-password').value.trim();
      const confirmPassword = document.getElementById('confirm-password').value.trim();
      
      // Validate passwords match
      if (!currentPassword || !newPassword) {
        toast.error('All password fields are required');
        return;
      }
      
      if (newPassword !== confirmPassword) {
        toast.error('New passwords do not match');
        return;
      }
      
      try {
        const response = await api.put('/settings/password', { 
          currentPassword, 
          newPassword 
        });
        
        if (response && response.success) {
          toast.success('Password updated successfully');
          passwordForm.reset();
        } else {
          toast.error(response.message || 'Failed to update password');
        }
      } catch (error) {
        toast.error(error.message || 'An error occurred');
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
          toast.error('API key cannot be empty');
          return;
        }
        
        button.disabled = true;
        button.textContent = 'Saving...';
        
        try {
          const response = await api.put('/settings/api-keys', { 
            [service]: apiKey 
          });
          
          if (response && response.success) {
            toast.success(`${service} API key saved successfully`);
          } else {
            toast.error(`Failed to save ${service} API key: ${response.message || 'Unknown error'}`);
          }
        } catch (error) {
          toast.error(`Error saving ${service} API key: ${error.message}`);
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
            toast.error('Please enter a valid port number (1-65535)');
            return;
          }
        } else if (configType === 'dbPath') {
          configValue = document.getElementById('db-path').value.trim();
          if (!configValue) {
            toast.error('Database path cannot be empty');
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
            toast.success(`${configType} updated successfully`);
          } else {
            toast.error(`Failed to update ${configType}: ${response.message || 'Unknown error'}`);
          }
        } catch (error) {
          toast.error(`Error updating ${configType}: ${error.message}`);
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
            toast.success(response.message || `Successfully connected to ${service}`);
          } else {
            toast.error(response.message || `Failed to connect to ${service}`);
          }
        } catch (error) {
          toast.error(error.message || 'Connection test failed');
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
        toast.error('All fields are required');
        return;
      }
      
      if (!url.match(/^https?:\/\/.+/)) {
        toast.error('Please enter a valid URL (e.g., http://192.168.1.100:8080)');
        return;
      }
      
      saveButton.disabled = true;
      saveButton.textContent = 'Saving...';
      
      try {
        const response = await api.put('/settings/qbittorrent', { 
          url, username, password
        });
        
        if (response && response.success) {
          toast.success('qBittorrent configuration saved successfully');
        } else {
          toast.error(`Failed to save qBittorrent configuration: ${response.message || 'Unknown error'}`);
        }
      } catch (error) {
        toast.error(`Error saving qBittorrent configuration: ${error.message}`);
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
          toast.success(response.message || 'Successfully connected to qBittorrent');
        } else {
          toast.error(response.message || 'Failed to connect to qBittorrent');
        }
      } catch (error) {
        toast.error(error.message || 'qBittorrent connection test failed');
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
        toast.error('All fields are required');
        return;
      }
      
      if (!url.match(/^https?:\/\/.+/)) {
        toast.error('Please enter a valid URL (e.g., http://192.168.1.100:9117)');
        return;
      }
      
      saveJackettButton.disabled = true;
      saveJackettButton.textContent = 'Saving...';
      
      try {
        const response = await api.put('/settings/jackett', { url, apiKey });
        
        if (response && response.success) {
          toast.success('Jackett configuration saved successfully');
        } else {
          toast.error(`Failed to save Jackett configuration: ${response.message || 'Unknown error'}`);
        }
      } catch (error) {
        toast.error(`Error saving Jackett configuration: ${error.message}`);
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
          toast.success(response.message || 'Successfully connected to Jackett');
        } else {
          toast.error(response.message || 'Failed to connect to Jackett');
        }
      } catch (error) {
        toast.error(error.message || 'Jackett connection test failed');
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
        toast.error('All fields are required');
        return;
      }
      
      if (!url.match(/^https?:\/\/.+/)) {
        toast.error('Please enter a valid URL (e.g., http://192.168.1.100:8080)');
        return;
      }
      
      saveFilebrowserButton.disabled = true;
      saveFilebrowserButton.textContent = 'Saving...';
      
      try {
        const moviesPath = document.getElementById('movies-path').value.trim();
        const showsPath = document.getElementById('shows-path').value.trim();
        
        const response = await api.put('/settings/filebrowser', { 
          url, username, password, moviesPath, showsPath 
        });
        
        if (response && response.success) {
          toast.success('Filebrowser configuration saved successfully');
        } else {
          toast.error(`Failed to save filebrowser configuration: ${response.message || 'Unknown error'}`);
        }
      } catch (error) {
        toast.error(`Error saving filebrowser configuration: ${error.message}`);
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
          toast.success(response.message || 'Successfully connected to filebrowser');
        } else {
          toast.error(response.message || 'Failed to connect to filebrowser');
        }
      } catch (error) {
        toast.error(error.message || 'Filebrowser connection test failed');
      } finally {
        testFilebrowserButton.disabled = false;
        testFilebrowserButton.textContent = 'Test Connection';
      }
    });
  }
  
  // Load filebrowser configuration
  loadFilebrowserConfig();
  
  // Portainer save button
  if (savePortainerButton) {
    savePortainerButton.addEventListener('click', async () => {
      const url = document.getElementById('portainer-url').value.trim();
      const apiKey = document.getElementById('portainer-api-key').value.trim();
      const endpointId = document.getElementById('portainer-endpoint-id').value.trim() || '2';
      
      if (!url || !apiKey) {
        toast.error('URL and API Key are required');
        return;
      }
      
      if (!url.match(/^https?:\/\/.+/)) {
        toast.error('Please enter a valid URL (e.g., http://192.168.1.100:9000)');
        return;
      }
      
      savePortainerButton.disabled = true;
      savePortainerButton.textContent = 'Saving...';
      
      try {
        const response = await api.put('/settings/portainer', { url, apiKey, endpointId });
        
        if (response && response.success) {
          toast.success('Portainer configuration saved successfully');
        } else {
          toast.error(`Failed to save Portainer configuration: ${response.message || 'Unknown error'}`);
        }
      } catch (error) {
        toast.error(`Error saving Portainer configuration: ${error.message}`);
      } finally {
        savePortainerButton.disabled = false;
        savePortainerButton.textContent = 'Save';
      }
    });
  }
  
  // Portainer test connection button
  if (testPortainerButton) {
    testPortainerButton.addEventListener('click', async () => {
      testPortainerButton.disabled = true;
      testPortainerButton.textContent = 'Testing...';
      
      try {
        const response = await api.get('/settings/test-connection/portainer');
        
        if (response && response.success) {
          toast.success(response.message || 'Successfully connected to Portainer');
        } else {
          toast.error(response.message || 'Failed to connect to Portainer');
        }
      } catch (error) {
        toast.error(error.message || 'Portainer connection test failed');
      } finally {
        testPortainerButton.disabled = false;
        testPortainerButton.textContent = 'Test Connection';
      }
    });
  }
  
  // Load Portainer configuration
  loadPortainerConfig();
  
  // Jellyfin save button
  if (saveJellyfinButton) {
    saveJellyfinButton.addEventListener('click', async () => {
      const url = document.getElementById('jellyfin-url').value.trim();
      const apiKey = document.getElementById('jellyfin-api-key').value.trim();
      
      if (!url || !apiKey) {
        toast.error('All fields are required');
        return;
      }
      
      if (!url.match(/^https?:\/\/.+/)) {
        toast.error('Please enter a valid URL (e.g., http://192.168.1.100:8096)');
        return;
      }
      
      saveJellyfinButton.disabled = true;
      saveJellyfinButton.textContent = 'Saving...';
      
      try {
        const response = await api.put('/settings/jellyfin', { url, apiKey });
        
        if (response && response.success) {
          toast.success('Jellyfin configuration saved successfully');
        } else {
          toast.error(`Failed to save Jellyfin configuration: ${response.message || 'Unknown error'}`);
        }
      } catch (error) {
        toast.error(`Error saving Jellyfin configuration: ${error.message}`);
      } finally {
        saveJellyfinButton.disabled = false;
        saveJellyfinButton.textContent = 'Save';
      }
    });
  }
  
  // Jellyfin test connection button
  if (testJellyfinButton) {
    testJellyfinButton.addEventListener('click', async () => {
      testJellyfinButton.disabled = true;
      testJellyfinButton.textContent = 'Testing...';
      
      try {
        const response = await api.get('/settings/test-connection/jellyfin-config');
        
        if (response && response.success) {
          toast.success(response.message || 'Successfully connected to Jellyfin');
        } else {
          toast.error(response.message || 'Failed to connect to Jellyfin');
        }
      } catch (error) {
        toast.error(error.message || 'Jellyfin connection test failed');
      } finally {
        testJellyfinButton.disabled = false;
        testJellyfinButton.textContent = 'Test Connection';
      }
    });
  }
  
  // Load Jellyfin configuration
  loadJellyfinConfig();
}

/**
 * Initialize theme selector
 */
function initializeThemeSelector() {
  const themeSelector = document.getElementById('theme-selector');
  if (!themeSelector) return;
  
  // Load custom themes into selector
  updateThemeSelector();
  
  // Set current theme in selector
  themeSelector.value = themeManager.getCurrentTheme();
  
  // Add change event listener
  themeSelector.addEventListener('change', (e) => {
    const selectedTheme = e.target.value;
    themeManager.setTheme(selectedTheme);
    toast.success(`Theme changed to ${getThemeDisplayName(selectedTheme)}`);
  });
  
  // Initialize custom theme creator
  initializeCustomThemeCreator();
}

/**
 * Update theme selector with custom themes
 */
function updateThemeSelector() {
  const themeSelector = document.getElementById('theme-selector');
  const customThemes = themeManager.loadCustomThemes();
  
  // Remove existing custom options
  Array.from(themeSelector.options).forEach(option => {
    if (option.value.startsWith('custom-')) {
      option.remove();
    }
  });
  
  // Add custom themes
  Object.entries(customThemes).forEach(([key, theme]) => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = theme.name;
    themeSelector.appendChild(option);
  });
}

/**
 * Initialize custom theme creator
 */
function initializeCustomThemeCreator() {
  const colorInputs = ['color1', 'color2', 'color3', 'color4'];
  
  // Sync color picker with hex input
  colorInputs.forEach(id => {
    const colorPicker = document.getElementById(id);
    const hexInput = document.getElementById(`${id}-hex`);
    
    colorPicker.addEventListener('input', (e) => {
      hexInput.value = e.target.value.toUpperCase();
    });
    
    hexInput.addEventListener('input', (e) => {
      const hex = e.target.value;
      if (/^#[0-9A-F]{6}$/i.test(hex)) {
        colorPicker.value = hex;
      }
    });
  });
  
  // Create theme button
  document.getElementById('create-theme-btn').addEventListener('click', () => {
    if (isPreviewActive) {
      stopPreview();
    }
    createCustomTheme();
  });
  
  // Preview theme button
  document.getElementById('preview-theme-btn').addEventListener('click', () => {
    if (isPreviewActive) {
      stopPreview();
    } else {
      previewCustomTheme();
    }
  });
  
  // Import palette button
  document.getElementById('import-palette-btn').addEventListener('click', importColorHuntPalette);
}

/**
 * Create custom theme
 */
function createCustomTheme() {
  const themeName = document.getElementById('custom-theme-name').value.trim();
  
  if (!themeName) {
    toast.error('Please enter a theme name');
    return;
  }
  
  const colors = {
    primary: document.getElementById('color1').value,
    secondary: document.getElementById('color2').value,
    accent: document.getElementById('color3').value,
    text: document.getElementById('color4').value
  };
  
  try {
    const themeKey = themeManager.createCustomTheme(themeName, colors);
    updateThemeSelector();
    document.getElementById('theme-selector').value = themeKey;
    toast.success(`Custom theme "${themeName}" created and applied!`);
  } catch (error) {
    toast.error('Failed to create theme');
  }
}

let previewTimeout;
let isPreviewActive = false;

/**
 * Preview custom theme
 */
function previewCustomTheme() {
  const colors = {
    primary: document.getElementById('color1').value,
    secondary: document.getElementById('color2').value,
    accent: document.getElementById('color3').value,
    text: document.getElementById('color4').value
  };
  
  // Clear existing preview
  if (previewTimeout) {
    clearTimeout(previewTimeout);
  }
  
  // Apply preview theme
  themeManager.injectCustomThemeCSS('preview-theme', colors);
  document.body.className = document.body.className.replace(/\b\w+-theme\b/g, '') + ' preview-theme';
  
  isPreviewActive = true;
  updatePreviewButtons(true);
  
  toast.info('Preview active for 10 seconds. Click "Stop Preview" to cancel.');
  
  // Auto-remove preview after 10 seconds
  previewTimeout = setTimeout(() => {
    stopPreview();
  }, 10000);
}

/**
 * Stop preview and return to current theme
 */
function stopPreview() {
  if (previewTimeout) {
    clearTimeout(previewTimeout);
    previewTimeout = null;
  }
  
  if (isPreviewActive) {
    themeManager.applyTheme(themeManager.getCurrentTheme());
    isPreviewActive = false;
    updatePreviewButtons(false);
    toast.success('Preview stopped, returned to current theme.');
  }
}

/**
 * Import ColorHunt palette from URL
 */
function importColorHuntPalette() {
  const url = document.getElementById('colorhunt-url').value.trim();
  
  if (!url) {
    toast.error('Please enter a ColorHunt URL');
    return;
  }
  
  // Extract colors from ColorHunt URL
  const colors = parseColorHuntUrl(url);
  
  if (!colors) {
    toast.error('Invalid ColorHunt URL format');
    return;
  }
  
  // Populate color inputs
  document.getElementById('color1').value = colors[0];
  document.getElementById('color1-hex').value = colors[0];
  document.getElementById('color2').value = colors[1];
  document.getElementById('color2-hex').value = colors[1];
  document.getElementById('color3').value = colors[2];
  document.getElementById('color3-hex').value = colors[2];
  document.getElementById('color4').value = colors[3];
  document.getElementById('color4-hex').value = colors[3];
  
  toast.success('Color palette imported successfully!');
}

/**
 * Parse ColorHunt URL to extract colors
 * @param {string} url - ColorHunt URL
 * @returns {Array|null} Array of 4 hex colors or null if invalid
 */
function parseColorHuntUrl(url) {
  try {
    // Match ColorHunt palette URL pattern
    const match = url.match(/colorhunt\.co\/palette\/([a-fA-F0-9]{24})/);
    
    if (!match) {
      return null;
    }
    
    const colorString = match[1];
    
    // Split into 4 colors (6 characters each)
    if (colorString.length !== 24) {
      return null;
    }
    
    const colors = [];
    for (let i = 0; i < 4; i++) {
      const hex = '#' + colorString.substr(i * 6, 6);
      colors.push(hex.toUpperCase());
    }
    
    return colors;
  } catch (error) {
    return null;
  }
}

/**
 * Update preview button states
 */
function updatePreviewButtons(previewing) {
  const previewBtn = document.getElementById('preview-theme-btn');
  const createBtn = document.getElementById('create-theme-btn');
  
  if (previewing) {
    previewBtn.textContent = 'Stop Preview';
    previewBtn.classList.add('btn-warning');
    previewBtn.classList.remove('btn-secondary');
    createBtn.style.opacity = '0.7';
  } else {
    previewBtn.textContent = 'Preview';
    previewBtn.classList.remove('btn-warning');
    previewBtn.classList.add('btn-secondary');
    createBtn.style.opacity = '1';
  }
}

/**
 * Get display name for theme
 * @param {string} themeName - Theme name
 * @returns {string} Display name
 */
function getThemeDisplayName(themeName) {
  const displayNames = {
    'default': 'Default Dark',
    'netflix': 'Netflix',
    'amazon-prime': 'Amazon Prime Video',
    'disney': 'Disney+',
    'nature': 'Nature'
  };
  
  // Check for custom themes
  if (themeName.startsWith('custom-')) {
    const customThemes = themeManager.loadCustomThemes();
    return customThemes[themeName]?.name || themeName;
  }
  
  return displayNames[themeName] || themeName;
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
        if (config.moviesPath) document.getElementById('movies-path').value = config.moviesPath;
        if (config.showsPath) document.getElementById('shows-path').value = config.showsPath;
      }
    })
    .catch(error => {
      console.error('Failed to load filebrowser configuration:', error);
    });
}

/**
 * Load Portainer configuration from server
 */
function loadPortainerConfig() {
  api.get('/settings/portainer')
    .then(response => {
      if (response && response.success) {
        const config = response.data;
        
        if (config.url) document.getElementById('portainer-url').value = config.url;
        if (config.apiKey) document.getElementById('portainer-api-key').value = config.apiKey;
        if (config.endpointId) document.getElementById('portainer-endpoint-id').value = config.endpointId;
      }
    })
    .catch(error => {
      console.error('Failed to load Portainer configuration:', error);
    });
}

/**
 * Load Jellyfin configuration from server
 */
function loadJellyfinConfig() {
  api.get('/settings/jellyfin')
    .then(response => {
      if (response && response.success) {
        const config = response.data;
        
        if (config.url) document.getElementById('jellyfin-url').value = config.url;
        if (config.apiKey) document.getElementById('jellyfin-api-key').value = config.apiKey;
      }
    })
    .catch(error => {
      console.error('Failed to load Jellyfin configuration:', error);
    });
}




