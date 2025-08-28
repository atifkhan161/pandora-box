/**
 * Base API Client Service
 * Handles all HTTP communication with the backend API
 */

import authService from './auth.js'

class ApiClient {
  constructor() {
    this.baseURL = '/api/v1'
    this.timeout = 30000 // 30 seconds
    this.retryAttempts = 3
    this.retryDelay = 1000 // 1 second
  }

  /**
   * Get default headers for API requests
   * @returns {object}
   */
  getDefaultHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }

    // Add authorization header if token exists
    const authHeaders = authService.getAuthHeaders()
    return { ...headers, ...authHeaders }
  }

  /**
   * Handle API response
   * @param {Response} response 
   * @returns {Promise<any>}
   */
  async handleResponse(response) {
    const contentType = response.headers.get('content-type')
    
    let data
    if (contentType && contentType.includes('application/json')) {
      data = await response.json()
    } else {
      data = await response.text()
    }

    if (!response.ok) {
      // Handle authentication errors
      if (response.status === 401) {
        // Try to refresh token
        const refreshed = await authService.refreshToken()
        if (!refreshed) {
          // Token refresh failed, logout user
          await authService.logout()
          
          // Redirect to login if we have access to the app
          if (window.app) {
            window.app.views.main.router.navigate('/login/', {
              clearPreviousHistory: true
            })
          }
        }
        
        throw new ApiError('Authentication required', response.status, data)
      }

      // Handle other HTTP errors
      const errorMessage = data?.message || data?.error || `HTTP ${response.status}: ${response.statusText}`
      throw new ApiError(errorMessage, response.status, data)
    }

    return data
  }

  /**
   * Make HTTP request with retry logic
   * @param {string} url 
   * @param {object} options 
   * @param {number} attempt 
   * @returns {Promise<any>}
   */
  async makeRequest(url, options = {}, attempt = 1) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          ...this.getDefaultHeaders(),
          ...options.headers
        }
      })

      clearTimeout(timeoutId)
      return await this.handleResponse(response)
    } catch (error) {
      clearTimeout(timeoutId)

      // Handle abort/timeout errors
      if (error.name === 'AbortError') {
        throw new ApiError('Request timeout', 408)
      }

      // Handle network errors with retry
      if (error instanceof TypeError && attempt < this.retryAttempts) {
        console.warn(`Request failed (attempt ${attempt}/${this.retryAttempts}):`, error.message)
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt))
        
        return this.makeRequest(url, options, attempt + 1)
      }

      // Re-throw API errors or final network errors
      throw error
    }
  }

  /**
   * GET request
   * @param {string} endpoint 
   * @param {object} params 
   * @param {object} options 
   * @returns {Promise<any>}
   */
  async get(endpoint, params = {}, options = {}) {
    const url = new URL(`${this.baseURL}${endpoint}`, window.location.origin)
    
    // Add query parameters
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key])
      }
    })

    return this.makeRequest(url.toString(), {
      method: 'GET',
      ...options
    })
  }

  /**
   * POST request
   * @param {string} endpoint 
   * @param {any} data 
   * @param {object} options 
   * @returns {Promise<any>}
   */
  async post(endpoint, data = null, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    
    const requestOptions = {
      method: 'POST',
      ...options
    }

    if (data !== null) {
      if (data instanceof FormData) {
        // Don't set Content-Type for FormData, let browser set it
        const { 'Content-Type': _, ...headersWithoutContentType } = this.getDefaultHeaders()
        requestOptions.headers = {
          ...headersWithoutContentType,
          ...options.headers
        }
        requestOptions.body = data
      } else {
        requestOptions.body = JSON.stringify(data)
      }
    }

    return this.makeRequest(url, requestOptions)
  }

  /**
   * PUT request
   * @param {string} endpoint 
   * @param {any} data 
   * @param {object} options 
   * @returns {Promise<any>}
   */
  async put(endpoint, data = null, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    
    const requestOptions = {
      method: 'PUT',
      ...options
    }

    if (data !== null) {
      if (data instanceof FormData) {
        const { 'Content-Type': _, ...headersWithoutContentType } = this.getDefaultHeaders()
        requestOptions.headers = {
          ...headersWithoutContentType,
          ...options.headers
        }
        requestOptions.body = data
      } else {
        requestOptions.body = JSON.stringify(data)
      }
    }

    return this.makeRequest(url, requestOptions)
  }

  /**
   * PATCH request
   * @param {string} endpoint 
   * @param {any} data 
   * @param {object} options 
   * @returns {Promise<any>}
   */
  async patch(endpoint, data = null, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    
    const requestOptions = {
      method: 'PATCH',
      ...options
    }

    if (data !== null) {
      requestOptions.body = JSON.stringify(data)
    }

    return this.makeRequest(url, requestOptions)
  }

  /**
   * DELETE request
   * @param {string} endpoint 
   * @param {object} options 
   * @returns {Promise<any>}
   */
  async delete(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    
    return this.makeRequest(url, {
      method: 'DELETE',
      ...options
    })
  }

  /**
   * Upload file
   * @param {string} endpoint 
   * @param {File|FileList} files 
   * @param {object} additionalData 
   * @param {function} onProgress 
   * @returns {Promise<any>}
   */
  async upload(endpoint, files, additionalData = {}, onProgress = null) {
    const formData = new FormData()
    
    // Add files
    if (files instanceof FileList) {
      Array.from(files).forEach((file, index) => {
        formData.append(`file${index}`, file)
      })
    } else if (files instanceof File) {
      formData.append('file', files)
    }
    
    // Add additional data
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key])
    })

    const options = {}
    
    // Add progress tracking if callback provided
    if (onProgress && typeof onProgress === 'function') {
      // Note: Fetch API doesn't support upload progress natively
      // This would need to be implemented with XMLHttpRequest if needed
      console.warn('Upload progress tracking not implemented with Fetch API')
    }

    return this.post(endpoint, formData, options)
  }

  /**
   * Download file
   * @param {string} endpoint 
   * @param {string} filename 
   * @param {object} params 
   * @returns {Promise<void>}
   */
  async download(endpoint, filename = null, params = {}) {
    const url = new URL(`${this.baseURL}${endpoint}`, window.location.origin)
    
    // Add query parameters
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key])
      }
    })

    const response = await this.makeRequest(url.toString(), {
      method: 'GET'
    })

    // Create blob and download
    const blob = new Blob([response])
    const downloadUrl = window.URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename || 'download'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    window.URL.revokeObjectURL(downloadUrl)
  }

  /**
   * Health check
   * @returns {Promise<object>}
   */
  async healthCheck() {
    return this.get('/health')
  }
}

/**
 * Custom API Error class
 */
class ApiError extends Error {
  constructor(message, status = 500, data = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

// Create singleton instance
const apiClient = new ApiClient()

export default apiClient
export { ApiError }