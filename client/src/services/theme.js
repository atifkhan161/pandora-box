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
      'disney': 'disney-theme',
      'nature': 'nature-theme'
    };
    
    this.currentTheme = 'default';
    this.init();
  }

  /**
   * Initialize theme manager
   */
  init() {
    this.loadCustomThemes();
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
   * Create and apply custom theme
   * @param {string} themeName - Custom theme name
   * @param {Object} colors - Color palette object
   */
  createCustomTheme(themeName, colors) {
    const themeKey = `custom-${themeName.toLowerCase().replace(/\s+/g, '-')}`;
    const themeClass = `${themeKey}-theme`;
    
    // Add to themes object
    this.themes[themeKey] = themeClass;
    
    // Create CSS for custom theme
    this.injectCustomThemeCSS(themeClass, colors);
    
    // Save custom theme data
    const customThemes = JSON.parse(localStorage.getItem('pandora-box-custom-themes') || '{}');
    customThemes[themeKey] = { name: themeName, colors, class: themeClass };
    localStorage.setItem('pandora-box-custom-themes', JSON.stringify(customThemes));
    
    // Apply the theme
    this.setTheme(themeKey);
    
    return themeKey;
  }

  /**
   * Inject custom theme CSS
   * @param {string} themeClass - CSS class name
   * @param {Object} colors - Color palette
   */
  injectCustomThemeCSS(themeClass, colors) {
    const existingStyle = document.getElementById(`custom-theme-${themeClass}`);
    if (existingStyle) existingStyle.remove();
    
    const style = document.createElement('style');
    style.id = `custom-theme-${themeClass}`;
    style.textContent = `
      body.${themeClass} {
        --pb-primary: ${colors.primary};
        --pb-primary-light: ${this.lightenColor(colors.primary, 20)};
        --pb-primary-dark: ${this.darkenColor(colors.primary, 20)};
        --pb-primary-rgb: ${this.hexToRgb(colors.primary)};
        
        --pb-secondary: ${this.darkenColor(colors.secondary, 40)};
        --pb-secondary-light: ${colors.secondary};
        --pb-secondary-dark: ${this.darkenColor(colors.secondary, 60)};
        
        --pb-background: ${this.darkenColor(colors.secondary, 70)};
        --pb-background-light: ${this.darkenColor(colors.secondary, 40)};
        --pb-background-dark: ${this.darkenColor(colors.secondary, 80)};
        
        --pb-surface-primary: ${this.darkenColor(colors.secondary, 40)};
        --pb-surface-secondary: ${colors.secondary};
        --pb-surface-hover: ${this.lightenColor(colors.secondary, 10)};
        
        --pb-accent-primary: ${colors.accent};
        --pb-border-color: ${colors.secondary};
        --pb-text-primary: ${colors.text};
        --pb-text-secondary: ${colors.accent};
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Load custom themes from localStorage
   */
  loadCustomThemes() {
    const customThemes = JSON.parse(localStorage.getItem('pandora-box-custom-themes') || '{}');
    Object.entries(customThemes).forEach(([key, theme]) => {
      this.themes[key] = theme.class;
      this.injectCustomThemeCSS(theme.class, theme.colors);
    });
    return customThemes;
  }

  /**
   * Utility functions for color manipulation
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0, 0, 0';
  }

  lightenColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }

  darkenColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return '#' + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
      (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
      (B > 255 ? 255 : B < 0 ? 0 : B)).toString(16).slice(1);
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