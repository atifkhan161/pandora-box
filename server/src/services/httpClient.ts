import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { config, getCacheConfig } from '@/config/config.js'
import { logger, logHelpers } from '@/utils/logger.js'
import { DatabaseService } from '@/services/database.js'
import { ExternalServiceError } from '@/middleware/errorHandler.js'

export interface HttpClientConfig {
  baseURL: string
  timeout?: number
  headers?: Record<string, string>
  retries?: number
  retryDelay?: number
  cacheTTL?: number
  auth?: {
    type: 'bearer' | 'basic' | 'api-key'
    token?: string
    username?: string
    password?: string
    apiKey?: string
    apiKeyHeader?: string
  }
}

export interface CachedResponse<T = any> {
  data: T
  timestamp: number
  expiresAt: number
}

export class HttpClient {
  private client: AxiosInstance
  private serviceName: string
  private config: HttpClientConfig
  private dbService?: DatabaseService
  private cache: Map<string, CachedResponse> = new Map()

  constructor(serviceName: string, config: HttpClientConfig, dbService?: DatabaseService) {
    this.serviceName = serviceName
    this.config = config
    this.dbService = dbService

    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 10000,
      headers: {
        'User-Agent': 'Pandora-Box/1.0.0',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...config.headers
      }
    })

    this.setupInterceptors()
    this.setupAuthentication()
  }

  // Setup request/response interceptors
  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const start = Date.now()
        config.metadata = { start }
        
        logHelpers.logExternalApi(
          this.serviceName,
          config.url || '',
          config.method?.toUpperCase() || 'GET',
          0,
          0,
          false
        )
        
        return config
      },
      (error) => {
        logger.error(`${this.serviceName} request error:`, error)
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        const duration = Date.now() - (response.config.metadata?.start || 0)
        
        logHelpers.logExternalApi(
          this.serviceName,
          response.config.url || '',
          response.config.method?.toUpperCase() || 'GET',
          response.status,
          duration,
          false
        )
        
        return response
      },
      (error: AxiosError) => {
        const duration = Date.now() - (error.config?.metadata?.start || 0)
        
        logHelpers.logExternalApi(
          this.serviceName,
          error.config?.url || '',
          error.config?.method?.toUpperCase() || 'GET',
          error.response?.status || 0,
          duration,
          false
        )
        
        logger.error(`${this.serviceName} response error:`, error.message)
        return Promise.reject(this.handleError(error))
      }
    )
  }

  // Setup authentication
  private setupAuthentication(): void {
    if (!this.config.auth) return

    const { auth } = this.config

    switch (auth.type) {
      case 'bearer':
        if (auth.token) {
          this.client.defaults.headers.common['Authorization'] = `Bearer ${auth.token}`
        }
        break

      case 'basic':
        if (auth.username && auth.password) {
          const credentials = Buffer.from(`${auth.username}:${auth.password}`).toString('base64')
          this.client.defaults.headers.common['Authorization'] = `Basic ${credentials}`
        }
        break

      case 'api-key':
        if (auth.apiKey && auth.apiKeyHeader) {
          this.client.defaults.headers.common[auth.apiKeyHeader] = auth.apiKey
        }
        break
    }
  }

  // Handle axios errors
  private handleError(error: AxiosError): Error {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status
      const message = error.response.data?.message || error.message
      
      if (status >= 500) {
        return new ExternalServiceError(this.serviceName, `Server error: ${message}`)
      } else if (status === 429) {
        return new ExternalServiceError(this.serviceName, 'Rate limit exceeded')
      } else if (status === 401) {
        return new ExternalServiceError(this.serviceName, 'Authentication failed')
      } else if (status === 403) {
        return new ExternalServiceError(this.serviceName, 'Access forbidden')
      } else if (status === 404) {
        return new ExternalServiceError(this.serviceName, 'Resource not found')
      } else {
        return new ExternalServiceError(this.serviceName, `Client error: ${message}`)
      }
    } else if (error.request) {
      // Network error
      return new ExternalServiceError(this.serviceName, 'Network error - service unavailable')
    } else {
      // Other error
      return new ExternalServiceError(this.serviceName, `Request error: ${error.message}`)
    }
  }

  // Generate cache key
  private getCacheKey(url: string, params?: any): string {
    const paramString = params ? JSON.stringify(params) : ''
    return `${this.serviceName}:${url}:${paramString}`
  }

  // Get cached response
  private getCachedResponse<T>(cacheKey: string): T | null {
    const cached = this.cache.get(cacheKey)
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data
    }
    
    // Remove expired cache
    if (cached) {
      this.cache.delete(cacheKey)
    }
    
    return null
  }

  // Set cached response
  private setCachedResponse<T>(cacheKey: string, data: T, ttl: number): void {
    const expiresAt = Date.now() + (ttl * 1000)
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      expiresAt
    })
  }

  // GET request with caching
  async get<T = any>(url: string, params?: any, options?: { cache?: boolean, cacheTTL?: number }): Promise<T> {
    const cacheKey = this.getCacheKey(url, params)
    const useCache = options?.cache !== false
    const cacheTTL = options?.cacheTTL || this.config.cacheTTL || 300 // 5 minutes default

    // Check cache first
    if (useCache) {
      const cached = this.getCachedResponse<T>(cacheKey)
      if (cached) {
        logHelpers.logExternalApi(
          this.serviceName,
          url,
          'GET',
          200,
          0,
          true
        )
        return cached
      }
    }

    // Make request with retry logic
    const response = await this.requestWithRetry<T>('GET', url, { params })
    
    // Cache successful responses
    if (useCache && response) {
      this.setCachedResponse(cacheKey, response, cacheTTL)
    }
    
    return response
  }

  // POST request
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.requestWithRetry<T>('POST', url, { data, ...config })
    return response
  }

  // PUT request
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.requestWithRetry<T>('PUT', url, { data, ...config })
    return response
  }

  // DELETE request
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.requestWithRetry<T>('DELETE', url, config)
    return response
  }

  // PATCH request
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.requestWithRetry<T>('PATCH', url, { data, ...config })
    return response
  }

  // Request with retry logic
  private async requestWithRetry<T>(
    method: string,
    url: string,
    config?: AxiosRequestConfig,
    attempt: number = 1
  ): Promise<T> {
    const maxRetries = this.config.retries || 3
    const retryDelay = this.config.retryDelay || 1000

    try {
      const response: AxiosResponse<T> = await this.client.request({
        method,
        url,
        ...config
      })
      
      return response.data
    } catch (error) {
      const axiosError = error as AxiosError
      
      // Don't retry on client errors (4xx) except 429 (rate limit)
      if (axiosError.response && 
          axiosError.response.status >= 400 && 
          axiosError.response.status < 500 && 
          axiosError.response.status !== 429) {
        throw this.handleError(axiosError)
      }
      
      // Retry on network errors, 5xx errors, and 429 rate limits
      if (attempt < maxRetries) {
        logger.warn(
          `${this.serviceName} request failed (attempt ${attempt}/${maxRetries}), retrying in ${retryDelay}ms:`,
          axiosError.message
        )
        
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt))
        return this.requestWithRetry<T>(method, url, config, attempt + 1)
      }
      
      throw this.handleError(axiosError)
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy', message?: string }> {
    try {
      await this.client.request({
        method: 'GET',
        url: '/health',
        timeout: 5000
      })
      
      return { status: 'healthy' }
    } catch (error) {
      return { 
        status: 'unhealthy', 
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Update authentication
  updateAuth(auth: HttpClientConfig['auth']): void {
    this.config.auth = auth
    this.setupAuthentication()
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear()
  }

  // Get cache stats
  getCacheStats(): { size: number, entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    }
  }

  // Get service name
  getServiceName(): string {
    return this.serviceName
  }
}

// Service factory for creating HTTP clients
export class HttpClientFactory {
  private clients: Map<string, HttpClient> = new Map()
  private dbService?: DatabaseService

  constructor(dbService?: DatabaseService) {
    this.dbService = dbService
  }

  // Create or get HTTP client for service
  createClient(serviceName: string, config: HttpClientConfig): HttpClient {
    if (this.clients.has(serviceName)) {
      return this.clients.get(serviceName)!
    }

    const client = new HttpClient(serviceName, config, this.dbService)
    this.clients.set(serviceName, client)
    return client
  }

  // Get existing client
  getClient(serviceName: string): HttpClient | undefined {
    return this.clients.get(serviceName)
  }

  // Health check all clients
  async healthCheckAll(): Promise<Record<string, any>> {
    const results: Record<string, any> = {}
    
    for (const [serviceName, client] of this.clients) {
      try {
        results[serviceName] = await client.healthCheck()
      } catch (error) {
        results[serviceName] = {
          status: 'unhealthy',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }
    
    return results
  }

  // Clear all caches
  clearAllCaches(): void {
    for (const client of this.clients.values()) {
      client.clearCache()
    }
  }

  // Get all cache stats
  getAllCacheStats(): Record<string, any> {
    const stats: Record<string, any> = {}
    
    for (const [serviceName, client] of this.clients) {
      stats[serviceName] = client.getCacheStats()
    }
    
    return stats
  }
}

export default HttpClient

// Extend Axios config for metadata
declare module 'axios' {
  interface AxiosRequestConfig {
    metadata?: {
      start: number
    }
  }
}