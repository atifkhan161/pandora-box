/**
 * Router for Pandora Box PWA
 * Handles client-side routing and navigation
 */

class Router {
  /**
   * Initialize the router
   */
  constructor() {
    this.routes = {};
    this.currentRoute = null;
    this.defaultRoute = '/dashboard';
    this.notFoundHandler = null;
    this.beforeEachHooks = [];
    this.afterEachHooks = [];
    
    // Bind methods
    this.navigate = this.navigate.bind(this);
    this.handlePopState = this.handlePopState.bind(this);
    
    // Listen for popstate events (browser back/forward)
    window.addEventListener('popstate', this.handlePopState);
    
    // Intercept link clicks for SPA navigation
    document.addEventListener('click', (event) => {
      // Find closest anchor tag
      const link = event.target.closest('a');
      
      // If it's a link with href starting with #
      if (link && link.getAttribute('href') && link.getAttribute('href').startsWith('#/')) {
        event.preventDefault();
        const path = link.getAttribute('href').substring(1); // Remove the # character
        this.navigate(path);
      }
    });
  }
  
  /**
   * Register a route
   */
  register(path, handler) {
    this.routes[path] = handler;
    return this;
  }
  
  /**
   * Set the default route
   */
  setDefault(path) {
    this.defaultRoute = path;
    return this;
  }
  
  /**
   * Set the not found handler
   */
  setNotFound(handler) {
    this.notFoundHandler = handler;
    return this;
  }
  
  /**
   * Add a hook to run before each navigation
   */
  beforeEach(hook) {
    this.beforeEachHooks.push(hook);
    return this;
  }
  
  /**
   * Add a hook to run after each navigation
   */
  afterEach(hook) {
    this.afterEachHooks.push(hook);
    return this;
  }
  
  /**
   * Navigate to a route
   */
  async navigate(path, replace = false) {
    // Default to dashboard if no path
    if (!path) {
      path = this.defaultRoute;
    }
    
    // Remove leading slash if present
    if (path.startsWith('/')) {
      path = path.substring(1);
    }
    
    // Find the matching route
    const route = this.findMatchingRoute(path);
    
    // If no route found, use not found handler
    if (!route) {
      if (this.notFoundHandler) {
        this.notFoundHandler(path);
      } else {
        console.error(`Route not found: ${path}`);
      }
      return;
    }
    
    // Extract route handler and params
    const { handler, params } = route;
    
    // Run before hooks
    for (const hook of this.beforeEachHooks) {
      const result = await hook(path, this.currentRoute);
      if (result === false) {
        // Navigation cancelled
        return;
      }
    }
    
    // Update browser history
    const url = `#/${path}`;
    if (replace) {
      window.history.replaceState({ path }, '', url);
    } else {
      window.history.pushState({ path }, '', url);
    }
    
    // Store current route
    this.currentRoute = path;
    
    // Call the route handler
    await handler(params);
    
    // Run after hooks
    for (const hook of this.afterEachHooks) {
      await hook(path, params);
    }
  }
  
  /**
   * Handle popstate event (browser back/forward)
   */
  handlePopState(event) {
    const path = event.state?.path || this.getPathFromHash();
    this.navigate(path, true);
  }
  
  /**
   * Get the current path from URL hash
   */
  getPathFromHash() {
    const hash = window.location.hash;
    return hash.startsWith('#/') ? hash.substring(2) : '';
  }
  
  /**
   * Find a matching route for the given path
   */
  findMatchingRoute(path) {
    // First try exact match
    if (this.routes[path]) {
      return { handler: this.routes[path], params: {} };
    }
    
    // Then try pattern matching for dynamic routes
    for (const routePath in this.routes) {
      const match = this.matchRoute(routePath, path);
      if (match) {
        return { handler: this.routes[routePath], params: match };
      }
    }
    
    return null;
  }
  
  /**
   * Match a route pattern against a path
   * Supports patterns like '/users/:id' or '/posts/:category/:id'
   */
  matchRoute(pattern, path) {
    // Skip if not a pattern route
    if (!pattern.includes(':')) {
      return null;
    }
    
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');
    
    // Different number of parts means no match
    if (patternParts.length !== pathParts.length) {
      return null;
    }
    
    const params = {};
    
    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      const pathPart = pathParts[i];
      
      // If this part is a parameter
      if (patternPart.startsWith(':')) {
        const paramName = patternPart.substring(1);
        params[paramName] = pathPart;
      }
      // If this is a static part and doesn't match
      else if (patternPart !== pathPart) {
        return null;
      }
    }
    
    return params;
  }
  
  /**
   * Start the router
   */
  start() {
    // Get initial path from hash or use default
    const initialPath = this.getPathFromHash() || this.defaultRoute.substring(1);
    this.navigate(initialPath, true);
    return this;
  }
}

// Export the router
window.Router = Router;