/**
 * Authentication State Management
 * Vanilla JavaScript implementation
 */

import authService from '../services/auth.js';

class AuthStore {
  constructor() {
    this.state = {
      isAuthenticated: false,
      user: null,
      loading: false,
      error: null
    };
    
    this.listeners = new Set();
    this.authChangeListeners = new Set();
    this.authService = authService;
  }

  /**
   * Initialize the auth store
   */
  async init() {
    this.setState({ loading: true, error: null });
    
    try {
      // Load stored authentication from service
      await this.authService.loadStoredAuth();
      
      // Check if user is authenticated
      if (this.authService.isAuthenticated()) {
        // Verify token is still valid
        const isValid = await this.authService.verifyToken();
        
        if (isValid) {
          this.setState({
            isAuthenticated: true,
            user: this.authService.getUser(),
            loading: false
          });
          
          // Initialize WebSocket connection
          await this.initializeWebSocket();
        } else {
          // Token is invalid, clear auth
          await this.authService.clearAuth();
          this.setState({ loading: false });
        }
      } else {
        this.setState({ loading: false });
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      this.setState({
        error: 'Failed to initialize authentication',
        loading: false
      });
    }
  }

  /**
   * Subscribe to state changes
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Subscribe to authentication changes
   */
  onAuthChange(callback) {
    this.authChangeListeners.add(callback);
    return () => this.authChangeListeners.delete(callback);
  }

  /**
   * Notify all listeners of state changes
   */
  notify() {
    this.listeners.forEach(callback => callback(this.state));
  }

  /**
   * Notify auth change listeners
   */
  notifyAuthChange() {
    this.authChangeListeners.forEach(callback => 
      callback(this.state.isAuthenticated)
    );
  }

  /**
   * Update state and notify listeners
   */
  setState(updates) {
    const wasAuthenticated = this.state.isAuthenticated;
    this.state = { ...this.state, ...updates };
    
    // Notify general listeners
    this.notify();
    
    // Notify auth change listeners if authentication status changed
    if (wasAuthenticated !== this.state.isAuthenticated) {
      this.notifyAuthChange();
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return this.state.isAuthenticated;
  }

  /**
   * Get current user
   */
  getUser() {
    return this.state.user;
  }

  /**
   * Check if user is admin
   */
  isAdmin() {
    return this.state.user && this.state.user.role === 'admin';
  }

  /**
   * Login user
   */
  async login({ username, password, rememberMe }) {
    this.setState({ loading: true, error: null });
    
    try {
      // Use authentication service for login
      const result = await this.authService.login(username, password, rememberMe);
      
      if (result.success) {
        this.setState({
          isAuthenticated: true,
          user: result.user,
          loading: false
        });
        
        // Initialize WebSocket connection
        await this.initializeWebSocket();
        
        return { success: true, user: result.user };
      } else {
        this.setState({
          error: result.error,
          loading: false
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = 'Login failed. Please try again.';
      this.setState({
        error: errorMessage,
        loading: false
      });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Logout user
   */
  async logout() {
    this.setState({ loading: true });
    
    try {
      // Disconnect WebSocket first
      this.disconnectWebSocket();
      
      // Use authentication service for logout
      await this.authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.setState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null
      });
    }
  }

  /**
   * Clear error state
   */
  clearError() {
    this.setState({ error: null });
  }

  /**
   * Update user data
   */
  updateUser(userData) {
    if (this.state.isAuthenticated) {
      const updatedUser = { ...this.state.user, ...userData };
      this.setState({ user: updatedUser });
      
      // Update user data in auth service
      this.authService.user = updatedUser;
      
      // Update stored user data via storage service
      import('../utils/storage.js').then(({ default: storage }) => {
        storage.setUserData(updatedUser);
      });
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken() {
    try {
      const success = await this.authService.refreshToken();
      if (!success) {
        // Token refresh failed, logout user
        await this.logout();
        return false;
      }
      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      await this.logout();
      return false;
    }
  }

  /**
   * Get authentication token
   */
  getToken() {
    return this.authService.getToken();
  }

  /**
   * Get authorization headers for API requests
   */
  getAuthHeaders() {
    return this.authService.getAuthHeaders();
  }

  /**
   * Initialize WebSocket connection
   */
  async initializeWebSocket() {
    if (window.wsClient && this.state.isAuthenticated) {
      try {
        await window.wsClient.connect();
        console.log('WebSocket connection initialized');
      } catch (error) {
        console.warn('Failed to initialize WebSocket:', error);
      }
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnectWebSocket() {
    if (window.wsClient) {
      window.wsClient.disconnect();
      console.log('WebSocket disconnected');
    }
  }

  /**
   * Get current state
   */
  getState() {
    return { ...this.state };
  }
}

export default AuthStore;