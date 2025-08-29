/**
 * Base API Client for Pandora PWA
 * Handles all HTTP communication with the backend API
 * Includes comprehensive error handling, token refresh, and retry mechanisms
 */

import { JWTManager } from '../utils/jwt-manager.js'

export class ApiError extends Error {
  constructor(message, status, code, details = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export class NetworkError extends Error {
  constructor(message, originalError = null) {
    super(message)
    this.name = 'NetworkError'
    this.originalError = originalError
  }
}

export class ApiClient {
  constructor(baseURL = '/api/v1', options = {}) {
    this.baseURL = baseURL
    this.jwtManager = new JWTManager()
    
    // Configuration options
    this.options = {
      timeout: 30000, // 30 seconds
      retryAttempts: 3,
      retryDelay: 1000, // 1 second
      retryBackoff: 2, // Exponential backoff multiplier
      ...options
    }

    // Request interceptors
    this.requestInterceptors = []
    this.responseInterceptors = []

    // Add default request interceptor for authentication
    this.addRequestInterceptor(this.authInterceptor.bind(this))
    
    // Add default response interceptor for token refresh
    this.addResponseInterceptor(this.tokenRefreshInterceptor.bind(this))
  }

  /**
   * Add request interceptor
   * @param {Function} interceptor - Function that modifies request options
   */
  addRequestInterceptor(interceptor) {
    this.requestInterceptors.push(interceptor)
  }

  /**
   * Add response interceptor
   * @param {Function} interceptor - Function that handles response
   */
  addResponseInterceptor(interceptor) {
    this.responseInterceptors.push(interceptor)
  }

  /**
   * Default authentication interceptor
   * @param {string} url - Request URL
   * @param {RequestInit} options - Fetch options
   * @returns {RequestInit} Modified options
   */
  async authInterceptor(url, options) {
    const token = await this.jwtManager.getValidToken()
    if (token) {
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      }
    }
    return options
  }

  /**
   * Token refresh interceptor
   * @param {Response} response - Fetch response
   * @param {string} url - Original request URL
   * @param {RequestInit} options - Original request options
   * @returns {Response|Promise<Response>} Response or retry promise
   */
  async tokenRefreshInterceptor(response, url, options) {
    // Prevent infinite loops by checking if this is already a retry
    if (response.status === 401 && !options._isRetry) {
      const refreshed = await this.jwtManager.refreshToken()
      if (refreshed) {
        // Mark this as a retry to prevent infinite loops
        const retryOptions = { ...options, _isRetry: true }
        // Retry the original request with new token
        return this.request(url, retryOptions)
      } else {
        // Refresh failed, redirect to login
        this.handleAuthenticationFailure()
        throw new ApiError('Authentication failed', 401, 'AUTH_FAILED')
      }
    }
    return response
  }

  /**
   * Handle authentication failure
   */
  handleAuthenticationFailure() {
    this.jwtManager.clearTokens()
    // Dispatch custom event for app to handle
    window.dispatchEvent(new CustomEvent('auth:logout', {
      detail: { reason: 'token_expired' }
    }))
  }

  /**
   * Create full URL from endpoint
   * @param {string} endpoint - API endpoint
   * @returns {string} Full URL
   */
  createURL(endpoint) {
    if (endpoint.startsWith('http')) {
      return endpoint
    }
    return `${this.baseURL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`
  }

  /**
   * Create AbortController with timeout
   * @param {number} timeout - Timeout in milliseconds
   * @returns {AbortController} Abort controller
   */
  createAbortController(timeout = this.options.timeout) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    
    // Clear timeout when request completes
    controller.signal.addEventListener('abort', () => {
      clearTimeout(timeoutId)
    })
    
    return controller
  }

  /**
   * Sleep for specified duration
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise} Promise that resolves after delay
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Calculate retry delay with exponential backoff
   * @param {number} attempt - Current attempt number (0-based)
   * @returns {number} Delay in milliseconds
   */
  calculateRetryDelay(attempt) {
    return this.options.retryDelay * Math.pow(this.options.retryBackoff, attempt)
  }

  /**
   * Check if error is retryable
   * @param {Error} error - Error to check
   * @returns {boolean} Whether error is retryable
   */
  isRetryableError(error) {
    if (error instanceof NetworkError) {
      return true
    }
    
    if (error instanceof ApiError) {
      // Retry on server errors (5xx) but not client errors (4xx)
      return error.status >= 500
    }
    
    return false
  }

  /**
   * Make HTTP request with retry logic
   * @param {string} url - Request URL
   * @param {RequestInit} options - Fetch options
   * @param {number} attempt - Current attempt number
   * @returns {Promise<Response>} Response promise
   */
  async request(url, options = {}, attempt = 0) {
    const fullURL = this.createURL(url)
    
    // Apply request interceptors
    let modifiedOptions = { ...options }
    for (const interceptor of this.requestInterceptors) {
      modifiedOptions = await interceptor(fullURL, modifiedOptions)
    }

    // Set default headers
    modifiedOptions.headers = {
      'Content-Type': 'application/json',
      ...modifiedOptions.headers
    }

    // Create abort controller for timeout
    const controller = this.createAbortController()
    modifiedOptions.signal = controller.signal

    try {
      const response = await fetch(fullURL, modifiedOptions)
      
      // Apply response interceptors
      let finalResponse = response
      for (const interceptor of this.responseInterceptors) {
        finalResponse = await interceptor(finalResponse, fullURL, modifiedOptions)
      }

      // Check if response is ok
      if (!finalResponse.ok) {
        const errorData = await this.parseErrorResponse(finalResponse)
        throw new ApiError(
          errorData.message || `HTTP ${finalResponse.status}: ${finalResponse.statusText}`,
          finalResponse.status,
          errorData.code || 'HTTP_ERROR',
          errorData.details
        )
      }

      return finalResponse
      
    } catch (error) {
      // Handle network errors
      if (error.name === 'AbortError') {
        throw new NetworkError('Request timeout', error)
      }
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new NetworkError('Network connection failed', error)
      }

      // If it's already our custom error, re-throw
      if (error instanceof ApiError || error instanceof NetworkError) {
        // Check if we should retry
        if (this.isRetryableError(error) && attempt < this.options.retryAttempts) {
          const delay = this.calculateRetryDelay(attempt)
          console.warn(`Request failed, retrying in ${delay}ms (attempt ${attempt + 1}/${this.options.retryAttempts})`, error)
          
          await this.sleep(delay)
          return this.request(url, options, attempt + 1)
        }
        
        throw error
      }

      // Unknown error
      throw new NetworkError('Unknown request error', error)
    }
  }

  /**
   * Parse error response body
   * @param {Response} response - Error response
   * @returns {Promise<Object>} Parsed error data
   */
  async parseErrorResponse(response) {
    try {
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        return await response.json()
      } else {
        const text = await response.text()
        return { message: text || response.statusText }
      }
    } catch (error) {
      return { message: response.statusText || 'Unknown error' }
    }
  }

  /**
   * Parse response body
   * @param {Response} response - Response to parse
   * @returns {Promise<any>} Parsed response data
   */
  async parseResponse(response) {
    const contentType = response.headers.get('content-type')
    
    if (contentType && contentType.includes('application/json')) {
      return await response.json()
    }
    
    if (contentType && contentType.includes('text/')) {
      return await response.text()
    }
    
    return await response.blob()
  }

  /**
   * GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Query parameters
   * @param {RequestInit} options - Additional fetch options
   * @returns {Promise<any>} Response data
   */
  async get(endpoint, params = {}, options = {}) {
    let fullUrl = this.createURL(endpoint)
    
    // Add query parameters
    if (Object.keys(params).length > 0) {
      const urlParams = new URLSearchParams()
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          urlParams.append(key, params[key])
        }
      })
      
      const separator = fullUrl.includes('?') ? '&' : '?'
      fullUrl = `${fullUrl}${separator}${urlParams.toString()}`
    }
    
    const response = await this.request(fullUrl, {
      method: 'GET',
      ...options
    })
    
    return this.parseResponse(response)
  }

  /**
   * POST request
   * @param {string} endpoint - API endpoint
   * @param {any} data - Request body data
   * @param {RequestInit} options - Additional fetch options
   * @returns {Promise<any>} Response data
   */
  async post(endpoint, data = null, options = {}) {
    const requestOptions = {
      method: 'POST',
      ...options
    }
    
    if (data !== null) {
      if (data instanceof FormData) {
        requestOptions.body = data
        // Remove Content-Type header for FormData (browser will set it with boundary)
        delete requestOptions.headers?.['Content-Type']
      } else {
        requestOptions.body = JSON.stringify(data)
      }
    }
    
    const response = await this.request(endpoint, requestOptions)
    return this.parseResponse(response)
  }

  /**
   * PUT request
   * @param {string} endpoint - API endpoint
   * @param {any} data - Request body data
   * @param {RequestInit} options - Additional fetch options
   * @returns {Promise<any>} Response data
   */
  async put(endpoint, data = null, options = {}) {
    const requestOptions = {
      method: 'PUT',
      ...options
    }
    
    if (data !== null) {
      if (data instanceof FormData) {
        requestOptions.body = data
        delete requestOptions.headers?.['Content-Type']
      } else {
        requestOptions.body = JSON.stringify(data)
      }
    }
    
    const response = await this.request(endpoint, requestOptions)
    return this.parseResponse(response)
  }

  /**
   * PATCH request
   * @param {string} endpoint - API endpoint
   * @param {any} data - Request body data
   * @param {RequestInit} options - Additional fetch options
   * @returns {Promise<any>} Response data
   */
  async patch(endpoint, data = null, options = {}) {
    const requestOptions = {
      method: 'PATCH',
      ...options
    }
    
    if (data !== null) {
      if (data instanceof FormData) {
        requestOptions.body = data
        delete requestOptions.headers?.['Content-Type']
      } else {
        requestOptions.body = JSON.stringify(data)
      }
    }
    
    const response = await this.request(endpoint, requestOptions)
    return this.parseResponse(response)
  }

  /**
   * DELETE request
   * @param {string} endpoint - API endpoint
   * @param {RequestInit} options - Additional fetch options
   * @returns {Promise<any>} Response data
   */
  async delete(endpoint, options = {}) {
    const response = await this.request(endpoint, {
      method: 'DELETE',
      ...options
    })
    
    return this.parseResponse(response)
  }

  /**
   * Upload file with progress tracking
   * @param {string} endpoint - Upload endpoint
   * @param {File|FormData} fileData - File or FormData to upload
   * @param {Function} onProgress - Progress callback
   * @param {RequestInit} options - Additional options
   * @returns {Promise<any>} Upload response
   */
  async upload(endpoint, fileData, onProgress = null, options = {}) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      
      // Setup progress tracking
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100
            onProgress(progress, event.loaded, event.total)
          }
        })
      }
      
      // Setup completion handlers
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText)
            resolve(response)
          } catch (error) {
            resolve(xhr.responseText)
          }
        } else {
          reject(new ApiError(
            `Upload failed: ${xhr.statusText}`,
            xhr.status,
            'UPLOAD_ERROR'
          ))
        }
      })
      
      xhr.addEventListener('error', () => {
        reject(new NetworkError('Upload network error'))
      })
      
      xhr.addEventListener('timeout', () => {
        reject(new NetworkError('Upload timeout'))
      })
      
      // Prepare request
      xhr.open('POST', this.createURL(endpoint))
      xhr.timeout = this.options.timeout
      
      // Add auth header
      this.jwtManager.getValidToken().then(token => {
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        }
        
        // Send request
        if (fileData instanceof FormData) {
          xhr.send(fileData)
        } else {
          const formData = new FormData()
          formData.append('file', fileData)
          xhr.send(formData)
        }
      }).catch(reject)
    })
  }

  /**
   * Download file with progress tracking
   * @param {string} endpoint - Download endpoint
   * @param {Function} onProgress - Progress callback
   * @param {RequestInit} options - Additional options
   * @returns {Promise<Blob>} Downloaded file blob
   */
  async download(endpoint, onProgress = null, options = {}) {
    const response = await this.request(endpoint, {
      method: 'GET',
      ...options
    })
    
    if (!response.body) {
      throw new ApiError('No response body for download', 500, 'DOWNLOAD_ERROR')
    }
    
    const contentLength = response.headers.get('content-length')
    const total = contentLength ? parseInt(contentLength, 10) : 0
    
    if (!onProgress || !total) {
      return await response.blob()
    }
    
    // Track download progress
    const reader = response.body.getReader()
    const chunks = []
    let loaded = 0
    
    while (true) {
      const { done, value } = await reader.read()
      
      if (done) break
      
      chunks.push(value)
      loaded += value.length
      
      onProgress((loaded / total) * 100, loaded, total)
    }
    
    return new Blob(chunks)
  }

  /**
   * Health check endpoint
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    return this.get('health')
  }

  /**
   * Get API client statistics
   * @returns {Object} Client statistics
   */
  getStats() {
    return {
      baseURL: this.baseURL,
      timeout: this.options.timeout,
      retryAttempts: this.options.retryAttempts,
      retryDelay: this.options.retryDelay,
      interceptors: {
        request: this.requestInterceptors.length,
        response: this.responseInterceptors.length
      }
    }
  }
}

// Create default API client instance
export const apiClient = new ApiClient()

export default ApiClient