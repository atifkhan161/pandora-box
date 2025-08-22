import { Request, Response } from 'express'
import Joi from 'joi'
import { ApiProxyService } from '@/services/apiProxy.js'
import { DatabaseService } from '@/services/database.js'
import { asyncHandler, ValidationError, ExternalServiceError } from '@/middleware/errorHandler.js'
import { logger, logHelpers } from '@/utils/logger.js'
import { getCacheConfig } from '@/config/config.js'

export class StreamingController {
  private apiProxy: ApiProxyService
  private dbService: DatabaseService

  constructor(apiProxy: ApiProxyService, dbService: DatabaseService) {
    this.apiProxy = apiProxy
    this.dbService = dbService
  }

  // Validation schemas
  private availabilitySchema = Joi.object({
    tmdbId: Joi.number().integer().required(),
    type: Joi.string().valid('movie', 'tv').required(),
    region: Joi.string().length(2).default('US')
  })

  private providersSchema = Joi.object({
    region: Joi.string().length(2).default('US'),
    type: Joi.string().valid('movie', 'tv', 'all').default('all')
  })

  // Get streaming availability for content
  getAvailability = asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = this.availabilitySchema.validate({
      tmdbId: parseInt(req.params.tmdbId),
      type: req.params.type,
      region: req.query.region
    })

    if (error) {
      throw new ValidationError(error.details[0].message)
    }

    const { tmdbId, type, region } = value

    try {
      // Check if Watchmode service is available
      if (!this.apiProxy.isServiceAvailable('watchmode')) {
        return res.json({
          success: true,
          data: {
            available: false,
            message: 'Streaming availability service not configured',
            sources: []
          }
        })
      }

      // Check cache first
      const cacheKey = `availability_${tmdbId}_${type}_${region}`
      const cached = await this.dbService.getCachedData('availability', type, cacheKey)
      
      if (cached) {
        logHelpers.logExternalApi('watchmode', '/availability', 'GET', 200, 0, true)
        return res.json({
          success: true,
          data: cached.data,
          cached: true,
          cacheTime: cached.createdAt
        })
      }

      // Fetch from Watchmode
      const data = await this.apiProxy.getWatchmodeAvailability(tmdbId, type)
      
      // Transform the response
      const transformedData = this.transformAvailabilityData(data, region)
      
      // Cache the response
      await this.dbService.setCachedData(
        'availability',
        type,
        transformedData,
        getCacheConfig().ttlAvailability,
        cacheKey
      )

      res.json({
        success: true,
        data: transformedData,
        cached: false
      })

    } catch (error) {
      logger.error('Error fetching streaming availability:', error)
      
      // Return graceful fallback instead of error
      res.json({
        success: true,
        data: {
          available: false,
          message: 'Unable to fetch streaming availability',
          sources: [],
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })
    }
  })

  // Get streaming providers
  getProviders = asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = this.providersSchema.validate(req.query)

    if (error) {
      throw new ValidationError(error.details[0].message)
    }

    const { region, type } = value

    try {
      // Check if Watchmode service is available
      if (!this.apiProxy.isServiceAvailable('watchmode')) {
        return res.json({
          success: true,
          data: {
            providers: [],
            message: 'Streaming provider service not configured'
          }
        })
      }

      // Check cache first
      const cacheKey = `providers_${region}_${type}`
      const cached = await this.dbService.getCachedData('providers', 'global', cacheKey)
      
      if (cached) {
        logHelpers.logExternalApi('watchmode', '/providers', 'GET', 200, 0, true)
        return res.json({
          success: true,
          data: cached.data,
          cached: true,
          cacheTime: cached.createdAt
        })
      }

      // Fetch from Watchmode
      const watchmodeClient = this.apiProxy.getService('watchmode')
      const data = await watchmodeClient.get('/sources', { 
        region,
        types: type === 'all' ? undefined : type
      }, { 
        cache: true, 
        cacheTTL: 86400 // 24 hours
      })
      
      // Transform the response
      const transformedData = this.transformProvidersData(data, region)
      
      // Cache the response
      await this.dbService.setCachedData(
        'providers',
        'global',
        transformedData,
        86400, // 24 hours
        cacheKey
      )

      res.json({
        success: true,
        data: transformedData,
        cached: false
      })

    } catch (error) {
      logger.error('Error fetching streaming providers:', error)
      
      // Return graceful fallback
      res.json({
        success: true,
        data: {
          providers: [],
          message: 'Unable to fetch streaming providers',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })
    }
  })

  // Search content on streaming platforms
  searchStreaming = asyncHandler(async (req: Request, res: Response) => {
    const schema = Joi.object({
      query: Joi.string().required().min(1).max(100),
      type: Joi.string().valid('movie', 'tv', 'all').default('all'),
      region: Joi.string().length(2).default('US'),
      providers: Joi.string().optional() // Comma-separated provider IDs
    })

    const { error, value } = schema.validate(req.query)

    if (error) {
      throw new ValidationError(error.details[0].message)
    }

    const { query, type, region, providers } = value

    try {
      // Check if Watchmode service is available
      if (!this.apiProxy.isServiceAvailable('watchmode')) {
        return res.json({
          success: true,
          data: {
            results: [],
            message: 'Streaming search service not configured'
          }
        })
      }

      // Check cache first
      const cacheKey = `search_${query}_${type}_${region}_${providers || 'all'}`
      const cached = await this.dbService.getCachedData('streaming_search', type, cacheKey)
      
      if (cached) {
        return res.json({
          success: true,
          data: cached.data,
          cached: true,
          cacheTime: cached.createdAt
        })
      }

      // Fetch from Watchmode
      const watchmodeClient = this.apiProxy.getService('watchmode')
      const searchParams: any = { 
        search_field: 'name',
        search_value: query,
        types: type === 'all' ? undefined : type
      }
      
      if (providers) {
        searchParams.source_ids = providers
      }

      const data = await watchmodeClient.get('/autocomplete-search', searchParams, { 
        cache: true, 
        cacheTTL: 3600 // 1 hour
      })
      
      // Transform the response
      const transformedData = this.transformSearchData(data)
      
      // Cache the response
      await this.dbService.setCachedData(
        'streaming_search',
        type,
        transformedData,
        3600, // 1 hour
        cacheKey
      )

      res.json({
        success: true,
        data: transformedData,
        cached: false
      })

    } catch (error) {
      logger.error('Error searching streaming content:', error)
      
      // Return graceful fallback
      res.json({
        success: true,
        data: {
          results: [],
          message: 'Unable to search streaming content',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })
    }
  })

  // Get popular content on streaming platforms
  getPopularStreaming = asyncHandler(async (req: Request, res: Response) => {
    const schema = Joi.object({
      type: Joi.string().valid('movie', 'tv').required(),
      region: Joi.string().length(2).default('US'),
      providers: Joi.string().optional(),
      limit: Joi.number().integer().min(1).max(50).default(20)
    })

    const { error, value } = schema.validate({
      type: req.params.type,
      ...req.query
    })

    if (error) {
      throw new ValidationError(error.details[0].message)
    }

    const { type, region, providers, limit } = value

    try {
      // Check if Watchmode service is available
      if (!this.apiProxy.isServiceAvailable('watchmode')) {
        return res.json({
          success: true,
          data: {
            results: [],
            message: 'Streaming content service not configured'
          }
        })
      }

      // Check cache first
      const cacheKey = `popular_${type}_${region}_${providers || 'all'}_${limit}`
      const cached = await this.dbService.getCachedData('popular_streaming', type, cacheKey)
      
      if (cached) {
        return res.json({
          success: true,
          data: cached.data,
          cached: true,
          cacheTime: cached.createdAt
        })
      }

      // Fetch from Watchmode
      const watchmodeClient = this.apiProxy.getService('watchmode')
      const searchParams: any = { 
        types: type,
        sort_by: 'popularity_score',
        limit
      }
      
      if (providers) {
        searchParams.source_ids = providers
      }

      const data = await watchmodeClient.get('/list-titles', searchParams, { 
        cache: true, 
        cacheTTL: 21600 // 6 hours
      })
      
      // Transform the response
      const transformedData = this.transformContentData(data)
      
      // Cache the response
      await this.dbService.setCachedData(
        'popular_streaming',
        type,
        transformedData,
        21600, // 6 hours
        cacheKey
      )

      res.json({
        success: true,
        data: transformedData,
        cached: false
      })

    } catch (error) {
      logger.error('Error fetching popular streaming content:', error)
      
      // Return graceful fallback
      res.json({
        success: true,
        data: {
          results: [],
          message: 'Unable to fetch popular streaming content',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })
    }
  })

  // Transform availability data
  private transformAvailabilityData(data: any, region: string): any {
    if (!data || !data.sources) {
      return {
        available: false,
        sources: [],
        region,
        message: 'No streaming sources found'
      }
    }

    const sources = data.sources.map((source: any) => ({
      id: source.source_id,
      name: source.name,
      type: source.type, // subscription, rent, buy, free
      logo: source.logo_100px,
      url: source.web_url,
      price: source.price,
      quality: source.format, // HD, SD, 4K
      region: source.region
    }))

    // Group by type
    const groupedSources = {
      subscription: sources.filter((s: any) => s.type === 'sub'),
      rent: sources.filter((s: any) => s.type === 'rent'),
      buy: sources.filter((s: any) => s.type === 'buy'),
      free: sources.filter((s: any) => s.type === 'free')
    }

    return {
      available: sources.length > 0,
      sources: groupedSources,
      region,
      total_sources: sources.length,
      last_updated: new Date().toISOString()
    }
  }

  // Transform providers data
  private transformProvidersData(data: any, region: string): any {
    if (!data) {
      return {
        providers: [],
        region,
        message: 'No providers found'
      }
    }

    const providers = data.map((provider: any) => ({
      id: provider.id,
      name: provider.name,
      type: provider.type,
      logo: provider.logo_100px,
      regions: provider.regions || [region],
      supported_types: provider.supported_types || ['movie', 'tv']
    }))

    return {
      providers,
      region,
      total_providers: providers.length
    }
  }

  // Transform search data
  private transformSearchData(data: any): any {
    if (!data || !data.results) {
      return {
        results: [],
        message: 'No search results found'
      }
    }

    const results = data.results.map((item: any) => ({
      id: item.id,
      title: item.name,
      type: item.type,
      year: item.year,
      tmdb_id: item.tmdb_id,
      imdb_id: item.imdb_id,
      poster: item.poster,
      backdrop: item.backdrop,
      plot_overview: item.plot_overview,
      user_rating: item.user_rating,
      critic_score: item.critic_score,
      sources_count: item.source_ids?.length || 0
    }))

    return {
      results,
      total_results: results.length
    }
  }

  // Transform content data
  private transformContentData(data: any): any {
    if (!data || !data.titles) {
      return {
        results: [],
        message: 'No content found'
      }
    }

    const results = data.titles.map((item: any) => ({
      id: item.id,
      title: item.title,
      type: item.type,
      year: item.year,
      tmdb_id: item.tmdb_id,
      imdb_id: item.imdb_id,
      poster: item.poster,
      backdrop: item.backdrop,
      plot_overview: item.plot_overview,
      user_rating: item.user_rating,
      critic_score: item.critic_score,
      popularity_score: item.popularity_score,
      sources_count: item.source_ids?.length || 0
    }))

    return {
      results,
      total_results: results.length
    }
  }

  // Clear streaming cache
  clearCache = asyncHandler(async (req: Request, res: Response) => {
    try {
      // Clear Watchmode service cache
      if (this.apiProxy.isServiceAvailable('watchmode')) {
        const watchmodeClient = this.apiProxy.getService('watchmode')
        watchmodeClient.clearCache()
      }
      
      logger.info('Streaming cache cleared successfully')
      
      res.json({
        success: true,
        message: 'Streaming cache cleared successfully'
      })
      
    } catch (error) {
      logger.error('Error clearing streaming cache:', error)
      throw new ExternalServiceError('Cache', 'Failed to clear streaming cache')
    }
  })

  // Get cache statistics
  getCacheStats = asyncHandler(async (req: Request, res: Response) => {
    try {
      let cacheStats = {}
      
      if (this.apiProxy.isServiceAvailable('watchmode')) {
        const watchmodeClient = this.apiProxy.getService('watchmode')
        cacheStats = watchmodeClient.getCacheStats()
      }
      
      // Get database cache stats
      const dbStats = this.dbService.getStats()
      
      res.json({
        success: true,
        data: {
          watchmode_client_cache: cacheStats,
          database_cache: {
            availability_entries: dbStats?.media_cache || 0
          }
        }
      })
      
    } catch (error) {
      logger.error('Error getting streaming cache stats:', error)
      throw new ExternalServiceError('Cache', 'Failed to get cache statistics')
    }
  })
}

export default StreamingController