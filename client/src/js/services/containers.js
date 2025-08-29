/**
 * Containers Service for Pandora PWA
 * Handles Docker container and stack management via Portainer
 */

import { apiClient } from './api.js'

export class ContainersService {
  constructor(client = apiClient) {
    this.client = client
  }

  /**
   * Get all containers
   * @returns {Promise<Array>} List of containers
   */
  async getContainers() {
    try {
      const response = await this.client.get('docker/containers')
      return response
    } catch (error) {
      console.error('Failed to get containers:', error)
      throw error
    }
  }

  /**
   * Get container details
   * @param {string} containerId - Container ID
   * @returns {Promise<Object>} Container details
   */
  async getContainerDetails(containerId) {
    try {
      const response = await this.client.get(`docker/containers/${containerId}`)
      return response
    } catch (error) {
      console.error('Failed to get container details:', error)
      throw error
    }
  }

  /**
   * Start container
   * @param {string} containerId - Container ID
   * @returns {Promise<Object>} Start result
   */
  async startContainer(containerId) {
    try {
      const response = await this.client.post(`docker/containers/${containerId}/start`)
      return response
    } catch (error) {
      console.error('Failed to start container:', error)
      throw error
    }
  }

  /**
   * Stop container
   * @param {string} containerId - Container ID
   * @returns {Promise<Object>} Stop result
   */
  async stopContainer(containerId) {
    try {
      const response = await this.client.post(`docker/containers/${containerId}/stop`)
      return response
    } catch (error) {
      console.error('Failed to stop container:', error)
      throw error
    }
  }

  /**
   * Restart container
   * @param {string} containerId - Container ID
   * @returns {Promise<Object>} Restart result
   */
  async restartContainer(containerId) {
    try {
      const response = await this.client.post(`docker/containers/${containerId}/restart`)
      return response
    } catch (error) {
      console.error('Failed to restart container:', error)
      throw error
    }
  }

  /**
   * Remove container
   * @param {string} containerId - Container ID
   * @param {boolean} force - Force removal
   * @returns {Promise<Object>} Remove result
   */
  async removeContainer(containerId, force = false) {
    try {
      const response = await this.client.delete(`docker/containers/${containerId}`, {
        force
      })
      return response
    } catch (error) {
      console.error('Failed to remove container:', error)
      throw error
    }
  }

  /**
   * Get container logs
   * @param {string} containerId - Container ID
   * @param {Object} options - Log options
   * @returns {Promise<string>} Container logs
   */
  async getContainerLogs(containerId, options = {}) {
    try {
      const params = {
        tail: 100,
        timestamps: true,
        ...options
      }
      
      const response = await this.client.get(`docker/containers/${containerId}/logs`, params)
      return response
    } catch (error) {
      console.error('Failed to get container logs:', error)
      throw error
    }
  }

  /**
   * Get container stats
   * @param {string} containerId - Container ID
   * @returns {Promise<Object>} Container statistics
   */
  async getContainerStats(containerId) {
    try {
      const response = await this.client.get(`docker/containers/${containerId}/stats`)
      return response
    } catch (error) {
      console.error('Failed to get container stats:', error)
      throw error
    }
  }

  /**
   * Get all stacks
   * @returns {Promise<Array>} List of stacks
   */
  async getStacks() {
    try {
      const response = await this.client.get('docker/stacks')
      return response
    } catch (error) {
      console.error('Failed to get stacks:', error)
      throw error
    }
  }

  /**
   * Get stack details
   * @param {string} stackId - Stack ID
   * @returns {Promise<Object>} Stack details
   */
  async getStackDetails(stackId) {
    try {
      const response = await this.client.get(`docker/stacks/${stackId}`)
      return response
    } catch (error) {
      console.error('Failed to get stack details:', error)
      throw error
    }
  }

  /**
   * Deploy stack
   * @param {Object} stackData - Stack deployment data
   * @returns {Promise<Object>} Deploy result
   */
  async deployStack(stackData) {
    try {
      const response = await this.client.post('docker/stacks', stackData)
      return response
    } catch (error) {
      console.error('Failed to deploy stack:', error)
      throw error
    }
  }

  /**
   * Update stack
   * @param {string} stackId - Stack ID
   * @param {Object} stackData - Updated stack data
   * @returns {Promise<Object>} Update result
   */
  async updateStack(stackId, stackData) {
    try {
      const response = await this.client.put(`docker/stacks/${stackId}`, stackData)
      return response
    } catch (error) {
      console.error('Failed to update stack:', error)
      throw error
    }
  }

  /**
   * Remove stack
   * @param {string} stackId - Stack ID
   * @returns {Promise<Object>} Remove result
   */
  async removeStack(stackId) {
    try {
      const response = await this.client.delete(`docker/stacks/${stackId}`)
      return response
    } catch (error) {
      console.error('Failed to remove stack:', error)
      throw error
    }
  }

  /**
   * Start stack
   * @param {string} stackId - Stack ID
   * @returns {Promise<Object>} Start result
   */
  async startStack(stackId) {
    try {
      const response = await this.client.post(`docker/stacks/${stackId}/start`)
      return response
    } catch (error) {
      console.error('Failed to start stack:', error)
      throw error
    }
  }

  /**
   * Stop stack
   * @param {string} stackId - Stack ID
   * @returns {Promise<Object>} Stop result
   */
  async stopStack(stackId) {
    try {
      const response = await this.client.post(`docker/stacks/${stackId}/stop`)
      return response
    } catch (error) {
      console.error('Failed to stop stack:', error)
      throw error
    }
  }

  /**
   * Get Docker system information
   * @returns {Promise<Object>} System information
   */
  async getSystemInfo() {
    try {
      const response = await this.client.get('docker/system/info')
      return response
    } catch (error) {
      console.error('Failed to get system info:', error)
      throw error
    }
  }

  /**
   * Get Docker system events
   * @param {Object} filters - Event filters
   * @returns {Promise<Array>} System events
   */
  async getSystemEvents(filters = {}) {
    try {
      const response = await this.client.get('docker/system/events', filters)
      return response
    } catch (error) {
      console.error('Failed to get system events:', error)
      throw error
    }
  }

  /**
   * Get Docker images
   * @returns {Promise<Array>} List of images
   */
  async getImages() {
    try {
      const response = await this.client.get('docker/images')
      return response
    } catch (error) {
      console.error('Failed to get images:', error)
      throw error
    }
  }

  /**
   * Remove image
   * @param {string} imageId - Image ID
   * @param {boolean} force - Force removal
   * @returns {Promise<Object>} Remove result
   */
  async removeImage(imageId, force = false) {
    try {
      const response = await this.client.delete(`docker/images/${imageId}`, {
        force
      })
      return response
    } catch (error) {
      console.error('Failed to remove image:', error)
      throw error
    }
  }

  /**
   * Get Docker networks
   * @returns {Promise<Array>} List of networks
   */
  async getNetworks() {
    try {
      const response = await this.client.get('docker/networks')
      return response
    } catch (error) {
      console.error('Failed to get networks:', error)
      throw error
    }
  }

  /**
   * Get Docker volumes
   * @returns {Promise<Array>} List of volumes
   */
  async getVolumes() {
    try {
      const response = await this.client.get('docker/volumes')
      return response
    } catch (error) {
      console.error('Failed to get volumes:', error)
      throw error
    }
  }

  /**
   * Prune system (remove unused containers, networks, images)
   * @param {Object} options - Prune options
   * @returns {Promise<Object>} Prune result
   */
  async pruneSystem(options = {}) {
    try {
      const response = await this.client.post('docker/system/prune', options)
      return response
    } catch (error) {
      console.error('Failed to prune system:', error)
      throw error
    }
  }

  /**
   * Format container state
   * @param {string} state - Container state
   * @returns {string} Formatted state
   */
  formatContainerState(state) {
    const stateMap = {
      'running': 'Running',
      'exited': 'Exited',
      'created': 'Created',
      'restarting': 'Restarting',
      'removing': 'Removing',
      'paused': 'Paused',
      'dead': 'Dead'
    }
    
    return stateMap[state] || state
  }

  /**
   * Get state color class
   * @param {string} state - Container state
   * @returns {string} CSS class for state color
   */
  getStateColorClass(state) {
    const colorMap = {
      'running': 'success',
      'exited': 'error',
      'created': 'info',
      'restarting': 'warning',
      'removing': 'warning',
      'paused': 'warning',
      'dead': 'error'
    }
    
    return colorMap[state] || 'muted'
  }

  /**
   * Get health status color class
   * @param {string} health - Health status
   * @returns {string} CSS class for health color
   */
  getHealthColorClass(health) {
    const colorMap = {
      'healthy': 'success',
      'unhealthy': 'error',
      'starting': 'warning',
      'none': 'muted'
    }
    
    return colorMap[health] || 'muted'
  }

  /**
   * Format uptime
   * @param {string} startedAt - Container start time
   * @returns {string} Formatted uptime
   */
  formatUptime(startedAt) {
    if (!startedAt) return 'N/A'
    
    try {
      const start = new Date(startedAt)
      const now = new Date()
      const diff = now - start
      
      const seconds = Math.floor(diff / 1000)
      const minutes = Math.floor(seconds / 60)
      const hours = Math.floor(minutes / 60)
      const days = Math.floor(hours / 24)
      
      if (days > 0) {
        return `${days}d ${hours % 24}h`
      } else if (hours > 0) {
        return `${hours}h ${minutes % 60}m`
      } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`
      } else {
        return `${seconds}s`
      }
    } catch (error) {
      return 'N/A'
    }
  }

  /**
   * Format memory usage
   * @param {number} bytes - Memory in bytes
   * @returns {string} Formatted memory
   */
  formatMemory(bytes) {
    if (!bytes || bytes === 0) return '0 B'
    
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  /**
   * Format CPU percentage
   * @param {number} cpuPercent - CPU percentage
   * @returns {string} Formatted CPU usage
   */
  formatCPU(cpuPercent) {
    if (!cpuPercent && cpuPercent !== 0) return 'N/A'
    
    return `${cpuPercent.toFixed(1)}%`
  }

  /**
   * Parse container name
   * @param {string} name - Container name with leading slash
   * @returns {string} Clean container name
   */
  parseContainerName(name) {
    if (!name) return 'Unknown'
    
    // Remove leading slash if present
    return name.startsWith('/') ? name.substring(1) : name
  }

  /**
   * Get container icon based on image
   * @param {string} image - Container image name
   * @returns {string} Icon emoji or class
   */
  getContainerIcon(image) {
    if (!image) return '📦'
    
    const imageLower = image.toLowerCase()
    
    const iconMap = {
      'nginx': '🌐',
      'apache': '🌐',
      'mysql': '🗄️',
      'postgres': '🗄️',
      'redis': '🔴',
      'mongo': '🍃',
      'elasticsearch': '🔍',
      'kibana': '📊',
      'grafana': '📈',
      'prometheus': '📊',
      'traefik': '🔀',
      'portainer': '🐳',
      'jellyfin': '🎬',
      'plex': '🎬',
      'qbittorrent': '🧲',
      'transmission': '🧲',
      'sonarr': '📺',
      'radarr': '🎬',
      'jackett': '🔍',
      'prowlarr': '🔍',
      'bazarr': '💬',
      'overseerr': '📋',
      'tautulli': '📊',
      'node': '💚',
      'python': '🐍',
      'php': '🐘',
      'java': '☕',
      'golang': '🐹',
      'rust': '🦀'
    }
    
    for (const [key, icon] of Object.entries(iconMap)) {
      if (imageLower.includes(key)) {
        return icon
      }
    }
    
    return '📦'
  }

  /**
   * Check if container is healthy
   * @param {Object} container - Container object
   * @returns {boolean} Health status
   */
  isContainerHealthy(container) {
    if (!container) return false
    
    const state = container.State?.toLowerCase()
    const health = container.State?.Health?.Status?.toLowerCase()
    
    if (health) {
      return health === 'healthy'
    }
    
    return state === 'running'
  }

  /**
   * Get stack status
   * @param {Object} stack - Stack object
   * @returns {string} Stack status
   */
  getStackStatus(stack) {
    if (!stack || !stack.containers) {
      return 'unknown'
    }
    
    const containers = stack.containers
    const runningCount = containers.filter(c => c.State === 'running').length
    const totalCount = containers.length
    
    if (runningCount === 0) {
      return 'stopped'
    } else if (runningCount === totalCount) {
      return 'running'
    } else {
      return 'partial'
    }
  }

  /**
   * Get stack health summary
   * @param {Object} stack - Stack object
   * @returns {Object} Health summary
   */
  getStackHealthSummary(stack) {
    if (!stack || !stack.containers) {
      return { healthy: 0, unhealthy: 0, total: 0 }
    }
    
    const containers = stack.containers
    let healthy = 0
    let unhealthy = 0
    
    containers.forEach(container => {
      if (this.isContainerHealthy(container)) {
        healthy++
      } else {
        unhealthy++
      }
    })
    
    return {
      healthy,
      unhealthy,
      total: containers.length
    }
  }
}

// Create default containers service instance
export const containersService = new ContainersService()

export default ContainersService