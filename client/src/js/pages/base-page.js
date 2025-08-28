/**
 * Base Page Class
 * All page controllers should extend this class
 */
class BasePage {
  constructor() {
    this.container = null;
    this.isInitialized = false;
    this.templatePath = '';
    this.eventListeners = [];
  }

  /**
   * Initialize the page
   * Override this method in child classes
   */
  async init() {
    if (this.isInitialized) return;

    try {
      // Load HTML template if templatePath is set
      if (this.templatePath) {
        const template = await this.loadTemplate();
        this.container = document.createElement('div');
        this.container.className = 'page-container';
        this.container.innerHTML = template;
      }

      // Setup page-specific logic
      await this.setupPage();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Load initial data
      await this.loadData();

      this.isInitialized = true;
      console.log(`${this.constructor.name} initialized`);
    } catch (error) {
      console.error(`Error initializing ${this.constructor.name}:`, error);
      throw error;
    }
  }

  /**
   * Load HTML template from file
   * @returns {Promise<string>} - Template HTML
   */
  async loadTemplate() {
    try {
      const response = await fetch(this.templatePath);
      if (!response.ok) {
        throw new Error(`Failed to load template: ${response.statusText}`);
      }
      return await response.text();
    } catch (error) {
      console.error('Error loading template:', error);
      return '<div class="error">Failed to load page template</div>';
    }
  }

  /**
   * Setup page-specific logic
   * Override this method in child classes
   */
  async setupPage() {
    // Override in child classes
  }

  /**
   * Setup event listeners
   * Override this method in child classes
   */
  setupEventListeners() {
    // Override in child classes
  }

  /**
   * Load initial data
   * Override this method in child classes
   */
  async loadData() {
    // Override in child classes
  }

  /**
   * Render the page to target element
   * @param {HTMLElement} targetElement - Element to render into
   */
  render(targetElement) {
    if (!targetElement) {
      console.error('No target element provided for rendering');
      return;
    }

    // Clear target element
    targetElement.innerHTML = '';

    // Add page container if it exists
    if (this.container) {
      targetElement.appendChild(this.container);
    }

    // Call post-render hook
    this.onRender();
  }

  /**
   * Post-render hook
   * Override this method in child classes for post-render logic
   */
  onRender() {
    // Override in child classes
  }

  /**
   * Add event listener with cleanup tracking
   * @param {HTMLElement} element - Element to add listener to
   * @param {string} event - Event type
   * @param {Function} handler - Event handler
   * @param {Object} options - Event options
   */
  addEventListener(element, event, handler, options = {}) {
    element.addEventListener(event, handler, options);
    
    // Track for cleanup
    this.eventListeners.push({
      element,
      event,
      handler,
      options
    });
  }

  /**
   * Find element within page container
   * @param {string} selector - CSS selector
   * @returns {HTMLElement|null} - Found element or null
   */
  querySelector(selector) {
    if (!this.container) return null;
    return this.container.querySelector(selector);
  }

  /**
   * Find elements within page container
   * @param {string} selector - CSS selector
   * @returns {NodeList} - Found elements
   */
  querySelectorAll(selector) {
    if (!this.container) return [];
    return this.container.querySelectorAll(selector);
  }

  /**
   * Show loading state
   * @param {string} message - Loading message
   */
  showLoading(message = 'Loading...') {
    const loadingEl = document.createElement('div');
    loadingEl.className = 'page-loading-overlay';
    loadingEl.innerHTML = `
      <div class="loading-content">
        <div class="spinner"></div>
        <p class="loading-message">${message}</p>
      </div>
    `;

    if (this.container) {
      this.container.appendChild(loadingEl);
    }
  }

  /**
   * Hide loading state
   */
  hideLoading() {
    if (this.container) {
      const loadingEl = this.container.querySelector('.page-loading-overlay');
      if (loadingEl) {
        loadingEl.remove();
      }
    }
  }

  /**
   * Show error message
   * @param {string} message - Error message
   * @param {Error} error - Error object (optional)
   */
  showError(message, error = null) {
    console.error('Page error:', message, error);

    const errorEl = document.createElement('div');
    errorEl.className = 'page-error';
    errorEl.innerHTML = `
      <div class="error-content">
        <h3>Error</h3>
        <p>${message}</p>
        <button class="btn btn-primary" onclick="window.location.reload()">
          Reload Page
        </button>
      </div>
    `;

    if (this.container) {
      // Remove any existing error messages
      const existingError = this.container.querySelector('.page-error');
      if (existingError) {
        existingError.remove();
      }
      
      this.container.appendChild(errorEl);
    }
  }

  /**
   * Update page title
   * @param {string} title - New page title
   */
  setTitle(title) {
    document.title = `${title} - Pandora Box`;
  }

  /**
   * Cleanup page resources
   */
  destroy() {
    // Remove event listeners
    this.eventListeners.forEach(({ element, event, handler, options }) => {
      element.removeEventListener(event, handler, options);
    });
    this.eventListeners = [];

    // Clear container
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }

    this.container = null;
    this.isInitialized = false;

    console.log(`${this.constructor.name} destroyed`);
  }

  /**
   * Refresh page data
   */
  async refresh() {
    try {
      this.showLoading('Refreshing...');
      await this.loadData();
      this.hideLoading();
    } catch (error) {
      this.hideLoading();
      this.showError('Failed to refresh page data', error);
    }
  }
}

export default BasePage;