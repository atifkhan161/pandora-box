/**
 * Pandora Box PWA - Main Application
 */

export class PandoraBoxApp {
  constructor() {
    this.apiBaseUrl = '/api';
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
    this.setupEventListeners();
    
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
    this.loginPage = document.getElementById('login-page');
    this.mainApp = document.getElementById('main-app');
    this.navSidebar = document.getElementById('nav-sidebar');
    this.pageContainer = document.getElementById('page-container');
    this.pageTitle = document.getElementById('page-title');
    
    // Initialize component libraries if needed
    this.initToastSystem();
  }
  
  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Login form submission
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleLogin();
      });
    }
    
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
    
    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => p.classList.remove('active'));
    
    // Show the requested page
    const targetPage = document.getElementById(`${page}-page`);
    if (targetPage) {
      targetPage.classList.add('active');
      this.currentPage = page;
      
      // Update page title
      this.updatePageTitle(page);
      
      // Update active nav link
      this.updateActiveNavLink(page);
      
      // Load page content if needed
      this.loadPageContent(page);
      
      // Update URL if not triggered by popstate
      if (!skipPushState) {
        const url = page === 'dashboard' ? '/' : `/${page}`;
        window.history.pushState({ page }, '', url);
      }
    } else {
      console.error(`Page not found: ${page}`);
      this.navigateTo('dashboard');
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
  
  /**
   * Load content for the current page
   */
  async loadPageContent(page) {
    switch (page) {
      case 'dashboard':
        await this.loadDashboard();
        break;
      case 'media':
        await this.loadMediaLibrary();
        break;
      case 'downloads':
        await this.loadDownloads();
        break;
      case 'files':
        await this.loadFileManager();
        break;
      case 'docker':
        await this.loadDockerContainers();
        break;
      case 'jellyfin':
        await this.loadJellyfin();
        break;
      case 'settings':
        await this.loadSettings();
        break;
      default:
        break;
    }
  }
  
  /**
   * Show login page
   */
  showLogin() {
    this.loginPage.style.display = 'flex';
    this.mainApp.style.display = 'none';
  }
  
  /**
   * Show main application
   */
  showApp() {
    this.loginPage.style.display = 'none';
    this.mainApp.style.display = 'block';
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
   * Load dashboard content
   */
  async loadDashboard() {
    try {
      const dashboardPage = document.getElementById('dashboard-page');
      
      // Show loading state
      dashboardPage.innerHTML = '<div class="text-center"><span class="loader loader-lg"></span><p>Loading dashboard...</p></div>';
      
      // Fetch data from API
      const [mediaStats, downloadStats, systemStats] = await Promise.all([
        this.apiRequest('/library/stats'),
        this.apiRequest('/downloads/stats'),
        this.apiRequest('/system/stats')
      ]);
      
      // Build dashboard content
      let html = `
        <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--spacing-lg);">
          <!-- Media Stats Card -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Media Library</h3>
            </div>
            <div class="card-body">
              <div class="flex justify-between mb-md">
                <div>
                  <div class="text-xl">${mediaStats.movies || 0}</div>
                  <div>Movies</div>
                </div>
                <div>
                  <div class="text-xl">${mediaStats.shows || 0}</div>
                  <div>TV Shows</div>
                </div>
                <div>
                  <div class="text-xl">${mediaStats.episodes || 0}</div>
                  <div>Episodes</div>
                </div>
              </div>
              <button class="btn btn-primary btn-sm" data-page="media">Browse Library</button>
            </div>
          </div>
          
          <!-- Downloads Stats Card -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Downloads</h3>
            </div>
            <div class="card-body">
              <div class="flex justify-between mb-md">
                <div>
                  <div class="text-xl">${downloadStats.active || 0}</div>
                  <div>Active</div>
                </div>
                <div>
                  <div class="text-xl">${downloadStats.completed || 0}</div>
                  <div>Completed</div>
                </div>
                <div>
                  <div class="text-xl">${downloadStats.paused || 0}</div>
                  <div>Paused</div>
                </div>
              </div>
              <button class="btn btn-primary btn-sm" data-page="downloads">Manage Downloads</button>
            </div>
          </div>
          
          <!-- System Stats Card -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">System</h3>
            </div>
            <div class="card-body">
              <div class="mb-sm">
                <div class="flex justify-between mb-xs">
                  <span>CPU</span>
                  <span>${systemStats.cpu || 0}%</span>
                </div>
                <div class="progress">
                  <div class="progress-bar" style="width: ${systemStats.cpu || 0}%"></div>
                </div>
              </div>
              <div class="mb-sm">
                <div class="flex justify-between mb-xs">
                  <span>Memory</span>
                  <span>${systemStats.memory || 0}%</span>
                </div>
                <div class="progress">
                  <div class="progress-bar" style="width: ${systemStats.memory || 0}%"></div>
                </div>
              </div>
              <div class="mb-sm">
                <div class="flex justify-between mb-xs">
                  <span>Disk</span>
                  <span>${systemStats.disk || 0}%</span>
                </div>
                <div class="progress">
                  <div class="progress-bar" style="width: ${systemStats.disk || 0}%"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Recent Media -->
        <div class="mt-lg">
          <h3 class="mb-md">Recently Added Media</h3>
          <div class="grid">
            ${this.renderRecentMedia(mediaStats.recent || [])}
          </div>
        </div>
      `;
      
      dashboardPage.innerHTML = html;
      
      // Set up event listeners for navigation buttons
      dashboardPage.querySelectorAll('[data-page]').forEach(button => {
        button.addEventListener('click', () => {
          const page = button.getAttribute('data-page');
          this.navigateTo(page);
        });
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
      document.getElementById('dashboard-page').innerHTML = `
        <div class="alert alert-error">
          <div class="alert-content">
            <div class="alert-title">Error Loading Dashboard</div>
            <p class="alert-message">Failed to load dashboard content. Please try again later.</p>
          </div>
        </div>
      `;
    }
  }
  
  /**
   * Render recent media items
   */
  renderRecentMedia(items) {
    if (!items || items.length === 0) {
      return '<p>No recent media found.</p>';
    }
    
    return items.map(item => `
      <div class="media-card">
        <img src="${item.poster || '/assets/images/placeholder-poster.jpg'}" alt="${item.title}" class="media-card-image">
        <div class="media-card-overlay">
          <h4 class="media-card-title">${item.title}</h4>
          <div class="media-card-info">${item.year || ''} ${item.type === 'show' ? '• TV Show' : '• Movie'}</div>
        </div>
        <div class="media-card-actions">
          <button class="media-card-action" data-id="${item.id}" data-action="play">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>
          <button class="media-card-action" data-id="${item.id}" data-action="info">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
            </svg>
          </button>
        </div>
      </div>
    `).join('');
  }
  
  /**
   * Load media library content
   */
  async loadMediaLibrary() {
    // Implementation for media library page
    // This would fetch media items from the API and render them
  }
  
  /**
   * Load downloads content
   */
  async loadDownloads() {
    // Implementation for downloads page
    // This would fetch active downloads and render them
  }
  
  /**
   * Load file manager content
   */
  async loadFileManager() {
    // Implementation for file manager page
    // This would fetch directory contents and render them
  }
  
  /**
   * Load docker containers content
   */
  async loadDockerContainers() {
    // Implementation for docker containers page
    // This would fetch container information and render it
  }
  
  /**
   * Load Jellyfin content
   */
  async loadJellyfin() {
    // Implementation for Jellyfin page
    // This would load the Jellyfin interface or redirect to it
  }
  
  /**
   * Load settings content
   */
  async loadSettings() {
    // Implementation for settings page
    // This would fetch user settings and render the form
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
      const theme = themeSetting ? themeSetting.value : 'dark';
      
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
      if (theme === 'dark') {
        themeToggle.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
        `;
      } else {
        themeToggle.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        `;
      }
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
            icon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
            break;
          case 'error':
            icon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
            break;
          case 'warning':
            icon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
            break;
          default: // info
            icon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
        }
        
        // Build toast content
        let toastContent = `
          <div class="toast-icon">${icon}</div>
          <div class="toast-content">
            <p class="toast-message">${this.message}</p>
            ${this.action ? `<button class="btn btn-sm btn-primary mt-sm">${this.action.text}</button>` : ''}
          </div>
          <button class="toast-close">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
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
      const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
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