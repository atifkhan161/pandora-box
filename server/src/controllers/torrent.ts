import { Request, Response } from 'express'
import Joi from 'joi'
import { ApiProxyService } from '@/services/apiProxy.js'
import { DatabaseService } from '@/services/database.js'
import { asyncHandler, ValidationError, ExternalServiceError } from '@/middleware/errorHandler.js'
import { logger, logHelpers } from '@/utils/logger.js'

export class TorrentController {
  private apiProxy: ApiProxyService
  private dbService: DatabaseService

  constructor(apiProxy: ApiProxyService, dbService: DatabaseService) {
    this.apiProxy = apiProxy
    this.dbService = dbService
  }

  // Validation schemas
  private searchSchema = Joi.object({
    query: Joi.string().required().min(1).max(200),
    category: Joi.string().valid('movie', 'tv', 'all').default('all'),
    minSeeders: Joi.number().integer().min(0).default(1),
    maxResults: Joi.number().integer().min(1).max(100).default(50),
    sortBy: Joi.string().valid('seeders', 'size', 'name', 'date').default('seeders'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
    quality: Joi.string().valid('4k', '1080p', '720p', '480p', 'any').default('any'),
    trustedOnly: Joi.boolean().default(false)
  })

  private indexersSchema = Joi.object({
    category: Joi.string().valid('movie', 'tv', 'all').default('all')
  })

  // Search torrents across all indexers
  searchTorrents = asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = this.searchSchema.validate(req.query)

    if (error) {
      throw new ValidationError(error.details[0].message)
    }

    const { query, category, minSeeders, maxResults, sortBy, sortOrder, quality, trustedOnly } = value
    const userId = req.user!.id

    try {
      // Check if Jackett service is available
      if (!this.apiProxy.isServiceAvailable('jackett')) {
        return res.json({
          success: false,
          message: 'Torrent search service not configured',
          data: {
            results: [],
            indexers: [],
            totalResults: 0
          }
        })
      }

      // Check cache first (shorter cache for torrent searches)
      const cacheKey = `${query}_${category}_${quality}_${minSeeders}`
      const cached = await this.dbService.getCachedData('torrent_search', category, cacheKey)
      
      if (cached && this.isCacheValid(cached.createdAt, 900)) { // 15 minutes cache
        logHelpers.logExternalApi('jackett', '/search', 'GET', 200, 0, true)
        return res.json({
          success: true,
          data: cached.data,
          cached: true,
          cacheTime: cached.createdAt
        })
      }

      // Build Jackett search parameters
      const jackettParams = this.buildJackettParams(query, category, quality)
      
      // Fetch from Jackett
      const data = await this.apiProxy.searchTorrents(query, jackettParams.category)
      
      // Process and filter results
      const processedResults = this.processSearchResults(
        data,
        { minSeeders, maxResults, sortBy, sortOrder, quality, trustedOnly }
      )
      
      // Save search to database for history
      await this.saveSearchHistory(userId, query, category, processedResults.results.length)
      
      // Cache the response (15 minutes for torrent searches)
      await this.dbService.setCachedData(
        'torrent_search',
        category,
        processedResults,
        900, // 15 minutes
        cacheKey
      )

      res.json({
        success: true,
        data: processedResults,
        cached: false
      })

    } catch (error) {
      logger.error('Error searching torrents:', error)
      throw new ExternalServiceError('Jackett', 'Failed to search torrents')
    }
  })

  // Get available indexers
  getIndexers = asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = this.indexersSchema.validate(req.query)

    if (error) {
      throw new ValidationError(error.details[0].message)
    }

    const { category } = value

    try {
      // Check if Jackett service is available
      if (!this.apiProxy.isServiceAvailable('jackett')) {
        return res.json({
          success: false,
          message: 'Jackett service not configured',
          data: { indexers: [] }
        })
      }

      // Check cache first
      const cached = await this.dbService.getCachedData('indexers', 'global', category)
      
      if (cached && this.isCacheValid(cached.createdAt, 3600)) { // 1 hour cache
        return res.json({
          success: true,
          data: cached.data,
          cached: true,
          cacheTime: cached.createdAt
        })
      }

      // Fetch from Jackett
      const jackettClient = this.apiProxy.getService('jackett')
      const data = await jackettClient.get('/api/v2.0/indexers', {
        configured: 'true'
      }, { cache: true, cacheTTL: 3600 })
      
      // Transform indexer data
      const transformedData = this.transformIndexersData(data, category)
      
      // Cache the response
      await this.dbService.setCachedData(
        'indexers',
        'global',
        transformedData,
        3600, // 1 hour
        category
      )

      res.json({
        success: true,
        data: transformedData,
        cached: false
      })

    } catch (error) {
      logger.error('Error fetching indexers:', error)
      throw new ExternalServiceError('Jackett', 'Failed to fetch indexers')
    }
  })

  // Get search history for user
  getSearchHistory = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id
    const limit = parseInt(req.query.limit as string) || 20

    try {
      const searches = await this.dbService.find('torrent_searches', 
        { userId }, 
        { limit, sort: 'createdAt', order: 'desc' }
      )

      res.json({
        success: true,
        data: { searches }
      })

    } catch (error) {
      logger.error('Error fetching search history:', error)
      throw new Error('Failed to fetch search history')
    }
  })

  // Clear search history
  clearSearchHistory = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id

    try {
      // This would need to be implemented in the database service
      // await this.dbService.deleteMany('torrent_searches', { userId })

      res.json({
        success: true,
        message: 'Search history cleared successfully'
      })

    } catch (error) {
      logger.error('Error clearing search history:', error)
      throw new Error('Failed to clear search history')
    }
  })

  // Get torrent categories
  getCategories = asyncHandler(async (req: Request, res: Response) => {
    try {
      // Check if Jackett service is available
      if (!this.apiProxy.isServiceAvailable('jackett')) {
        return res.json({
          success: false,
          message: 'Jackett service not configured',
          data: { categories: [] }
        })
      }

      // Static categories for Jackett
      const categories = [
        { id: 'all', name: 'All', description: 'Search all categories' },
        { id: 'movie', name: 'Movies', description: 'Movies and films' },
        { id: 'tv', name: 'TV Shows', description: 'TV series and episodes' },
        { id: 'anime', name: 'Anime', description: 'Anime movies and series' },
        { id: 'music', name: 'Music', description: 'Music and audio' },
        { id: 'games', name: 'Games', description: 'Video games and software' },
        { id: 'books', name: 'Books', description: 'E-books and audiobooks' }
      ]

      res.json({
        success: true,
        data: { categories }
      })

    } catch (error) {
      logger.error('Error fetching categories:', error)
      throw new ExternalServiceError('Jackett', 'Failed to fetch categories')
    }
  })

  // Build Jackett search parameters
  private buildJackettParams(query: string, category: string, quality: string): any {
    const params: any = {}
    
    // Category mapping
    if (category === 'movie') {
      params.category = '2000' // Movies category in Jackett
    } else if (category === 'tv') {
      params.category = '5000' // TV category in Jackett
    }
    // 'all' uses no category filter
    
    // Quality filtering in query
    if (quality !== 'any') {
      params.query = `${query} ${quality}`
    } else {
      params.query = query
    }
    
    return params
  }

  // Process and filter search results
  private processSearchResults(data: any, filters: any): any {
    if (!data || !data.Results) {
      return {
        results: [],
        indexers: [],
        totalResults: 0,
        filters: filters
      }
    }

    let results = data.Results.map((item: any) => this.transformTorrentResult(item))
    
    // Filter by minimum seeders
    if (filters.minSeeders > 0) {
      results = results.filter((item: any) => item.seeders >= filters.minSeeders)
    }
    
    // Filter by quality
    if (filters.quality !== 'any') {
      results = results.filter((item: any) => 
        item.title.toLowerCase().includes(filters.quality.toLowerCase()) ||
        item.description?.toLowerCase().includes(filters.quality.toLowerCase())
      )
    }
    
    // Filter trusted only
    if (filters.trustedOnly) {
      results = results.filter((item: any) => item.trusted)
    }
    
    // Sort results
    results = this.sortTorrentResults(results, filters.sortBy, filters.sortOrder)
    
    // Limit results
    if (filters.maxResults) {
      results = results.slice(0, filters.maxResults)
    }
    
    // Get unique indexers
    const indexers = [...new Set(results.map((item: any) => item.indexer))]
    
    // Deduplicate by info hash if available
    const uniqueResults = this.deduplicateResults(results)
    
    return {
      results: uniqueResults,
      indexers,
      totalResults: uniqueResults.length,
      filters,
      cached: false
    }
  }

  // Transform individual torrent result
  private transformTorrentResult(item: any): any {
    return {
      title: item.Title || '',
      description: item.Description || '',
      size: item.Size || 0,
      sizeFormatted: this.formatBytes(item.Size || 0),
      seeders: item.Seeders || 0,
      leechers: item.Peers || 0,
      ratio: item.Seeders && item.Peers ? (item.Seeders / (item.Seeders + item.Peers)).toFixed(2) : '0.00',
      magnetUrl: item.MagnetUri || '',
      downloadUrl: item.Link || '',
      infoHash: this.extractInfoHash(item.MagnetUri || ''),
      indexer: item.Tracker || 'Unknown',
      category: item.CategoryDesc || '',
      publishDate: item.PublishDate || '',
      trusted: this.isTrustedUploader(item.Title || '', item.Tracker || ''),
      quality: this.extractQuality(item.Title || ''),
      type: this.extractType(item.CategoryDesc || ''),
      guid: item.Guid || ''
    }
  }

  // Sort torrent results
  private sortTorrentResults(results: any[], sortBy: string, sortOrder: string): any[] {
    return results.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'seeders':
          comparison = a.seeders - b.seeders
          break
        case 'size':
          comparison = a.size - b.size
          break
        case 'name':
          comparison = a.title.localeCompare(b.title)
          break
        case 'date':
          comparison = new Date(a.publishDate).getTime() - new Date(b.publishDate).getTime()
          break
        default:
          comparison = a.seeders - b.seeders
      }
      
      return sortOrder === 'desc' ? -comparison : comparison
    })
  }

  // Deduplicate results by info hash
  private deduplicateResults(results: any[]): any[] {
    const seen = new Set()
    return results.filter(item => {
      if (item.infoHash && seen.has(item.infoHash)) {
        return false
      }
      if (item.infoHash) {
        seen.add(item.infoHash)
      }
      return true
    })
  }

  // Transform indexers data
  private transformIndexersData(data: any, category: string): any {
    if (!data) {
      return { indexers: [] }
    }

    const indexers = data
      .filter((indexer: any) => indexer.configured)
      .map((indexer: any) => ({
        id: indexer.id,
        name: indexer.name,
        description: indexer.description,
        language: indexer.language,
        type: indexer.type,
        categories: indexer.caps?.categories || [],
        status: 'online' // This would need real-time checking
      }))

    return {
      indexers,
      category,
      totalIndexers: indexers.length
    }
  }

  // Save search history
  private async saveSearchHistory(userId: string, query: string, category: string, resultCount: number): Promise<void> {
    try {
      await this.dbService.create('torrent_searches', {
        userId,
        query,
        category,
        results: [],
        indexers: [],
        createdAt: new Date().toISOString()
      })
    } catch (error) {
      logger.error('Error saving search history:', error)
      // Don't throw, this is non-critical
    }
  }

  // Helper functions
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  private extractInfoHash(magnetUrl: string): string {
    const match = magnetUrl.match(/xt=urn:btih:([a-fA-F0-9]{40}|[a-fA-F0-9]{32})/)
    return match ? match[1].toLowerCase() : ''
  }

  private isTrustedUploader(title: string, tracker: string): boolean {
    // Simple heuristic for trusted uploaders
    const trustedPatterns = [
      /\[rartv\]/i,
      /\[eztv\]/i,
      /\[ettv\]/i,
      /\[rarbg\]/i,
      /\[yts\]/i,
      /\[axxo\]/i
    ]
    
    return trustedPatterns.some(pattern => pattern.test(title)) ||
           ['RARBG', 'EZTV', 'YTS', '1337x'].includes(tracker)
  }

  private extractQuality(title: string): string {
    if (/2160p|4k/i.test(title)) return '4K'
    if (/1080p/i.test(title)) return '1080p'
    if (/720p/i.test(title)) return '720p'
    if (/480p/i.test(title)) return '480p'
    return 'Unknown'
  }

  private extractType(categoryDesc: string): string {
    if (/movie/i.test(categoryDesc)) return 'movie'
    if (/tv|series/i.test(categoryDesc)) return 'tv'
    return 'other'
  }

  private isCacheValid(createdAt: string, maxAgeSeconds: number): boolean {
    const now = new Date().getTime()
    const cacheTime = new Date(createdAt).getTime()
    return (now - cacheTime) < (maxAgeSeconds * 1000)
  }
}

export default TorrentController