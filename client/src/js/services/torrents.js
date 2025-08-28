/**
 * Torrents Service for Pandora PWA
 * Handles torrent search, download management, and qBittorrent integration
 */

import { apiClient } from './api.js'

export class TorrentsService {
  constructor(client = apiClient) {
    this.client = client
  }

  /**
   * Get all torrents
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} List of torrents
   */
  async getTorrents(filters = {}) {
    try {
      const response = await this.client.get('/downloads', filters)
      return response
    } catch (error) {
      console.error('Failed to get torrents:', error)
      throw error
    }
  }

  /**
   * Get transfer information
   * @returns {Promise<Object>} Transfer info (global stats)
   */
  async getTransferInfo() {
    try {
      const response = await this.client.get('/downloads/transfer-info')
      return response
    } catch (error) {
      console.error('Failed to get transfer info:', error)
      throw error
    }
  }

  /**
   * Get qBittorrent preferences
   * @returns {Promise<Object>} qBittorrent preferences
   */
  async getPreferences() {
    try {
      const response = await this.client.get('/downloads/preferences')
      return response
    } catch (error) {
      console.error('Failed to get preferences:', error)
      throw error
    }
  }

  /**
   * Get torrent details by hash
   * @param {string} hash - Torrent hash
   * @returns {Promise<Object>} Torrent details
   */
  async getTorrentDetails(hash) {
    try {
      const response = await this.client.get(`/downloads/${hash}/details`)
      return response
    } catch (error) {
      console.error('Failed to get torrent details:', error)
      throw error
    }
  }

  /**
   * Search torrents via Jackett
   * @param {string} query - Search query
   * @param {Array} categories - Category IDs to search
   * @param {Array} indexers - Indexer IDs to use
   * @returns {Promise<Array>} Search results
   */
  async searchTorrents(query, categories = [], indexers = []) {
    try {
      const params = { query }
      
      if (categories.length > 0) {
        params.categories = categories.join(',')
      }
      
      if (indexers.length > 0) {
        params.indexers = indexers.join(',')
      }
      
      const response = await this.client.get('/downloads/search-torrents', params)
      return response
    } catch (error) {
      console.error('Failed to search torrents:', error)
      throw error
    }
  }

  /**
   * Get available indexers
   * @returns {Promise<Array>} List of available indexers
   */
  async getIndexers() {
    try {
      const response = await this.client.get('/downloads/indexers')
      return response
    } catch (error) {
      console.error('Failed to get indexers:', error)
      throw error
    }
  }

  /**
   * Get torrent categories
   * @returns {Promise<Array>} List of categories
   */
  async getCategories() {
    try {
      const response = await this.client.get('/downloads/categories')
      return response
    } catch (error) {
      console.error('Failed to get categories:', error)
      throw error
    }
  }

  /**
   * Get search history
   * @returns {Promise<Array>} Search history
   */
  async getSearchHistory() {
    try {
      const response = await this.client.get('/downloads/search-history')
      return response
    } catch (error) {
      console.error('Failed to get search history:', error)
      throw error
    }
  }

  /**
   * Clear search history
   * @returns {Promise<void>}
   */
  async clearSearchHistory() {
    try {
      await this.client.delete('/downloads/search-history')
    } catch (error) {
      console.error('Failed to clear search history:', error)
      throw error
    }
  }

  /**
   * Add torrent to qBittorrent
   * @param {Object} torrentData - Torrent data
   * @returns {Promise<Object>} Add result
   */
  async addTorrent(torrentData) {
    try {
      const response = await this.client.post('/downloads/add', torrentData)
      return response
    } catch (error) {
      console.error('Failed to add torrent:', error)
      throw error
    }
  }

  /**
   * Add torrent by magnet URI
   * @param {string} magnetUri - Magnet URI
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Add result
   */
  async addMagnet(magnetUri, options = {}) {
    try {
      const torrentData = {
        urls: magnetUri,
        ...options
      }
      
      return await this.addTorrent(torrentData)
    } catch (error) {
      console.error('Failed to add magnet:', error)
      throw error
    }
  }

  /**
   * Add torrent by file
   * @param {File} torrentFile - Torrent file
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Add result
   */
  async addTorrentFile(torrentFile, options = {}) {
    try {
      const formData = new FormData()
      formData.append('torrents', torrentFile)
      
      // Add options to form data
      Object.keys(options).forEach(key => {
        formData.append(key, options[key])
      })
      
      const response = await this.client.post('/downloads/add', formData)
      return response
    } catch (error) {
      console.error('Failed to add torrent file:', error)
      throw error
    }
  }

  /**
   * Control torrent (pause, resume, delete)
   * @param {string} hash - Torrent hash
   * @param {string} action - Action to perform
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Control result
   */
  async controlTorrent(hash, action, options = {}) {
    try {
      const response = await this.client.post(`/downloads/${hash}/control`, {
        action,
        ...options
      })
      return response
    } catch (error) {
      console.error('Failed to control torrent:', error)
      throw error
    }
  }

  /**
   * Pause torrent
   * @param {string} hash - Torrent hash
   * @returns {Promise<Object>} Pause result
   */
  async pauseTorrent(hash) {
    return this.controlTorrent(hash, 'pause')
  }

  /**
   * Resume torrent
   * @param {string} hash - Torrent hash
   * @returns {Promise<Object>} Resume result
   */
  async resumeTorrent(hash) {
    return this.controlTorrent(hash, 'resume')
  }

  /**
   * Delete torrent
   * @param {string} hash - Torrent hash
   * @param {boolean} deleteFiles - Whether to delete files
   * @returns {Promise<Object>} Delete result
   */
  async deleteTorrent(hash, deleteFiles = false) {
    return this.controlTorrent(hash, 'delete', { deleteFiles })
  }

  /**
   * Force start torrent
   * @param {string} hash - Torrent hash
   * @returns {Promise<Object>} Force start result
   */
  async forceStartTorrent(hash) {
    return this.controlTorrent(hash, 'forceStart')
  }

  /**
   * Recheck torrent
   * @param {string} hash - Torrent hash
   * @returns {Promise<Object>} Recheck result
   */
  async recheckTorrent(hash) {
    return this.controlTorrent(hash, 'recheck')
  }

  /**
   * Set torrent priority
   * @param {string} hash - Torrent hash
   * @param {string} priority - Priority level
   * @returns {Promise<Object>} Priority result
   */
  async setTorrentPriority(hash, priority) {
    return this.controlTorrent(hash, 'setPriority', { priority })
  }

  /**
   * Set torrent location
   * @param {string} hash - Torrent hash
   * @param {string} location - New location
   * @returns {Promise<Object>} Location result
   */
  async setTorrentLocation(hash, location) {
    return this.controlTorrent(hash, 'setLocation', { location })
  }

  /**
   * Rename torrent
   * @param {string} hash - Torrent hash
   * @param {string} name - New name
   * @returns {Promise<Object>} Rename result
   */
  async renameTorrent(hash, name) {
    return this.controlTorrent(hash, 'rename', { name })
  }

  /**
   * Get torrent files
   * @param {string} hash - Torrent hash
   * @returns {Promise<Array>} List of files
   */
  async getTorrentFiles(hash) {
    try {
      const response = await this.client.get(`/downloads/${hash}/files`)
      return response
    } catch (error) {
      console.error('Failed to get torrent files:', error)
      throw error
    }
  }

  /**
   * Set file priority
   * @param {string} hash - Torrent hash
   * @param {number} fileId - File ID
   * @param {number} priority - Priority (0-7)
   * @returns {Promise<Object>} Priority result
   */
  async setFilePriority(hash, fileId, priority) {
    try {
      const response = await this.client.post(`/downloads/${hash}/files/${fileId}/priority`, {
        priority
      })
      return response
    } catch (error) {
      console.error('Failed to set file priority:', error)
      throw error
    }
  }

  /**
   * Get torrent trackers
   * @param {string} hash - Torrent hash
   * @returns {Promise<Array>} List of trackers
   */
  async getTorrentTrackers(hash) {
    try {
      const response = await this.client.get(`/downloads/${hash}/trackers`)
      return response
    } catch (error) {
      console.error('Failed to get torrent trackers:', error)
      throw error
    }
  }

  /**
   * Add tracker to torrent
   * @param {string} hash - Torrent hash
   * @param {string} trackerUrl - Tracker URL
   * @returns {Promise<Object>} Add tracker result
   */
  async addTracker(hash, trackerUrl) {
    try {
      const response = await this.client.post(`/downloads/${hash}/trackers`, {
        url: trackerUrl
      })
      return response
    } catch (error) {
      console.error('Failed to add tracker:', error)
      throw error
    }
  }

  /**
   * Remove tracker from torrent
   * @param {string} hash - Torrent hash
   * @param {string} trackerUrl - Tracker URL
   * @returns {Promise<Object>} Remove tracker result
   */
  async removeTracker(hash, trackerUrl) {
    try {
      const response = await this.client.delete(`/downloads/${hash}/trackers`, {
        url: trackerUrl
      })
      return response
    } catch (error) {
      console.error('Failed to remove tracker:', error)
      throw error
    }
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
   * Format download speed
   * @param {number} bytesPerSecond - Speed in bytes per second
   * @returns {string} Formatted speed
   */
  formatSpeed(bytesPerSecond) {
    if (!bytesPerSecond || bytesPerSecond === 0) return '0 B/s'
    
    return `${this.formatFileSize(bytesPerSecond)}/s`
  }

  /**
   * Format ETA
   * @param {number} seconds - ETA in seconds
   * @returns {string} Formatted ETA
   */
  formatETA(seconds) {
    if (!seconds || seconds <= 0 || seconds === Infinity) {
      return '∞'
    }
    
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  /**
   * Format torrent state
   * @param {string} state - Torrent state
   * @returns {string} Formatted state
   */
  formatState(state) {
    const stateMap = {
      'error': 'Error',
      'missingFiles': 'Missing Files',
      'uploading': 'Uploading',
      'pausedUP': 'Paused (Upload)',
      'queuedUP': 'Queued (Upload)',
      'stalledUP': 'Stalled (Upload)',
      'checkingUP': 'Checking (Upload)',
      'forcedUP': 'Forced (Upload)',
      'allocating': 'Allocating',
      'downloading': 'Downloading',
      'metaDL': 'Downloading Metadata',
      'pausedDL': 'Paused (Download)',
      'queuedDL': 'Queued (Download)',
      'stalledDL': 'Stalled (Download)',
      'checkingDL': 'Checking (Download)',
      'forcedDL': 'Forced (Download)',
      'checkingResumeData': 'Checking Resume Data',
      'moving': 'Moving',
      'unknown': 'Unknown'
    }
    
    return stateMap[state] || state
  }

  /**
   * Get state color class
   * @param {string} state - Torrent state
   * @returns {string} CSS class for state color
   */
  getStateColorClass(state) {
    const colorMap = {
      'error': 'error',
      'missingFiles': 'error',
      'uploading': 'success',
      'pausedUP': 'warning',
      'queuedUP': 'info',
      'stalledUP': 'warning',
      'checkingUP': 'info',
      'forcedUP': 'success',
      'allocating': 'info',
      'downloading': 'primary',
      'metaDL': 'info',
      'pausedDL': 'warning',
      'queuedDL': 'info',
      'stalledDL': 'warning',
      'checkingDL': 'info',
      'forcedDL': 'primary',
      'checkingResumeData': 'info',
      'moving': 'info',
      'unknown': 'muted'
    }
    
    return colorMap[state] || 'muted'
  }

  /**
   * Calculate progress percentage
   * @param {number} downloaded - Downloaded bytes
   * @param {number} total - Total bytes
   * @returns {number} Progress percentage (0-100)
   */
  calculateProgress(downloaded, total) {
    if (!total || total === 0) return 0
    return Math.min(100, Math.max(0, (downloaded / total) * 100))
  }
}

// Create default torrents service instance
export const torrentsService = new TorrentsService()

export default TorrentsService