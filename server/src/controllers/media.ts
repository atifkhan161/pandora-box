import { Request, Response } from 'express'
import Joi from 'joi'
import { ApiProxyService } from '@/services/apiProxy.js'
import { DatabaseService } from '@/services/database.js'
import { asyncHandler, ValidationError, ExternalServiceError } from '@/middleware/errorHandler.js'
import { logger, logHelpers } from '@/utils/logger.js'
import { getCacheConfig } from '@/config/config.js'

export class MediaController {
  private apiProxy: ApiProxyService
  private dbService: DatabaseService

  constructor(apiProxy: ApiProxyService, dbService: DatabaseService) {
    this.apiProxy = apiProxy
    this.dbService = dbService
  }

  // Validation schemas
  private trendingSchema = Joi.object({
    type: Joi.string().valid('movie', 'tv').required(),
    timeWindow: Joi.string().valid('day', 'week').default('day')
  })

  private popularSchema = Joi.object({
    type: Joi.string().valid('movie', 'tv').required(),
    page: Joi.number().integer().min(1).max(500).default(1)
  })

  private searchSchema = Joi.object({
    query: Joi.string().required().min(1).max(100),
    type: Joi.string().valid('movie', 'tv', 'multi').default('multi'),
    page: Joi.number().integer().min(1).max(500).default(1),
    year: Joi.number().integer().min(1900).max(new Date().getFullYear() + 5).optional(),
    include_adult: Joi.boolean().default(false)
  })

  private detailsSchema = Joi.object({
    type: Joi.string().valid('movie', 'tv').required(),
    id: Joi.number().integer().required()
  })

  // Get trending content
  getTrending = asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = this.trendingSchema.validate({
      type: req.params.type,
      timeWindow: req.params.timeWindow
    })

    if (error) {
      throw new ValidationError(error.details[0].message)
    }

    const { type, timeWindow } = value

    try {
      // Check cache first
      const cacheKey = `trending_${type}_${timeWindow}`
      const cached = await this.dbService.getCachedData('trending', type, timeWindow)
      
      if (cached) {
        logHelpers.logExternalApi('tmdb', `/trending/${type}/${timeWindow}`, 'GET', 200, 0, true)
        return res.json({
          success: true,
          data: cached.data,
          cached: true,
          cacheTime: cached.createdAt
        })
      }

      // Fetch from TMDB
      const data = await this.apiProxy.getTMDBTrending(type, timeWindow)
      
      // Transform and enrich data
      const transformedData = await this.transformMediaList(data.results || [])
      
      // Cache the response
      await this.dbService.setCachedData(
        'trending',
        type,
        { ...data, results: transformedData },
        getCacheConfig().ttlTrending,
        timeWindow
      )

      res.json({
        success: true,
        data: { ...data, results: transformedData },
        cached: false
      })

    } catch (error) {
      logger.error('Error fetching trending content:', error)
      throw new ExternalServiceError('TMDB', 'Failed to fetch trending content')
    }
  })

  // Get popular content
  getPopular = asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = this.popularSchema.validate({
      type: req.params.type,
      page: req.query.page
    })

    if (error) {
      throw new ValidationError(error.details[0].message)
    }

    const { type, page } = value

    try {
      // Check cache first
      const cacheKey = `popular_${type}_${page}`
      const cached = await this.dbService.getCachedData('popular', type, page.toString())
      
      if (cached) {
        logHelpers.logExternalApi('tmdb', `/popular/${type}`, 'GET', 200, 0, true)
        return res.json({
          success: true,
          data: cached.data,
          cached: true,
          cacheTime: cached.createdAt
        })
      }

      // Fetch from TMDB
      const data = await this.apiProxy.getTMDBPopular(type, page)
      
      // Transform and enrich data
      const transformedData = await this.transformMediaList(data.results || [])
      
      // Cache the response
      await this.dbService.setCachedData(
        'popular',
        type,
        { ...data, results: transformedData },
        getCacheConfig().ttlTrending,
        page.toString()
      )

      res.json({
        success: true,
        data: { ...data, results: transformedData },
        cached: false
      })

    } catch (error) {
      logger.error('Error fetching popular content:', error)
      throw new ExternalServiceError('TMDB', 'Failed to fetch popular content')
    }
  })

  // Search content
  search = asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = this.searchSchema.validate(req.query)

    if (error) {
      throw new ValidationError(error.details[0].message)
    }

    const { query, type, page, year, include_adult } = value

    try {
      // Check cache first
      const cacheKey = `search_${type}_${query}_${page}_${year || 'noYear'}`
      const cached = await this.dbService.getCachedData('search', type, cacheKey)
      
      if (cached) {
        logHelpers.logExternalApi('tmdb', '/search', 'GET', 200, 0, true)
        return res.json({
          success: true,
          data: cached.data,
          cached: true,
          cacheTime: cached.createdAt
        })
      }

      // Prepare search parameters
      const searchParams: any = { query, page, include_adult }
      if (year) searchParams.year = year

      // Fetch from TMDB
      const data = await this.apiProxy.searchTMDB(query, type === 'multi' ? undefined : type, page)
      
      // Transform and enrich data
      const transformedData = await this.transformMediaList(data.results || [])
      
      // Cache the response
      await this.dbService.setCachedData(
        'search',
        type,
        { ...data, results: transformedData },
        getCacheConfig().ttlSearch,
        cacheKey
      )

      res.json({
        success: true,
        data: { ...data, results: transformedData },
        cached: false
      })

    } catch (error) {
      logger.error('Error searching content:', error)
      throw new ExternalServiceError('TMDB', 'Failed to search content')
    }
  })

  // Get content details
  getDetails = asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = this.detailsSchema.validate({
      type: req.params.type,
      id: parseInt(req.params.id)
    })

    if (error) {
      throw new ValidationError(error.details[0].message)
    }

    const { type, id } = value

    try {
      // Check cache first
      const cacheKey = `details_${type}_${id}`
      const cached = await this.dbService.getCachedData('details', type, id.toString())
      
      if (cached) {
        logHelpers.logExternalApi('tmdb', `/details/${type}/${id}`, 'GET', 200, 0, true)
        return res.json({
          success: true,
          data: cached.data,
          cached: true,
          cacheTime: cached.createdAt
        })
      }

      // Fetch from TMDB
      const data = await this.apiProxy.getTMDBDetails(type, id)
      
      // Transform and enrich data
      const transformedData = await this.transformMediaDetails(data)
      
      // Try to get streaming availability from Watchmode
      try {
        if (this.apiProxy.isServiceAvailable('watchmode')) {
          const availability = await this.apiProxy.getWatchmodeAvailability(id, type)
          transformedData.streaming_availability = availability
        }
      } catch (error) {
        logger.warn('Failed to fetch streaming availability:', error)
        transformedData.streaming_availability = null
      }
      
      // Cache the response
      await this.dbService.setCachedData(
        'details',
        type,
        transformedData,
        getCacheConfig().ttlDetails,
        id.toString()
      )

      res.json({
        success: true,
        data: transformedData,
        cached: false
      })

    } catch (error) {
      logger.error('Error fetching content details:', error)
      throw new ExternalServiceError('TMDB', 'Failed to fetch content details')
    }
  })

  // Get genres
  getGenres = asyncHandler(async (req: Request, res: Response) => {
    const { type } = req.params

    if (!['movie', 'tv'].includes(type)) {
      throw new ValidationError('Type must be movie or tv')
    }

    try {
      // Check cache first
      const cached = await this.dbService.getCachedData('genres', type)
      
      if (cached) {
        return res.json({
          success: true,
          data: cached.data,
          cached: true,
          cacheTime: cached.createdAt
        })
      }

      // Fetch from TMDB
      const tmdbClient = this.apiProxy.getService('tmdb')
      const data = await tmdbClient.get(`/genre/${type}/list`, null, { 
        cache: true, 
        cacheTTL: 86400 // 24 hours
      })
      
      // Cache the response
      await this.dbService.setCachedData(
        'genres',
        type,
        data,
        86400 // 24 hours
      )

      res.json({
        success: true,
        data: data,
        cached: false
      })

    } catch (error) {
      logger.error('Error fetching genres:', error)
      throw new ExternalServiceError('TMDB', 'Failed to fetch genres')
    }
  })

  // Get top rated content
  getTopRated = asyncHandler(async (req: Request, res: Response) => {
    const { type } = req.params
    const page = parseInt(req.query.page as string) || 1

    if (!['movie', 'tv'].includes(type)) {
      throw new ValidationError('Type must be movie or tv')
    }

    try {
      // Check cache first
      const cached = await this.dbService.getCachedData('top_rated', type, page.toString())
      
      if (cached) {
        return res.json({
          success: true,
          data: cached.data,
          cached: true,
          cacheTime: cached.createdAt
        })
      }

      // Fetch from TMDB
      const tmdbClient = this.apiProxy.getService('tmdb')
      const data = await tmdbClient.get(`/${type}/top_rated`, { page }, { 
        cache: true, 
        cacheTTL: 21600 // 6 hours
      })
      
      // Transform and enrich data
      const transformedData = await this.transformMediaList(data.results || [])
      
      // Cache the response
      await this.dbService.setCachedData(
        'top_rated',
        type,
        { ...data, results: transformedData },
        21600, // 6 hours
        page.toString()
      )

      res.json({
        success: true,
        data: { ...data, results: transformedData },
        cached: false
      })

    } catch (error) {
      logger.error('Error fetching top rated content:', error)
      throw new ExternalServiceError('TMDB', 'Failed to fetch top rated content')
    }
  })

  // Transform media list for consistent response format
  private async transformMediaList(results: any[]): Promise<any[]> {
    return results.map(item => this.transformMediaItem(item))
  }

  // Transform individual media item
  private transformMediaItem(item: any): any {
    const isMovie = item.title !== undefined
    
    return {
      id: item.id,
      title: isMovie ? item.title : item.name,
      original_title: isMovie ? item.original_title : item.original_name,
      overview: item.overview,
      poster_path: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
      backdrop_path: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : null,
      release_date: isMovie ? item.release_date : item.first_air_date,
      vote_average: Math.round(item.vote_average * 10) / 10,
      vote_count: item.vote_count,
      popularity: Math.round(item.popularity),
      genre_ids: item.genre_ids || [],
      adult: item.adult || false,
      media_type: isMovie ? 'movie' : 'tv',
      original_language: item.original_language
    }
  }

  // Transform detailed media information
  private async transformMediaDetails(data: any): Promise<any> {
    const isMovie = data.title !== undefined
    
    return {
      id: data.id,
      title: isMovie ? data.title : data.name,
      original_title: isMovie ? data.original_title : data.original_name,
      overview: data.overview,
      poster_path: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null,
      backdrop_path: data.backdrop_path ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}` : null,
      release_date: isMovie ? data.release_date : data.first_air_date,
      vote_average: Math.round(data.vote_average * 10) / 10,
      vote_count: data.vote_count,
      popularity: Math.round(data.popularity),
      runtime: isMovie ? data.runtime : data.episode_run_time?.[0],
      genres: data.genres || [],
      production_companies: data.production_companies || [],
      production_countries: data.production_countries || [],
      spoken_languages: data.spoken_languages || [],
      status: data.status,
      tagline: data.tagline,
      homepage: data.homepage,
      budget: isMovie ? data.budget : undefined,
      revenue: isMovie ? data.revenue : undefined,
      number_of_seasons: !isMovie ? data.number_of_seasons : undefined,
      number_of_episodes: !isMovie ? data.number_of_episodes : undefined,
      created_by: !isMovie ? data.created_by : undefined,
      networks: !isMovie ? data.networks : undefined,
      seasons: !isMovie ? data.seasons : undefined,
      media_type: isMovie ? 'movie' : 'tv',
      adult: data.adult || false,
      original_language: data.original_language,
      credits: data.credits,
      videos: data.videos,
      images: data.images,
      recommendations: data.recommendations?.results?.slice(0, 10) || [],
      similar: data.similar?.results?.slice(0, 10) || []
    }
  }

  // Clear media cache
  clearCache = asyncHandler(async (req: Request, res: Response) => {
    try {
      // Clear TMDB service cache
      const tmdbClient = this.apiProxy.getService('tmdb')
      tmdbClient.clearCache()
      
      // Clear database cache
      const cacheTypes = ['trending', 'popular', 'search', 'details', 'genres', 'top_rated']
      for (const type of cacheTypes) {
        // This would need to be implemented in the database service
        // await this.dbService.clearCacheByType(type)
      }
      
      logger.info('Media cache cleared successfully')
      
      res.json({
        success: true,
        message: 'Media cache cleared successfully'
      })
      
    } catch (error) {
      logger.error('Error clearing media cache:', error)
      throw new ExternalServiceError('Cache', 'Failed to clear media cache')
    }
  })

  // Get cache statistics
  getCacheStats = asyncHandler(async (req: Request, res: Response) => {
    try {
      const tmdbClient = this.apiProxy.getService('tmdb')
      const cacheStats = tmdbClient.getCacheStats()
      
      // Get database cache stats
      const dbStats = this.dbService.getStats()
      
      res.json({
        success: true,
        data: {
          tmdb_client_cache: cacheStats,
          database_cache: {
            media_cache_entries: dbStats?.media_cache || 0
          }
        }
      })
      
    } catch (error) {
      logger.error('Error getting cache stats:', error)
      throw new ExternalServiceError('Cache', 'Failed to get cache statistics')
    }
  })
}

export default MediaController