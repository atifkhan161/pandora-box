/**
 * Pandora Box PWA - Main Application
 */

export class PandoraBoxApp {
  constructor() {
    this.apiBaseUrl = '/api/v1';
    this.currentPage = null;
    this.isAuthenticated = false;
    this.currentUser = null;
    this.db = null;
    this.mediaCache = {};
    this.settings = {};
    
    // Initialize the application
    this.init();
  }
  
  /**
   * Initialize the application
   */
  async init() {
    // Initialize IndexedDB
    await this.initDatabase();
    
    // Check authentication status
    await this.checkAuth();
    
    // Initialize UI components
    this.initUI();
    
    // Set up event listeners

    
    // Load settings
    await this.loadSettings();
    
    // Apply theme
    this.applyTheme();
    
    // Initialize router
    this.initRouter();
  }
  
  /**
   * Initialize IndexedDB database
   */
  async initDatabase() {
    try {
      // Open database connection
      const dbPromise = window.indexedDB.open('pandoraBoxDB', 1);
      
      dbPromise.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains('auth')) {
          db.createObjectStore('auth', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('media')) {
          db.createObjectStore('media', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('downloads')) {
          db.createObjectStore('downloads', { keyPath: 'id' });
        }
      };
      
      return new Promise((resolve, reject) => {
        dbPromise.onsuccess = (event) => {
          this.db = event.target.result;
          console.log('IndexedDB initialized successfully');
          resolve();
        };
        
        dbPromise.onerror = (event) => {
          console.error('Error initializing IndexedDB:', event.target.error);
          reject(event.target.error);
        };
      });
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
      this.showToast('Failed to initialize local database', 'error');
    }
  }
  
  /**
   * Check if user is authenticated
   */
  async checkAuth() {
    try {
      // Check for token in IndexedDB
      const token = await this.getFromDB('auth', 'token');
      
      if (token) {
        // Validate token with the server
        const response = await this.apiRequest('/auth/validate', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token.value}`
          }
        });
        
        if (response.valid) {
          this.isAuthenticated = true;
          this.currentUser = response.user;
          return true;
        } else {
          // Token is invalid, remove it
          await this.removeFromDB('auth', 'token');
        }
      }
      
      this.isAuthenticated = false;
      return false;
    } catch (error) {
      console.error('Error checking authentication:', error);
      this.isAuthenticated = false;
      return false;
    }
  }
  
  /**
   * Initialize UI components
   */
  initUI() {
    // Initialize UI components
    this.navSidebar = document.getElementById('nav-sidebar');
    this.pageContainer = document.getElementById('page-container');
    this.pageTitle = document.getElementById('page-title');
    this.initToastSystem();

    // Initialize component libraries if needed
  }
  
  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Check if login form exists (means we are on the login page)
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleLogin();
      });
    } else { // Assume we are on the main app page
      // Navigation menu toggle
      const menuToggle = document.getElementById('menu-toggle');
      if (menuToggle) {
        menuToggle.addEventListener('click', () => {
          this.toggleNavSidebar();
        });
      }
      
      // Theme toggle
      const themeToggle = document.getElementById('theme-toggle');
      if (themeToggle) {
        themeToggle.addEventListener('click', () => {
          this.toggleTheme();
        });
      }
      
      // Logout button
      const logoutBtn = document.getElementById('logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
          this.handleLogout();
        });
      }
      
      // Navigation links
      const navLinks = document.querySelectorAll('.nav-link');
      navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const page = link.getAttribute('data-page');
          this.navigateTo(page);
          
          // Close sidebar on mobile
          if (window.innerWidth < 768) {
            this.toggleNavSidebar(false);
          }
        });
      });
    
      // Search input
      const searchInput = document.getElementById('search-input');
      if (searchInput) {
        searchInput.addEventListener('input', this.debounce(() => {
          const query = searchInput.value.trim();
          if (query.length >= 2) {
            this.handleSearch(query);
          }
        }, 300));
      }
    }
  }
  
  /**
   * Initialize router
   */
  initRouter() {
    // Parse the current URL
    const path = window.location.pathname.replace(/^\/+/, '');
    const page = path || 'dashboard';
    
    // Navigate to the appropriate page
    if (this.isAuthenticated) {
      this.showApp();
      this.navigateTo(page);
    } else {
      this.showLogin();
    }
    
    // Set up popstate event listener for browser back/forward navigation
    window.addEventListener('popstate', (event) => {
      if (event.state && event.state.page) {
        this.navigateTo(event.state.page, true);
      }
    });
  }
  
  /**
   * Navigate to a specific page
   */
  navigateTo(page, skipPushState = false) {
    // Check authentication
    if (!this.isAuthenticated && page !== 'login') {
      this.showLogin();
      return;
    }
    
    this.currentPage = page;

    // Update page title
    this.updatePageTitle(page);

    // Update active nav link
    this.updateActiveNavLink(page);

    // Load page content
    this.loadPage(page);

    // Update URL if not triggered by popstate
    if (!skipPushState) {
      const url = page === 'dashboard' ? '/' : `/${page}`;
      window.history.pushState({ page }, '', url);
    }
  }
  
  /**
   * Update page title based on current page
   */
  updatePageTitle(page) {
    const titles = {
      'dashboard': 'Dashboard',
      'media': 'Media Library',
      'downloads': 'Downloads',
      'files': 'File Manager',
      'docker': 'Docker Containers',
      'jellyfin': 'Jellyfin',
      'settings': 'Settings'
    };
    
    const title = titles[page] || 'Dashboard';
    this.pageTitle.textContent = title;
    document.title = `${title} - Pandora Box`;
  }
  
  /**
   * Update active navigation link
   */
  updateActiveNavLink(page) {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      const linkPage = link.getAttribute('data-page');
      if (linkPage === page) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }
  
  async loadPage(page) {
    try {
      const pageContainer = document.getElementById('page-container');
      if (!pageContainer) {
        console.error('Page container not found');
        return;
      }

      // Load HTML
      const htmlContent = await this.loadPageContent(`pages/${page}.html`);
      pageContainer.innerHTML = htmlContent;

      // Load CSS
      let oldLink = document.getElementById('page-css');
      if (oldLink) {
        oldLink.remove();
      }
      const link = document.createElement('link');
      link.id = 'page-css';
      link.rel = 'stylesheet';
      link.href = `/pages/${page}.css`;
      document.head.appendChild(link);

      // Load JavaScript
      let oldScript = document.getElementById('page-script');
      if (oldScript) {
        oldScript.remove();
      }
      const script = document.createElement('script');
      script.id = 'page-script';
      script.type = 'module';
      script.src = `/pages/${page}.js`;
      document.body.appendChild(script);

      // Wait for script to load and then call init function if it exists
      await new Promise(resolve => {
        script.onload = resolve;
        script.onerror = () => {
          console.warn(`Failed to load script: /pages/${page}.js`);
          resolve(); // Resolve anyway to not block the app
        };
      });

      // Call init function if it exists in the loaded module
      const module = await import(`/pages/${page}.js`);
      const initFunctionName = `init${page.charAt(0).toUpperCase() + page.slice(1)}`;
      if (module[initFunctionName]) {
        module[initFunctionName]();
      } else {
        console.warn(`Init function ${initFunctionName} not found in /pages/${page}.js`);
      }

    } catch (error) {
      console.error(`Failed to load ${page} page:`, error);
      // Fallback to dashboard if a page fails to load
      if (page !== 'dashboard') {
        this.navigateTo('dashboard');
      }
    }
  }

  async loadPageContent(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.text();
  }
  
  /**
   * Show login page
   */
  async showLogin() {
    try {
      const response = await fetch('/pages/login.html');
      const html = await response.text();
      document.getElementById('login-page').innerHTML = html;
      document.getElementById('login-page').classList.add('active');
      document.getElementById('main-app').classList.remove('active');
      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to load login page:', error);
    }
  }
  
  /**
   * Show main application
   */
  async showApp() {
    try {
      const response = await fetch('/pages/main-app.html');
      const html = await response.text();
      document.getElementById('main-app').innerHTML = html;
      document.getElementById('login-page').classList.remove('active');
      document.getElementById('main-app').classList.add('active');
      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to load main app:', error);
    }
  }
  
  /**
   * Handle login form submission
   */
  async handleLogin() {
    try {
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      
      if (!username || !password) {
        this.showToast('Please enter both username and password', 'error');
        return;
      }
      
      // Show loading state
      const loginButton = document.querySelector('#login-form button[type="submit"]');
      const originalText = loginButton.textContent;
      loginButton.disabled = true;
      loginButton.innerHTML = '<span class="loader loader-sm"></span> Logging in...';
      
      // Send login request to the server
      const response = await this.apiRequest('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      // Reset button state
      loginButton.disabled = false;
      loginButton.textContent = originalText;
      
      if (response.token) {
        // Store token in IndexedDB
        await this.saveToDb('auth', { id: 'token', value: response.token });
        
        // Set authentication state
        this.isAuthenticated = true;
        this.currentUser = response.user;
        
        // Show the main application
        this.showApp();
        this.navigateTo('dashboard');
        
        this.showToast('Login successful', 'success');
      } else {
        this.showToast('Invalid username or password', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      this.showToast('Login failed. Please try again.', 'error');
      
      // Reset button state
      const loginButton = document.querySelector('#login-form button[type="submit"]');
      loginButton.disabled = false;
      loginButton.textContent = 'Login';
    }
  }
  
  /**
   * Handle logout
   */
  async handleLogout() {
    try {
      // Remove token from IndexedDB
      await this.removeFromDB('auth', 'token');
      
      // Reset authentication state
      this.isAuthenticated = false;
      this.currentUser = null;
      
      // Show login page
      this.showLogin();
      
      this.showToast('Logged out successfully', 'info');
    } catch (error) {
      console.error('Logout error:', error);
      this.showToast('Logout failed', 'error');
    }
  }
  
  /**
   * Toggle navigation sidebar
   */
  toggleNavSidebar(show = null) {
    if (show === null) {
      this.navSidebar.classList.toggle('active');
    } else if (show) {
      this.navSidebar.classList.add('active');
    } else {
      this.navSidebar.classList.remove('active');
    }
  }
  

  

  
  /**
   * Handle search input
   */
  async handleSearch(query) {
    // Implementation for search functionality
    // This would search across media, downloads, etc.
  }
  
  /**
   * Toggle between light and dark theme
   */
  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    this.saveToDb('settings', { id: 'theme', value: newTheme });
    
    // Update theme toggle icon
    this.updateThemeToggleIcon(newTheme);
  }
  
  /**
   * Apply saved theme
   */
  async applyTheme() {
    try {
      const themeSetting = await this.getFromDB('settings', 'theme');
    const theme = themeSetting ? themeSetting.value : 'netflix';
      
      document.documentElement.setAttribute('data-theme', theme);
      this.updateThemeToggleIcon(theme);
    } catch (error) {
      console.error('Error applying theme:', error);
    }
  }
  
  /**
   * Update theme toggle icon based on current theme
   */
  updateThemeToggleIcon(theme) {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.querySelector('.icon-sun').classList.toggle('hidden', theme === 'dark');
      themeToggle.querySelector('.icon-moon').classList.toggle('hidden', theme === 'light');
    }
  }
  
  /**
   * Initialize toast notification system
   */
  initToastSystem() {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }
    
    // Toast class definition
    window.Toast = class {
      constructor(options) {
        this.message = options.message || '';
        this.type = options.type || 'info';
        this.duration = options.duration !== undefined ? options.duration : 3000;
        this.action = options.action || null;
        this.toastElement = null;
      }
      
      show() {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${this.type}`;
        
        // Set icon based on type
        let icon = '';
        switch (this.type) {
          case 'success':
            iconClass = 'icon-check-circle';
            break;
          case 'error':
            iconClass = 'icon-x-circle';
            break;
          case 'warning':
            iconClass = 'icon-alert-triangle';
            break;
          default: // info
            iconClass = 'icon-info';
        }
        
        // Build toast content
        let toastContent = `
          <div class="toast-icon"><i class="${iconClass}"></i></div>
          <div class="toast-content">
            <p class="toast-message">${this.message}</p>
            ${this.action ? `<button class="btn btn-sm btn-primary mt-sm">${this.action.text}</button>` : ''}
          </div>
          <button class="toast-close"><i class="icon-x"></i></button>
        `;
        
        toast.innerHTML = toastContent;
        
        // Add to container
        const toastContainer = document.querySelector('.toast-container');
        toastContainer.appendChild(toast);
        
        // Store reference
        this.toastElement = toast;
        
        // Add event listeners
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this.hide());
        
        // Add action button event listener if provided
        if (this.action) {
          const actionBtn = toast.querySelector('.btn');
          actionBtn.addEventListener('click', () => {
            this.action.callback();
            this.hide();
          });
        }
        
        // Auto-hide after duration (if not 0)
        if (this.duration > 0) {
          this.autoHideTimeout = setTimeout(() => this.hide(), this.duration);
        }
        
        return this;
      }
      
      hide() {
        if (this.toastElement) {
          this.toastElement.classList.add('hide');
          
          // Remove after animation completes
          setTimeout(() => {
            if (this.toastElement && this.toastElement.parentNode) {
              this.toastElement.parentNode.removeChild(this.toastElement);
            }
          }, 300);
          
          // Clear timeout if it exists
          if (this.autoHideTimeout) {
            clearTimeout(this.autoHideTimeout);
          }
        }
      }
    };
  }
  
  /**
   * Show a toast notification
   */
  showToast(message, type = 'info', duration = 3000) {
    const toast = new Toast({
      message,
      type,
      duration
    });
    toast.show();
  }
  
  /**
   * Make an API request
   */
  async apiRequest(endpoint, options = {}) {
    try {
      // Get auth token if available
      const token = await this.getFromDB('auth', 'token');
      
      // Set default headers
      const headers = options.headers || {};
      
      // Add authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token.value}`;
      }
      
      // Set content type if not specified and method is POST/PUT
      if ((options.method === 'POST' || options.method === 'PUT') && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }
      
      // Make the request
      const requestUrl = `${this.apiBaseUrl}${endpoint}`;
      console.log('API Request URL:', requestUrl);
      const response = await fetch(requestUrl, {
        method: options.method || 'GET',
        headers,
        body: options.body
      });
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        
        // Check for error response
        if (!response.ok) {
          throw new Error(data.message || 'API request failed');
        }
        
        return data;
      } else {
        // Handle non-JSON responses
        if (!response.ok) {
          throw new Error('API request failed');
        }
        
        return await response.text();
      }
    } catch (error) {
      console.error(`API request error (${endpoint}):`, error);
      throw error;
    }
  }
  
  /**
   * Save data to IndexedDB
   */
  async saveToDb(storeName, data) {
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(data);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Get data from IndexedDB
   */
  async getFromDB(storeName, key) {
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Remove data from IndexedDB
   */
  async removeFromDB(storeName, key) {
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(key);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Load user settings
   */
  async loadSettings() {
    try {
      // Try to load settings from IndexedDB
      const settingsStore = this.db.transaction('settings', 'readonly').objectStore('settings');
      
      return new Promise((resolve, reject) => {
        const request = settingsStore.getAll();
        
        request.onsuccess = () => {
          const settings = {};
          request.result.forEach(item => {
            settings[item.id] = item.value;
          });
          
          this.settings = settings;
          resolve(settings);
        };
        
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error loading settings:', error);
      return {};
    }
  }
  
  /**
   * Debounce function for search input
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new PandoraBoxApp();
});