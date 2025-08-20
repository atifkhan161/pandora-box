/**
 * Authentication Utilities for Pandora Box PWA
 * Handles user authentication, token management, and session control
 */

class Auth {
  constructor() {
    this.currentUser = null;
    this.isAuthenticated = false;
    this.authToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    this.db = window.DB; // Reference to the DB utility
    this.api = window.ApiClient; // Reference to the API client
    
    // Bind methods
    this.initialize = this.initialize.bind(this);
    this.login = this.login.bind(this);
    this.logout = this.logout.bind(this);
    this.refreshSession = this.refreshSession.bind(this);
    this.checkSession = this.checkSession.bind(this);
    this.handleAuthError = this.handleAuthError.bind(this);
  }
  
  /**
   * Initialize authentication state from IndexedDB
   * @returns {Promise<boolean>} - Whether the user is authenticated
   */
  async initialize() {
    try {
      // Get auth data from IndexedDB
      const authData = await this.db.get('auth', 'currentSession');
      
      if (authData && authData.authToken) {
        // Check if token is expired
        if (authData.tokenExpiry && new Date(authData.tokenExpiry) > new Date()) {
          // Set auth state
          this.currentUser = authData.user;
          this.authToken = authData.authToken;
          this.refreshToken = authData.refreshToken;
          this.tokenExpiry = authData.tokenExpiry;
          this.isAuthenticated = true;
          
          // Set token in API client
          this.api.setAuthToken(this.authToken);
          
          // Schedule token refresh if needed
          this._scheduleTokenRefresh();
          
          return true;
        } else if (authData.refreshToken) {
          // Try to refresh the token
          return await this.refreshSession();
        }
      }
      
      // No valid auth data
      return false;
    } catch (error) {
      console.error('Auth initialization error:', error);
      return false;
    }
  }
  
  /**
   * Log in a user
   * @param {string} username - The username
   * @param {string} password - The password
   * @param {boolean} rememberMe - Whether to remember the user
   * @returns {Promise<Object>} - The login result
   */
  async login(username, password, rememberMe = false) {
    try {
      // Call login API
      const response = await this.api.post('/auth/login', { username, password });
      
      if (response && response.token) {
        // Set auth state
        this.currentUser = response.user;
        this.authToken = response.token;
        this.refreshToken = response.refreshToken;
        this.tokenExpiry = response.tokenExpiry;
        this.isAuthenticated = true;
        
        // Set token in API client
        this.api.setAuthToken(this.authToken);
        
        // Save to IndexedDB if rememberMe is true
        if (rememberMe) {
          await this._saveAuthData();
        }
        
        // Schedule token refresh
        this._scheduleTokenRefresh();
        
        // Dispatch auth event
        this._dispatchAuthEvent('login');
        
        return {
          success: true,
          user: this.currentUser
        };
      }
      
      return {
        success: false,
        error: 'Invalid credentials'
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.message || 'Login failed'
      };
    }
  }
  
  /**
   * Log out the current user
   * @returns {Promise<boolean>} - Whether logout was successful
   */
  async logout() {
    try {
      // Call logout API if authenticated
      if (this.isAuthenticated) {
        try {
          await this.api.post('/auth/logout', { refreshToken: this.refreshToken });
        } catch (error) {
          console.warn('Logout API error:', error);
          // Continue with local logout even if API fails
        }
      }
      
      // Clear auth state
      this.currentUser = null;
      this.authToken = null;
      this.refreshToken = null;
      this.tokenExpiry = null;
      this.isAuthenticated = false;
      
      // Clear token in API client
      this.api.clearAuthToken();
      
      // Clear from IndexedDB
      await this.db.delete('auth', 'currentSession');
      
      // Clear any token refresh timeout
      if (this._refreshTimeout) {
        clearTimeout(this._refreshTimeout);
        this._refreshTimeout = null;
      }
      
      // Dispatch auth event
      this._dispatchAuthEvent('logout');
      
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  }
  
  /**
   * Refresh the authentication session
   * @returns {Promise<boolean>} - Whether refresh was successful
   */
  async refreshSession() {
    try {
      if (!this.refreshToken) {
        return false;
      }
      
      // Call refresh token API
      const response = await this.api.post('/auth/refresh', { refreshToken: this.refreshToken });
      
      if (response && response.token) {
        // Update auth state
        this.authToken = response.token;
        this.refreshToken = response.refreshToken || this.refreshToken;
        this.tokenExpiry = response.tokenExpiry;
        this.isAuthenticated = true;
        
        // Update user info if provided
        if (response.user) {
          this.currentUser = response.user;
        }
        
        // Set token in API client
        this.api.setAuthToken(this.authToken);
        
        // Save updated auth data
        await this._saveAuthData();
        
        // Schedule token refresh
        this._scheduleTokenRefresh();
        
        // Dispatch auth event
        this._dispatchAuthEvent('refresh');
        
        return true;
      }
      
      // Refresh failed, log out
      await this.logout();
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      // Refresh failed, log out
      await this.logout();
      return false;
    }
  }
  
  /**
   * Check if the current session is valid
   * @returns {boolean} - Whether the session is valid
   */
  checkSession() {
    if (!this.isAuthenticated || !this.tokenExpiry) {
      return false;
    }
    
    // Check if token is expired
    return new Date(this.tokenExpiry) > new Date();
  }
  
  /**
   * Handle authentication errors
   * @param {Object} error - The error object
   * @returns {Promise<void>}
   */
  async handleAuthError(error) {
    // Check if error is due to authentication
    if (error && error.status === 401) {
      // Try to refresh token
      const refreshed = await this.refreshSession();
      
      if (!refreshed) {
        // Redirect to login page
        window.location.hash = '#/login';
        
        // Show error toast
        if (window.UIComponents && window.UIComponents.createToast) {
          window.UIComponents.createToast('Session expired. Please log in again.', 'error');
        }
      }
    }
  }
  
  /**
   * Get the current user
   * @returns {Object|null} - The current user or null if not authenticated
   */
  getCurrentUser() {
    return this.currentUser;
  }
  
  /**
   * Check if the user has a specific role
   * @param {string|Array} role - The role or roles to check
   * @returns {boolean} - Whether the user has the role
   */
  hasRole(role) {
    if (!this.isAuthenticated || !this.currentUser || !this.currentUser.roles) {
      return false;
    }
    
    if (Array.isArray(role)) {
      return role.some(r => this.currentUser.roles.includes(r));
    }
    
    return this.currentUser.roles.includes(role);
  }
  
  /**
   * Register a new user
   * @param {Object} userData - The user data
   * @returns {Promise<Object>} - The registration result
   */
  async register(userData) {
    try {
      // Call register API
      const response = await this.api.post('/auth/register', userData);
      
      if (response && response.success) {
        return {
          success: true,
          message: response.message || 'Registration successful'
        };
      }
      
      return {
        success: false,
        error: response.error || 'Registration failed'
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error.message || 'Registration failed'
      };
    }
  }
  
  /**
   * Request a password reset
   * @param {string} email - The email address
   * @returns {Promise<Object>} - The reset request result
   */
  async requestPasswordReset(email) {
    try {
      // Call password reset API
      const response = await this.api.post('/auth/reset-password', { email });
      
      if (response && response.success) {
        return {
          success: true,
          message: response.message || 'Password reset email sent'
        };
      }
      
      return {
        success: false,
        error: response.error || 'Password reset request failed'
      };
    } catch (error) {
      console.error('Password reset request error:', error);
      return {
        success: false,
        error: error.message || 'Password reset request failed'
      };
    }
  }
  
  /**
   * Reset a password with a token
   * @param {string} token - The reset token
   * @param {string} newPassword - The new password
   * @returns {Promise<Object>} - The reset result
   */
  async resetPassword(token, newPassword) {
    try {
      // Call password reset confirmation API
      const response = await this.api.post('/auth/reset-password/confirm', {
        token,
        newPassword
      });
      
      if (response && response.success) {
        return {
          success: true,
          message: response.message || 'Password reset successful'
        };
      }
      
      return {
        success: false,
        error: response.error || 'Password reset failed'
      };
    } catch (error) {
      console.error('Password reset error:', error);
      return {
        success: false,
        error: error.message || 'Password reset failed'
      };
    }
  }
  
  /**
   * Update the current user's password
   * @param {string} currentPassword - The current password
   * @param {string} newPassword - The new password
   * @returns {Promise<Object>} - The update result
   */
  async updatePassword(currentPassword, newPassword) {
    try {
      if (!this.isAuthenticated) {
        return {
          success: false,
          error: 'Not authenticated'
        };
      }
      
      // Call update password API
      const response = await this.api.post('/auth/update-password', {
        currentPassword,
        newPassword
      });
      
      if (response && response.success) {
        return {
          success: true,
          message: response.message || 'Password updated successfully'
        };
      }
      
      return {
        success: false,
        error: response.error || 'Password update failed'
      };
    } catch (error) {
      console.error('Password update error:', error);
      return {
        success: false,
        error: error.message || 'Password update failed'
      };
    }
  }
  
  /**
   * Update the current user's profile
   * @param {Object} profileData - The profile data to update
   * @returns {Promise<Object>} - The update result
   */
  async updateProfile(profileData) {
    try {
      if (!this.isAuthenticated) {
        return {
          success: false,
          error: 'Not authenticated'
        };
      }
      
      // Call update profile API
      const response = await this.api.put('/auth/profile', profileData);
      
      if (response && response.success) {
        // Update current user data
        this.currentUser = { ...this.currentUser, ...response.user };
        
        // Save updated auth data
        await this._saveAuthData();
        
        return {
          success: true,
          message: response.message || 'Profile updated successfully',
          user: this.currentUser
        };
      }
      
      return {
        success: false,
        error: response.error || 'Profile update failed'
      };
    } catch (error) {
      console.error('Profile update error:', error);
      return {
        success: false,
        error: error.message || 'Profile update failed'
      };
    }
  }
  
  /**
   * Save authentication data to IndexedDB
   * @private
   * @returns {Promise<void>}
   */
  async _saveAuthData() {
    if (!this.db) return;
    
    try {
      await this.db.put('auth', {
        id: 'currentSession',
        user: this.currentUser,
        authToken: this.authToken,
        refreshToken: this.refreshToken,
        tokenExpiry: this.tokenExpiry,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error saving auth data:', error);
    }
  }
  
  /**
   * Schedule a token refresh before expiry
   * @private
   */
  _scheduleTokenRefresh() {
    // Clear any existing timeout
    if (this._refreshTimeout) {
      clearTimeout(this._refreshTimeout);
      this._refreshTimeout = null;
    }
    
    if (!this.tokenExpiry) return;
    
    const expiryDate = new Date(this.tokenExpiry);
    const now = new Date();
    
    // Calculate time until token expires (in milliseconds)
    let timeUntilExpiry = expiryDate.getTime() - now.getTime();
    
    // If token is already expired, don't schedule refresh
    if (timeUntilExpiry <= 0) return;
    
    // Refresh token when 90% of its lifetime has passed
    const refreshTime = timeUntilExpiry * 0.9;
    
    // Schedule token refresh
    this._refreshTimeout = setTimeout(() => {
      this.refreshSession();
    }, refreshTime);
  }
  
  /**
   * Dispatch an authentication event
   * @private
   * @param {string} type - The event type
   */
  _dispatchAuthEvent(type) {
    const event = new CustomEvent('auth', {
      detail: {
        type,
        user: this.currentUser,
        isAuthenticated: this.isAuthenticated
      }
    });
    
    document.dispatchEvent(event);
  }
}

// Create and export the auth instance
window.Auth = new Auth();