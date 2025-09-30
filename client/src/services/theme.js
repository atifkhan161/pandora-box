/**
 * Theme Manager Service
 * Handles theme switching and persistence
 */

class ThemeManager {
  constructor() {
    this.themes = {
      'default': '',
      'netflix': 'netflix-theme',
      'amazon-prime': 'amazon-prime-theme',
      'disney': 'disney-theme'
    };
    
    this.currentTheme = 'default';
    this.init();
  }

  /**
   * Initialize theme manager
   */
  init() {
    this.loadSavedTheme();
    this.applyTheme(this.currentTheme);
  }

  /**
   * Load saved theme from localStorage
   */
  loadSavedTheme() {
    const savedTheme = localStorage.getItem('pandora-box-theme');
    if (savedTheme && this.themes.hasOwnProperty(savedTheme)) {
      this.currentTheme = savedTheme;
    }
  }

  /**
   * Apply theme to the body element
   * @param {string} themeName - Theme name to apply
   */
  applyTheme(themeName) {
    if (!this.themes.hasOwnProperty(themeName)) {
      console.warn(`Theme "${themeName}" not found, using default`);
      themeName = 'default';
    }

    // Remove all theme classes
    Object.values(this.themes).forEach(className => {
      if (className) {
        document.body.classList.remove(className);
      }
    });

    // Apply new theme class
    const themeClass = this.themes[themeName];
    if (themeClass) {
      document.body.classList.add(themeClass);
    }

    this.currentTheme = themeName;
  }

  /**
   * Set and save theme
   * @param {string} themeName - Theme name to set
   */
  setTheme(themeName) {
    this.applyTheme(themeName);
    localStorage.setItem('pandora-box-theme', this.currentTheme);
  }

  /**
   * Get current theme
   * @returns {string} Current theme name
   */
  getCurrentTheme() {
    return this.currentTheme;
  }

  /**
   * Get available themes
   * @returns {Object} Available themes object
   */
  getAvailableThemes() {
    return { ...this.themes };
  }
}

// Create and export singleton instance
const themeManager = new ThemeManager();
export default themeManager;