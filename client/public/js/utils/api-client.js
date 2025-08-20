/**
 * API Client for Pandora Box PWA
 * Handles communication with the backend API
 */

class ApiClient {
  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
    this.authToken = null;
    this.initializeToken();
  }

  /**
   * Initialize the auth token from IndexedDB
   */
  async initializeToken() {
    try {
      const token = await this.getTokenFromDB();
      if (token) {
        this.authToken = token;
      }
    } catch (error) {
      console.error('Failed to initialize token:', error);
    }
  }

  /**
   * Get auth token from IndexedDB
   */
  async getTokenFromDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('pandoraBoxDB', 1);

      request.onerror = (event) => {
        reject(new Error('Failed to open database'));
      };

      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(['auth'], 'readonly');
        const store = transaction.objectStore('auth');
        const tokenRequest = store.get('token');

        tokenRequest.onsuccess = () => {
          if (tokenRequest.result) {
            resolve(tokenRequest.result.value);
          } else {
            resolve(null);
          }
        };

        tokenRequest.onerror = () => {
          reject(new Error('Failed to get token from database'));
        };
      };
    });
  }

  /**
   * Set auth token
   */
  setToken(token) {
    this.authToken = token;
  }

  /**
   * Clear auth token
   */
  clearToken() {
    this.authToken = null;
  }

  /**
   * Get request headers
   */
  getHeaders(customHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...customHeaders
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  /**
   * Make a GET request
   */
  async get(endpoint, params = {}, headers = {}) {
    const url = this.buildUrl(endpoint, params);
    return this.request(url, {
      method: 'GET',
      headers: this.getHeaders(headers)
    });
  }

  /**
   * Make a POST request
   */
  async post(endpoint, data = {}, headers = {}) {
    const url = this.buildUrl(endpoint);
    return this.request(url, {
      method: 'POST',
      headers: this.getHeaders(headers),
      body: JSON.stringify(data)
    });
  }

  /**
   * Make a PUT request
   */
  async put(endpoint, data = {}, headers = {}) {
    const url = this.buildUrl(endpoint);
    return this.request(url, {
      method: 'PUT',
      headers: this.getHeaders(headers),
      body: JSON.stringify(data)
    });
  }

  /**
   * Make a DELETE request
   */
  async delete(endpoint, headers = {}) {
    const url = this.buildUrl(endpoint);
    return this.request(url, {
      method: 'DELETE',
      headers: this.getHeaders(headers)
    });
  }

  /**
   * Build URL with query parameters
   */
  buildUrl(endpoint, params = {}) {
    const url = new URL(`${this.baseUrl}${endpoint}`, window.location.origin);
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });
    
    return url.toString();
  }

  /**
   * Make a request with fetch API
   */
  async request(url, options) {
    try {
      const response = await fetch(url, options);
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      // Parse response based on content type
      let data;
      if (isJson) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      
      // Handle error responses
      if (!response.ok) {
        const error = new Error(isJson && data.message ? data.message : 'API request failed');
        error.status = response.status;
        error.data = data;
        throw error;
      }
      
      return data;
    } catch (error) {
      // Handle network errors
      if (!error.status) {
        error.message = 'Network error. Please check your connection.';
      }
      
      // Handle authentication errors
      if (error.status === 401) {
        // Clear token and trigger authentication flow
        this.clearToken();
        this.handleAuthError();
      }
      
      throw error;
    }
  }

  /**
   * Handle authentication errors
   */
  handleAuthError() {
    // Dispatch an event that the app can listen for
    const event = new CustomEvent('auth:error', {
      detail: { message: 'Authentication failed. Please log in again.' }
    });
    window.dispatchEvent(event);
  }

  /**
   * Authentication endpoints
   */
  async login(username, password) {
    const data = await this.post('/auth/login', { username, password });
    if (data && data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  async logout() {
    try {
      await this.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearToken();
    }
  }

  async validateToken() {
    return this.post('/auth/validate');
  }

  /**
   * Media library endpoints
   */
  async getMediaLibraries() {
    return this.get('/library/libraries');
  }

  async getMediaItems(libraryId, params = {}) {
    return this.get(`/library/items/${libraryId}`, params);
  }

  async getMediaItemDetails(itemId) {
    return this.get(`/library/item/${itemId}`);
  }

  async searchMedia(query, params = {}) {
    return this.get('/library/search', { query, ...params });
  }

  /**
   * Download endpoints
   */
  async getTorrents(params = {}) {
    return this.get('/downloads/torrents', params);
  }

  async searchTorrents(query, params = {}) {
    return this.get('/downloads/search', { query, ...params });
  }

  async addTorrent(url, params = {}) {
    return this.post('/downloads/add', { url, ...params });
  }

  async pauseTorrent(id) {
    return this.post(`/downloads/pause/${id}`);
  }

  async resumeTorrent(id) {
    return this.post(`/downloads/resume/${id}`);
  }

  async deleteTorrent(id, deleteFiles = false) {
    return this.delete(`/downloads/delete/${id}?deleteFiles=${deleteFiles}`);
  }

  /**
   * File manager endpoints
   */
  async getDirectoryContents(path = '/') {
    return this.get('/files/list', { path });
  }

  async createDirectory(path, name) {
    return this.post('/files/mkdir', { path, name });
  }

  async deleteFile(path) {
    return this.post('/files/delete', { path });
  }

  async renameFile(path, newName) {
    return this.post('/files/rename', { path, newName });
  }

  /**
   * System endpoints
   */
  async getSystemStats() {
    return this.get('/system/stats');
  }

  async getSystemSettings() {
    return this.get('/system/settings');
  }

  async updateSystemSettings(settings) {
    return this.post('/system/settings', settings);
  }

  async getContainers() {
    return this.get('/system/containers');
  }

  async getContainerLogs(id) {
    return this.get(`/system/container/${id}/logs`);
  }

  async startContainer(id) {
    return this.post(`/system/container/${id}/start`);
  }

  async stopContainer(id) {
    return this.post(`/system/container/${id}/stop`);
  }

  async restartContainer(id) {
    return this.post(`/system/container/${id}/restart`);
  }
}

// Export the API client
window.ApiClient = ApiClient;