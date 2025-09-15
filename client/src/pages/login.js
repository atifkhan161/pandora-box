/**
 * Login Page Handler
 * Manages login form submission and validation
 */

import auth from '../services/auth.js';

document.addEventListener('DOMContentLoaded', () => {
  // Get form elements
  const loginForm = document.getElementById('login-form');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const errorMessage = document.getElementById('error-message');
  
  // Check if user is already logged in
  if (auth.isAuthenticated()) {
    // Redirect to dashboard
    window.location.href = '/dashboard.html';
    return;
  }
  
  // Handle form submission
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    // Clear previous error messages
    hideError();
    
    // Get form values
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    // Validate form
    if (!username || !password) {
      showError('Please enter both username and password');
      return;
    }
    
    try {
      // Disable form during login attempt
      setFormLoading(true);
      
      // Attempt login
      await auth.login(username, password);
      
      // Redirect to dashboard on success
      window.location.href = '/dashboard.html';
    } catch (error) {
      // Show error message
      showError(error.message || 'Invalid username or password');
      
      // Re-enable form
      setFormLoading(false);
    }
  });
  
  /**
   * Show error message
   * @param {string} message - Error message to display
   */
  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
  }
  
  /**
   * Hide error message
   */
  function hideError() {
    errorMessage.textContent = '';
    errorMessage.classList.remove('show');
  }
  
  /**
   * Set form loading state
   * @param {boolean} isLoading - Whether form is in loading state
   */
  function setFormLoading(isLoading) {
    const submitButton = loginForm.querySelector('button[type="submit"]');
    
    if (isLoading) {
      submitButton.disabled = true;
      submitButton.textContent = 'Logging in...';
      usernameInput.disabled = true;
      passwordInput.disabled = true;
    } else {
      submitButton.disabled = false;
      submitButton.textContent = 'Login';
      usernameInput.disabled = false;
      passwordInput.disabled = false;
    }
  }
});