/**
 * Theme Manager for Pandora Box PWA
 * Handles theme switching and preferences
 */

class ThemeManager {
  /**
   * Initialize the theme manager
   */
  constructor() {
    this.THEME_STORAGE_KEY = 'pandora_theme_preference';
    this.ACCENT_STORAGE_KEY = 'pandora_accent_color';
    this.THEME_ATTRIBUTE = 'data-theme';
    this.ACCENT_ATTRIBUTE = 'data-accent-color';
    
    // Available themes
    this.themes = ['netflix', 'prime-video'];
    this.accentColors = ['blue', 'purple', 'green', 'orange', 'red'];
    
    // Bind methods
    this.setTheme = this.setTheme.bind(this);
    this.setAccentColor = this.setAccentColor.bind(this);
    this.getSystemTheme = this.getSystemTheme.bind(this);
    this.handleSystemThemeChange = this.handleSystemThemeChange.bind(this);
    
    // Initialize theme from storage or default to system
    this.init();
  }
  
  /**
   * Initialize theme settings
   */
  init() {
    // Get saved preferences
    const savedTheme = localStorage.getItem(this.THEME_STORAGE_KEY) || 'netflix';
    const savedAccent = localStorage.getItem(this.ACCENT_STORAGE_KEY) || 'blue';
    
    // Set initial theme
    this.setTheme(savedTheme, false);
    
    // Set initial accent color
    this.setAccentColor(savedAccent, false);
    
    // Listen for system theme changes
    this.setupSystemThemeListener();
  }
  
  /**
   * Set up listener for system theme changes
   */
  setupSystemThemeListener() {
    // Check if the browser supports matchMedia
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      // Add change listener
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', this.handleSystemThemeChange);
      } else if (mediaQuery.addListener) {
        // Older browsers
        mediaQuery.addListener(this.handleSystemThemeChange);
      }
    }
  }
  
  /**
   * Handle system theme change
   */
  handleSystemThemeChange(e) {
    // Only update if current theme is set to 'system'
    if (localStorage.getItem(this.THEME_STORAGE_KEY) === 'system') {
      this.applyTheme(this.getSystemTheme());
    }
  }
  
  /**
   * Get the current system theme
   */
  getSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }
  
  /**
   * Set the theme
   */
  setTheme(theme, save = true) {
    // Validate theme
    if (!this.themes.includes(theme)) {
      console.error(`Invalid theme: ${theme}. Must be one of: ${this.themes.join(', ')}`);
      return;
    }
    
    // Save preference if requested
    if (save) {
      localStorage.setItem(this.THEME_STORAGE_KEY, theme);
    }
    
    // Apply the theme
    if (theme === 'system') {
      this.applyTheme(this.getSystemTheme());
    } else {
      this.applyTheme(theme);
    }
    
    // Dispatch event for theme change
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
  }
  
  /**
   * Apply the theme to the document
   */
  applyTheme(theme) {
    document.documentElement.setAttribute(this.THEME_ATTRIBUTE, theme);
  }
  
  /**
   * Get the current theme
   */
  getCurrentTheme() {
    return localStorage.getItem(this.THEME_STORAGE_KEY) || 'system';
  }
  
  /**
   * Get the current applied theme (actual light/dark value, not 'system')
   */
  getCurrentAppliedTheme() {
    const theme = this.getCurrentTheme();
    return theme === 'system' ? this.getSystemTheme() : theme;
  }
  
  /**
   * Set the accent color
   */
  setAccentColor(color, save = true) {
    // Validate color
    if (!this.accentColors.includes(color)) {
      console.error(`Invalid accent color: ${color}. Must be one of: ${this.accentColors.join(', ')}`);
      return;
    }
    
    // Save preference if requested
    if (save) {
      localStorage.setItem(this.ACCENT_STORAGE_KEY, color);
    }
    
    // Apply the accent color
    document.documentElement.setAttribute(this.ACCENT_ATTRIBUTE, color);
    
    // Dispatch event for accent color change
    window.dispatchEvent(new CustomEvent('accentchange', { detail: { color } }));
  }
  
  /**
   * Get the current accent color
   */
  getCurrentAccentColor() {
    return localStorage.getItem(this.ACCENT_STORAGE_KEY) || 'blue';
  }
  
  /**
   * Toggle between light and dark themes
   */
  toggleTheme() {
    const currentTheme = this.getCurrentTheme();
    let newTheme;

    if (currentTheme === 'netflix') {
      newTheme = 'prime-video';
    } else {
      newTheme = 'netflix';
    }
    
    this.setTheme(newTheme);
    return newTheme;
  }
}

// Export the theme manager
window.ThemeManager = ThemeManager;