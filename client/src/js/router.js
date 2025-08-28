/**
 * Vanilla JavaScript Router using History API
 * Implements client-side routing without external dependencies
 */
class Router {
  constructor() {
    this.routes = new Map();
    this.currentPage = null;
    this.isInitialized = false;
    this.loadingElement = null;
  }

  /**
   * Initialize the router
   */
  init() {
    if (this.isInitialized) return;

    // Listen for browser navigation events
    window.addEventListener('popstate', () => this.handleRoute());
    
    // Listen for navigation clicks
    document.addEventListener('click', (e) => this.handleNavClick(e));
    
    // Handle initial route
    this.handleRoute();
    
    this.isInitialized = true;
    console.log('Router initialized');
  }

  /**
   * Add a route to the router
   * @param {string} path - The route path
   * @param {Function} pageClass - The page class constructor
   * @param {Object} options - Route options
   */
  addRoute(path, pageClass, options = {}) {
    this.routes.set(path, {
      pageClass,
      requiresAuth: options.requiresAuth || false,
      title: options.title || 'Pandora Box'
    });
  }

  /**
   * Navigate to a path
   * @param {string} path - The path to navigate to
   * @param {boolean} pushState - Whether to push to history
   */
  navigate(path, pushState = true) {
    if (pushState && window.location.pathname !== path) {
      history.pushState(null, '', path);
    }
    this.handleRoute();
  }

  /**
   * Handle route changes
   */
  async handleRoute() {
    const path = window.location.pathname;
    const route = this.findRoute(path);

    if (!route) {
      console.warn(`No route found for path: ${path}`);
      this.navigate('/404', false);
      return;
    }

    try {
      // Show loading state
      this.showLoading();

      // Check authentication if required
      if (route.requiresAuth) {
        const isAuth = this.isAuthenticated();
        console.log(`Route ${path} requires auth. Authenticated: ${isAuth}`);
        
        if (!isAuth) {
          console.log('Route requires authentication, redirecting to login');
          this.navigate('/login', false);
          return;
        }
      }

      // Cleanup current page
      if (this.currentPage && typeof this.currentPage.destroy === 'function') {
        this.currentPage.destroy();
      }

      // Update page title
      document.title = route.title;

      // Initialize new page
      this.currentPage = new route.pageClass();
      
      if (typeof this.currentPage.init === 'function') {
        await this.currentPage.init();
      }

      // Render page
      const mainContent = document.getElementById('main-content');
      if (mainContent && typeof this.currentPage.render === 'function') {
        this.currentPage.render(mainContent);
      }

      // Update navigation active state
      this.updateNavigation(path);

      // Hide loading state
      this.hideLoading();

      console.log(`Navigated to: ${path}`);
    } catch (error) {
      console.error('Error handling route:', error);
      this.hideLoading();
      // Could navigate to error page here
    }
  }

  /**
   * Find matching route for path
   * @param {string} path - The path to match
   * @returns {Object|null} - The matching route or null
   */
  findRoute(path) {
    // Exact match first
    if (this.routes.has(path)) {
      return this.routes.get(path);
    }

    // Try to match with trailing slash variations
    const pathWithSlash = path.endsWith('/') ? path.slice(0, -1) : path + '/';
    if (this.routes.has(pathWithSlash)) {
      return this.routes.get(pathWithSlash);
    }

    // Default route for root
    if (path === '' || path === '/') {
      return this.routes.get('/') || this.routes.get('');
    }

    return null;
  }

  /**
   * Handle navigation clicks
   * @param {Event} e - Click event
   */
  handleNavClick(e) {
    const link = e.target.closest('a[href]');
    
    if (!link) return;

    const href = link.getAttribute('href');
    
    // Skip external links and non-route links
    if (!href || 
        href.startsWith('http') || 
        href.startsWith('mailto:') || 
        href.startsWith('tel:') ||
        link.hasAttribute('target')) {
      return;
    }

    // Handle internal navigation
    e.preventDefault();
    
    // Close mobile navigation if open
    this.closeMobileNav();
    
    this.navigate(href);
  }

  /**
   * Update navigation active states
   * @param {string} currentPath - Current active path
   */
  updateNavigation(currentPath) {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      const isActive = href === currentPath || 
                      (href === '/' && currentPath === '/') ||
                      (href !== '/' && currentPath.startsWith(href));
      
      link.classList.toggle('active', isActive);
      link.setAttribute('aria-current', isActive ? 'page' : 'false');
    });
  }

  /**
   * Close mobile navigation
   */
  closeMobileNav() {
    const nav = document.getElementById('main-navigation');
    const backdrop = document.getElementById('nav-backdrop');
    
    if (nav) {
      nav.classList.remove('nav-open');
    }
    
    if (backdrop) {
      backdrop.classList.remove('active');
    }
  }

  /**
   * Show loading state
   */
  showLoading() {
    if (!this.loadingElement) {
      this.loadingElement = document.createElement('div');
      this.loadingElement.className = 'page-loading';
      this.loadingElement.innerHTML = `
        <div class="loading-spinner">
          <div class="spinner"></div>
        </div>
      `;
    }

    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.appendChild(this.loadingElement);
    }
  }

  /**
   * Hide loading state
   */
  hideLoading() {
    if (this.loadingElement && this.loadingElement.parentNode) {
      this.loadingElement.parentNode.removeChild(this.loadingElement);
    }
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} - Authentication status
   */
  isAuthenticated() {
    // This will be overridden by the app during initialization
    // Default to false for security
    return false;
  }

  /**
   * Get current route path
   * @returns {string} - Current path
   */
  getCurrentPath() {
    return window.location.pathname;
  }

  /**
   * Destroy the router
   */
  destroy() {
    window.removeEventListener('popstate', this.handleRoute);
    document.removeEventListener('click', this.handleNavClick);
    
    if (this.currentPage && typeof this.currentPage.destroy === 'function') {
      this.currentPage.destroy();
    }
    
    this.isInitialized = false;
  }
}

export default Router;