// Authentication Service for Pandora Box
import { apiService } from './api.js'

class AuthService {
  constructor() {
    this.token = null
    this.user = null
    this.tokenKey = 'pandora_auth_token'
    this.userKey = 'pandora_user_data'
    this.refreshTimeout = null
  }

  // Initialize authentication service
  async init() {
    try {
      // Load token from IndexedDB
      await this.loadTokenFromStorage()
      
      if (this.token) {
        // Verify token is still valid
        const isValid = await this.verifyToken()
        if (isValid) {
          this.scheduleTokenRefresh()
        } else {
          await this.logout()
        }
      }
    } catch (error) {
      console.error('Auth service initialization failed:', error)
      await this.logout()
    }
  }

  // Login with username and password
  async login(username, password, rememberMe = false) {
    try {
      const response = await apiService.post('/auth/login', {
        username,
        password,
        rememberMe
      })

      if (response.success) {
        this.token = response.data.token
        this.user = response.data.user
        
        // Store in IndexedDB
        await this.saveTokenToStorage()
        await this.saveUserToStorage()
        
        // Schedule token refresh
        this.scheduleTokenRefresh()
        
        return { success: true, user: this.user }
      } else {
        throw new Error(response.message || 'Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      throw new Error(error.message || 'Login failed')
    }
  }

  // Logout user
  async logout() {
    try {
      if (this.token) {
        // Call logout endpoint
        await apiService.post('/auth/logout')
      }
    } catch (error) {
      console.error('Logout API call failed:', error)
    } finally {
      // Clear local data regardless of API call result
      this.token = null
      this.user = null
      
      if (this.refreshTimeout) {
        clearTimeout(this.refreshTimeout)
        this.refreshTimeout = null
      }
      
      await this.clearStorage()
      
      // Redirect to login
      if (window.app && window.app.view.main.router) {
        window.app.view.main.router.navigate('/login/', {
          clearPreviousHistory: true
        })
      }
    }
  }

  // Verify current token
  async verifyToken() {
    if (!this.token) {
      return false
    }

    try {
      const response = await apiService.get('/auth/verify')
      return response.success
    } catch (error) {
      console.error('Token verification failed:', error)
      return false
    }
  }

  // Refresh JWT token
  async refreshToken() {
    if (!this.token) {
      throw new Error('No token to refresh')
    }

    try {
      const response = await apiService.post('/auth/refresh')
      
      if (response.success) {
        this.token = response.data.token
        await this.saveTokenToStorage()
        this.scheduleTokenRefresh()
        return true
      } else {
        throw new Error(response.message || 'Token refresh failed')
      }
    } catch (error) {
      console.error('Token refresh failed:', error)
      await this.logout()
      return false
    }
  }

  // Change password
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await apiService.put('/auth/password', {
        currentPassword,
        newPassword
      })

      if (response.success) {
        return { success: true, message: 'Password changed successfully' }
      } else {
        throw new Error(response.message || 'Password change failed')
      }
    } catch (error) {
      console.error('Password change error:', error)
      throw new Error(error.message || 'Password change failed')
    }
  }

  // Get current authentication status
  isAuthenticated() {
    return !!this.token && !!this.user
  }

  // Get current user
  getCurrentUser() {
    return this.user
  }

  // Get current token
  getToken() {
    return this.token
  }

  // Check if user has admin role
  isAdmin() {
    return this.user && this.user.role === 'admin'
  }

  // Check if user has specific role
  hasRole(role) {
    return this.user && this.user.role === role
  }

  // Schedule automatic token refresh
  scheduleTokenRefresh() {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout)
    }

    // Parse token to get expiry time
    try {
      const tokenData = this.parseJWT(this.token)
      const expiryTime = tokenData.exp * 1000 // Convert to milliseconds
      const currentTime = Date.now()
      const timeUntilExpiry = expiryTime - currentTime
      
      // Refresh token 5 minutes before expiry
      const refreshTime = Math.max(timeUntilExpiry - (5 * 60 * 1000), 60000)
      
      this.refreshTimeout = setTimeout(() => {
        this.refreshToken()
      }, refreshTime)
      
    } catch (error) {
      console.error('Error scheduling token refresh:', error)
      // Fallback: refresh in 30 minutes
      this.refreshTimeout = setTimeout(() => {
        this.refreshToken()
      }, 30 * 60 * 1000)
    }
  }

  // Parse JWT token
  parseJWT(token) {
    try {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      }).join(''))
      
      return JSON.parse(jsonPayload)
    } catch (error) {
      console.error('Error parsing JWT:', error)
      return null
    }
  }

  // Save token to IndexedDB
  async saveTokenToStorage() {
    try {
      await this.setItem(this.tokenKey, this.token)
    } catch (error) {
      console.error('Error saving token to storage:', error)
    }
  }

  // Save user data to IndexedDB
  async saveUserToStorage() {
    try {
      await this.setItem(this.userKey, JSON.stringify(this.user))
    } catch (error) {
      console.error('Error saving user to storage:', error)
    }
  }

  // Load token from IndexedDB
  async loadTokenFromStorage() {
    try {
      this.token = await this.getItem(this.tokenKey)
      const userData = await this.getItem(this.userKey)
      if (userData) {
        this.user = JSON.parse(userData)
      }
    } catch (error) {
      console.error('Error loading from storage:', error)
      this.token = null
      this.user = null
    }
  }

  // Clear storage
  async clearStorage() {
    try {
      await this.removeItem(this.tokenKey)
      await this.removeItem(this.userKey)
    } catch (error) {
      console.error('Error clearing storage:', error)
    }
  }

  // IndexedDB helper methods
  async openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('PandoraBoxDB', 1)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result
        if (!db.objectStoreNames.contains('auth')) {
          db.createObjectStore('auth', { keyPath: 'key' })
        }
      }
    })
  }

  async setItem(key, value) {
    const db = await this.openDB()
    const transaction = db.transaction(['auth'], 'readwrite')
    const store = transaction.objectStore('auth')
    return store.put({ key, value })
  }

  async getItem(key) {
    const db = await this.openDB()
    const transaction = db.transaction(['auth'], 'readonly')
    const store = transaction.objectStore('auth')
    const result = await store.get(key)
    return result ? result.value : null
  }

  async removeItem(key) {
    const db = await this.openDB()
    const transaction = db.transaction(['auth'], 'readwrite')
    const store = transaction.objectStore('auth')
    return store.delete(key)
  }
}

// Create and export singleton instance
export const authService = new AuthService()