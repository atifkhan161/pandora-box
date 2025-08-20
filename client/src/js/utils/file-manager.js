/**
 * File Manager for Pandora Box PWA
 * Handles file operations, browsing, and management
 */

class FileManager {
  constructor() {
    this.currentPath = '/';
    this.files = [];
    this.directories = [];
    this.isLoading = false;
    this.error = null;
    this.selectedItems = new Set();
    this.clipboardItems = [];
    this.clipboardOperation = null; // 'copy' or 'cut'
    this.sortBy = 'name';
    this.sortDirection = 'asc';
    this.viewMode = 'grid'; // 'grid' or 'list'
    this.api = window.ApiClient; // Reference to the API client
    
    // Bind methods
    this.initialize = this.initialize.bind(this);
    this.loadDirectory = this.loadDirectory.bind(this);
    this.navigateUp = this.navigateUp.bind(this);
    this.navigateTo = this.navigateTo.bind(this);
    this.refresh = this.refresh.bind(this);
    this.createDirectory = this.createDirectory.bind(this);
    this.uploadFiles = this.uploadFiles.bind(this);
    this.downloadFile = this.downloadFile.bind(this);
    this.deleteItems = this.deleteItems.bind(this);
    this.renameItem = this.renameItem.bind(this);
    this.copyItems = this.copyItems.bind(this);
    this.cutItems = this.cutItems.bind(this);
    this.pasteItems = this.pasteItems.bind(this);
    this.selectItem = this.selectItem.bind(this);
    this.deselectItem = this.deselectItem.bind(this);
    this.selectAll = this.selectAll.bind(this);
    this.deselectAll = this.deselectAll.bind(this);
    this.getSelectedItems = this.getSelectedItems.bind(this);
    this.setSortBy = this.setSortBy.bind(this);
    this.setViewMode = this.setViewMode.bind(this);
    this.getFileDetails = this.getFileDetails.bind(this);
    this.searchFiles = this.searchFiles.bind(this);
  }
  
  /**
   * Initialize the file manager
   * @returns {Promise<boolean>} - Whether initialization was successful
   */
  async initialize() {
    try {
      // Get file manager settings
      const fileSettings = window.SettingsManager.get('files', {
        defaultSortBy: 'name',
        defaultSortDirection: 'asc',
        defaultViewMode: 'grid',
        showHiddenFiles: false,
        confirmDelete: true,
      });
      
      // Set initial values from settings
      this.sortBy = fileSettings.defaultSortBy;
      this.sortDirection = fileSettings.defaultSortDirection;
      this.viewMode = fileSettings.defaultViewMode;
      this.showHiddenFiles = fileSettings.showHiddenFiles;
      
      // Load root directory
      await this.loadDirectory('/');
      
      // Listen for settings changes
      document.addEventListener('settings-change', (event) => {
        if (event.detail.path === 'files.showHiddenFiles') {
          this.showHiddenFiles = event.detail.value;
          this.refresh();
        }
      });
      
      return true;
    } catch (error) {
      console.error('File manager initialization error:', error);
      this.error = error.message;
      return false;
    }
  }
  
  /**
   * Load directory contents
   * @param {string} path - The directory path to load
   * @returns {Promise<Object>} - The directory contents
   */
  async loadDirectory(path) {
    try {
      this.isLoading = true;
      this.error = null;
      this.selectedItems.clear();
      
      // Normalize path
      path = this._normalizePath(path);
      
      // Dispatch event
      this._dispatchFileEvent('loading', { path, loading: true });
      
      // Fetch directory contents from API
      const response = await this.api.get('/api/files/list', { path });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to load directory');
      }
      
      // Update current path and contents
      this.currentPath = path;
      
      // Filter hidden files if needed
      let files = response.data.files || [];
      let directories = response.data.directories || [];
      
      if (!this.showHiddenFiles) {
        files = files.filter(file => !file.name.startsWith('.'));
        directories = directories.filter(dir => !dir.name.startsWith('.'));
      }
      
      // Sort items
      this.files = this._sortItems(files);
      this.directories = this._sortItems(directories);
      
      this.isLoading = false;
      
      // Dispatch event
      this._dispatchFileEvent('loaded', { 
        path: this.currentPath,
        files: this.files,
        directories: this.directories,
        loading: false 
      });
      
      return {
        path: this.currentPath,
        files: this.files,
        directories: this.directories
      };
    } catch (error) {
      console.error('Error loading directory:', error);
      this.error = error.message;
      this.isLoading = false;
      
      // Dispatch event
      this._dispatchFileEvent('error', { 
        error: error.message,
        loading: false 
      });
      
      throw error;
    }
  }
  
  /**
   * Navigate up one directory
   * @returns {Promise<Object>} - The parent directory contents
   */
  async navigateUp() {
    const parentPath = this._getParentPath(this.currentPath);
    return this.loadDirectory(parentPath);
  }
  
  /**
   * Navigate to a specific path
   * @param {string} path - The path to navigate to
   * @returns {Promise<Object>} - The directory contents
   */
  async navigateTo(path) {
    return this.loadDirectory(path);
  }
  
  /**
   * Refresh the current directory
   * @returns {Promise<Object>} - The directory contents
   */
  async refresh() {
    return this.loadDirectory(this.currentPath);
  }
  
  /**
   * Create a new directory
   * @param {string} name - The directory name
   * @returns {Promise<Object>} - The created directory
   */
  async createDirectory(name) {
    try {
      if (!name) {
        throw new Error('Directory name is required');
      }
      
      // Validate name
      if (!/^[\w\-. ]+$/.test(name)) {
        throw new Error('Invalid directory name. Use only letters, numbers, spaces, hyphens, underscores, and periods.');
      }
      
      // Check if directory already exists
      if (this.directories.some(dir => dir.name === name)) {
        throw new Error(`Directory '${name}' already exists`);
      }
      
      // Create directory via API
      const response = await this.api.post('/api/files/mkdir', { 
        path: this._joinPaths(this.currentPath, name) 
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to create directory');
      }
      
      // Refresh directory
      await this.refresh();
      
      // Show notification
      window.NotificationManager.showToast({
        title: 'Directory Created',
        message: `Directory '${name}' created successfully`,
        type: 'success'
      });
      
      return response.data;
    } catch (error) {
      console.error('Error creating directory:', error);
      
      // Show error notification
      window.NotificationManager.showToast({
        title: 'Create Directory Failed',
        message: error.message,
        type: 'error'
      });
      
      throw error;
    }
  }
  
  /**
   * Upload files to the current directory
   * @param {FileList|Array<File>} files - The files to upload
   * @param {Object} [options={}] - Upload options
   * @param {boolean} [options.overwrite=false] - Whether to overwrite existing files
   * @returns {Promise<Array>} - The uploaded files
   */
  async uploadFiles(files, options = {}) {
    try {
      if (!files || files.length === 0) {
        throw new Error('No files selected');
      }
      
      const uploadedFiles = [];
      const failedFiles = [];
      const totalFiles = files.length;
      let completedFiles = 0;
      
      // Create progress modal
      const modal = document.createElement('div');
      modal.className = 'modal upload-modal';
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h2>Uploading Files</h2>
            <button class="modal-close">&times;</button>
          </div>
          <div class="modal-body">
            <div class="upload-progress">
              <div class="upload-status">Preparing to upload ${totalFiles} files...</div>
              <div class="progress">
                <div class="progress-bar" style="width: 0%"></div>
              </div>
              <div class="upload-details">
                <span class="upload-count">0/${totalFiles}</span>
                <span class="upload-current"></span>
              </div>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      // Add event listeners
      const closeBtn = modal.querySelector('.modal-close');
      closeBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
      });
      
      // Update progress elements
      const progressBar = modal.querySelector('.progress-bar');
      const uploadStatus = modal.querySelector('.upload-status');
      const uploadCount = modal.querySelector('.upload-count');
      const uploadCurrent = modal.querySelector('.upload-current');
      
      // Upload each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
          // Update progress
          uploadStatus.textContent = `Uploading file ${i + 1} of ${totalFiles}`;
          uploadCurrent.textContent = file.name;
          
          // Create form data
          const formData = new FormData();
          formData.append('file', file);
          formData.append('path', this.currentPath);
          formData.append('overwrite', options.overwrite ? 'true' : 'false');
          
          // Upload file via API
          const response = await this.api.upload('/api/files/upload', formData, {
            onProgress: (progress) => {
              // Update individual file progress
              const fileProgress = Math.round(progress);
              progressBar.style.width = `${fileProgress}%`;
            }
          });
          
          if (!response.success) {
            throw new Error(response.message || 'Upload failed');
          }
          
          uploadedFiles.push(response.data);
        } catch (error) {
          console.error(`Error uploading file ${file.name}:`, error);
          failedFiles.push({ file, error: error.message });
        }
        
        // Update completed count
        completedFiles++;
        uploadCount.textContent = `${completedFiles}/${totalFiles}`;
        
        // Update overall progress
        const overallProgress = Math.round((completedFiles / totalFiles) * 100);
        progressBar.style.width = `${overallProgress}%`;
      }
      
      // Update status when complete
      uploadStatus.textContent = 'Upload complete';
      uploadCurrent.textContent = '';
      
      // Close modal after a delay
      setTimeout(() => {
        if (document.body.contains(modal)) {
          document.body.removeChild(modal);
        }
      }, 2000);
      
      // Refresh directory
      await this.refresh();
      
      // Show notification
      if (failedFiles.length === 0) {
        window.NotificationManager.showToast({
          title: 'Upload Complete',
          message: `Successfully uploaded ${uploadedFiles.length} files`,
          type: 'success'
        });
      } else if (uploadedFiles.length === 0) {
        window.NotificationManager.showToast({
          title: 'Upload Failed',
          message: `Failed to upload ${failedFiles.length} files`,
          type: 'error'
        });
      } else {
        window.NotificationManager.showToast({
          title: 'Upload Partially Complete',
          message: `Uploaded ${uploadedFiles.length} files, ${failedFiles.length} failed`,
          type: 'warning'
        });
      }
      
      return uploadedFiles;
    } catch (error) {
      console.error('Error uploading files:', error);
      
      // Show error notification
      window.NotificationManager.showToast({
        title: 'Upload Failed',
        message: error.message,
        type: 'error'
      });
      
      throw error;
    }
  }
  
  /**
   * Download a file
   * @param {string} path - The file path
   * @returns {Promise<boolean>} - Whether the download was initiated
   */
  async downloadFile(path) {
    try {
      // Normalize path
      path = this._normalizePath(path);
      
      // Get file name from path
      const fileName = path.split('/').pop();
      
      // Create download URL
      const downloadUrl = this.api.getDownloadUrl(path);
      
      // Create a hidden link and click it
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return true;
    } catch (error) {
      console.error('Error downloading file:', error);
      
      // Show error notification
      window.NotificationManager.showToast({
        title: 'Download Failed',
        message: error.message,
        type: 'error'
      });
      
      return false;
    }
  }
  
  /**
   * Delete selected items
   * @param {Array<string>} [itemPaths] - Optional specific item paths to delete
   * @returns {Promise<boolean>} - Whether the deletion was successful
   */
  async deleteItems(itemPaths) {
    try {
      // Get items to delete
      const items = itemPaths || this.getSelectedItems();
      
      if (items.length === 0) {
        throw new Error('No items selected for deletion');
      }
      
      // Confirm deletion if enabled in settings
      if (window.SettingsManager.get('files.confirmDelete', true)) {
        const confirmed = await new Promise(resolve => {
          // Create confirmation modal
          const modal = document.createElement('div');
          modal.className = 'modal';
          modal.innerHTML = `
            <div class="modal-content">
              <div class="modal-header">
                <h2>Delete Items</h2>
                <button class="modal-close">&times;</button>
              </div>
              <div class="modal-body">
                <p>Are you sure you want to delete ${items.length} item(s)?</p>
                <p class="text-danger">This action cannot be undone.</p>
              </div>
              <div class="modal-footer">
                <button class="btn btn-secondary modal-cancel">Cancel</button>
                <button class="btn btn-danger modal-confirm">Delete</button>
              </div>
            </div>
          `;
          
          document.body.appendChild(modal);
          
          // Add event listeners
          const closeBtn = modal.querySelector('.modal-close');
          const cancelBtn = modal.querySelector('.modal-cancel');
          const confirmBtn = modal.querySelector('.modal-confirm');
          
          closeBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
            resolve(false);
          });
          
          cancelBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
            resolve(false);
          });
          
          confirmBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
            resolve(true);
          });
        });
        
        if (!confirmed) {
          return false;
        }
      }
      
      // Delete items via API
      const response = await this.api.post('/api/files/delete', { paths: items });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete items');
      }
      
      // Clear selection
      this.deselectAll();
      
      // Refresh directory
      await this.refresh();
      
      // Show notification
      window.NotificationManager.showToast({
        title: 'Items Deleted',
        message: `Successfully deleted ${items.length} item(s)`,
        type: 'success'
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting items:', error);
      
      // Show error notification
      window.NotificationManager.showToast({
        title: 'Delete Failed',
        message: error.message,
        type: 'error'
      });
      
      return false;
    }
  }
  
  /**
   * Rename an item
   * @param {string} path - The item path
   * @param {string} newName - The new name
   * @returns {Promise<boolean>} - Whether the rename was successful
   */
  async renameItem(path, newName) {
    try {
      if (!path || !newName) {
        throw new Error('Path and new name are required');
      }
      
      // Validate name
      if (!/^[\w\-. ]+$/.test(newName)) {
        throw new Error('Invalid name. Use only letters, numbers, spaces, hyphens, underscores, and periods.');
      }
      
      // Normalize path
      path = this._normalizePath(path);
      
      // Get parent directory and old name
      const parentPath = this._getParentPath(path);
      const oldName = path.split('/').pop();
      
      // Check if name is the same
      if (oldName === newName) {
        return true; // No change needed
      }
      
      // Check if destination already exists
      const newPath = this._joinPaths(parentPath, newName);
      const existingItems = [...this.files, ...this.directories];
      
      if (existingItems.some(item => this._joinPaths(this.currentPath, item.name) === newPath)) {
        throw new Error(`An item named '${newName}' already exists`);
      }
      
      // Rename item via API
      const response = await this.api.post('/api/files/rename', { 
        path, 
        newName 
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to rename item');
      }
      
      // Refresh directory
      await this.refresh();
      
      // Show notification
      window.NotificationManager.showToast({
        title: 'Item Renamed',
        message: `Successfully renamed '${oldName}' to '${newName}'`,
        type: 'success'
      });
      
      return true;
    } catch (error) {
      console.error('Error renaming item:', error);
      
      // Show error notification
      window.NotificationManager.showToast({
        title: 'Rename Failed',
        message: error.message,
        type: 'error'
      });
      
      return false;
    }
  }
  
  /**
   * Copy selected items to clipboard
   * @returns {number} - Number of items copied
   */
  copyItems() {
    const items = this.getSelectedItems();
    
    if (items.length === 0) {
      window.NotificationManager.showToast({
        title: 'Copy Failed',
        message: 'No items selected',
        type: 'error'
      });
      return 0;
    }
    
    this.clipboardItems = items;
    this.clipboardOperation = 'copy';
    
    window.NotificationManager.showToast({
      title: 'Items Copied',
      message: `${items.length} item(s) copied to clipboard`,
      type: 'success'
    });
    
    return items.length;
  }
  
  /**
   * Cut selected items to clipboard
   * @returns {number} - Number of items cut
   */
  cutItems() {
    const items = this.getSelectedItems();
    
    if (items.length === 0) {
      window.NotificationManager.showToast({
        title: 'Cut Failed',
        message: 'No items selected',
        type: 'error'
      });
      return 0;
    }
    
    this.clipboardItems = items;
    this.clipboardOperation = 'cut';
    
    window.NotificationManager.showToast({
      title: 'Items Cut',
      message: `${items.length} item(s) cut to clipboard`,
      type: 'success'
    });
    
    return items.length;
  }
  
  /**
   * Paste items from clipboard to current directory
   * @returns {Promise<boolean>} - Whether the paste was successful
   */
  async pasteItems() {
    try {
      if (!this.clipboardItems || this.clipboardItems.length === 0) {
        throw new Error('Clipboard is empty');
      }
      
      if (!this.clipboardOperation) {
        throw new Error('No clipboard operation specified');
      }
      
      // Create progress modal
      const modal = document.createElement('div');
      modal.className = 'modal paste-modal';
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h2>${this.clipboardOperation === 'copy' ? 'Copying' : 'Moving'} Items</h2>
            <button class="modal-close">&times;</button>
          </div>
          <div class="modal-body">
            <div class="paste-progress">
              <div class="paste-status">Preparing...</div>
              <div class="progress">
                <div class="progress-bar" style="width: 0%"></div>
              </div>
              <div class="paste-details">
                <span class="paste-count">0/${this.clipboardItems.length}</span>
                <span class="paste-current"></span>
              </div>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      // Add event listeners
      const closeBtn = modal.querySelector('.modal-close');
      closeBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
      });
      
      // Update progress elements
      const progressBar = modal.querySelector('.progress-bar');
      const pasteStatus = modal.querySelector('.paste-status');
      const pasteCount = modal.querySelector('.paste-count');
      const pasteCurrent = modal.querySelector('.paste-current');
      
      // Paste items via API
      const operation = this.clipboardOperation === 'copy' ? 'copy' : 'move';
      const response = await this.api.post(`/api/files/${operation}`, { 
        sources: this.clipboardItems,
        destination: this.currentPath,
        onProgress: (current, total, currentItem) => {
          // Update progress
          const progress = Math.round((current / total) * 100);
          progressBar.style.width = `${progress}%`;
          pasteStatus.textContent = `${this.clipboardOperation === 'copy' ? 'Copying' : 'Moving'} items...`;
          pasteCount.textContent = `${current}/${total}`;
          pasteCurrent.textContent = currentItem || '';
        }
      });
      
      if (!response.success) {
        throw new Error(response.message || `Failed to ${operation} items`);
      }
      
      // Close modal
      if (document.body.contains(modal)) {
        document.body.removeChild(modal);
      }
      
      // Clear clipboard if move operation
      if (this.clipboardOperation === 'cut') {
        this.clipboardItems = [];
        this.clipboardOperation = null;
      }
      
      // Refresh directory
      await this.refresh();
      
      // Show notification
      window.NotificationManager.showToast({
        title: `${this.clipboardOperation === 'copy' ? 'Copy' : 'Move'} Complete`,
        message: `Successfully ${this.clipboardOperation === 'copy' ? 'copied' : 'moved'} ${this.clipboardItems.length} item(s)`,
        type: 'success'
      });
      
      return true;
    } catch (error) {
      console.error('Error pasting items:', error);
      
      // Show error notification
      window.NotificationManager.showToast({
        title: 'Paste Failed',
        message: error.message,
        type: 'error'
      });
      
      return false;
    }
  }
  
  /**
   * Select an item
   * @param {string} path - The item path
   */
  selectItem(path) {
    this.selectedItems.add(path);
    this._dispatchFileEvent('selection-change', { 
      selectedItems: Array.from(this.selectedItems) 
    });
  }
  
  /**
   * Deselect an item
   * @param {string} path - The item path
   */
  deselectItem(path) {
    this.selectedItems.delete(path);
    this._dispatchFileEvent('selection-change', { 
      selectedItems: Array.from(this.selectedItems) 
    });
  }
  
  /**
   * Select all items in the current directory
   */
  selectAll() {
    this.selectedItems.clear();
    
    // Add all files and directories to selection
    this.files.forEach(file => {
      this.selectedItems.add(this._joinPaths(this.currentPath, file.name));
    });
    
    this.directories.forEach(dir => {
      this.selectedItems.add(this._joinPaths(this.currentPath, dir.name));
    });
    
    this._dispatchFileEvent('selection-change', { 
      selectedItems: Array.from(this.selectedItems) 
    });
  }
  
  /**
   * Deselect all items
   */
  deselectAll() {
    this.selectedItems.clear();
    this._dispatchFileEvent('selection-change', { 
      selectedItems: [] 
    });
  }
  
  /**
   * Get selected items
   * @returns {Array<string>} - The selected item paths
   */
  getSelectedItems() {
    return Array.from(this.selectedItems);
  }
  
  /**
   * Set sort method
   * @param {string} sortBy - The property to sort by
   * @param {string} [direction] - The sort direction ('asc' or 'desc')
   */
  setSortBy(sortBy, direction) {
    if (this.sortBy === sortBy && !direction) {
      // Toggle direction if clicking the same sort property
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = sortBy;
      this.sortDirection = direction || 'asc';
    }
    
    // Re-sort items
    this.files = this._sortItems(this.files);
    this.directories = this._sortItems(this.directories);
    
    // Dispatch event
    this._dispatchFileEvent('sort-change', { 
      sortBy: this.sortBy,
      sortDirection: this.sortDirection 
    });
  }
  
  /**
   * Set view mode
   * @param {string} mode - The view mode ('grid' or 'list')
   */
  setViewMode(mode) {
    if (mode !== 'grid' && mode !== 'list') {
      return;
    }
    
    this.viewMode = mode;
    
    // Dispatch event
    this._dispatchFileEvent('view-change', { viewMode: this.viewMode });
  }
  
  /**
   * Get file details
   * @param {string} path - The file path
   * @returns {Promise<Object>} - The file details
   */
  async getFileDetails(path) {
    try {
      // Normalize path
      path = this._normalizePath(path);
      
      // Get file details via API
      const response = await this.api.get('/api/files/info', { path });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to get file details');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error getting file details:', error);
      throw error;
    }
  }
  
  /**
   * Search for files
   * @param {string} query - The search query
   * @param {Object} [options={}] - Search options
   * @param {string} [options.path='/'] - The path to search in
   * @param {boolean} [options.recursive=true] - Whether to search recursively
   * @param {boolean} [options.caseSensitive=false] - Whether the search is case sensitive
   * @returns {Promise<Object>} - The search results
   */
  async searchFiles(query, options = {}) {
    try {
      if (!query) {
        throw new Error('Search query is required');
      }
      
      this.isLoading = true;
      
      // Dispatch event
      this._dispatchFileEvent('search-start', { query, loading: true });
      
      // Set default options
      const searchOptions = {
        path: options.path || '/',
        recursive: options.recursive !== undefined ? options.recursive : true,
        caseSensitive: options.caseSensitive || false,
        query
      };
      
      // Search files via API
      const response = await this.api.get('/api/files/search', searchOptions);
      
      if (!response.success) {
        throw new Error(response.message || 'Search failed');
      }
      
      this.isLoading = false;
      
      // Dispatch event
      this._dispatchFileEvent('search-results', { 
        query,
        results: response.data,
        loading: false 
      });
      
      return response.data;
    } catch (error) {
      console.error('Error searching files:', error);
      this.isLoading = false;
      
      // Dispatch event
      this._dispatchFileEvent('search-error', { 
        query,
        error: error.message,
        loading: false 
      });
      
      throw error;
    }
  }
  
  /**
   * Sort items by the current sort method
   * @private
   * @param {Array<Object>} items - The items to sort
   * @returns {Array<Object>} - The sorted items
   */
  _sortItems(items) {
    return [...items].sort((a, b) => {
      let valueA, valueB;
      
      switch (this.sortBy) {
        case 'name':
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
          break;
        case 'size':
          valueA = a.size || 0;
          valueB = b.size || 0;
          break;
        case 'type':
          valueA = a.type || '';
          valueB = b.type || '';
          break;
        case 'modified':
          valueA = new Date(a.modified || 0).getTime();
          valueB = new Date(b.modified || 0).getTime();
          break;
        default:
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
      }
      
      // Compare values
      if (valueA < valueB) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }
  
  /**
   * Normalize a path
   * @private
   * @param {string} path - The path to normalize
   * @returns {string} - The normalized path
   */
  _normalizePath(path) {
    // Ensure path starts with /
    if (!path.startsWith('/')) {
      path = '/' + path;
    }
    
    // Remove trailing slash except for root
    if (path !== '/' && path.endsWith('/')) {
      path = path.slice(0, -1);
    }
    
    return path;
  }
  
  /**
   * Get parent path
   * @private
   * @param {string} path - The path
   * @returns {string} - The parent path
   */
  _getParentPath(path) {
    // Normalize path
    path = this._normalizePath(path);
    
    // Root has no parent
    if (path === '/') {
      return '/';
    }
    
    // Get parent path
    const parts = path.split('/');
    parts.pop();
    
    return parts.join('/') || '/';
  }
  
  /**
   * Join paths
   * @private
   * @param {string} base - The base path
   * @param {string} path - The path to join
   * @returns {string} - The joined path
   */
  _joinPaths(base, path) {
    // Normalize base
    base = this._normalizePath(base);
    
    // Remove leading slash from path
    if (path.startsWith('/')) {
      path = path.slice(1);
    }
    
    // Join paths
    return base === '/' ? `/${path}` : `${base}/${path}`;
  }
  
  /**
   * Dispatch a file event
   * @private
   * @param {string} type - The event type
   * @param {Object} detail - The event detail
   */
  _dispatchFileEvent(type, detail) {
    const event = new CustomEvent('file', {
      detail: {
        type,
        ...detail
      }
    });
    
    document.dispatchEvent(event);
  }
}

// Create and export the file manager instance
window.FileManager = new FileManager();