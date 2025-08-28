/**
 * Advanced Theme Manager for Pandora PWA
 * Handles dynamic theme switching, persistence, and PWA meta theme-color updates
 */
class ThemeManager {
  constructor() {
    this.currentTheme = 'netflix'; // Default theme
    this.availableThemes = [
      {
        id: 'netflix',
        name: 'Netflix',
        description: 'Netflix-inspired dark theme with signature red accents',
        primaryColor: '#e50914',
        category: 'streaming'
      },
      {
        id: 'prime-video',
        name: 'Prime Video',
        description: 'Prime Video-inspired theme with blue and orange accents',
        primaryColor: '#00a8e1',
        category: 'streaming'
      },
      {
        id: 'hulu',
        name: 'Hulu',
        description: 'Hulu-inspired theme with vibrant green and orange',
        primaryColor: '#1ce783',
        category: 'streaming'
      },
      {
        id: 'hbo-max',
        name: 'HBO Max',
        description: 'HBO Max-inspired theme with purple and gold accents',
        primaryColor: '#9146ff',
        category: 'streaming'
      },
      {
        id: 'disney-plus',
        name: 'Disney+',
        description: 'Disney+ inspired theme with magical blue and gold',
        primaryColor: '#113ccf',
        category: 'streaming'
      },
      {
        id: 'apple-tv',
        name: 'Apple TV+',
        description: 'Apple TV+ inspired minimalist black theme',
        primaryColor: '#007aff',
        category: 'streaming'
      }
    ];
    
    this.themeChangeCallbacks = new Set();
    this.storageKey = 'pb-theme';
    this.metaThemeColor = null;
    this.isInitialized = false;
    
    // Bind methods
    this.handleSystemThemeChange = this.handleSystemThemeChange.bind(this);
    this.handleStorageChange = this.handleStorageChange.bind(this);
  }

  /**
   * Initialize the theme manager
   */
  async init() {
    if (this.isInitialized) return;

    try {
      // Get meta theme-color element
      this.metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (!this.metaThemeColor) {
        this.metaThemeColor = document.createElement('meta');
        this.metaThemeColor.name = 'theme-color';
        document.head.appendChild(this.metaThemeColor);
      }

      // Load saved theme or detect system preference
      const savedTheme = this.getSavedTheme();
      const initialTheme = savedTheme || this.detectSystemTheme();
      
      // Load and apply initial theme
      await this.setTheme(initialTheme, false);

      // Set up event listeners
      this.setupEventListeners();

      this.isInitialized = true;
      console.log(`ThemeManager initialized with theme: ${this.currentTheme}`);
    } catch (error) {
      console.error('Failed to initialize ThemeManager:', error);
      // Fallback to default theme
      await this.setTheme('netflix', false);
      this.isInitialized = true;
    }
  }

  /**
   * Set up event listeners for theme changes
   */
  setupEventListeners() {
    // Listen for system theme changes
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', this.handleSystemThemeChange);
    }

    // Listen for storage changes (cross-tab synchronization)
    window.addEventListener('storage', this.handleStorageChange);

    // Listen for visibility changes to sync theme
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.syncTheme();
      }
    });
  }

  /**
   * Handle system theme preference changes
   */
  handleSystemThemeChange(event) {
    // Only auto-switch if no theme is explicitly saved
    if (!this.getSavedTheme()) {
      const systemTheme = this.detectSystemTheme();
      this.setTheme(systemTheme);
    }
  }

  /**
   * Handle storage changes for cross-tab synchronization
   */
  handleStorageChange(event) {
    if (event.key === this.storageKey && event.newValue !== this.currentTheme) {
      this.setTheme(event.newValue, false); // Don't save again
    }
  }

  /**
   * Detect system theme preference
   */
  detectSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'apple-tv'; // Closest to light theme
    }
    return 'netflix'; // Default dark theme
  }

  /**
   * Get saved theme from localStorage
   */
  getSavedTheme() {
    try {
      return localStorage.getItem(this.storageKey);
    } catch (error) {
      console.warn('Failed to read theme from localStorage:', error);
      return null;
    }
  }

  /**
   * Save theme to localStorage
   */
  saveTheme(themeId) {
    try {
      localStorage.setItem(this.storageKey, themeId);
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error);
    }
  }

  /**
   * Load theme CSS file dynamically
   */
  async loadThemeCSS(themeId) {
    return new Promise((resolve, reject) => {
      // Remove existing theme stylesheets
      const existingThemeLinks = document.querySelectorAll('link[data-theme-css]');
      existingThemeLinks.forEach(link => link.remove());

      // Create new theme stylesheet link
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `/src/css/themes/${themeId}.css`;
      link.setAttribute('data-theme-css', themeId);
      
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to load theme: ${themeId}`));
      
      document.head.appendChild(link);
    });
  }

  /**
   * Apply theme to document
   */
  applyTheme(themeId) {
    // Set data-theme attribute on document element
    document.documentElement.setAttribute('data-theme', themeId);
    
    // Set data-theme attribute on body for compatibility
    document.body.setAttribute('data-theme', themeId);
    
    // Update PWA meta theme-color
    this.updateMetaThemeColor(themeId);
    
    // Update CSS custom properties on root
    this.updateRootProperties(themeId);
  }

  /**
   * Update PWA meta theme-color
   */
  updateMetaThemeColor(themeId) {
    const theme = this.getThemeById(themeId);
    if (theme && this.metaThemeColor) {
      this.metaThemeColor.content = theme.primaryColor;
    }
  }

  /**
   * Update CSS custom properties on root element
   */
  updateRootProperties(themeId) {
    const theme = this.getThemeById(themeId);
    if (theme) {
      document.documentElement.style.setProperty('--pb-theme-id', `"${themeId}"`);
      document.documentElement.style.setProperty('--pb-theme-name', `"${theme.name}"`);
    }
  }

  /**
   * Set active theme
   */
  async setTheme(themeId, save = true) {
    if (!themeId || !this.isValidTheme(themeId)) {
      console.warn(`Invalid theme ID: ${themeId}, falling back to default`);
      themeId = 'netflix';
    }

    try {
      // Load theme CSS
      await this.loadThemeCSS(themeId);
      
      // Apply theme
      this.applyTheme(themeId);
      
      // Update current theme
      const previousTheme = this.currentTheme;
      this.currentTheme = themeId;
      
      // Save to localStorage
      if (save) {
        this.saveTheme(themeId);
      }
      
      // Notify callbacks
      this.notifyThemeChange(themeId, previousTheme);
      
      console.log(`Theme changed to: ${themeId}`);
    } catch (error) {
      console.error(`Failed to set theme ${themeId}:`, error);
      throw error;
    }
  }

  /**
   * Get current theme
   */
  getCurrentTheme() {
    return this.currentTheme;
  }

  /**
   * Get current theme object
   */
  getCurrentThemeObject() {
    return this.getThemeById(this.currentTheme);
  }

  /**
   * Get all available themes
   */
  getAvailableThemes() {
    return [...this.availableThemes];
  }

  /**
   * Get theme by ID
   */
  getThemeById(themeId) {
    return this.availableThemes.find(theme => theme.id === themeId);
  }

  /**
   * Check if theme ID is valid
   */
  isValidTheme(themeId) {
    return this.availableThemes.some(theme => theme.id === themeId);
  }

  /**
   * Get themes by category
   */
  getThemesByCategory(category) {
    return this.availableThemes.filter(theme => theme.category === category);
  }

  /**
   * Cycle to next theme
   */
  async nextTheme() {
    const currentIndex = this.availableThemes.findIndex(theme => theme.id === this.currentTheme);
    const nextIndex = (currentIndex + 1) % this.availableThemes.length;
    const nextTheme = this.availableThemes[nextIndex];
    await this.setTheme(nextTheme.id);
    return nextTheme;
  }

  /**
   * Cycle to previous theme
   */
  async previousTheme() {
    const currentIndex = this.availableThemes.findIndex(theme => theme.id === this.currentTheme);
    const prevIndex = currentIndex === 0 ? this.availableThemes.length - 1 : currentIndex - 1;
    const prevTheme = this.availableThemes[prevIndex];
    await this.setTheme(prevTheme.id);
    return prevTheme;
  }

  /**
   * Add theme change callback
   */
  onThemeChange(callback) {
    if (typeof callback === 'function') {
      this.themeChangeCallbacks.add(callback);
    }
  }

  /**
   * Remove theme change callback
   */
  offThemeChange(callback) {
    this.themeChangeCallbacks.delete(callback);
  }

  /**
   * Notify all callbacks of theme change
   */
  notifyThemeChange(newTheme, previousTheme) {
    const themeData = {
      current: newTheme,
      previous: previousTheme,
      themeObject: this.getThemeById(newTheme)
    };

    this.themeChangeCallbacks.forEach(callback => {
      try {
        callback(themeData);
      } catch (error) {
        console.error('Theme change callback error:', error);
      }
    });

    // Dispatch custom event
    const event = new CustomEvent('themechange', {
      detail: themeData
    });
    document.dispatchEvent(event);
  }

  /**
   * Sync theme across tabs
   */
  syncTheme() {
    const savedTheme = this.getSavedTheme();
    if (savedTheme && savedTheme !== this.currentTheme) {
      this.setTheme(savedTheme, false);
    }
  }

  /**
   * Reset to default theme
   */
  async resetTheme() {
    await this.setTheme('netflix');
  }

  /**
   * Get theme CSS custom properties
   */
  getThemeProperties(themeId = this.currentTheme) {
    const computedStyle = getComputedStyle(document.documentElement);
    const properties = {};
    
    // Get all CSS custom properties that start with --pb-
    const allProperties = Array.from(document.styleSheets)
      .flatMap(sheet => {
        try {
          return Array.from(sheet.cssRules);
        } catch (e) {
          return [];
        }
      })
      .filter(rule => rule.type === CSSRule.STYLE_RULE)
      .flatMap(rule => Array.from(rule.style))
      .filter(prop => prop.startsWith('--pb-'));

    // Get unique properties
    const uniqueProperties = [...new Set(allProperties)];
    
    uniqueProperties.forEach(prop => {
      properties[prop] = computedStyle.getPropertyValue(prop).trim();
    });

    return properties;
  }

  /**
   * Export current theme configuration
   */
  exportThemeConfig() {
    return {
      currentTheme: this.currentTheme,
      themeObject: this.getCurrentThemeObject(),
      properties: this.getThemeProperties(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Preload all theme CSS files
   */
  async preloadThemes() {
    const preloadPromises = this.availableThemes.map(theme => {
      return new Promise((resolve) => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'style';
        link.href = `/src/css/themes/${theme.id}.css`;
        link.onload = resolve;
        link.onerror = resolve; // Don't fail if one theme fails to preload
        document.head.appendChild(link);
      });
    });

    try {
      await Promise.all(preloadPromises);
      console.log('All themes preloaded successfully');
    } catch (error) {
      console.warn('Some themes failed to preload:', error);
    }
  }

  /**
   * Destroy theme manager
   */
  destroy() {
    // Remove event listeners
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.removeEventListener('change', this.handleSystemThemeChange);
    }
    
    window.removeEventListener('storage', this.handleStorageChange);
    
    // Clear callbacks
    this.themeChangeCallbacks.clear();
    
    // Remove theme stylesheets
    const themeLinks = document.querySelectorAll('link[data-theme-css]');
    themeLinks.forEach(link => link.remove());
    
    this.isInitialized = false;
    console.log('ThemeManager destroyed');
  }
}

// Create and export singleton instance
const themeManager = new ThemeManager();

export default themeManager;