/**
 * Jellyfin Service for Pandora PWA
 * Handles Jellyfin media server control and library management
 */

import { apiClient } from './api.js'

export class JellyfinService {
    constructor(client = apiClient) {
        this.client = client
    }

    /**
     * Get Jellyfin server info
     * @returns {Promise<Object>} Server information
     */
    async getServerInfo() {
        try {
            const response = await this.client.get('jellyfin/info')
            return response
        } catch (error) {
            console.error('Failed to get Jellyfin server info:', error)
            throw error
        }
    }

    /**
     * Get Jellyfin system info
     * @returns {Promise<Object>} System information
     */
    async getSystemInfo() {
        try {
            const response = await this.client.get('jellyfin/system/info')
            return response
        } catch (error) {
            console.error('Failed to get Jellyfin system info:', error)
            throw error
        }
    }

    /**
     * Get all libraries
     * @returns {Promise<Array>} List of libraries
     */
    async getLibraries() {
        try {
            const response = await this.client.get('jellyfin/libraries')
            return response
        } catch (error) {
            console.error('Failed to get libraries:', error)
            throw error
        }
    }

    /**
     * Get library details
     * @param {string} libraryId - Library ID
     * @returns {Promise<Object>} Library details
     */
    async getLibraryDetails(libraryId) {
        try {
            const response = await this.client.get(`jellyfin/libraries/${libraryId}`)
            return response
        } catch (error) {
            console.error('Failed to get library details:', error)
            throw error
        }
    }

    /**
     * Scan library
     * @param {string} libraryId - Library ID
     * @returns {Promise<Object>} Scan result
     */
    async scanLibrary(libraryId) {
        try {
            const response = await this.client.post(`jellyfin/libraries/${libraryId}/scan`)
            return response
        } catch (error) {
            console.error('Failed to scan library:', error)
            throw error
        }
    }

    /**
     * Scan all libraries
     * @returns {Promise<Object>} Scan result
     */
    async scanAllLibraries() {
        try {
            const response = await this.client.post('jellyfin/libraries/scan-all')
            return response
        } catch (error) {
            console.error('Failed to scan all libraries:', error)
            throw error
        }
    }

    /**
     * Refresh library metadata
     * @param {string} libraryId - Library ID
     * @returns {Promise<Object>} Refresh result
     */
    async refreshLibraryMetadata(libraryId) {
        try {
            const response = await this.client.post(`jellyfin/libraries/${libraryId}/refresh`)
            return response
        } catch (error) {
            console.error('Failed to refresh library metadata:', error)
            throw error
        }
    }

    /**
     * Get scan status
     * @returns {Promise<Object>} Scan status information
     */
    async getScanStatus() {
        try {
            const response = await this.client.get('jellyfin/scan/status')
            return response
        } catch (error) {
            console.error('Failed to get scan status:', error)
            throw error
        }
    }

    /**
     * Get active tasks
     * @returns {Promise<Array>} List of active tasks
     */
    async getActiveTasks() {
        try {
            const response = await this.client.get('jellyfin/tasks/active')
            return response
        } catch (error) {
            console.error('Failed to get active tasks:', error)
            throw error
        }
    }

    /**
     * Get scheduled tasks
     * @returns {Promise<Array>} List of scheduled tasks
     */
    async getScheduledTasks() {
        try {
            const response = await this.client.get('jellyfin/tasks/scheduled')
            return response
        } catch (error) {
            console.error('Failed to get scheduled tasks:', error)
            throw error
        }
    }

    /**
     * Start scheduled task
     * @param {string} taskId - Task ID
     * @returns {Promise<Object>} Task start result
     */
    async startTask(taskId) {
        try {
            const response = await this.client.post(`jellyfin/tasks/${taskId}/start`)
            return response
        } catch (error) {
            console.error('Failed to start task:', error)
            throw error
        }
    }

    /**
     * Stop scheduled task
     * @param {string} taskId - Task ID
     * @returns {Promise<Object>} Task stop result
     */
    async stopTask(taskId) {
        try {
            const response = await this.client.post(`jellyfin/tasks/${taskId}/stop`)
            return response
        } catch (error) {
            console.error('Failed to stop task:', error)
            throw error
        }
    }

    /**
     * Get users
     * @returns {Promise<Array>} List of users
     */
    async getUsers() {
        try {
            const response = await this.client.get('jellyfin/users')
            return response
        } catch (error) {
            console.error('Failed to get users:', error)
            throw error
        }
    }

    /**
     * Get user details
     * @param {string} userId - User ID
     * @returns {Promise<Object>} User details
     */
    async getUserDetails(userId) {
        try {
            const response = await this.client.get(`jellyfin/users/${userId}`)
            return response
        } catch (error) {
            console.error('Failed to get user details:', error)
            throw error
        }
    }

    /**
     * Create user
     * @param {Object} userData - User data
     * @returns {Promise<Object>} Created user
     */
    async createUser(userData) {
        try {
            const response = await this.client.post('jellyfin/users', userData)
            return response
        } catch (error) {
            console.error('Failed to create user:', error)
            throw error
        }
    }

    /**
     * Update user
     * @param {string} userId - User ID
     * @param {Object} userData - Updated user data
     * @returns {Promise<Object>} Updated user
     */
    async updateUser(userId, userData) {
        try {
            const response = await this.client.put(`jellyfin/users/${userId}`, userData)
            return response
        } catch (error) {
            console.error('Failed to update user:', error)
            throw error
        }
    }

    /**
     * Delete user
     * @param {string} userId - User ID
     * @returns {Promise<void>}
     */
    async deleteUser(userId) {
        try {
            await this.client.delete(`jellyfin/users/${userId}`)
        } catch (error) {
            console.error('Failed to delete user:', error)
            throw error
        }
    }

    /**
     * Get server configuration
     * @returns {Promise<Object>} Server configuration
     */
    async getServerConfiguration() {
        try {
            const response = await this.client.get('jellyfin/configuration')
            return response
        } catch (error) {
            console.error('Failed to get server configuration:', error)
            throw error
        }
    }

    /**
     * Update server configuration
     * @param {Object} config - Configuration data
     * @returns {Promise<Object>} Updated configuration
     */
    async updateServerConfiguration(config) {
        try {
            const response = await this.client.put('jellyfin/configuration', config)
            return response
        } catch (error) {
            console.error('Failed to update server configuration:', error)
            throw error
        }
    }

    /**
     * Get plugins
     * @returns {Promise<Array>} List of plugins
     */
    async getPlugins() {
        try {
            const response = await this.client.get('jellyfin/plugins')
            return response
        } catch (error) {
            console.error('Failed to get plugins:', error)
            throw error
        }
    }

    /**
     * Install plugin
     * @param {string} pluginId - Plugin ID
     * @param {string} version - Plugin version
     * @returns {Promise<Object>} Installation result
     */
    async installPlugin(pluginId, version) {
        try {
            const response = await this.client.post('jellyfin/plugins/install', {
                pluginId,
                version
            })
            return response
        } catch (error) {
            console.error('Failed to install plugin:', error)
            throw error
        }
    }

    /**
     * Uninstall plugin
     * @param {string} pluginId - Plugin ID
     * @returns {Promise<Object>} Uninstallation result
     */
    async uninstallPlugin(pluginId) {
        try {
            const response = await this.client.delete(`jellyfin/plugins/${pluginId}`)
            return response
        } catch (error) {
            console.error('Failed to uninstall plugin:', error)
            throw error
        }
    }

    /**
     * Restart server
     * @returns {Promise<Object>} Restart result
     */
    async restartServer() {
        try {
            const response = await this.client.post('jellyfin/system/restart')
            return response
        } catch (error) {
            console.error('Failed to restart server:', error)
            throw error
        }
    }

    /**
     * Shutdown server
     * @returns {Promise<Object>} Shutdown result
     */
    async shutdownServer() {
        try {
            const response = await this.client.post('jellyfin/system/shutdown')
            return response
        } catch (error) {
            console.error('Failed to shutdown server:', error)
            throw error
        }
    }

    /**
     * Get server logs
     * @param {Object} options - Log options
     * @returns {Promise<Array>} Server logs
     */
    async getServerLogs(options = {}) {
        try {
            const params = {
                limit: 100,
                ...options
            }

            const response = await this.client.get('jellyfin/system/logs', params)
            return response
        } catch (error) {
            console.error('Failed to get server logs:', error)
            throw error
        }
    }

    /**
     * Get library statistics
     * @returns {Promise<Object>} Library statistics
     */
    async getLibraryStatistics() {
        try {
            const response = await this.client.get('jellyfin/statistics')
            return response
        } catch (error) {
            console.error('Failed to get library statistics:', error)
            throw error
        }
    }

    /**
     * Get recent items
     * @param {string} libraryId - Library ID (optional)
     * @param {number} limit - Number of items to return
     * @returns {Promise<Array>} Recent items
     */
    async getRecentItems(libraryId = null, limit = 20) {
        try {
            const params = { limit }
            if (libraryId) {
                params.libraryId = libraryId
            }

            const response = await this.client.get('jellyfin/items/recent', params)
            return response
        } catch (error) {
            console.error('Failed to get recent items:', error)
            throw error
        }
    }

    /**
     * Search items
     * @param {string} query - Search query
     * @param {Object} options - Search options
     * @returns {Promise<Array>} Search results
     */
    async searchItems(query, options = {}) {
        try {
            const params = {
                query,
                limit: 50,
                ...options
            }

            const response = await this.client.get('jellyfin/search', params)
            return response
        } catch (error) {
            console.error('Failed to search items:', error)
            throw error
        }
    }

    /**
     * Format library type
     * @param {string} type - Library type
     * @returns {string} Formatted type
     */
    formatLibraryType(type) {
        const typeMap = {
            'movies': 'Movies',
            'tvshows': 'TV Shows',
            'music': 'Music',
            'books': 'Books',
            'photos': 'Photos',
            'homevideos': 'Home Videos',
            'musicvideos': 'Music Videos',
            'mixed': 'Mixed Content'
        }

        return typeMap[type?.toLowerCase()] || type || 'Unknown'
    }

    /**
     * Get library icon
     * @param {string} type - Library type
     * @returns {string} Icon emoji
     */
    getLibraryIcon(type) {
        const iconMap = {
            'movies': '🎬',
            'tvshows': '📺',
            'music': '🎵',
            'books': '📚',
            'photos': '📷',
            'homevideos': '🎥',
            'musicvideos': '🎶',
            'mixed': '📁'
        }

        return iconMap[type?.toLowerCase()] || '📁'
    }

    /**
     * Format scan status
     * @param {string} status - Scan status
     * @returns {string} Formatted status
     */
    formatScanStatus(status) {
        const statusMap = {
            'idle': 'Idle',
            'scanning': 'Scanning',
            'completed': 'Completed',
            'cancelled': 'Cancelled',
            'failed': 'Failed'
        }

        return statusMap[status?.toLowerCase()] || status || 'Unknown'
    }

    /**
     * Get scan status color class
     * @param {string} status - Scan status
     * @returns {string} CSS class for status color
     */
    getScanStatusColorClass(status) {
        const colorMap = {
            'idle': 'muted',
            'scanning': 'primary',
            'completed': 'success',
            'cancelled': 'warning',
            'failed': 'error'
        }

        return colorMap[status?.toLowerCase()] || 'muted'
    }

    /**
     * Format task state
     * @param {string} state - Task state
     * @returns {string} Formatted state
     */
    formatTaskState(state) {
        const stateMap = {
            'idle': 'Idle',
            'running': 'Running',
            'completed': 'Completed',
            'cancelled': 'Cancelled',
            'failed': 'Failed'
        }

        return stateMap[state?.toLowerCase()] || state || 'Unknown'
    }

    /**
     * Get task state color class
     * @param {string} state - Task state
     * @returns {string} CSS class for state color
     */
    getTaskStateColorClass(state) {
        const colorMap = {
            'idle': 'muted',
            'running': 'primary',
            'completed': 'success',
            'cancelled': 'warning',
            'failed': 'error'
        }

        return colorMap[state?.toLowerCase()] || 'muted'
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
     * Format duration
     * @param {number} ticks - Duration in ticks
     * @returns {string} Formatted duration
     */
    formatDuration(ticks) {
        if (!ticks || ticks === 0) return '0:00'

        const totalSeconds = Math.floor(ticks / 10000000) // Convert ticks to seconds
        const hours = Math.floor(totalSeconds / 3600)
        const minutes = Math.floor((totalSeconds % 3600) / 60)
        const seconds = totalSeconds % 60

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        } else {
            return `${minutes}:${seconds.toString().padStart(2, '0')}`
        }
    }

    /**
     * Format last scan time
     * @param {string} dateString - Date string
     * @returns {string} Formatted time
     */
    formatLastScanTime(dateString) {
        if (!dateString) return 'Never'

        try {
            const date = new Date(dateString)
            const now = new Date()
            const diff = now - date

            const minutes = Math.floor(diff / 60000)
            const hours = Math.floor(minutes / 60)
            const days = Math.floor(hours / 24)

            if (days > 0) {
                return `${days} day${days > 1 ? 's' : ''} ago`
            } else if (hours > 0) {
                return `${hours} hour${hours > 1 ? 's' : ''} ago`
            } else if (minutes > 0) {
                return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
            } else {
                return 'Just now'
            }
        } catch (error) {
            return 'Unknown'
        }
    }

    /**
     * Check if library needs scan
     * @param {Object} library - Library object
     * @returns {boolean} Whether library needs scan
     */
    libraryNeedsScan(library) {
        if (!library || !library.lastScanTime) {
            return true
        }

        try {
            const lastScan = new Date(library.lastScanTime)
            const now = new Date()
            const hoursSinceLastScan = (now - lastScan) / (1000 * 60 * 60)

            // Suggest scan if more than 24 hours since last scan
            return hoursSinceLastScan > 24
        } catch (error) {
            return true
        }
    }
}

// Create default Jellyfin service instance
export const jellyfinService = new JellyfinService()

export default JellyfinService