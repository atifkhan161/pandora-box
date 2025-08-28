/**
 * Settings Service for Pandora PWA
 * Handles application settings and configuration management
 */

import { apiClient } from './api.js'

export class SettingsService {
  constructor(client = apiClient) {
    this.client = client
  }

  /**
   * Get all settings
   * @returns {Promise<Object>} Application settings
   */
  async getSettings() {
    try {
      const response = await this.client.get('/settings')
      return response
    } catch (error) {
      console.error('Failed to get settings:', error)
      throw error
    }
  }

  /**
   * Update settings
   * @param {Object} settings - Settings to update
   * @returns {Promise<Object>} Updated settings
   */
  async updateSettings(settings) {
    try {
      const response = await this.client.put('/settings', settings)
      return response
    } catch (error) {
      console.error('Failed to update settings:', error)
      throw error
    }
  }

  /**
   * Get API keys configuration
   * @returns {Promise<Object>} API keys configuration
   */
  async getApiKeys() {
    try {
      const response = await this.client.get('/settings/api-keys')
      return response
    } catch (error) {
      console.error('Failed to get API keys:', error)
      throw error
    }
  }

  /**
   * Update API keys
   * @param {Object} apiKeys - API keys to update
   * @returns {Promise<Object>} Updated API keys
   */
  async updateApiKeys(apiKeys) {
    try {
      const response = await this.client.put('/settings/api-keys', apiKeys)
      return response
    } catch (error) {
      console.error('Failed to update API keys:', error)
      throw error
    }
  }

  /**
   * Test API key
   * @param {string} service - Service name
   * @param {string} apiKey - API key to test
   * @returns {Promise<Object>} Test result
   */
  async testApiKey(service, apiKey) {
    try {
      const response = await this.client.post('/settings/api-keys/test', {
        service,
        apiKey
      })
      return response
    } catch (error) {
      console.error('Failed to test API key:', error)
      throw error
    }
  }

  /**
   * Get notification settings
   * @returns {Promise<Object>} Notification settings
   */
  async getNotificationSettings() {
    try {
      const response = await this.client.get('/settings/notifications')
      return response
    } catch (error) {
      console.error('Failed to get notification settings:', error)
      throw error
    }
  }

  /**
   * Update notification settings
   * @param {Object} settings - Notification settings
   * @returns {Promise<Object>} Updated settings
   */
  async updateNotificationSettings(settings) {
    try {
      const response = await this.client.put('/settings/notifications', settings)
      return response
    } catch (error) {
      console.error('Failed to update notification settings:', error)
      throw error
    }
  }

  /**
   * Get download settings
   * @returns {Promise<Object>} Download settings
   */
  async getDownloadSettings() {
    try {
      const response = await this.client.get('/settings/downloads')
      return response
    } catch (error) {
      console.error('Failed to get download settings:', error)
      throw error
    }
  }

  /**
   * Update download settings
   * @param {Object} settings - Download settings
   * @returns {Promise<Object>} Updated settings
   */
  async updateDownloadSettings(settings) {
    try {
      const response = await this.client.put('/settings/downloads', settings)
      return response
    } catch (error) {
      console.error('Failed to update download settings:', error)
      throw error
    }
  }

  /**
   * Get media settings
   * @returns {Promise<Object>} Media settings
   */
  async getMediaSettings() {
    try {
      const response = await this.client.get('/settings/media')
      return response
    } catch (error) {
      console.error('Failed to get media settings:', error)
      throw error
    }
  }

  /**
   * Update media settings
   * @param {Object} settings - Media settings
   * @returns {Promise<Object>} Updated settings
   */
  async updateMediaSettings(settings) {
    try {
      const response = await this.client.put('/settings/media', settings)
      return response
    } catch (error) {
      console.error('Failed to update media settings:', error)
      throw error
    }
  }

  /**
   * Get system settings
   * @returns {Promise<Object>} System settings
   */
  async getSystemSettings() {
    try {
      const response = await this.client.get('/settings/system')
      return response
    } catch (error) {
      console.error('Failed to get system settings:', error)
      throw error
    }
  }

  /**
   * Update system settings
   * @param {Object} settings - System settings
   * @returns {Promise<Object>} Updated settings
   */
  async updateSystemSettings(settings) {
    try {
      const response = await this.client.put('/settings/system', settings)
      return response
    } catch (error) {
      console.error('Failed to update system settings:', error)
      throw error
    }
  }

  /**
   * Export settings
   * @returns {Promise<Blob>} Settings export file
   */
  async exportSettings() {
    try {
      const response = await this.client.download('/settings/export')
      return response
    } catch (error) {
      console.error('Failed to export settings:', error)
      throw error
    }
  }

  /**
   * Import settings
   * @param {File} settingsFile - Settings file to import
   * @returns {Promise<Object>} Import result
   */
  async importSettings(settingsFile) {
    try {
      const formData = new FormData()
      formData.append('settings', settingsFile)
      
      const response = await this.client.post('/settings/import', formData)
      return response
    } catch (error) {
      console.error('Failed to import settings:', error)
      throw error
    }
  }

  /**
   * Reset settings to defaults
   * @param {Array} categories - Categories to reset (optional)
   * @returns {Promise<Object>} Reset result
   */
  async resetSettings(categories = []) {
    try {
      const response = await this.client.post('/settings/reset', { categories })
      return response
    } catch (error) {
      console.error('Failed to reset settings:', error)
      throw error
    }
  }

  /**
   * Get application info
   * @returns {Promise<Object>} Application information
   */
  async getAppInfo() {
    try {
      const response = await this.client.get('/settings/app-info')
      return response
    } catch (error) {
      console.error('Failed to get app info:', error)
      throw error
    }
  }

  /**
   * Check for updates
   * @returns {Promise<Object>} Update information
   */
  async checkForUpdates() {
    try {
      const response = await this.client.get('/settings/updates/check')
      return response
    } catch (error) {
      console.error('Failed to check for updates:', error)
      throw error
    }
  }

  /**
   * Get system status
   * @returns {Promise<Object>} System status
   */
  async getSystemStatus() {
    try {
      const response = await this.client.get('/settings/system/status')
      return response
    } catch (error) {
      console.error('Failed to get system status:', error)
      throw error
    }
  }

  /**
   * Get logs
   * @param {Object} options - Log options
   * @returns {Promise<Array>} System logs
   */
  async getLogs(options = {}) {
    try {
      const params = {
        limit: 100,
        level: 'info',
        ...options
      }
      
      const response = await this.client.get('/settings/logs', params)
      return response
    } catch (error) {
      console.error('Failed to get logs:', error)
      throw error
    }
  }

  /**
   * Clear logs
   * @returns {Promise<Object>} Clear result
   */
  async clearLogs() {
    try {
      const response = await this.client.delete('/settings/logs')
      return response
    } catch (error) {
      console.error('Failed to clear logs:', error)
      throw error
    }
  }

  /**
   * Get backup settings
   * @returns {Promise<Object>} Backup settings
   */
  async getBackupSettings() {
    try {
      const response = await this.client.get('/settings/backup')
      return response
    } catch (error) {
      console.error('Failed to get backup settings:', error)
      throw error
    }
  }

  /**
   * Create backup
   * @param {Object} options - Backup options
   * @returns {Promise<Object>} Backup result
   */
  async createBackup(options = {}) {
    try {
      const response = await this.client.post('/settings/backup/create', options)
      return response
    } catch (error) {
      console.error('Failed to create backup:', error)
      throw error
    }
  }

  /**
   * Restore from backup
   * @param {File} backupFile - Backup file
   * @returns {Promise<Object>} Restore result
   */
  async restoreBackup(backupFile) {
    try {
      const formData = new FormData()
      formData.append('backup', backupFile)
      
      const response = await this.client.post('/settings/backup/restore', formData)
      return response
    } catch (error) {
      console.error('Failed to restore backup:', error)
      throw error
    }
  }

  /**
   * Get available themes
   * @returns {Promise<Array>} Available themes
   */
  async getAvailableThemes() {
    try {
      const response = await this.client.get('/settings/themes')
      return response
    } catch (error) {
      console.error('Failed to get available themes:', error)
      throw error
    }
  }

  /**
   * Get current theme
   * @returns {Promise<Object>} Current theme
   */
  async getCurrentTheme() {
    try {
      const response = await this.client.get('/settings/themes/current')
      return response
    } catch (error) {
      console.error('Failed to get current theme:', error)
      throw error
    }
  }

  /**
   * Set theme
   * @param {string} themeId - Theme ID
   * @returns {Promise<Object>} Theme set result
   */
  async setTheme(themeId) {
    try {
      const response = await this.client.post('/settings/themes/set', { themeId })
      return response
    } catch (error) {
      console.error('Failed to set theme:', error)
      throw error
    }
  }

  /**
   * Validate settings
   * @param {Object} settings - Settings to validate
   * @returns {Promise<Object>} Validation result
   */
  async validateSettings(settings) {
    try {
      const response = await this.client.post('/settings/validate', settings)
      return response
    } catch (error) {
      console.error('Failed to validate settings:', error)
      throw error
    }
  }

  /**
   * Get default settings
   * @param {string} category - Settings category (optional)
   * @returns {Promise<Object>} Default settings
   */
  async getDefaultSettings(category = null) {
    try {
      const params = category ? { category } : {}
      const response = await this.client.get('/settings/defaults', params)
      return response
    } catch (error) {
      console.error('Failed to get default settings:', error)
      throw error
    }
  }

  /**
   * Get settings schema
   * @returns {Promise<Object>} Settings schema
   */
  async getSettingsSchema() {
    try {
      const response = await this.client.get('/settings/schema')
      return response
    } catch (error) {
      console.error('Failed to get settings schema:', error)
      throw error
    }
  }

  /**
   * Format API service name
   * @param {string} service - Service key
   * @returns {string} Formatted service name
   */
  formatServiceName(service) {
    const serviceMap = {
      'tmdb': 'The Movie Database (TMDB)',
      'watchmode': 'Watchmode',
      'jackett': 'Jackett',
      'qbittorrent': 'qBittorrent',
      'cloudcommander': 'Cloud Commander',
      'portainer': 'Portainer',
      'jellyfin': 'Jellyfin'
    }
    
    return serviceMap[service] || service
  }

  /**
   * Get service icon
   * @param {string} service - Service key
   * @returns {string} Service icon
   */
  getServiceIcon(service) {
    const iconMap = {
      'tmdb': '🎬',
      'watchmode': '📺',
      'jackett': '🔍',
      'qbittorrent': '🧲',
      'cloudcommander': '📁',
      'portainer': '🐳',
      'jellyfin': '🎭'
    }
    
    return iconMap[service] || '⚙️'
  }

  /**
   * Format log level
   * @param {string} level - Log level
   * @returns {string} Formatted log level
   */
  formatLogLevel(level) {
    const levelMap = {
      'error': 'Error',
      'warn': 'Warning',
      'info': 'Info',
      'debug': 'Debug',
      'verbose': 'Verbose'
    }
    
    return levelMap[level] || level
  }

  /**
   * Get log level color class
   * @param {string} level - Log level
   * @returns {string} CSS class for log level
   */
  getLogLevelColorClass(level) {
    const colorMap = {
      'error': 'error',
      'warn': 'warning',
      'info': 'info',
      'debug': 'muted',
      'verbose': 'muted'
    }
    
    return colorMap[level] || 'muted'
  }

  /**
   * Format file size
   * @param {number} bytes - Size in bytes
   * @returns {string} Formatted size
   */
  formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B'
    
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  /**
   * Format uptime
   * @param {number} seconds - Uptime in seconds
   * @returns {string} Formatted uptime
   */
  formatUptime(seconds) {
    if (!seconds || seconds <= 0) return '0s'
    
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    const parts = []
    if (days > 0) parts.push(`${days}d`)
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0) parts.push(`${minutes}m`)
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`)
    
    return parts.join(' ')
  }

  /**
   * Validate API key format
   * @param {string} service - Service name
   * @param {string} apiKey - API key to validate
   * @returns {boolean} Whether API key format is valid
   */
  validateApiKeyFormat(service, apiKey) {
    if (!apiKey || typeof apiKey !== 'string') {
      return false
    }
    
    const patterns = {
      'tmdb': /^[a-f0-9]{32}$/i, // 32 character hex string
      'watchmode': /^[a-zA-Z0-9]{20,}$/, // At least 20 alphanumeric characters
      'jackett': /^[a-zA-Z0-9]{10,}$/, // At least 10 alphanumeric characters
      'qbittorrent': /^.{1,}$/, // Any non-empty string (username:password)
      'cloudcommander': /^.{1,}$/, // Any non-empty string
      'portainer': /^ptr_[a-zA-Z0-9+/=]{40,}$/, // Portainer token format
      'jellyfin': /^[a-f0-9]{32}$/i // 32 character hex string
    }
    
    const pattern = patterns[service]
    return pattern ? pattern.test(apiKey) : apiKey.length > 0
  }

  /**
   * Get API key placeholder
   * @param {string} service - Service name
   * @returns {string} Placeholder text for API key input
   */
  getApiKeyPlaceholder(service) {
    const placeholders = {
      'tmdb': 'Enter your TMDB API key (32 characters)',
      'watchmode': 'Enter your Watchmode API key',
      'jackett': 'Enter your Jackett API key',
      'qbittorrent': 'Enter qBittorrent credentials (username:password)',
      'cloudcommander': 'Enter Cloud Commander credentials',
      'portainer': 'Enter your Portainer access token',
      'jellyfin': 'Enter your Jellyfin API key'
    }
    
    return placeholders[service] || 'Enter API key'
  }
}

// Create default settings service instance
export const settingsService = new SettingsService()

export default SettingsService