/**
 * Authentication State Management
 * Manages authentication state using Framework7's store
 */

import { createStore } from 'framework7/lite'
import authService from '../services/auth.js'

// Create authentication store
const authStore = createStore({
  state: {
    isAuthenticated: false,
    user: null,
    loading: false,
    error: null
  },
  
  getters: {
    isAuthenticated({ state }) {
      return state.isAuthenticated
    },
    
    user({ state }) {
      return state.user
    },
    
    isAdmin({ state }) {
      return state.user && state.user.role === 'admin'
    },
    
    loading({ state }) {
      return state.loading
    },
    
    error({ state }) {
      return state.error
    }
  },
  
  actions: {
    // Initialize authentication state
    async initAuth({ state }) {
      state.loading = true
      state.error = null
      
      try {
        // Load stored authentication data
        await authService.loadStoredAuth()
        
        if (authService.isAuthenticated()) {
          state.isAuthenticated = true
          state.user = authService.getUser()
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        state.error = 'Failed to initialize authentication'
      } finally {
        state.loading = false
      }
    },
    
    // Login action
    async login({ state }, { username, password, rememberMe }) {
      state.loading = true
      state.error = null
      
      try {
        const result = await authService.login(username, password, rememberMe)
        
        if (result.success) {
          state.isAuthenticated = true
          state.user = result.user
          return { success: true }
        } else {
          state.error = result.error
          return { success: false, error: result.error }
        }
      } catch (error) {
        console.error('Login action error:', error)
        state.error = 'Login failed. Please try again.'
        return { success: false, error: state.error }
      } finally {
        state.loading = false
      }
    },
    
    // Logout action
    async logout({ state }) {
      state.loading = true
      
      try {
        await authService.logout()
      } catch (error) {
        console.error('Logout action error:', error)
      } finally {
        state.isAuthenticated = false
        state.user = null
        state.loading = false
        state.error = null
      }
    },
    
    // Clear error
    clearError({ state }) {
      state.error = null
    },
    
    // Update user data
    updateUser({ state }, userData) {
      if (state.isAuthenticated) {
        state.user = { ...state.user, ...userData }
      }
    }
  }
})

export default authStore