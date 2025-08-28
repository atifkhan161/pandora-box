/**
 * Authentication Service
 * Handles user authentication, JWT token management, and session storage
 */

import storage from '../utils/storage.js';
import jwtManager from '../utils/jwt-manager.js';

class AuthService {
  constructor() {
    this.baseURL = '/api/v1/auth'
    this.token = null
    this.user = null
    
    // Initialize from stored data
    this.loadStoredAuth()
  }

  /**
   * Load authentication data from storage
   */
  async loadStoredAuth() {
    try {
      // Try IndexedDB first, then fallback to localStorage
      let storedToken = await storage.getAuthToken()
      let storedUser = await storage.getUserData()
      
      // Fallback to localStorage if IndexedDB fails
      if (!storedToken) {
        storedToken = localStorage.getItem('pandora_auth_token') || sessionStorage.getItem('pandora_auth_token')
      }
      
      if (!storedUser) {
        const userStr = localStorage.getItem('pandora_user_data') || sessionStorage.getItem('pandora_user_data')
        if (userStr) {
          storedUser = JSON.parse(userStr)
        }
      }
      
      if (storedToken && storedUser) {
        // Check if token structure is valid
        if (!jwtManager.isValidTokenStructure(storedToken)) {
          console.warn('Invalid token structure, clearing auth');
          this.clearAuth();
          return;
        }

        // Check if token is expired
        if (jwtManager.isTokenExpired(storedToken)) {
          console.warn('Token expired, clearing auth');
          this.clearAuth();
          return;
        }

        this.token = storedToken;
        this.user = storedUser;
        
        // Verify token with server
        const isValid = await this.verifyToken();
        if (isValid) {
          // Schedule automatic token refresh
          this.scheduleTokenRefresh();
        } else {
          this.clearAuth();
        }
      }
    } catch (error) {
      console.error('Error loading stored auth:', error)
      this.clearAuth()
    }
  }

  /**
   * Login with username and password
   * @param {string} username 
   * @param {string} password 
   * @param {boolean} rememberMe 
   * @returns {Promise<{success: boolean, user?: object, error?: string}>}
   */
  async login(username, password, rememberMe = false) {
    try {
      const response = await fetch(`${this.baseURL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          password,
          rememberMe
        })
      })

      const data = await response.json()

      if (response.ok && data.token) {
        // Store authentication data
        this.token = data.token;
        this.user = data.user;
        
        // Store authentication data
        try {
          if (rememberMe) {
            // Store in IndexedDB with 90-day TTL for persistent storage
            await storage.setAuthToken(this.token, 90 * 24 * 60 * 60 * 1000);
            await storage.setUserData(this.user);
            
            // Also store in localStorage as fallback
            localStorage.setItem('pandora_auth_token', this.token);
            localStorage.setItem('pandora_user_data', JSON.stringify(this.user));
          } else {
            // Store in sessionStorage for session-only persistence
            sessionStorage.setItem('pandora_auth_token', this.token);
            sessionStorage.setItem('pandora_user_data', JSON.stringify(this.user));
          }
        } catch (error) {
          console.error('Error storing auth data:', error);
          // Fallback to localStorage
          localStorage.setItem('pandora_auth_token', this.token);
          localStorage.setItem('pandora_user_data', JSON.stringify(this.user));
        }

        // Schedule automatic token refresh
        this.scheduleTokenRefresh();

        return {
          success: true,
          user: this.user
        };
      } else {
        return {
          success: false,
          error: data.message || 'Login failed'
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      return {
        success: false,
        error: 'Network error. Please try again.'
      }
    }
  }

  /**
   * Logout user and clear stored data
   */
  async logout() {
    try {
      // Call logout endpoint if token exists
      if (this.token) {
        await fetch(`${this.baseURL}/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local auth data
      await this.clearAuth();
    }
  }

  /**
   * Verify if current token is valid
   * @returns {Promise<boolean>}
   */
  async verifyToken() {
    if (!this.token) return false

    try {
      const response = await fetch(`${this.baseURL}/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      })

      return response.ok
    } catch (error) {
      console.error('Token verification error:', error)
      return false
    }
  }

  /**
   * Refresh authentication token
   * @returns {Promise<boolean>}
   */
  async refreshToken() {
    if (!this.token) return false

    try {
      const response = await fetch(`${this.baseURL}/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          this.token = data.token;
          
          // Update stored token
          try {
            await storage.setAuthToken(this.token, 90 * 24 * 60 * 60 * 1000);
          } catch (error) {
            console.error('Error updating token in IndexedDB:', error);
          }
          
          if (localStorage.getItem('pandora_auth_token')) {
            localStorage.setItem('pandora_auth_token', this.token);
          } else if (sessionStorage.getItem('pandora_auth_token')) {
            sessionStorage.setItem('pandora_auth_token', this.token);
          }
          
          // Schedule next refresh
          this.scheduleTokenRefresh();
          
          return true;
        }
      }
      
      return false
    } catch (error) {
      console.error('Token refresh error:', error)
      return false
    }
  }

  /**
   * Get current authentication token
   * @returns {string|null}
   */
  getToken() {
    return this.token
  }

  /**
   * Get current user data
   * @returns {object|null}
   */
  getUser() {
    return this.user
  }

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!(this.token && this.user)
  }

  /**
   * Check if user has specific role
   * @param {string} role 
   * @returns {boolean}
   */
  hasRole(role) {
    return this.user && this.user.role === role
  }

  /**
   * Check if user is admin
   * @returns {boolean}
   */
  isAdmin() {
    return this.hasRole('admin')
  }

  /**
   * Schedule automatic token refresh
   */
  scheduleTokenRefresh() {
    if (!this.token) return;

    jwtManager.scheduleRefresh(this.token, async () => {
      return await this.refreshToken();
    });
  }

  /**
   * Clear refresh timer
   */
  clearRefreshTimer() {
    jwtManager.clearRefreshTimer();
  }

  /**
   * Get token information
   * @returns {object|null}
   */
  getTokenInfo() {
    if (!this.token) return null;

    return {
      claims: jwtManager.getTokenClaims(this.token),
      expiresAt: jwtManager.getExpiryTimeString(this.token),
      timeRemaining: jwtManager.getTimeRemainingString(this.token),
      isExpired: jwtManager.isTokenExpired(this.token),
      shouldRefresh: jwtManager.shouldRefreshToken(this.token)
    };
  }

  /**
   * Clear all authentication data
   */
  async clearAuth() {
    // Clear refresh timer
    this.clearRefreshTimer();
    
    this.token = null;
    this.user = null;
    
    // Clear from IndexedDB
    try {
      await storage.clearAuth();
    } catch (error) {
      console.error('Error clearing auth from IndexedDB:', error);
    }
    
    // Clear from both localStorage and sessionStorage
    localStorage.removeItem('pandora_auth_token');
    localStorage.removeItem('pandora_user_data');
    sessionStorage.removeItem('pandora_auth_token');
    sessionStorage.removeItem('pandora_user_data');
  }

  /**
   * Get authorization header for API requests
   * @returns {object}
   */
  getAuthHeaders() {
    if (this.token) {
      return {
        'Authorization': `Bearer ${this.token}`
      }
    }
    return {}
  }
}

// Create singleton instance
const authService = new AuthService()

export default authService