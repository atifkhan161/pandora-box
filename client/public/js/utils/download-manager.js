/**
 * Download Manager for Pandora Box PWA
 * Handles file downloads, progress tracking, and download queue management
 */

class DownloadManager {
  constructor() {
    this.downloads = [];
    this.activeDownloads = new Map();
    this.maxConcurrent = 3;
    this.db = window.DB; // Reference to the DB utility
    this.api = window.ApiClient; // Reference to the API client
    
    // Bind methods
    this.initialize = this.initialize.bind(this);
    this.addDownload = this.addDownload.bind(this);
    this.pauseDownload = this.pauseDownload.bind(this);
    this.resumeDownload = this.resumeDownload.bind(this);
    this.cancelDownload = this.cancelDownload.bind(this);
    this.getDownloads = this.getDownloads.bind(this);
    this.getDownload = this.getDownload.bind(this);
    this.clearCompleted = this.clearCompleted.bind(this);
    this._processQueue = this._processQueue.bind(this);
    this._updateDownload = this._updateDownload.bind(this);
  }
  
  /**
   * Initialize the download manager
   * @returns {Promise<boolean>} - Whether initialization was successful
   */
  async initialize() {
    try {
      // Get download settings
      const downloadSettings = window.SettingsManager.get('downloads', {
        maxConcurrent: 3,
        downloadLocation: 'downloads',
        notifyOnComplete: true,
        autoExtract: true,
        autoOrganize: true,
      });
      
      this.maxConcurrent = downloadSettings.maxConcurrent;
      
      // Load downloads from IndexedDB
      const savedDownloads = await this.db.getAll('downloads');
      if (savedDownloads && savedDownloads.length > 0) {
        this.downloads = savedDownloads;
        
        // Reset status for downloads that were in progress
        this.downloads.forEach(download => {
          if (download.status === 'downloading') {
            download.status = 'paused';
            download.statusText = 'Paused (App was closed)';
          }
        });
        
        // Save updated statuses
        await this._saveDownloads();
      }
      
      // Listen for settings changes
      document.addEventListener('settings-change', (event) => {
        if (event.detail.path === 'downloads.maxConcurrent') {
          this.maxConcurrent = event.detail.value;
          this._processQueue();
        }
      });
      
      // Set up background sync if available
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready.then(registration => {
          // Register sync event
          registration.sync.register('sync-downloads');
        });
      }
      
      // Process queue
      this._processQueue();
      
      return true;
    } catch (error) {
      console.error('Download manager initialization error:', error);
      return false;
    }
  }
  
  /**
   * Add a new download
   * @param {Object} downloadInfo - The download information
   * @param {string} downloadInfo.url - The download URL
   * @param {string} downloadInfo.filename - The filename
   * @param {string} [downloadInfo.type] - The file type
   * @param {number} [downloadInfo.size] - The file size in bytes
   * @param {string} [downloadInfo.mediaId] - Associated media ID
   * @param {string} [downloadInfo.category] - Download category
   * @param {Object} [downloadInfo.metadata] - Additional metadata
   * @returns {Promise<Object|null>} - The download object
   */
  async addDownload(downloadInfo) {
    try {
      if (!downloadInfo || !downloadInfo.url || !downloadInfo.filename) {
        throw new Error('Invalid download information');
      }
      
      // Generate download ID
      const downloadId = `dl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create download object
      const download = {
        id: downloadId,
        url: downloadInfo.url,
        filename: downloadInfo.filename,
        type: downloadInfo.type || this._getFileType(downloadInfo.filename),
        size: downloadInfo.size || 0,
        downloaded: 0,
        progress: 0,
        speed: 0,
        status: 'queued',
        statusText: 'Queued',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        mediaId: downloadInfo.mediaId,
        category: downloadInfo.category || 'other',
        metadata: downloadInfo.metadata || {},
        error: null
      };
      
      // Add to downloads list
      this.downloads.unshift(download);
      
      // Save to IndexedDB
      await this.db.put('downloads', download);
      
      // Dispatch event
      this._dispatchDownloadEvent('added', { download });
      
      // Process queue
      this._processQueue();
      
      return download;
    } catch (error) {
      console.error('Error adding download:', error);
      return null;
    }
  }
  
  /**
   * Pause a download
   * @param {string} id - The download ID
   * @returns {Promise<boolean>} - Whether the download was paused
   */
  async pauseDownload(id) {
    try {
      // Find download
      const download = this.downloads.find(d => d.id === id);
      
      if (!download) {
        throw new Error('Download not found');
      }
      
      // Check if download is active
      if (download.status !== 'downloading') {
        return false;
      }
      
      // Cancel active download
      if (this.activeDownloads.has(id)) {
        const controller = this.activeDownloads.get(id);
        controller.abort();
        this.activeDownloads.delete(id);
      }
      
      // Update status
      download.status = 'paused';
      download.statusText = 'Paused';
      download.updatedAt = new Date().toISOString();
      
      // Save to IndexedDB
      await this.db.put('downloads', download);
      
      // Dispatch event
      this._dispatchDownloadEvent('paused', { download });
      
      // Process queue
      this._processQueue();
      
      return true;
    } catch (error) {
      console.error('Error pausing download:', error);
      return false;
    }
  }
  
  /**
   * Resume a download
   * @param {string} id - The download ID
   * @returns {Promise<boolean>} - Whether the download was resumed
   */
  async resumeDownload(id) {
    try {
      // Find download
      const download = this.downloads.find(d => d.id === id);
      
      if (!download) {
        throw new Error('Download not found');
      }
      
      // Check if download can be resumed
      if (download.status !== 'paused' && download.status !== 'error' && download.status !== 'queued') {
        return false;
      }
      
      // Update status
      download.status = 'queued';
      download.statusText = 'Queued';
      download.error = null;
      download.updatedAt = new Date().toISOString();
      
      // Save to IndexedDB
      await this.db.put('downloads', download);
      
      // Dispatch event
      this._dispatchDownloadEvent('queued', { download });
      
      // Process queue
      this._processQueue();
      
      return true;
    } catch (error) {
      console.error('Error resuming download:', error);
      return false;
    }
  }
  
  /**
   * Cancel a download
   * @param {string} id - The download ID
   * @returns {Promise<boolean>} - Whether the download was canceled
   */
  async cancelDownload(id) {
    try {
      // Find download
      const downloadIndex = this.downloads.findIndex(d => d.id === id);
      
      if (downloadIndex === -1) {
        throw new Error('Download not found');
      }
      
      const download = this.downloads[downloadIndex];
      
      // Cancel active download
      if (download.status === 'downloading' && this.activeDownloads.has(id)) {
        const controller = this.activeDownloads.get(id);
        controller.abort();
        this.activeDownloads.delete(id);
      }
      
      // Remove from downloads list
      this.downloads.splice(downloadIndex, 1);
      
      // Remove from IndexedDB
      await this.db.delete('downloads', id);
      
      // Dispatch event
      this._dispatchDownloadEvent('canceled', { download });
      
      // Process queue
      this._processQueue();
      
      return true;
    } catch (error) {
      console.error('Error canceling download:', error);
      return false;
    }
  }
  
  /**
   * Get all downloads
   * @param {Object} [filters={}] - Filters to apply
   * @param {string} [filters.status] - Filter by status
   * @param {string} [filters.category] - Filter by category
   * @param {string} [filters.type] - Filter by file type
   * @param {string} [filters.mediaId] - Filter by media ID
   * @returns {Array} - The filtered downloads
   */
  getDownloads(filters = {}) {
    let filteredDownloads = [...this.downloads];
    
    // Apply filters
    if (filters.status) {
      filteredDownloads = filteredDownloads.filter(d => d.status === filters.status);
    }
    
    if (filters.category) {
      filteredDownloads = filteredDownloads.filter(d => d.category === filters.category);
    }
    
    if (filters.type) {
      filteredDownloads = filteredDownloads.filter(d => d.type === filters.type);
    }
    
    if (filters.mediaId) {
      filteredDownloads = filteredDownloads.filter(d => d.mediaId === filters.mediaId);
    }
    
    return filteredDownloads;
  }
  
  /**
   * Get a download by ID
   * @param {string} id - The download ID
   * @returns {Object|null} - The download object
   */
  getDownload(id) {
    return this.downloads.find(d => d.id === id) || null;
  }
  
  /**
   * Clear completed downloads
   * @returns {Promise<number>} - The number of downloads cleared
   */
  async clearCompleted() {
    try {
      // Find completed downloads
      const completed = this.downloads.filter(d => d.status === 'completed');
      
      if (completed.length === 0) {
        return 0;
      }
      
      // Remove from downloads list
      this.downloads = this.downloads.filter(d => d.status !== 'completed');
      
      // Remove from IndexedDB
      for (const download of completed) {
        await this.db.delete('downloads', download.id);
      }
      
      // Dispatch event
      this._dispatchDownloadEvent('cleared', { count: completed.length });
      
      return completed.length;
    } catch (error) {
      console.error('Error clearing completed downloads:', error);
      return 0;
    }
  }
  
  /**
   * Process the download queue
   * @private
   */
  async _processQueue() {
    try {
      // Check if we can start more downloads
      const activeCount = this.activeDownloads.size;
      
      if (activeCount >= this.maxConcurrent) {
        return;
      }
      
      // Find queued downloads
      const queued = this.downloads.filter(d => d.status === 'queued');
      
      if (queued.length === 0) {
        return;
      }
      
      // Start downloads up to max concurrent
      const toStart = queued.slice(0, this.maxConcurrent - activeCount);
      
      for (const download of toStart) {
        this._startDownload(download);
      }
    } catch (error) {
      console.error('Error processing download queue:', error);
    }
  }
  
  /**
   * Start a download
   * @private
   * @param {Object} download - The download object
   */
  async _startDownload(download) {
    try {
      // Update status
      download.status = 'downloading';
      download.statusText = 'Connecting...';
      download.updatedAt = new Date().toISOString();
      download.startedAt = new Date().toISOString();
      
      // Save to IndexedDB
      await this.db.put('downloads', download);
      
      // Dispatch event
      this._dispatchDownloadEvent('started', { download });
      
      // Create abort controller
      const controller = new AbortController();
      this.activeDownloads.set(download.id, controller);
      
      // Start download
      this._downloadFile(download, controller.signal);
    } catch (error) {
      console.error('Error starting download:', error);
      this._handleDownloadError(download, error);
    }
  }
  
  /**
   * Download a file
   * @private
   * @param {Object} download - The download object
   * @param {AbortSignal} signal - The abort signal
   */
  async _downloadFile(download, signal) {
    try {
      // Create fetch options
      const options = {
        method: 'GET',
        headers: {},
        signal
      };
      
      // Add range header if download has progress
      if (download.downloaded > 0) {
        options.headers['Range'] = `bytes=${download.downloaded}-`;
      }
      
      // Add authorization header if needed
      if (this.api.getAuthToken()) {
        options.headers['Authorization'] = `Bearer ${this.api.getAuthToken()}`;
      }
      
      // Fetch file
      const response = await fetch(download.url, options);
      
      if (!response.ok && response.status !== 206) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }
      
      // Get content length
      const contentLength = parseInt(response.headers.get('Content-Length') || '0', 10);
      
      if (contentLength > 0) {
        download.size = download.downloaded + contentLength;
      }
      
      // Get reader
      const reader = response.body.getReader();
      
      // Update status
      download.statusText = 'Downloading...';
      await this._updateDownload(download);
      
      // Track progress
      let receivedLength = download.downloaded;
      let lastUpdate = Date.now();
      let lastBytes = receivedLength;
      
      // Process chunks
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }
        
        // Update received length
        receivedLength += value.length;
        download.downloaded = receivedLength;
        
        // Calculate progress
        if (download.size > 0) {
          download.progress = Math.round((receivedLength / download.size) * 100);
        }
        
        // Calculate speed every second
        const now = Date.now();
        const elapsed = now - lastUpdate;
        
        if (elapsed >= 1000) {
          const bytesPerSecond = (receivedLength - lastBytes) / (elapsed / 1000);
          download.speed = bytesPerSecond;
          lastUpdate = now;
          lastBytes = receivedLength;
          
          // Update status text with speed
          download.statusText = `Downloading... ${Helpers.formatFileSize(bytesPerSecond)}/s`;
          
          // Update download in DB and UI
          await this._updateDownload(download);
        }
      }
      
      // Download completed
      download.status = 'completed';
      download.statusText = 'Completed';
      download.progress = 100;
      download.speed = 0;
      download.completedAt = new Date().toISOString();
      download.updatedAt = new Date().toISOString();
      
      // Remove from active downloads
      this.activeDownloads.delete(download.id);
      
      // Save to IndexedDB
      await this.db.put('downloads', download);
      
      // Dispatch event
      this._dispatchDownloadEvent('completed', { download });
      
      // Show notification if enabled
      if (window.SettingsManager.get('downloads.notifyOnComplete', true)) {
        window.NotificationManager.showNotification({
          title: 'Download Complete',
          body: download.filename,
          icon: '/assets/icons/download-complete.png',
          type: 'download',
          data: { downloadId: download.id }
        });
      }
      
      // Process queue
      this._processQueue();
    } catch (error) {
      // Ignore abort errors
      if (error.name === 'AbortError') {
        return;
      }
      
      this._handleDownloadError(download, error);
    }
  }
  
  /**
   * Handle download error
   * @private
   * @param {Object} download - The download object
   * @param {Error} error - The error object
   */
  async _handleDownloadError(download, error) {
    try {
      // Update status
      download.status = 'error';
      download.statusText = 'Error';
      download.error = error.message;
      download.updatedAt = new Date().toISOString();
      
      // Remove from active downloads
      if (this.activeDownloads.has(download.id)) {
        this.activeDownloads.delete(download.id);
      }
      
      // Save to IndexedDB
      await this.db.put('downloads', download);
      
      // Dispatch event
      this._dispatchDownloadEvent('error', { download, error: error.message });
      
      // Process queue
      this._processQueue();
    } catch (err) {
      console.error('Error handling download error:', err);
    }
  }
  
  /**
   * Update a download
   * @private
   * @param {Object} download - The download object
   */
  async _updateDownload(download) {
    try {
      // Update timestamp
      download.updatedAt = new Date().toISOString();
      
      // Save to IndexedDB
      await this.db.put('downloads', download);
      
      // Dispatch event
      this._dispatchDownloadEvent('updated', { download });
    } catch (error) {
      console.error('Error updating download:', error);
    }
  }
  
  /**
   * Save all downloads to IndexedDB
   * @private
   */
  async _saveDownloads() {
    try {
      // Save each download
      for (const download of this.downloads) {
        await this.db.put('downloads', download);
      }
    } catch (error) {
      console.error('Error saving downloads:', error);
    }
  }
  
  /**
   * Get file type from filename
   * @private
   * @param {string} filename - The filename
   * @returns {string} - The file type
   */
  _getFileType(filename) {
    if (!filename) return 'unknown';
    
    const extension = Helpers.getFileExtension(filename);
    
    if (Helpers.isImageFile(filename)) return 'image';
    if (Helpers.isVideoFile(filename)) return 'video';
    if (Helpers.isAudioFile(filename)) return 'audio';
    
    switch (extension) {
      case 'pdf':
        return 'document';
      case 'doc':
      case 'docx':
      case 'txt':
      case 'rtf':
        return 'document';
      case 'xls':
      case 'xlsx':
      case 'csv':
        return 'spreadsheet';
      case 'zip':
      case 'rar':
      case '7z':
      case 'tar':
      case 'gz':
        return 'archive';
      case 'exe':
      case 'msi':
      case 'apk':
        return 'application';
      case 'torrent':
        return 'torrent';
      case 'srt':
      case 'vtt':
      case 'sub':
        return 'subtitle';
      default:
        return 'other';
    }
  }
  
  /**
   * Dispatch a download event
   * @private
   * @param {string} type - The event type
   * @param {Object} detail - The event detail
   */
  _dispatchDownloadEvent(type, detail) {
    const event = new CustomEvent('download', {
      detail: {
        type,
        ...detail
      }
    });
    
    document.dispatchEvent(event);
  }
}

// Create and export the download manager instance
window.DownloadManager = new DownloadManager();