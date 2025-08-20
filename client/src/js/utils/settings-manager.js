/**
 * Settings Manager for Pandora Box PWA
 * Handles user preferences and application configuration
 */

class SettingsManager {
  constructor() {
    this.settings = {
      // Theme settings
      theme: {
        mode: 'dark', // 'light', 'dark', 'system'
        accentColor: '#6200ee',
        useSystemPreference: true,
      },
      
      // Media settings
      media: {
        defaultQuality: 'auto', // 'auto', 'low', 'medium', 'high'
        autoplay: false,
        subtitlesEnabled: true,
        subtitlesLanguage: 'en',
        defaultView: 'grid', // 'grid', 'list'
      },
      
      // Download settings
      downloads: {
        maxConcurrent: 3,
        downloadLocation: 'downloads',
        notifyOnComplete: true,
        autoExtract: true,
        autoOrganize: true,
      },
      
      // Notification settings
      notifications: {
        enabled: true,
        sound: true,
        newContent: true,
        systemUpdates: true,
        downloadComplete: true,
      },
      
      // Privacy settings
      privacy: {
        saveHistory: true,
        collectAnalytics: false,
        rememberLastView: true,
      },
      
      // System settings
      system: {
        checkUpdatesAutomatically: true,
        updateInterval: 'daily', // 'hourly', 'daily', 'weekly', 'never'
        startOnBoot: false,
        hardwareAcceleration: true,
        proxyEnabled: false,
        proxyUrl: '',
      },
    };
    
    this.db = window.DB; // Reference to the DB utility
    
    // Bind methods
    this.initialize = this.initialize.bind(this);
    this.get = this.get.bind(this);
    this.set = this.set.bind(this);
    this.reset = this.reset.bind(this);
    this.exportSettings = this.exportSettings.bind(this);
    this.importSettings = this.importSettings.bind(this);
  }
  
  /**
   * Initialize settings from IndexedDB
   * @returns {Promise<Object>} - The loaded settings
   */
  async initialize() {
    try {
      // Get settings from IndexedDB
      const savedSettings = await this.db.get('settings', 'userPreferences');
      
      if (savedSettings) {
        // Merge saved settings with defaults (to ensure new settings are included)
        this.settings = this._mergeSettings(this.settings, savedSettings);
      }
      
      // Apply theme settings
      this._applyThemeSettings();
      
      return this.settings;
    } catch (error) {
      console.error('Settings initialization error:', error);
      return this.settings;
    }
  }
  
  /**
   * Get a setting value by path
   * @param {string} path - The path to the setting (e.g., 'theme.mode')
   * @param {*} defaultValue - The default value if the setting doesn't exist
   * @returns {*} - The setting value
   */
  get(path, defaultValue = undefined) {
    return Helpers.getValueByPath(this.settings, path, defaultValue);
  }
  
  /**
   * Set a setting value by path
   * @param {string} path - The path to the setting (e.g., 'theme.mode')
   * @param {*} value - The value to set
   * @returns {Promise<boolean>} - Whether the setting was set successfully
   */
  async set(path, value) {
    try {
      // Split the path into parts
      const parts = path.split('.');
      const lastPart = parts.pop();
      
      // Navigate to the parent object
      let current = this.settings;
      for (const part of parts) {
        if (current[part] === undefined) {
          current[part] = {};
        }
        current = current[part];
      }
      
      // Set the value
      current[lastPart] = value;
      
      // Save to IndexedDB
      await this._saveSettings();
      
      // Apply theme settings if theme-related setting changed
      if (path.startsWith('theme.')) {
        this._applyThemeSettings();
      }
      
      // Dispatch settings change event
      this._dispatchChangeEvent(path, value);
      
      return true;
    } catch (error) {
      console.error('Error setting value:', error);
      return false;
    }
  }
  
  /**
   * Reset settings to defaults
   * @param {string} [category] - Optional category to reset (e.g., 'theme')
   * @returns {Promise<boolean>} - Whether the settings were reset successfully
   */
  async reset(category = null) {
    try {
      const defaultSettings = {
        // Theme settings
        theme: {
          mode: 'dark',
          accentColor: '#6200ee',
          useSystemPreference: true,
        },
        
        // Media settings
        media: {
          defaultQuality: 'auto',
          autoplay: false,
          subtitlesEnabled: true,
          subtitlesLanguage: 'en',
          defaultView: 'grid',
        },
        
        // Download settings
        downloads: {
          maxConcurrent: 3,
          downloadLocation: 'downloads',
          notifyOnComplete: true,
          autoExtract: true,
          autoOrganize: true,
        },
        
        // Notification settings
        notifications: {
          enabled: true,
          sound: true,
          newContent: true,
          systemUpdates: true,
          downloadComplete: true,
        },
        
        // Privacy settings
        privacy: {
          saveHistory: true,
          collectAnalytics: false,
          rememberLastView: true,
        },
        
        // System settings
        system: {
          checkUpdatesAutomatically: true,
          updateInterval: 'daily',
          startOnBoot: false,
          hardwareAcceleration: true,
          proxyEnabled: false,
          proxyUrl: '',
        },
      };
      
      if (category && defaultSettings[category]) {
        // Reset only the specified category
        this.settings[category] = { ...defaultSettings[category] };
      } else {
        // Reset all settings
        this.settings = { ...defaultSettings };
      }
      
      // Save to IndexedDB
      await this._saveSettings();
      
      // Apply theme settings
      this._applyThemeSettings();
      
      // Dispatch reset event
      this._dispatchResetEvent(category);
      
      return true;
    } catch (error) {
      console.error('Error resetting settings:', error);
      return false;
    }
  }
  
  /**
   * Export settings as JSON
   * @returns {string} - The settings as a JSON string
   */
  exportSettings() {
    try {
      return JSON.stringify(this.settings, null, 2);
    } catch (error) {
      console.error('Error exporting settings:', error);
      return null;
    }
  }
  
  /**
   * Import settings from JSON
   * @param {string|Object} settings - The settings to import
   * @returns {Promise<boolean>} - Whether the settings were imported successfully
   */
  async importSettings(settings) {
    try {
      // Parse settings if string
      const parsedSettings = typeof settings === 'string' ? JSON.parse(settings) : settings;
      
      // Validate settings structure
      if (!parsedSettings || typeof parsedSettings !== 'object') {
        throw new Error('Invalid settings format');
      }
      
      // Merge with defaults to ensure structure integrity
      this.settings = this._mergeSettings(this.settings, parsedSettings);
      
      // Save to IndexedDB
      await this._saveSettings();
      
      // Apply theme settings
      this._applyThemeSettings();
      
      // Dispatch import event
      this._dispatchImportEvent();
      
      return true;
    } catch (error) {
      console.error('Error importing settings:', error);
      return false;
    }
  }
  
  /**
   * Save settings to IndexedDB
   * @private
   * @returns {Promise<void>}
   */
  async _saveSettings() {
    if (!this.db) return;
    
    try {
      await this.db.put('settings', {
        id: 'userPreferences',
        ...this.settings,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }
  
  /**
   * Apply theme settings to the document
   * @private
   */
  _applyThemeSettings() {
    const { mode, accentColor, useSystemPreference } = this.settings.theme;
    
    // Apply theme mode
    if (useSystemPreference) {
      // Use system preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
      }
      
      // Listen for system theme changes
      this._setupSystemThemeListener();
    } else {
      // Use user preference
      document.documentElement.setAttribute('data-theme', mode);
      
      // Remove system theme listener
      this._removeSystemThemeListener();
    }
    
    // Apply accent color
    document.documentElement.style.setProperty('--color-primary', accentColor);
    
    // Generate accent color variants
    const lighterAccent = this._adjustColor(accentColor, 20);
    const darkerAccent = this._adjustColor(accentColor, -20);
    
    document.documentElement.style.setProperty('--color-primary-light', lighterAccent);
    document.documentElement.style.setProperty('--color-primary-dark', darkerAccent);
  }
  
  /**
   * Set up listener for system theme changes
   * @private
   */
  _setupSystemThemeListener() {
    if (!window.matchMedia) return;
    
    // Remove existing listener if any
    this._removeSystemThemeListener();
    
    // Create new listener
    this._systemThemeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Define listener function
    this._systemThemeChangeHandler = (e) => {
      document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    };
    
    // Add listener
    if (this._systemThemeMediaQuery.addEventListener) {
      this._systemThemeMediaQuery.addEventListener('change', this._systemThemeChangeHandler);
    } else {
      // Fallback for older browsers
      this._systemThemeMediaQuery.addListener(this._systemThemeChangeHandler);
    }
  }
  
  /**
   * Remove listener for system theme changes
   * @private
   */
  _removeSystemThemeListener() {
    if (!this._systemThemeMediaQuery || !this._systemThemeChangeHandler) return;
    
    if (this._systemThemeMediaQuery.removeEventListener) {
      this._systemThemeMediaQuery.removeEventListener('change', this._systemThemeChangeHandler);
    } else {
      // Fallback for older browsers
      this._systemThemeMediaQuery.removeListener(this._systemThemeChangeHandler);
    }
    
    this._systemThemeMediaQuery = null;
    this._systemThemeChangeHandler = null;
  }
  
  /**
   * Adjust a color's lightness
   * @private
   * @param {string} color - The color to adjust (hex format)
   * @param {number} amount - The amount to adjust by (-100 to 100)
   * @returns {string} - The adjusted color
   */
  _adjustColor(color, amount) {
    // Convert hex to RGB
    let r = parseInt(color.substring(1, 3), 16);
    let g = parseInt(color.substring(3, 5), 16);
    let b = parseInt(color.substring(5, 7), 16);
    
    // Convert RGB to HSL
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      
      h /= 6;
    }
    
    // Adjust lightness
    l = Math.max(0, Math.min(1, l + amount / 100));
    
    // Convert back to RGB
    let r1, g1, b1;
    
    if (s === 0) {
      r1 = g1 = b1 = l; // achromatic
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      
      r1 = hue2rgb(p, q, h + 1/3);
      g1 = hue2rgb(p, q, h);
      b1 = hue2rgb(p, q, h - 1/3);
    }
    
    // Convert to hex
    const toHex = (x) => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r1)}${toHex(g1)}${toHex(b1)}`;
  }
  
  /**
   * Merge settings objects (deep merge)
   * @private
   * @param {Object} target - The target object
   * @param {Object} source - The source object
   * @returns {Object} - The merged object
   */
  _mergeSettings(target, source) {
    const output = { ...target };
    
    if (!source || typeof source !== 'object') return output;
    
    Object.keys(source).forEach(key => {
      if (source[key] && typeof source[key] === 'object') {
        if (target[key] && typeof target[key] === 'object') {
          output[key] = this._mergeSettings(target[key], source[key]);
        } else {
          output[key] = { ...source[key] };
        }
      } else if (source[key] !== undefined) {
        output[key] = source[key];
      }
    });
    
    return output;
  }
  
  /**
   * Dispatch a settings change event
   * @private
   * @param {string} path - The path that changed
   * @param {*} value - The new value
   */
  _dispatchChangeEvent(path, value) {
    const event = new CustomEvent('settings-change', {
      detail: {
        path,
        value,
        settings: this.settings
      }
    });
    
    document.dispatchEvent(event);
  }
  
  /**
   * Dispatch a settings reset event
   * @private
   * @param {string|null} category - The category that was reset
   */
  _dispatchResetEvent(category) {
    const event = new CustomEvent('settings-reset', {
      detail: {
        category,
        settings: this.settings
      }
    });
    
    document.dispatchEvent(event);
  }
  
  /**
   * Dispatch a settings import event
   * @private
   */
  _dispatchImportEvent() {
    const event = new CustomEvent('settings-import', {
      detail: {
        settings: this.settings
      }
    });
    
    document.dispatchEvent(event);
  }
}

// Create and export the settings manager instance
window.SettingsManager = new SettingsManager();