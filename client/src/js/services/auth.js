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
      const response = await this.client.post('/auth/login', {
        username,
        password,
        rememberMe
      })

      // Store tokens
      if (response.accessToken) {
        await this.jwtManager.setTokens(response.accessToken, response.refreshToken)
      }

      return response
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  /**
   * Logout current user
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      await this.client.post('/auth/logout')
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
   * @returns {Promise<Object>} New tokens
   */
  async refreshToken() {
    try {
      const refreshToken = await this.jwtManager.getRefreshToken()
      if (!refreshToken) {
        throw new Error('No refresh token available')
      }

      const response = await this.client.post('/auth/refresh', {
        refreshToken
      })

      // Update stored tokens
      if (response.accessToken) {
        await this.jwtManager.setTokens(response.accessToken, response.refreshToken)
      }

      return response
    } catch (error) {
      console.error('Token refresh failed:', error)
      this.jwtManager.clearTokens()
      throw error
    }
  }

  /**
   * Verify current token
   * @returns {Promise<Object>} Token verification result
   */
  async verifyToken() {
    try {
      return await this.client.get('/auth/verify')
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
      return await this.client.get('/auth/profile')
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
      return await this.client.put('/auth/profile', profileData)
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
      return await this.client.put('/auth/password', {
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
      return await this.client.post('/auth/register', userData)
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
      return await this.client.get('/auth/users')
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
      return await this.client.delete(`/auth/users/${userId}`)
    } catch (error) {
      console.error('Failed to delete user:', error)
      throw error
    }
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