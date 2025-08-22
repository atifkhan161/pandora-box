// API Service for Pandora Box
class ApiService {
  constructor() {
    this.baseURL = '/api/v1'
    this.requestTimeout = 10000 // 10 seconds
    this.defaultHeaders = {
      'Content-Type': 'application/json'
    }
  }

  // Initialize API service
  init() {
    console.log('API Service initialized')
  }

  // Get authentication token
  getAuthToken() {
    // Import authService dynamically to avoid circular dependency
    if (window.authService) {
      return window.authService.getToken()
    }
    return null
  }

  // Create request headers
  createHeaders(customHeaders = {}) {
    const headers = { ...this.defaultHeaders, ...customHeaders }
    
    const token = this.getAuthToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    return headers
  }

  // Make HTTP request
  async request(method, endpoint, data = null, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const headers = this.createHeaders(options.headers)
    
    const config = {
      method,
      headers,
      signal: AbortSignal.timeout(this.requestTimeout),
      ...options
    }

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = JSON.stringify(data)
    }

    try {
      console.log(`API Request: ${method} ${url}`, data)
      
      const response = await fetch(url, config)
      
      // Handle different response types
      const contentType = response.headers.get('content-type')
      let responseData
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json()
      } else {
        responseData = await response.text()
      }

      if (!response.ok) {
        throw new Error(responseData.message || `HTTP Error: ${response.status}`)
      }

      console.log(`API Response: ${method} ${url}`, responseData)
      return responseData
      
    } catch (error) {
      console.error(`API Error: ${method} ${url}`, error)
      
      // Handle different error types
      if (error.name === 'AbortError') {
        throw new Error('Request timeout')
      } else if (error.message.includes('401')) {
        // Token expired or invalid
        if (window.authService) {
          await window.authService.logout()
        }
        throw new Error('Authentication required')
      } else if (error.message.includes('403')) {
        throw new Error('Access denied')
      } else if (error.message.includes('404')) {
        throw new Error('Resource not found')
      } else if (error.message.includes('500')) {
        throw new Error('Server error')
      } else if (!navigator.onLine) {
        throw new Error('No internet connection')
      }
      
      throw error
    }
  }

  // GET request
  async get(endpoint, options = {}) {
    return this.request('GET', endpoint, null, options)
  }

  // POST request
  async post(endpoint, data, options = {}) {
    return this.request('POST', endpoint, data, options)
  }

  // PUT request
  async put(endpoint, data, options = {}) {
    return this.request('PUT', endpoint, data, options)
  }

  // PATCH request
  async patch(endpoint, data, options = {}) {
    return this.request('PATCH', endpoint, data, options)
  }

  // DELETE request
  async delete(endpoint, options = {}) {
    return this.request('DELETE', endpoint, null, options)
  }

  // Upload file
  async uploadFile(endpoint, file, onProgress = null) {
    const formData = new FormData()
    formData.append('file', file)

    const headers = {}
    const token = this.getAuthToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('File upload error:', error)
      throw error
    }
  }

  // Download file
  async downloadFile(endpoint, filename = null) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        headers: this.createHeaders()
      })

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = filename || 'download'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('File download error:', error)
      throw error
    }
  }

  // Batch requests
  async batch(requests) {
    try {
      const promises = requests.map(req => {
        return this.request(req.method, req.endpoint, req.data, req.options)
      })
      
      const results = await Promise.allSettled(promises)
      
      return results.map((result, index) => ({
        request: requests[index],
        success: result.status === 'fulfilled',
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason.message : null
      }))
      
    } catch (error) {
      console.error('Batch request error:', error)
      throw error
    }
  }

  // Retry mechanism
  async retryRequest(requestFn, maxRetries = 3, delay = 1000) {
    let lastError
    
    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await requestFn()
      } catch (error) {
        lastError = error
        
        if (i < maxRetries) {
          console.warn(`Request failed, retrying in ${delay}ms (attempt ${i + 1}/${maxRetries})`)
          await new Promise(resolve => setTimeout(resolve, delay))
          delay *= 2 // Exponential backoff
        }
      }
    }
    
    throw lastError
  }

  // Cache management
  async getCached(key, requestFn, ttl = 300000) { // 5 minutes default TTL
    try {
      const cached = localStorage.getItem(`api_cache_${key}`)
      if (cached) {
        const { data, timestamp } = JSON.parse(cached)
        if (Date.now() - timestamp < ttl) {
          return data
        }
      }
      
      const data = await requestFn()
      localStorage.setItem(`api_cache_${key}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }))
      
      return data
    } catch (error) {
      // Return cached data if available, even if expired
      const cached = localStorage.getItem(`api_cache_${key}`)
      if (cached) {
        const { data } = JSON.parse(cached)
        console.warn('Using expired cache due to request failure:', error)
        return data
      }
      throw error
    }
  }

  // Clear cache
  clearCache(pattern = null) {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith('api_cache_')) {
        if (!pattern || key.includes(pattern)) {
          localStorage.removeItem(key)
        }
      }
    })
  }

  // Health check
  async healthCheck() {
    try {
      const response = await this.get('/health')
      return {
        status: 'healthy',
        data: response
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      }
    }
  }
}

// Create and export singleton instance
export const apiService = new ApiService()