/**
 * Pandora Box - Vanilla JavaScript PWA
 * Main application initialization and setup
 */

// Import core modules
import Router from './router.js';
import themeManager from './utils/theme-manager.js';
import AuthStore from './store/auth.js';
import WebSocketClient from './services/websocket.js';

// Import page controllers
import DashboardPage from './pages/dashboard.js';
import LoginPage from './pages/login.js';
import DownloadsPage from './pages/downloads.js';
import FilesPage from './pages/files.js';
import ContainersPage from './pages/containers.js';
import JellyfinPage from './pages/jellyfin.js';
import SettingsPage from './pages/settings.js';

/**
 * Main Application Class
 */
class PandoraApp {
  constructor() {
    this.router = null;
    this.themeManager = null;
    this.authStore = null;
    this.wsClient = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the application
   */
  async init() {
    if (this.isInitialized) return;

    try {
      console.log('Initializing Pandora Box...');

      // Initialize core services
      await this.initializeServices();

      // Setup navigation
      this.setupNavigation();

      // Setup authentication first
      await this.initializeAuth();

      // Setup routing after auth is initialized
      this.setupRouting();

      // Initialize theme system
      await this.initializeTheme();

      // Setup WebSocket connection
      this.initializeWebSocket();

      // Hide loading screen
      this.hideLoadingScreen();

      this.isInitialized = true;
      console.log('Pandora Box initialized successfully');

    } catch (error) {
      console.error('Failed to initialize Pandora Box:', error);
      this.showError('Failed to initialize application');
    }
  }

  /**
   * Initialize core services
   */
  async initializeServices() {
    // Initialize router
    this.router = new Router();

    // Use singleton theme manager
    this.themeManager = themeManager;

    // Initialize auth store
    this.authStore = new AuthStore();

    // Initialize WebSocket client
    this.wsClient = new WebSocketClient();

    // Make services globally available for debugging
    window.app = this;
    window.router = this.router;
    window.themeManager = this.themeManager;
    window.authStore = this.authStore;
    window.wsClient = this.wsClient;
  }

  /**
   * Setup navigation functionality
   */
  setupNavigation() {
    const navToggle = document.getElementById('nav-toggle');
    const navigation = document.getElementById('main-navigation');
    const backdrop = document.getElementById('nav-backdrop');

    if (navToggle && navigation && backdrop) {
      // Toggle navigation
      navToggle.addEventListener('click', () => {
        const isOpen = navigation.classList.contains('nav-open');
        
        if (isOpen) {
          this.closeNavigation();
        } else {
          this.openNavigation();
        }
      });

      // Close navigation when clicking backdrop
      backdrop.addEventListener('click', () => {
        this.closeNavigation();
      });

      // Handle keyboard navigation
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navigation.classList.contains('nav-open')) {
          this.closeNavigation();
        }
      });

      // Handle navigation link clicks
      navigation.addEventListener('click', (e) => {
        const link = e.target.closest('.nav-link');
        if (link) {
          // Close navigation on mobile
          this.closeNavigation();
        }
      });
    }
  }

  /**
   * Open navigation
   */
  openNavigation() {
    const navigation = document.getElementById('main-navigation');
    const backdrop = document.getElementById('nav-backdrop');

    if (navigation && backdrop) {
      navigation.classList.add('nav-open');
      backdrop.classList.add('active');
      
      // Focus first navigation link for accessibility
      const firstLink = navigation.querySelector('.nav-link');
      if (firstLink) {
        setTimeout(() => firstLink.focus(), 100);
      }
    }
  }

  /**
   * Close navigation
   */
  closeNavigation() {
    const navigation = document.getElementById('main-navigation');
    const backdrop = document.getElementById('nav-backdrop');

    if (navigation && backdrop) {
      navigation.classList.remove('nav-open');
      backdrop.classList.remove('active');
    }
  }

  /**
   * Setup application routing
   */
  setupRouting() {
    // Register routes
    this.router.addRoute('/', DashboardPage, { 
      requiresAuth: true, 
      title: 'Dashboard - Pandora Box' 
    });
    
    this.router.addRoute('/login', LoginPage, { 
      requiresAuth: false, 
      title: 'Login - Pandora Box' 
    });
    
    this.router.addRoute('/downloads', DownloadsPage, { 
      requiresAuth: true, 
      title: 'Downloads - Pandora Box' 
    });
    
    this.router.addRoute('/files', FilesPage, { 
      requiresAuth: true, 
      title: 'Files - Pandora Box' 
    });
    
    this.router.addRoute('/containers', ContainersPage, { 
      requiresAuth: true, 
      title: 'Containers - Pandora Box' 
    });
    
    this.router.addRoute('/jellyfin', JellyfinPage, { 
      requiresAuth: true, 
      title: 'Jellyfin - Pandora Box' 
    });
    
    this.router.addRoute('/settings', SettingsPage, { 
      requiresAuth: true, 
      title: 'Settings - Pandora Box' 
    });

    // Initialize router after auth is set up
    this.router.init();
  }

  /**
   * Initialize theme system
   */
  async initializeTheme() {
    await this.themeManager.init();
    
    // Load saved theme or default to Netflix theme
    const savedTheme = localStorage.getItem('pb-theme') || 'netflix';
    await this.themeManager.setTheme(savedTheme);
  }

  /**
   * Initialize authentication
   */
  async initializeAuth() {
    console.log('Initializing authentication...');
    
    // Override router's authentication check before initializing auth store
    this.router.isAuthenticated = () => {
      const currentPath = window.location.pathname;
      
      // Always allow access to login page to prevent redirect loops
      if (currentPath === '/login') {
        return true;
      }
      
      // Check if auth store exists and is initialized
      if (!this.authStore) {
        return false;
      }
      
      // Check if auth store is still loading
      const authState = this.authStore.getState();
      if (authState.loading) {
        return true; // Allow navigation while loading
      }
      
      return this.authStore.isAuthenticated();
    };
    
    try {
      await this.authStore.init();
      console.log('Authentication initialized successfully');
    } catch (error) {
      console.error('Authentication initialization failed:', error);
      // Don't throw here, let the app continue with unauthenticated state
    }
  }

  /**
   * Initialize WebSocket connection
   */
  initializeWebSocket() {
    // Only connect if authenticated
    if (this.authStore.isAuthenticated()) {
      this.wsClient.connect();
    }

    // Listen for auth changes to manage WebSocket connection
    this.authStore.onAuthChange((isAuthenticated) => {
      if (isAuthenticated) {
        this.wsClient.connect();
      } else {
        this.wsClient.disconnect();
      }
    });
  }

  /**
   * Hide loading screen
   */
  hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.style.opacity = '0';
      setTimeout(() => {
        loadingScreen.remove();
      }, 300);
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    console.error('App Error:', message);
    
    // Create error overlay
    const errorEl = document.createElement('div');
    errorEl.className = 'app-error-overlay';
    errorEl.innerHTML = `
      <div class="error-content">
        <h2>Application Error</h2>
        <p>${message}</p>
        <button class="btn btn-primary" onclick="window.location.reload()">
          Reload Application
        </button>
      </div>
    `;

    document.body.appendChild(errorEl);
  }

  /**
   * Get current route path
   */
  getCurrentPath() {
    return this.router ? this.router.getCurrentPath() : '/';
  }

  /**
   * Navigate to path
   */
  navigate(path) {
    if (this.router) {
      this.router.navigate(path);
    }
  }

  /**
   * Destroy the application
   */
  destroy() {
    if (this.router) {
      this.router.destroy();
    }
    
    if (this.wsClient) {
      this.wsClient.disconnect();
    }

    this.isInitialized = false;
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  try {
    console.log('DOM loaded, initializing Pandora App...');
    const app = new PandoraApp();
    await app.init();
    console.log('Pandora App initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Pandora App:', error);
    
    // Show error to user
    const errorEl = document.createElement('div');
    errorEl.style.cssText = `
      position: fixed; top: 20px; left: 20px; right: 20px;
      background: #ff4444; color: white; padding: 15px;
      border-radius: 4px; z-index: 9999;
    `;
    errorEl.innerHTML = `
      <strong>Application Error:</strong> ${error.message}<br>
      <small>Check console for details. <a href="#" onclick="window.location.reload()" style="color: white;">Reload page</a></small>
    `;
    document.body.appendChild(errorEl);
  }
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
  if (window.app && window.app.wsClient) {
    if (document.hidden) {
      // Page is hidden, could pause some operations
      console.log('Page hidden');
    } else {
      // Page is visible, resume operations
      console.log('Page visible');
      if (window.app.authStore.isAuthenticated()) {
        window.app.wsClient.reconnect();
      }
    }
  }
});

export default PandoraApp;