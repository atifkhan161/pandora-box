/**
 * Theme Switcher Component
 * Provides UI for theme selection with preview functionality
 */
import themeManager from '../../utils/theme-manager.js';

class ThemeSwitcher {
  constructor(container) {
    this.container = container;
    this.themeGrid = null;
    this.previewElements = {};
    this.isInitialized = false;
    this.currentPreviewTheme = null;
    
    // Bind methods
    this.handleThemeSelect = this.handleThemeSelect.bind(this);
    this.handleActionClick = this.handleActionClick.bind(this);
    this.handleThemeChange = this.handleThemeChange.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);
  }

  /**
   * Initialize the theme switcher component
   */
  async init() {
    if (this.isInitialized) return;

    try {
      await this.loadTemplate();
      this.setupElements();
      this.setupEventListeners();
      this.renderThemeOptions();
      this.updatePreview(themeManager.getCurrentTheme());
      this.updateActiveTheme();
      
      this.isInitialized = true;
      console.log('ThemeSwitcher component initialized');
    } catch (error) {
      console.error('Failed to initialize ThemeSwitcher:', error);
    }
  }

  /**
   * Load the HTML template
   */
  async loadTemplate() {
    try {
      const response = await fetch('/src/components/theme-switcher/theme-switcher.html');
      const html = await response.text();
      this.container.innerHTML = html;
    } catch (error) {
      console.error('Failed to load theme switcher template:', error);
      // Fallback to basic HTML
      this.container.innerHTML = `
        <div class="theme-switcher" data-component="theme-switcher">
          <div class="theme-switcher-grid" data-theme-grid></div>
          <div class="theme-switcher-actions">
            <button class="theme-action-button" data-action="previous">←</button>
            <button class="theme-action-button" data-action="next">→</button>
            <button class="theme-action-button" data-action="reset">↻</button>
          </div>
        </div>
      `;
    }
  }

  /**
   * Setup DOM element references
   */
  setupElements() {
    this.themeGrid = this.container.querySelector('[data-theme-grid]');
    this.previewElements = {
      name: this.container.querySelector('[data-preview-name]'),
      description: this.container.querySelector('[data-preview-description]'),
      colorPrimary: this.container.querySelector('[data-color-primary]'),
      colorSecondary: this.container.querySelector('[data-color-secondary]'),
      colorAccent: this.container.querySelector('[data-color-accent]'),
      colorSuccess: this.container.querySelector('[data-color-success]'),
      colorWarning: this.container.querySelector('[data-color-warning]'),
      colorError: this.container.querySelector('[data-color-error]')
    };
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Theme selection
    if (this.themeGrid) {
      this.themeGrid.addEventListener('click', this.handleThemeSelect);
    }

    // Action buttons
    const actionButtons = this.container.querySelectorAll('[data-action]');
    actionButtons.forEach(button => {
      button.addEventListener('click', this.handleActionClick);
    });

    // Theme manager changes
    themeManager.onThemeChange(this.handleThemeChange);

    // Keyboard navigation
    this.container.addEventListener('keydown', this.handleKeydown);

    // Mouse hover for preview
    if (this.themeGrid) {
      this.themeGrid.addEventListener('mouseover', (event) => {
        const themeOption = event.target.closest('.theme-option');
        if (themeOption) {
          const themeId = themeOption.dataset.themeId;
          this.updatePreview(themeId);
        }
      });

      this.themeGrid.addEventListener('mouseleave', () => {
        this.updatePreview(themeManager.getCurrentTheme());
      });
    }
  }

  /**
   * Render theme options in the grid
   */
  renderThemeOptions() {
    if (!this.themeGrid) return;

    const themes = themeManager.getAvailableThemes();
    const currentTheme = themeManager.getCurrentTheme();

    this.themeGrid.innerHTML = themes.map(theme => `
      <div class="theme-option ${theme.id === currentTheme ? 'active' : ''}" 
           data-theme-id="${theme.id}"
           tabindex="0"
           role="button"
           aria-label="Select ${theme.name} theme"
           style="--theme-primary-color: ${theme.primaryColor}">
        <div class="theme-option-preview">
          <div class="theme-option-colors">
            <div class="theme-option-color" style="background: ${theme.primaryColor}"></div>
            <div class="theme-option-color" style="background: ${this.getThemeSecondaryColor(theme.id)}"></div>
            <div class="theme-option-color" style="background: ${this.getThemeAccentColor(theme.id)}"></div>
          </div>
        </div>
        <div class="theme-option-name">${theme.name}</div>
        <div class="theme-option-description">${this.truncateText(theme.description, 40)}</div>
      </div>
    `).join('');
  }

  /**
   * Get secondary color for theme preview
   */
  getThemeSecondaryColor(themeId) {
    const colorMap = {
      'netflix': '#564d4d',
      'prime-video': '#37475a',
      'hulu': '#2d3e50',
      'hbo-max': '#4c1d95',
      'disney-plus': '#1a202c',
      'apple-tv': '#38383a'
    };
    return colorMap[themeId] || '#666666';
  }

  /**
   * Get accent color for theme preview
   */
  getThemeAccentColor(themeId) {
    const colorMap = {
      'netflix': '#46d369',
      'prime-video': '#ff9500',
      'hulu': '#ff6b35',
      'hbo-max': '#f59e0b',
      'disney-plus': '#f6ad55',
      'apple-tv': '#007aff'
    };
    return colorMap[themeId] || '#00aaff';
  }

  /**
   * Update preview with theme data
   */
  updatePreview(themeId) {
    const theme = themeManager.getThemeById(themeId);
    if (!theme) return;

    this.currentPreviewTheme = themeId;

    // Update text elements
    if (this.previewElements.name) {
      this.previewElements.name.textContent = theme.name;
    }
    if (this.previewElements.description) {
      this.previewElements.description.textContent = theme.description;
    }

    // Update color swatches
    if (this.previewElements.colorPrimary) {
      this.previewElements.colorPrimary.style.background = theme.primaryColor;
    }
    if (this.previewElements.colorSecondary) {
      this.previewElements.colorSecondary.style.background = this.getThemeSecondaryColor(themeId);
    }
    if (this.previewElements.colorAccent) {
      this.previewElements.colorAccent.style.background = this.getThemeAccentColor(themeId);
    }
    if (this.previewElements.colorSuccess) {
      this.previewElements.colorSuccess.style.background = this.getThemeStateColor(themeId, 'success');
    }
    if (this.previewElements.colorWarning) {
      this.previewElements.colorWarning.style.background = this.getThemeStateColor(themeId, 'warning');
    }
    if (this.previewElements.colorError) {
      this.previewElements.colorError.style.background = this.getThemeStateColor(themeId, 'error');
    }
  }

  /**
   * Get state color for theme
   */
  getThemeStateColor(themeId, state) {
    const colorMaps = {
      success: {
        'netflix': '#46d369',
        'prime-video': '#27ae60',
        'hulu': '#2ecc71',
        'hbo-max': '#10b981',
        'disney-plus': '#38a169',
        'apple-tv': '#30d158'
      },
      warning: {
        'netflix': '#ffb800',
        'prime-video': '#f39c12',
        'hulu': '#ffa726',
        'hbo-max': '#fbbf24',
        'disney-plus': '#ed8936',
        'apple-tv': '#ff9500'
      },
      error: {
        'netflix': '#ff453a',
        'prime-video': '#e74c3c',
        'hulu': '#f44336',
        'hbo-max': '#ef4444',
        'disney-plus': '#e53e3e',
        'apple-tv': '#ff3b30'
      }
    };
    return colorMaps[state]?.[themeId] || '#666666';
  }

  /**
   * Update active theme in UI
   */
  updateActiveTheme() {
    const currentTheme = themeManager.getCurrentTheme();
    const themeOptions = this.container.querySelectorAll('.theme-option');
    
    themeOptions.forEach(option => {
      const isActive = option.dataset.themeId === currentTheme;
      option.classList.toggle('active', isActive);
      option.setAttribute('aria-pressed', isActive.toString());
    });
  }

  /**
   * Handle theme selection
   */
  async handleThemeSelect(event) {
    const themeOption = event.target.closest('.theme-option');
    if (!themeOption) return;

    const themeId = themeOption.dataset.themeId;
    if (!themeId) return;

    try {
      this.setLoadingState(true);
      await themeManager.setTheme(themeId);
      this.updateActiveTheme();
    } catch (error) {
      console.error('Failed to set theme:', error);
      this.showError('Failed to apply theme');
    } finally {
      this.setLoadingState(false);
    }
  }

  /**
   * Handle action button clicks
   */
  async handleActionClick(event) {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (!action) return;

    try {
      this.setLoadingState(true);

      switch (action) {
        case 'previous':
          await themeManager.previousTheme();
          break;
        case 'next':
          await themeManager.nextTheme();
          break;
        case 'random':
          await this.selectRandomTheme();
          break;
        case 'reset':
          await themeManager.resetTheme();
          break;
      }

      this.updateActiveTheme();
    } catch (error) {
      console.error(`Failed to execute action ${action}:`, error);
      this.showError(`Failed to ${action} theme`);
    } finally {
      this.setLoadingState(false);
    }
  }

  /**
   * Select random theme
   */
  async selectRandomTheme() {
    const themes = themeManager.getAvailableThemes();
    const currentTheme = themeManager.getCurrentTheme();
    const availableThemes = themes.filter(theme => theme.id !== currentTheme);
    
    if (availableThemes.length > 0) {
      const randomTheme = availableThemes[Math.floor(Math.random() * availableThemes.length)];
      await themeManager.setTheme(randomTheme.id);
    }
  }

  /**
   * Handle theme manager changes
   */
  handleThemeChange(themeData) {
    this.updateActiveTheme();
    this.updatePreview(themeData.current);
    this.animateThemeChange();
  }

  /**
   * Handle keyboard navigation
   */
  handleKeydown(event) {
    const focusedElement = document.activeElement;
    const themeOptions = Array.from(this.container.querySelectorAll('.theme-option'));
    const currentIndex = themeOptions.indexOf(focusedElement);

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        const nextIndex = (currentIndex + 1) % themeOptions.length;
        themeOptions[nextIndex]?.focus();
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        const prevIndex = currentIndex === 0 ? themeOptions.length - 1 : currentIndex - 1;
        themeOptions[prevIndex]?.focus();
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (focusedElement?.classList.contains('theme-option')) {
          focusedElement.click();
        }
        break;
    }
  }

  /**
   * Set loading state
   */
  setLoadingState(loading) {
    const switcher = this.container.querySelector('.theme-switcher');
    if (switcher) {
      switcher.classList.toggle('loading', loading);
    }
  }

  /**
   * Animate theme change
   */
  animateThemeChange() {
    const switcher = this.container.querySelector('.theme-switcher');
    if (switcher) {
      switcher.classList.add('switching');
      setTimeout(() => {
        switcher.classList.remove('switching');
      }, 300);
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    // This would integrate with your notification system
    console.error(message);
  }

  /**
   * Truncate text to specified length
   */
  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Refresh the component
   */
  refresh() {
    this.renderThemeOptions();
    this.updateActiveTheme();
    this.updatePreview(themeManager.getCurrentTheme());
  }

  /**
   * Destroy the component
   */
  destroy() {
    // Remove event listeners
    if (this.themeGrid) {
      this.themeGrid.removeEventListener('click', this.handleThemeSelect);
    }

    const actionButtons = this.container.querySelectorAll('[data-action]');
    actionButtons.forEach(button => {
      button.removeEventListener('click', this.handleActionClick);
    });

    themeManager.offThemeChange(this.handleThemeChange);
    this.container.removeEventListener('keydown', this.handleKeydown);

    // Clear container
    this.container.innerHTML = '';
    
    this.isInitialized = false;
    console.log('ThemeSwitcher component destroyed');
  }
}

export default ThemeSwitcher;