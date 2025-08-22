import { HttpClient, HttpClientFactory, HttpClientConfig } from '@/services/httpClient.js'
import { DatabaseService } from '@/services/database.js'
import { config, getApiConfig } from '@/config/config.js'
import { logger } from '@/utils/logger.js'
import { ExternalServiceError } from '@/middleware/errorHandler.js'

export interface ServiceConfig {
  name: string
  baseURL: string
  apiKey?: string
  username?: string
  password?: string
  timeout?: number
  retries?: number
  cacheTTL?: number
  enabled?: boolean
}

export class ApiProxyService {
  private httpFactory: HttpClientFactory
  private dbService: DatabaseService
  private services: Map<string, HttpClient> = new Map()
  private serviceConfigs: Map<string, ServiceConfig> = new Map()

  constructor(dbService: DatabaseService) {
    this.dbService = dbService
    this.httpFactory = new HttpClientFactory(dbService)
    // Initialize services will be called in init method
  }

  // Initialize the API proxy service
  async init(): Promise<void> {
    await this.initializeServices()
  }

  // Initialize all external services
  private async initializeServices(): Promise<void> {
    try {
      // Define service configurations
      const serviceConfigs: ServiceConfig[] = [
        {
          name: 'tmdb',
          baseURL: 'https://api.themoviedb.org/3',
          apiKey: config.apis.tmdb.apiKey,
          timeout: 10000,
          retries: 3,
          cacheTTL: 3600, // 1 hour
          enabled: !!config.apis.tmdb.apiKey
        },
        {
          name: 'watchmode',
          baseURL: 'https://api.watchmode.com/v1',
          apiKey: config.apis.watchmode.apiKey,
          timeout: 10000,
          retries: 3,
          cacheTTL: 86400, // 24 hours
          enabled: !!config.apis.watchmode.apiKey
        },
        {
          name: 'jackett',
          baseURL: config.apis.jackett.url,
          apiKey: config.apis.jackett.apiKey,
          timeout: 30000,
          retries: 2,
          cacheTTL: 900, // 15 minutes
          enabled: !!config.apis.jackett.url && !!config.apis.jackett.apiKey
        },
        {
          name: 'qbittorrent',
          baseURL: config.apis.qbittorrent.url,
          username: config.apis.qbittorrent.username,
          password: config.apis.qbittorrent.password,
          timeout: 15000,
          retries: 3,
          cacheTTL: 0, // No caching for real-time data
          enabled: !!config.apis.qbittorrent.url
        },
        {
          name: 'cloudcommander',
          baseURL: config.apis.cloudCommander.url,
          username: config.apis.cloudCommander.username,
          password: config.apis.cloudCommander.password,
          timeout: 20000,
          retries: 2,
          cacheTTL: 0, // No caching for file operations
          enabled: !!config.apis.cloudCommander.url
        },
        {
          name: 'portainer',
          baseURL: config.apis.portainer.url,
          apiKey: config.apis.portainer.apiKey,
          timeout: 15000,
          retries: 2,
          cacheTTL: 300, // 5 minutes
          enabled: !!config.apis.portainer.url && !!config.apis.portainer.apiKey
        },
        {
          name: 'jellyfin',
          baseURL: config.apis.jellyfin.url,
          apiKey: config.apis.jellyfin.apiKey,
          timeout: 15000,
          retries: 2,
          cacheTTL: 600, // 10 minutes
          enabled: !!config.apis.jellyfin.url && !!config.apis.jellyfin.apiKey
        }
      ]

      // Initialize enabled services
      for (const serviceConfig of serviceConfigs) {
        if (serviceConfig.enabled) {
          await this.initializeService(serviceConfig)
        } else {
          logger.warn(`Service ${serviceConfig.name} is disabled - missing configuration`)
        }
        
        this.serviceConfigs.set(serviceConfig.name, serviceConfig)
      }

      logger.info(`API Proxy Service initialized with ${this.services.size} services`)
    } catch (error) {
      logger.error('Failed to initialize API Proxy Service:', error)
      throw error
    }
  }

  // Initialize individual service
  private async initializeService(serviceConfig: ServiceConfig): Promise<void> {
    try {
      const clientConfig: HttpClientConfig = {
        baseURL: serviceConfig.baseURL,
        timeout: serviceConfig.timeout,
        retries: serviceConfig.retries,
        cacheTTL: serviceConfig.cacheTTL
      }

      // Configure authentication based on service
      if (serviceConfig.apiKey) {
        if (serviceConfig.name === 'tmdb') {
          clientConfig.auth = {
            type: 'api-key',
            apiKey: serviceConfig.apiKey,
            apiKeyHeader: 'Authorization'
          }
          clientConfig.headers = {
            'Authorization': `Bearer ${serviceConfig.apiKey}`
          }
        } else if (serviceConfig.name === 'watchmode') {
          clientConfig.auth = {
            type: 'api-key',
            apiKey: serviceConfig.apiKey,
            apiKeyHeader: 'X-API-Key'
          }
        } else if (serviceConfig.name === 'jackett') {
          clientConfig.auth = {
            type: 'api-key',
            apiKey: serviceConfig.apiKey,
            apiKeyHeader: 'X-Api-Key'
          }
        } else if (serviceConfig.name === 'portainer') {
          clientConfig.auth = {
            type: 'api-key',
            apiKey: serviceConfig.apiKey,
            apiKeyHeader: 'X-API-Key'
          }
        } else if (serviceConfig.name === 'jellyfin') {
          clientConfig.auth = {
            type: 'api-key',
            apiKey: serviceConfig.apiKey,
            apiKeyHeader: 'X-Emby-Token'
          }
        }
      } else if (serviceConfig.username && serviceConfig.password) {
        clientConfig.auth = {
          type: 'basic',
          username: serviceConfig.username,
          password: serviceConfig.password
        }
      }

      const client = this.httpFactory.createClient(serviceConfig.name, clientConfig)
      this.services.set(serviceConfig.name, client)
      
      logger.info(`Initialized ${serviceConfig.name} service client`)
    } catch (error) {
      logger.error(`Failed to initialize ${serviceConfig.name} service:`, error)
      throw error
    }
  }

  // Get service client
  getService(serviceName: string): HttpClient {
    const client = this.services.get(serviceName)
    if (!client) {
      throw new ExternalServiceError(serviceName, 'Service not available or not configured')
    }
    return client
  }

  // Check if service is available
  isServiceAvailable(serviceName: string): boolean {
    return this.services.has(serviceName)
  }

  // Get available services
  getAvailableServices(): string[] {
    return Array.from(this.services.keys())
  }

  // TMDB proxy methods
  async getTMDBTrending(mediaType: 'movie' | 'tv', timeWindow: 'day' | 'week'): Promise<any> {
    const client = this.getService('tmdb')
    return client.get(`/trending/${mediaType}/${timeWindow}`, null, { cache: true, cacheTTL: 21600 })
  }

  async getTMDBPopular(mediaType: 'movie' | 'tv', page: number = 1): Promise<any> {
    const client = this.getService('tmdb')
    return client.get(`/${mediaType}/popular`, { page }, { cache: true, cacheTTL: 21600 })
  }

  async searchTMDB(query: string, mediaType?: 'movie' | 'tv', page: number = 1): Promise<any> {
    const client = this.getService('tmdb')
    const endpoint = mediaType ? `/search/${mediaType}` : '/search/multi'
    return client.get(endpoint, { query, page }, { cache: true, cacheTTL: 3600 })
  }

  async getTMDBDetails(mediaType: 'movie' | 'tv', id: number): Promise<any> {
    const client = this.getService('tmdb')
    return client.get(`/${mediaType}/${id}`, null, { cache: true, cacheTTL: 86400 })
  }

  // Watchmode proxy methods
  async getWatchmodeAvailability(tmdbId: number, sourceType: 'movie' | 'tv'): Promise<any> {
    const client = this.getService('watchmode')
    return client.get('/title/sources', { 
      source_ids: `tmdb:${tmdbId}`,
      source_type: sourceType
    }, { cache: true, cacheTTL: 86400 })
  }

  // Jackett proxy methods
  async searchTorrents(query: string, category?: string): Promise<any> {
    const client = this.getService('jackett')
    return client.get('/api/v2.0/indexers/all/results', {
      apikey: config.apis.jackett.apiKey,
      Query: query,
      Category: category
    }, { cache: true, cacheTTL: 900 })
  }

  // qBittorrent proxy methods
  async qBittorrentLogin(): Promise<any> {
    const client = this.getService('qbittorrent')
    return client.post('/api/v2/auth/login', {
      username: config.apis.qbittorrent.username,
      password: config.apis.qbittorrent.password
    })
  }

  async getQBittorrentTorrents(): Promise<any> {
    const client = this.getService('qbittorrent')
    return client.get('/api/v2/torrents/info', null, { cache: false })
  }

  async addQBittorrentTorrent(magnetUrl: string, savePath?: string): Promise<any> {
    const client = this.getService('qbittorrent')
    return client.post('/api/v2/torrents/add', {
      urls: magnetUrl,
      savepath: savePath
    })
  }

  async controlQBittorrentTorrent(hash: string, action: 'pause' | 'resume' | 'delete'): Promise<any> {
    const client = this.getService('qbittorrent')
    const endpoint = `/api/v2/torrents/${action}`
    return client.post(endpoint, { hashes: hash })
  }

  // Cloud Commander proxy methods
  async browsePath(path: string = '/'): Promise<any> {
    const client = this.getService('cloudcommander')
    return client.get('/api/v1/fs', { path }, { cache: false })
  }

  async moveFile(from: string, to: string): Promise<any> {
    const client = this.getService('cloudcommander')
    return client.put('/api/v1/fs', { from, to, operation: 'move' })
  }

  async copyFile(from: string, to: string): Promise<any> {
    const client = this.getService('cloudcommander')
    return client.put('/api/v1/fs', { from, to, operation: 'copy' })
  }

  async deleteFile(path: string): Promise<any> {
    const client = this.getService('cloudcommander')
    return client.delete('/api/v1/fs', { data: { path } })
  }

  // Portainer proxy methods
  async getPortainerContainers(): Promise<any> {
    const client = this.getService('portainer')
    return client.get('/api/endpoints/1/docker/containers/json?all=true', null, { 
      cache: true, 
      cacheTTL: 300 
    })
  }

  async getPortainerStacks(): Promise<any> {
    const client = this.getService('portainer')
    return client.get('/api/stacks', null, { cache: true, cacheTTL: 300 })
  }

  async restartPortainerContainer(containerId: string): Promise<any> {
    const client = this.getService('portainer')
    return client.post(`/api/endpoints/1/docker/containers/${containerId}/restart`)
  }

  async getPortainerContainerLogs(containerId: string, tail: number = 100): Promise<any> {
    const client = this.getService('portainer')
    return client.get(`/api/endpoints/1/docker/containers/${containerId}/logs`, {
      stdout: true,
      stderr: true,
      tail
    })
  }

  // Jellyfin proxy methods
  async getJellyfinLibraries(): Promise<any> {
    const client = this.getService('jellyfin')
    return client.get('/Library/VirtualFolders', null, { cache: true, cacheTTL: 600 })
  }

  async scanJellyfinLibrary(libraryId: string): Promise<any> {
    const client = this.getService('jellyfin')
    return client.post(`/Library/Refresh?itemId=${libraryId}`)
  }

  async getJellyfinScanStatus(): Promise<any> {
    const client = this.getService('jellyfin')
    return client.get('/ScheduledTasks', null, { cache: false })
  }

  // Health check all services
  async healthCheckAll(): Promise<Record<string, any>> {
    const results = await this.httpFactory.healthCheckAll()
    
    // Add configuration status
    for (const [serviceName, serviceConfig] of this.serviceConfigs) {
      if (!results[serviceName]) {
        results[serviceName] = {
          status: serviceConfig.enabled ? 'unconfigured' : 'disabled',
          message: serviceConfig.enabled ? 'Service not configured' : 'Service disabled'
        }
      }
    }
    
    return results
  }

  // Update service configuration
  async updateServiceConfig(serviceName: string, newConfig: Partial<ServiceConfig>): Promise<void> {
    const currentConfig = this.serviceConfigs.get(serviceName)
    if (!currentConfig) {
      throw new Error(`Service ${serviceName} not found`)
    }

    const updatedConfig = { ...currentConfig, ...newConfig }
    this.serviceConfigs.set(serviceName, updatedConfig)

    // Reinitialize service if it was enabled
    if (updatedConfig.enabled) {
      await this.initializeService(updatedConfig)
      logger.info(`Service ${serviceName} configuration updated and reinitialized`)
    } else {
      this.services.delete(serviceName)
      logger.info(`Service ${serviceName} disabled`)
    }
  }

  // Clear all caches
  clearAllCaches(): void {
    this.httpFactory.clearAllCaches()
    logger.info('All API caches cleared')
  }

  // Get cache statistics
  getCacheStats(): Record<string, any> {
    return this.httpFactory.getAllCacheStats()
  }

  // Get service configurations
  getServiceConfigs(): Record<string, ServiceConfig> {
    const configs: Record<string, ServiceConfig> = {}
    for (const [name, config] of this.serviceConfigs) {
      // Don't expose sensitive data
      configs[name] = {
        ...config,
        apiKey: config.apiKey ? '***' : undefined,
        username: config.username ? '***' : undefined,
        password: config.password ? '***' : undefined
      }
    }
    return configs
  }
}

export default ApiProxyService