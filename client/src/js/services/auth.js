/**
 * Authentication Service for Pandora PWA
 * Handles user authentication, profile management, and user administration
 */

import { apiClient } from './api.js'
import { JWTManager } from '../utils/jwt-manager.js'

export class AuthService {
  constructor(client = apiClient) {
    this.client = client
    this.jwtManager = new JWTManager()
  }

  /**
   * Login user with credentials
   * @param {string} username - Username
   * @param {string} password - Password
   * @param {boolean} rememberMe - Whether to persist session
   * @returns {Promise<Object>} Login response with user data and tokens
   */
  async login(username, password, rememberMe = false) {
    try {
      const response = await this.client.post('auth/login', {
        username,
        password,
        rememberMe
      })

      // Handle server response format
      const accessToken = response.data?.token || response.accessToken
      const refreshToken = response.data?.refreshToken || response.refreshToken
      const user = response.data?.user || response.user

      // Store tokens based on rememberMe preference
      if (accessToken) {
        if (rememberMe) {
          // Store in localStorage for persistent login
          await this.jwtManager.setTokens(accessToken, refreshToken)
          console.log('Tokens stored persistently (remember me enabled)')
        } else {
          // Store in sessionStorage for session-only login
          await this.jwtManager.setSessionTokens(accessToken, refreshToken)
          console.log('Tokens stored for session only')
        }
        
        // Store the rememberMe preference for future reference
        try {
          if (rememberMe) {
            localStorage.setItem('pb_remember_me', 'true')
          } else {
            localStorage.removeItem('pb_remember_me')
            sessionStorage.setItem('pb_remember_me', 'false')
          }
        } catch (storageError) {
          console.warn('Could not store rememberMe preference:', storageError)
        }
      }

      return {
        success: true,
        user: user,
        accessToken: accessToken,
        refreshToken: refreshToken
      }
    } catch (error) {
      console.error('Login failed:', error)
      return {
        success: false,
        error: error.message || 'Login failed'
      }
    }
  }

  /**
   * Logout current user
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      await this.client.post('auth/logout')
    } catch (error) {
      console.error('Logout request failed:', error)
      // Continue with local cleanup even if server request fails
    } finally {
      // Always clear local tokens
      this.jwtManager.clearTokens()
    }
  }

  /**
   * Refresh authentication token
   * @returns {Promise<boolean>} Success status
   */
  async refreshToken() {
    try {
      const refreshToken = await this.jwtManager.getRefreshToken()
      if (!refreshToken) {
        console.log('No refresh token available')
        return false
      }

      console.log('Attempting to refresh token...')
      const response = await this.client.post('auth/refresh', {
        refreshToken
      })

      // Handle server response format
      const accessToken = response.data?.token || response.accessToken
      const newRefreshToken = response.data?.refreshToken || response.refreshToken

      // Update stored tokens
      if (accessToken) {
        // Determine storage type based on existing token location
        const hasLocalToken = localStorage.getItem('pb_access_token')
        
        if (hasLocalToken) {
          await this.jwtManager.setTokens(accessToken, newRefreshToken || refreshToken)
        } else {
          await this.jwtManager.setSessionTokens(accessToken, newRefreshToken || refreshToken)
        }
        
        console.log('Token refreshed successfully')
        return true
      }

      console.log('No access token in refresh response')
      return false
    } catch (error) {
      console.error('Token refresh failed:', error)
      this.jwtManager.clearTokens()
      return false
    }
  }

  /**
   * Verify current token
   * @returns {Promise<Object>} Token verification result
   */
  async verifyToken() {
    try {
      const response = await this.client.get('auth/verify')
      return response.data || response
    } catch (error) {
      console.error('Token verification failed:', error)
      throw error
    }
  }

  /**
   * Get current user profile
   * @returns {Promise<Object>} User profile data
   */
  async getProfile() {
    try {
      const response = await this.client.get('auth/profile')
      return response.data?.user || response.user || response
    } catch (error) {
      console.error('Failed to get user profile:', error)
      throw error
    }
  }

  /**
   * Update user profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} Updated profile data
   */
  async updateProfile(profileData) {
    try {
      return await this.client.put('auth/profile', profileData)
    } catch (error) {
      console.error('Failed to update profile:', error)
      throw error
    }
  }

  /**
   * Change user password
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Password change result
   */
  async changePassword(currentPassword, newPassword) {
    try {
      return await this.client.put('auth/password', {
        currentPassword,
        newPassword
      })
    } catch (error) {
      console.error('Failed to change password:', error)
      throw error
    }
  }

  /**
   * Register new user (admin only)
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Created user data
   */
  async registerUser(userData) {
    try {
      return await this.client.post('auth/register', userData)
    } catch (error) {
      console.error('Failed to register user:', error)
      throw error
    }
  }

  /**
   * Get all users (admin only)
   * @returns {Promise<Array>} List of users
   */
  async getUsers() {
    try {
      return await this.client.get('auth/users')
    } catch (error) {
      console.error('Failed to get users:', error)
      throw error
    }
  }

  /**
   * Delete user (admin only)
   * @param {string} userId - User ID to delete
   * @returns {Promise<void>}
   */
  async deleteUser(userId) {
    try {
      return await this.client.delete(`auth/users/${userId}`)
    } catch (error) {
      console.error('Failed to delete user:', error)
      throw error
    }
  }

  /**
   * Check if user has stored authentication tokens
   * @returns {boolean} Whether tokens exist in storage
   */
  hasStoredAuth() {
    try {
      const localToken = localStorage.getItem('pb_access_token')
      const sessionToken = sessionStorage.getItem('pb_access_token')
      const hasTokens = !!(localToken || sessionToken)
      
      console.log(`Checking stored auth - localStorage: ${!!localToken}, sessionStorage: ${!!sessionToken}, hasTokens: ${hasTokens}`)
      
      return hasTokens
    } catch (error) {
      console.error('Error checking stored auth:', error)
      return false
    }
  }

  /**
   * Clear stored authentication tokens
   */
  clearTokens() {
    this.jwtManager.clearTokens()
    
    // Also clear rememberMe preference
    try {
      localStorage.removeItem('pb_remember_me')
      sessionStorage.removeItem('pb_remember_me')
    } catch (error) {
      console.warn('Could not clear rememberMe preference:', error)
    }
  }

  /**
   * Get current access token
   * @returns {Promise<string|null>}
   */
  async getToken() {
    return await this.jwtManager.getValidToken()
  }

  /**
   * Get authorization headers for API requests
   * @returns {Promise<Object>}
   */
  async getAuthHeaders() {
    const token = await this.getToken()
    if (token) {
      return {
        'Authorization': `Bearer ${token}`
      }
    }
    return {}
  }

  /**
   * Check if user is authenticated
   * @returns {Promise<boolean>} Authentication status
   */
  async isAuthenticated() {
    try {
      const token = await this.jwtManager.getValidToken()
      if (!token) {
        return false
      }

      // Verify token with server
      await this.verifyToken()
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Get current user from token
   * @returns {Promise<Object|null>} Current user data or null
   */
  async getCurrentUser() {
    try {
      const token = await this.jwtManager.getValidToken()
      if (!token) {
        return null
      }

      // Decode token to get user info
      const payload = this.jwtManager.decodeToken(token)
      if (!payload) {
        return null
      }

      // Get full profile from server
      const profile = await this.getProfile()
      return profile
    } catch (error) {
      console.error('Failed to get current user:', error)
      return null
    }
  }

  /**
   * Check if current user has admin role
   * @returns {Promise<boolean>} Admin status
   */
  async isAdmin() {
    try {
      const user = await this.getCurrentUser()
      return user && user.role === 'admin'
    } catch (error) {
      return false
    }
  }

  /**
   * Get authentication status and user info
   * @returns {Promise<Object>} Authentication state
   */
  async getAuthState() {
    try {
      const isAuthenticated = await this.isAuthenticated()
      if (!isAuthenticated) {
        return {
          isAuthenticated: false,
          user: null,
          isAdmin: false
        }
      }

      const user = await this.getCurrentUser()
      const isAdmin = user && user.role === 'admin'

      return {
        isAuthenticated: true,
        user,
        isAdmin
      }
    } catch (error) {
      console.error('Failed to get auth state:', error)
      return {
        isAuthenticated: false,
        user: null,
        isAdmin: false
      }
    }
  }
}

// Create default auth service instance
export const authService = new AuthService()

export default AuthService