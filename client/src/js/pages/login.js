/**
 * Login Page Controller
 * Vanilla JavaScript implementation
 */
import BasePage from './base-page.js';
import { validateUsername, validatePassword } from '../utils/validators.js';

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
      this.showValidationError('Form elements not found');
      return;
    }

    // Get form values
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const rememberMe = rememberCheckbox ? rememberCheckbox.checked : false;

    // Validate inputs
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.isValid) {
      this.showValidationError(usernameValidation.message);
      usernameInput.focus();
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      this.showValidationError(passwordValidation.message);
      passwordInput.focus();
      return;
    }

    // Show loading state
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Signing In...';
    submitButton.disabled = true;

    try {
      // Clear any previous errors
      this.clearValidationErrors();

      // Attempt login using auth store
      if (window.authStore) {
        const result = await window.authStore.login({
          username,
          password,
          rememberMe
        });

        if (result.success) {
          // Show success message
          this.showSuccessToast('Login successful!');

          // Initialize WebSocket connection if available
          if (window.wsClient && typeof window.wsClient.connect === 'function') {
            try {
              await window.wsClient.connect();
            } catch (wsError) {
              console.warn('WebSocket connection failed:', wsError);
              // Don't block login for WebSocket failures
            }
          }

          // Clear form
          usernameInput.value = '';
          passwordInput.value = '';
          if (rememberCheckbox) rememberCheckbox.checked = false;

          // Redirect to dashboard after short delay
          setTimeout(() => {
            if (window.router) {
              window.router.navigate('/dashboard');
            } else {
              // Fallback navigation
              window.location.href = '/dashboard';
            }
          }, 1000);
        } else {
          this.showValidationError(result.error || 'Login failed');
          // Focus back to username field for retry
          usernameInput.focus();
        }
      } else {
        throw new Error('Authentication store not available');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Show appropriate error message
      if (error.name === 'ApiError' && error.status === 401) {
        this.showValidationError('Invalid username or password');
      } else if (error.name === 'ApiError' && error.status >= 500) {
        this.showValidationError('Server error. Please try again later.');
      } else if (error.message.includes('Network')) {
        this.showValidationError('Network error. Please check your connection.');
      } else {
        this.showValidationError('Login failed. Please try again.');
      }
      
      // Focus back to username field for retry
      usernameInput.focus();
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
   * Clear validation errors
   */
  clearValidationErrors() {
    const existingErrors = this.querySelectorAll('.validation-error');
    existingErrors.forEach(error => error.remove());
  }

  /**
   * Show validation error
   */
  showValidationError(message) {
    // Remove existing error messages
    this.clearValidationErrors();

    // Create error element
    const errorEl = document.createElement('div');
    errorEl.className = 'validation-error';
    errorEl.innerHTML = `
      <div class="error-content">
        <span class="error-icon">⚠️</span>
        <span class="error-message">${message}</span>
      </div>
    `;

    // Insert after form
    const form = this.querySelector('#login-form');
    if (form) {
      form.insertAdjacentElement('afterend', errorEl);
      
      // Add animation
      setTimeout(() => {
        errorEl.classList.add('show');
      }, 10);
      
      // Remove after 8 seconds
      setTimeout(() => {
        errorEl.classList.remove('show');
        setTimeout(() => {
          if (errorEl.parentNode) {
            errorEl.remove();
          }
        }, 300);
      }, 8000);
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