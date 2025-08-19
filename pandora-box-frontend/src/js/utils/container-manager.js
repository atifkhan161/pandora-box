/**
 * Container Manager for Pandora Box PWA
 * Handles Docker container operations, status monitoring, and management
 */

class ContainerManager {
  constructor() {
    this.containers = [];
    this.isLoading = false;
    this.error = null;
    this.refreshInterval = null;
    this.api = window.ApiClient; // Reference to the API client
    
    // Bind methods
    this.initialize = this.initialize.bind(this);
    this.getContainers = this.getContainers.bind(this);
    this.getContainer = this.getContainer.bind(this);
    this.refreshContainers = this.refreshContainers.bind(this);
    this.startContainer = this.startContainer.bind(this);
    this.stopContainer = this.stopContainer.bind(this);
    this.restartContainer = this.restartContainer.bind(this);
    this.removeContainer = this.removeContainer.bind(this);
    this.createContainer = this.createContainer.bind(this);
    this.getContainerLogs = this.getContainerLogs.bind(this);
    this.getContainerStats = this.getContainerStats.bind(this);
  }
  
  /**
   * Initialize the container manager
   * @returns {Promise<boolean>} - Whether initialization was successful
   */
  async initialize() {
    try {
      // Get container settings
      const systemSettings = window.SettingsManager.get('system', {
        containerRefreshInterval: 10000, // 10 seconds
        enableContainerManagement: true,
      });
      
      // Check if container management is enabled
      if (!systemSettings.enableContainerManagement) {
        console.log('Container management is disabled in settings');
        return false;
      }
      
      // Initial container fetch
      await this.refreshContainers();
      
      // Set up refresh interval
      this.refreshInterval = setInterval(
        this.refreshContainers, 
        systemSettings.containerRefreshInterval
      );
      
      // Listen for settings changes
      document.addEventListener('settings-change', (event) => {
        if (event.detail.path === 'system.containerRefreshInterval') {
          // Update refresh interval
          clearInterval(this.refreshInterval);
          this.refreshInterval = setInterval(
            this.refreshContainers, 
            event.detail.value
          );
        } else if (event.detail.path === 'system.enableContainerManagement') {
          if (!event.detail.value) {
            // Disable container management
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
          } else if (!this.refreshInterval) {
            // Re-enable container management
            const interval = window.SettingsManager.get('system.containerRefreshInterval', 10000);
            this.refreshInterval = setInterval(this.refreshContainers, interval);
            this.refreshContainers();
          }
        }
      });
      
      return true;
    } catch (error) {
      console.error('Container manager initialization error:', error);
      this.error = error.message;
      return false;
    }
  }
  
  /**
   * Get all containers
   * @param {Object} [filters={}] - Filters to apply
   * @param {string} [filters.status] - Filter by status (running, stopped, etc.)
   * @param {string} [filters.name] - Filter by name (case-insensitive substring match)
   * @param {string} [filters.image] - Filter by image name
   * @returns {Array} - The filtered containers
   */
  getContainers(filters = {}) {
    let filteredContainers = [...this.containers];
    
    // Apply filters
    if (filters.status) {
      filteredContainers = filteredContainers.filter(c => c.status === filters.status);
    }
    
    if (filters.name) {
      const nameLower = filters.name.toLowerCase();
      filteredContainers = filteredContainers.filter(c => 
        c.name.toLowerCase().includes(nameLower)
      );
    }
    
    if (filters.image) {
      const imageLower = filters.image.toLowerCase();
      filteredContainers = filteredContainers.filter(c => 
        c.image.toLowerCase().includes(imageLower)
      );
    }
    
    return filteredContainers;
  }
  
  /**
   * Get a container by ID
   * @param {string} id - The container ID
   * @returns {Object|null} - The container object
   */
  getContainer(id) {
    return this.containers.find(c => c.id === id) || null;
  }
  
  /**
   * Refresh the container list
   * @returns {Promise<Array>} - The updated container list
   */
  async refreshContainers() {
    try {
      if (this.isLoading) return this.containers;
      
      this.isLoading = true;
      this.error = null;
      
      // Dispatch event
      this._dispatchContainerEvent('loading', { loading: true });
      
      // Fetch containers from API
      const response = await this.api.get('/api/system/containers');
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch containers');
      }
      
      // Update containers list
      this.containers = response.data.map(container => ({
        id: container.id,
        name: container.name.replace(/^\//g, ''), // Remove leading slash
        image: container.image,
        status: container.state.status,
        state: container.state,
        created: container.created,
        ports: container.ports || [],
        volumes: container.mounts || [],
        networks: container.networkSettings?.networks || {},
        labels: container.labels || {},
        command: container.command,
        env: container.env || [],
        healthStatus: this._getHealthStatus(container),
        isSystem: this._isSystemContainer(container),
        restartPolicy: container.hostConfig?.restartPolicy || { name: 'no' },
        resources: {
          memory: container.hostConfig?.memory || 0,
          cpuShares: container.hostConfig?.cpuShares || 0,
        }
      }));
      
      // Sort containers by name
      this.containers.sort((a, b) => a.name.localeCompare(b.name));
      
      this.isLoading = false;
      
      // Dispatch event
      this._dispatchContainerEvent('updated', { 
        containers: this.containers,
        loading: false 
      });
      
      return this.containers;
    } catch (error) {
      console.error('Error refreshing containers:', error);
      this.error = error.message;
      this.isLoading = false;
      
      // Dispatch event
      this._dispatchContainerEvent('error', { 
        error: error.message,
        loading: false 
      });
      
      return this.containers;
    }
  }
  
  /**
   * Start a container
   * @param {string} id - The container ID
   * @returns {Promise<boolean>} - Whether the operation was successful
   */
  async startContainer(id) {
    try {
      // Find container
      const container = this.getContainer(id);
      
      if (!container) {
        throw new Error('Container not found');
      }
      
      // Update container status
      container.status = 'starting';
      
      // Dispatch event
      this._dispatchContainerEvent('starting', { container });
      
      // Start container via API
      const response = await this.api.post(`/api/system/containers/${id}/start`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to start container');
      }
      
      // Refresh containers
      await this.refreshContainers();
      
      // Show notification
      window.NotificationManager.showToast({
        title: 'Container Started',
        message: `Container ${container.name} started successfully`,
        type: 'success'
      });
      
      return true;
    } catch (error) {
      console.error('Error starting container:', error);
      
      // Show error notification
      window.NotificationManager.showToast({
        title: 'Container Start Failed',
        message: error.message,
        type: 'error'
      });
      
      // Refresh containers
      await this.refreshContainers();
      
      return false;
    }
  }
  
  /**
   * Stop a container
   * @param {string} id - The container ID
   * @returns {Promise<boolean>} - Whether the operation was successful
   */
  async stopContainer(id) {
    try {
      // Find container
      const container = this.getContainer(id);
      
      if (!container) {
        throw new Error('Container not found');
      }
      
      // Update container status
      container.status = 'stopping';
      
      // Dispatch event
      this._dispatchContainerEvent('stopping', { container });
      
      // Stop container via API
      const response = await this.api.post(`/api/system/containers/${id}/stop`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to stop container');
      }
      
      // Refresh containers
      await this.refreshContainers();
      
      // Show notification
      window.NotificationManager.showToast({
        title: 'Container Stopped',
        message: `Container ${container.name} stopped successfully`,
        type: 'success'
      });
      
      return true;
    } catch (error) {
      console.error('Error stopping container:', error);
      
      // Show error notification
      window.NotificationManager.showToast({
        title: 'Container Stop Failed',
        message: error.message,
        type: 'error'
      });
      
      // Refresh containers
      await this.refreshContainers();
      
      return false;
    }
  }
  
  /**
   * Restart a container
   * @param {string} id - The container ID
   * @returns {Promise<boolean>} - Whether the operation was successful
   */
  async restartContainer(id) {
    try {
      // Find container
      const container = this.getContainer(id);
      
      if (!container) {
        throw new Error('Container not found');
      }
      
      // Update container status
      container.status = 'restarting';
      
      // Dispatch event
      this._dispatchContainerEvent('restarting', { container });
      
      // Restart container via API
      const response = await this.api.post(`/api/system/containers/${id}/restart`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to restart container');
      }
      
      // Refresh containers
      await this.refreshContainers();
      
      // Show notification
      window.NotificationManager.showToast({
        title: 'Container Restarted',
        message: `Container ${container.name} restarted successfully`,
        type: 'success'
      });
      
      return true;
    } catch (error) {
      console.error('Error restarting container:', error);
      
      // Show error notification
      window.NotificationManager.showToast({
        title: 'Container Restart Failed',
        message: error.message,
        type: 'error'
      });
      
      // Refresh containers
      await this.refreshContainers();
      
      return false;
    }
  }
  
  /**
   * Remove a container
   * @param {string} id - The container ID
   * @param {boolean} [force=false] - Whether to force removal
   * @param {boolean} [removeVolumes=false] - Whether to remove associated volumes
   * @returns {Promise<boolean>} - Whether the operation was successful
   */
  async removeContainer(id, force = false, removeVolumes = false) {
    try {
      // Find container
      const container = this.getContainer(id);
      
      if (!container) {
        throw new Error('Container not found');
      }
      
      // Confirm removal
      const confirmed = await new Promise(resolve => {
        // Create confirmation modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
          <div class="modal-content">
            <div class="modal-header">
              <h2>Remove Container</h2>
              <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
              <p>Are you sure you want to remove container <strong>${container.name}</strong>?</p>
              <div class="form-group">
                <label class="checkbox-container">
                  <input type="checkbox" id="force-remove" ${force ? 'checked' : ''}>
                  <span class="checkmark"></span>
                  Force removal (remove even if running)
                </label>
              </div>
              <div class="form-group">
                <label class="checkbox-container">
                  <input type="checkbox" id="remove-volumes" ${removeVolumes ? 'checked' : ''}>
                  <span class="checkmark"></span>
                  Remove associated volumes
                </label>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary modal-cancel">Cancel</button>
              <button class="btn btn-danger modal-confirm">Remove</button>
            </div>
          </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        const closeBtn = modal.querySelector('.modal-close');
        const cancelBtn = modal.querySelector('.modal-cancel');
        const confirmBtn = modal.querySelector('.modal-confirm');
        const forceCheck = modal.querySelector('#force-remove');
        const volumesCheck = modal.querySelector('#remove-volumes');
        
        closeBtn.addEventListener('click', () => {
          document.body.removeChild(modal);
          resolve(null);
        });
        
        cancelBtn.addEventListener('click', () => {
          document.body.removeChild(modal);
          resolve(null);
        });
        
        confirmBtn.addEventListener('click', () => {
          const forceRemove = forceCheck.checked;
          const removeVols = volumesCheck.checked;
          document.body.removeChild(modal);
          resolve({ force: forceRemove, removeVolumes: removeVols });
        });
      });
      
      if (!confirmed) {
        return false;
      }
      
      // Update container status
      container.status = 'removing';
      
      // Dispatch event
      this._dispatchContainerEvent('removing', { container });
      
      // Remove container via API
      const response = await this.api.delete(`/api/system/containers/${id}`, {
        force: confirmed.force,
        removeVolumes: confirmed.removeVolumes
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to remove container');
      }
      
      // Refresh containers
      await this.refreshContainers();
      
      // Show notification
      window.NotificationManager.showToast({
        title: 'Container Removed',
        message: `Container ${container.name} removed successfully`,
        type: 'success'
      });
      
      return true;
    } catch (error) {
      console.error('Error removing container:', error);
      
      // Show error notification
      window.NotificationManager.showToast({
        title: 'Container Removal Failed',
        message: error.message,
        type: 'error'
      });
      
      // Refresh containers
      await this.refreshContainers();
      
      return false;
    }
  }
  
  /**
   * Create a new container
   * @param {Object} containerConfig - The container configuration
   * @returns {Promise<Object|null>} - The created container or null if failed
   */
  async createContainer(containerConfig) {
    try {
      // Validate container config
      if (!containerConfig.image) {
        throw new Error('Container image is required');
      }
      
      // Create container via API
      const response = await this.api.post('/api/system/containers/create', containerConfig);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to create container');
      }
      
      // Refresh containers
      await this.refreshContainers();
      
      // Show notification
      window.NotificationManager.showToast({
        title: 'Container Created',
        message: `Container ${containerConfig.name || response.data.id} created successfully`,
        type: 'success'
      });
      
      return response.data;
    } catch (error) {
      console.error('Error creating container:', error);
      
      // Show error notification
      window.NotificationManager.showToast({
        title: 'Container Creation Failed',
        message: error.message,
        type: 'error'
      });
      
      return null;
    }
  }
  
  /**
   * Get container logs
   * @param {string} id - The container ID
   * @param {Object} [options={}] - Log options
   * @param {number} [options.tail=100] - Number of lines to show from the end
   * @param {boolean} [options.timestamps=true] - Include timestamps
   * @param {boolean} [options.follow=false] - Follow log output
   * @returns {Promise<Object>} - The logs response
   */
  async getContainerLogs(id, options = {}) {
    try {
      // Find container
      const container = this.getContainer(id);
      
      if (!container) {
        throw new Error('Container not found');
      }
      
      // Set default options
      const logOptions = {
        tail: options.tail || 100,
        timestamps: options.timestamps !== undefined ? options.timestamps : true,
        follow: options.follow || false
      };
      
      // Get logs via API
      const response = await this.api.get(`/api/system/containers/${id}/logs`, logOptions);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to get container logs');
      }
      
      return {
        logs: response.data.logs,
        container
      };
    } catch (error) {
      console.error('Error getting container logs:', error);
      throw error;
    }
  }
  
  /**
   * Get container stats
   * @param {string} id - The container ID
   * @returns {Promise<Object>} - The stats response
   */
  async getContainerStats(id) {
    try {
      // Find container
      const container = this.getContainer(id);
      
      if (!container) {
        throw new Error('Container not found');
      }
      
      // Get stats via API
      const response = await this.api.get(`/api/system/containers/${id}/stats`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to get container stats');
      }
      
      return {
        stats: response.data,
        container
      };
    } catch (error) {
      console.error('Error getting container stats:', error);
      throw error;
    }
  }
  
  /**
   * Get container health status
   * @private
   * @param {Object} container - The container object from API
   * @returns {string} - The health status
   */
  _getHealthStatus(container) {
    if (!container.state || !container.state.health) {
      return 'unknown';
    }
    
    return container.state.health.status || 'unknown';
  }
  
  /**
   * Check if container is a system container
   * @private
   * @param {Object} container - The container object from API
   * @returns {boolean} - Whether the container is a system container
   */
  _isSystemContainer(container) {
    // Check labels for system container
    if (container.labels && container.labels['com.pandorabox.system'] === 'true') {
      return true;
    }
    
    // Check image name for common system containers
    const systemImages = [
      'traefik',
      'nginx',
      'postgres',
      'mysql',
      'mongo',
      'redis',
      'jellyfin',
      'portainer',
      'watchtower'
    ];
    
    return systemImages.some(image => 
      container.image.toLowerCase().includes(image.toLowerCase())
    );
  }
  
  /**
   * Dispatch a container event
   * @private
   * @param {string} type - The event type
   * @param {Object} detail - The event detail
   */
  _dispatchContainerEvent(type, detail) {
    const event = new CustomEvent('container', {
      detail: {
        type,
        ...detail
      }
    });
    
    document.dispatchEvent(event);
  }
  
  /**
   * Clean up resources
   */
  destroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }
}

// Create and export the container manager instance
window.ContainerManager = new ContainerManager();