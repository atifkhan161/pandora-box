/**
 * Login Page Controller
 * Vanilla JavaScript implementation
 */
import BasePage from './base-page.js';

class LoginPage extends BasePage {
  constructor() {
    super();
    this.templatePath = '/src/pages/login.html';
  }

  /**
   * Setup page-specific logic
   */
  async setupPage() {
    this.setTitle('Login');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Login form handler
    const loginForm = this.querySelector('#login-form');
    if (loginForm) {
      this.addEventListener(loginForm, 'submit', (e) => {
        e.preventDefault();
        this.handleLogin();
      });
    }

    // Enter key handler for password field
    const passwordInput = this.querySelector('input[name="password"]');
    if (passwordInput) {
      this.addEventListener(passwordInput, 'keypress', (e) => {
        if (e.key === 'Enter') {
          this.handleLogin();
        }
      });
    }

    // Demo login button
    const demoLoginBtn = this.querySelector('#demo-login-btn');
    if (demoLoginBtn) {
      this.addEventListener(demoLoginBtn, 'click', () => {
        this.fillDemoCredentials();
      });
    }
  }

  /**
   * Load initial data
   */
  async loadData() {
    // Auto-focus username field
    setTimeout(() => {
      const usernameInput = this.querySelector('input[name="username"]');
      if (usernameInput) {
        usernameInput.focus();
      }
    }, 300);
  }

  /**
   * Handle login form submission
   */
  async handleLogin() {
    const usernameInput = this.querySelector('input[name="username"]');
    const passwordInput = this.querySelector('input[name="password"]');
    const rememberCheckbox = this.querySelector('input[name="remember"]');
    const submitButton = this.querySelector('button[type="submit"]');

    if (!usernameInput || !passwordInput || !submitButton) {
      this.showError('Form elements not found');
      return;
    }

    // Get form values
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const rememberMe = rememberCheckbox ? rememberCheckbox.checked : false;

    // Validate inputs
    if (!username || !password) {
      this.showValidationError('Please enter both username and password');
      return;
    }

    // Show loading state
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Signing In...';
    submitButton.disabled = true;

    try {
      // Attempt login
      if (window.authStore) {
        const result = await window.authStore.login({
          username,
          password,
          rememberMe
        });

        if (result.success) {
          // Show success message
          this.showSuccessToast('Login successful!');

          // Initialize WebSocket connection
          if (window.wsClient) {
            window.wsClient.connect();
          }

          // Redirect to dashboard
          setTimeout(() => {
            if (window.router) {
              window.router.navigate('/');
            }
          }, 1000);
        } else {
          this.showValidationError(result.error || 'Login failed');
        }
      } else {
        // Demo login for development
        this.showSuccessToast('Demo login successful!');
        setTimeout(() => {
          if (window.router) {
            window.router.navigate('/');
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Login error:', error);
      this.showValidationError('Network error. Please try again.');
    } finally {
      // Reset button state
      submitButton.textContent = originalText;
      submitButton.disabled = false;
    }
  }

  /**
   * Fill demo credentials
   */
  fillDemoCredentials() {
    const usernameInput = this.querySelector('input[name="username"]');
    const passwordInput = this.querySelector('input[name="password"]');

    if (usernameInput && passwordInput) {
      usernameInput.value = 'admin';
      passwordInput.value = 'admin';
      
      this.showSuccessToast('Demo credentials filled');
    }
  }

  /**
   * Show validation error
   */
  showValidationError(message) {
    // Remove existing error messages
    const existingError = this.querySelector('.validation-error');
    if (existingError) {
      existingError.remove();
    }

    // Create error element
    const errorEl = document.createElement('div');
    errorEl.className = 'validation-error';
    errorEl.textContent = message;

    // Insert after form
    const form = this.querySelector('#login-form');
    if (form) {
      form.insertAdjacentElement('afterend', errorEl);
      
      // Remove after 5 seconds
      setTimeout(() => {
        if (errorEl.parentNode) {
          errorEl.remove();
        }
      }, 5000);
    }
  }

  /**
   * Show success toast
   */
  showSuccessToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast toast-success';
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  /**
   * Post-render hook
   */
  onRender() {
    console.log('Login page rendered');
    
    // Check if already authenticated
    if (window.authStore && window.authStore.isAuthenticated()) {
      // Redirect to dashboard if already logged in
      if (window.router) {
        window.router.navigate('/');
      }
    }
  }

  /**
   * Cleanup when leaving page
   */
  destroy() {
    // Clear any error states when leaving
    if (window.authStore && typeof window.authStore.clearError === 'function') {
      window.authStore.clearError();
    }
    
    super.destroy();
  }
}

export default LoginPage;