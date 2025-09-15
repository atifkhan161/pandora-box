/**
 * Authentication Service for Pandora Box
 * Handles user authentication and session management
 */

import api from './api.js';

export class AuthService {
  constructor() {
    this.tokenKey = 'auth_token';
    this.userKey = 'user_data';
  }
  
  /**
   * Authenticate user with username and password
   * @param {string} username - User's username
   * @param {string} password - User's password
   * @returns {Promise<Object>} - Authentication result
   */
  async login(username, password) {
    try {
      const response = await api.post('/auth/login', { username, password });
      
      if (response && response.success) {
        // For now, we're using a placeholder token since the backend doesn't provide one yet
        const token = 'placeholder-token';
        this.setToken(token);
        this.setUser(response.user);
        return response;
      }
      
      throw new Error(response.message || 'Invalid login response');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }
  
  /**
   * Log out the current user
   */
  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    window.location.href = '/';
  }
  
  /**
   * Store authentication token
   * @param {string} token - JWT token
   */
  setToken(token) {
    localStorage.setItem(this.tokenKey, token);
  }
  
  /**
   * Get stored authentication token
   * @returns {string|null} - JWT token or null if not found
   */
  getToken() {
    return localStorage.getItem(this.tokenKey);
  }
  
  /**
   * Store user data
   * @param {Object} user - User data
   */
  setUser(user) {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }
  
  /**
   * Get stored user data
   * @returns {Object|null} - User data or null if not found
   */
  getUser() {
    const userData = localStorage.getItem(this.userKey);
    return userData ? JSON.parse(userData) : null;
  }
  
  /**
   * Check if user is authenticated
   * @returns {boolean} - True if authenticated, false otherwise
   */
  isAuthenticated() {
    return !!this.getToken();
  }
}

// Create and export auth service instance
const auth = new AuthService();
export default auth;