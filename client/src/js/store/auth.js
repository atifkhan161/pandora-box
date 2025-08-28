/**
 * Authentication State Management
 * Vanilla JavaScript implementation
 */

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
  }

  /**
   * Initialize the auth store
   */
  async init() {
    this.setState({ loading: true, error: null });
    
    try {
      // Check for stored authentication
      const token = localStorage.getItem('pb-auth-token');
      const user = localStorage.getItem('pb-user');
      
      if (token && user) {
        this.setState({
          isAuthenticated: true,
          user: JSON.parse(user),
          loading: false
        });
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
      // For now, implement a simple demo login
      // This will be replaced with actual API calls in task 3.2
      if (username === 'admin' && password === 'admin') {
        const user = {
          id: '1',
          username: 'admin',
          role: 'admin',
          name: 'Administrator'
        };

        // Store authentication data
        if (rememberMe) {
          localStorage.setItem('pb-auth-token', 'demo-token');
          localStorage.setItem('pb-user', JSON.stringify(user));
        }

        this.setState({
          isAuthenticated: true,
          user: user,
          loading: false
        });

        return { success: true };
      } else {
        this.setState({
          error: 'Invalid username or password',
          loading: false
        });
        return { success: false, error: 'Invalid username or password' };
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
      // Clear stored authentication data
      localStorage.removeItem('pb-auth-token');
      localStorage.removeItem('pb-user');
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
      
      // Update stored user data
      localStorage.setItem('pb-user', JSON.stringify(updatedUser));
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