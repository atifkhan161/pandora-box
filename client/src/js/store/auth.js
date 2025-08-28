/**
 * Authentication State Management
 * Simple reactive state manager for authentication
 */

import authService from '../services/auth.js'

class AuthStore {
  constructor() {
    this.state = {
      isAuthenticated: false,
      user: null,
      loading: false,
      error: null
    }
    
    this.listeners = new Set()
  }

  // Subscribe to state changes
  subscribe(callback) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  // Notify all listeners of state changes
  notify() {
    this.listeners.forEach(callback => callback(this.state))
  }

  // Update state and notify listeners
  setState(updates) {
    this.state = { ...this.state, ...updates }
    this.notify()
  }

  // Getters
  getters = {
    isAuthenticated: {
      get value() {
        return authStore.state.isAuthenticated
      }
    },
    
    user: {
      get value() {
        return authStore.state.user
      }
    },
    
    isAdmin: {
      get value() {
        return authStore.state.user && authStore.state.user.role === 'admin'
      }
    },
    
    loading: {
      get value() {
        return authStore.state.loading
      }
    },
    
    error: {
      get value() {
        return authStore.state.error
      }
    }
  }

  // Actions
  async dispatch(action, payload) {
    switch (action) {
      case 'initAuth':
        return this.initAuth()
      case 'login':
        return this.login(payload)
      case 'logout':
        return this.logout()
      case 'clearError':
        return this.clearError()
      case 'updateUser':
        return this.updateUser(payload)
      default:
        throw new Error(`Unknown action: ${action}`)
    }
  }

  // Initialize authentication state
  async initAuth() {
    this.setState({ loading: true, error: null })
    
    try {
      // Load stored authentication data
      await authService.loadStoredAuth()
      
      if (authService.isAuthenticated()) {
        this.setState({
          isAuthenticated: true,
          user: authService.getUser(),
          loading: false
        })
      } else {
        this.setState({ loading: false })
      }
    } catch (error) {
      console.error('Auth initialization error:', error)
      this.setState({
        error: 'Failed to initialize authentication',
        loading: false
      })
    }
  }

  // Login action
  async login({ username, password, rememberMe }) {
    this.setState({ loading: true, error: null })
    
    try {
      const result = await authService.login(username, password, rememberMe)
      
      if (result.success) {
        this.setState({
          isAuthenticated: true,
          user: result.user,
          loading: false
        })
        return { success: true }
      } else {
        this.setState({
          error: result.error,
          loading: false
        })
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Login action error:', error)
      const errorMessage = 'Login failed. Please try again.'
      this.setState({
        error: errorMessage,
        loading: false
      })
      return { success: false, error: errorMessage }
    }
  }

  // Logout action
  async logout() {
    this.setState({ loading: true })
    
    try {
      await authService.logout()
    } catch (error) {
      console.error('Logout action error:', error)
    } finally {
      this.setState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null
      })
    }
  }

  // Clear error
  clearError() {
    this.setState({ error: null })
  }

  // Update user data
  updateUser(userData) {
    if (this.state.isAuthenticated) {
      this.setState({
        user: { ...this.state.user, ...userData }
      })
    }
  }
}

// Create singleton instance
const authStore = new AuthStore()

export default authStore