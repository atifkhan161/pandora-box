/**
 * Media Service for Pandora PWA
 * Handles media discovery, search, and content information
 */

import { apiClient } from './api.js'

export class MediaService {
  constructor(client = apiClient) {
    this.client = client
    this.cache = new Map()
    this.cacheTimeout = 5 * 60 * 1000 // 5 minutes
  }

  /**
   * Get trending content
   * @param {string} type - Content type ('movie' or 'tv')
   * @param {string} timeWindow - Time window ('day' or 'week')
   * @returns {Promise<Array>} Trending content list
   */
  async getTrending(type = 'movie', timeWindow = 'week') {
    const cacheKey = `trending_${type}_${timeWindow}`
    
    // Check cache first
    const cached = this.getFromCache(cacheKey)
    if (cached) {
      return cached
    }

    try {
      const response = await this.client.get(`media/trending/${type}/${timeWindow}`)
      
      // Cache the response
      this.setCache(cacheKey, response)
      
      return response
    } catch (error) {
      console.error('Failed to get trending content:', error)
      throw error
    }
  }

  /**
   * Get popular content
   * @param {string} type - Content type ('movie' or 'tv')
   * @returns {Promise<Array>} Popular content list
   */
  async getPopular(type = 'movie') {
    const cacheKey = `popular_${type}`
    
    // Check cache first
    const cached = this.getFromCache(cacheKey)
    if (cached) {
      return cached
    }

    try {
      const response = await this.client.get(`media/popular/${type}`)
      
      // Cache the response
      this.setCache(cacheKey, response)
      
      return response
    } catch (error) {
      console.error('Failed to get popular content:', error)
      throw error
    }
  }

  /**
   * Get top rated content
   * @param {string} type - Content type ('movie' or 'tv')
   * @returns {Promise<Array>} Top rated content list
   */
  async getTopRated(type = 'movie') {
    const cacheKey = `top_rated_${type}`
    
    // Check cache first
    const cached = this.getFromCache(cacheKey)
    if (cached) {
      return cached
    }

    try {
      const response = await this.client.get(`media/top-rated/${type}`)
      
      // Cache the response
      this.setCache(cacheKey, response)
      
      return response
    } catch (error) {
      console.error('Failed to get top rated content:', error)
      throw error
    }
  }

  /**
   * Search for media content
   * @param {string} query - Search query
   * @param {string} type - Content type ('movie', 'tv', or 'multi')
   * @param {number} page - Page number (default: 1)
   * @param {Object} options - Additional search options (sort_by, etc.)
   * @returns {Promise<Object>} Search results with pagination
   */
  async search(query, type = 'multi', page = 1, options = {}) {
    if (!query || query.trim().length === 0) {
      return { results: [], total_results: 0, total_pages: 0, page: 1 }
    }

    try {
      const params = {
        query: query.trim(),
        type,
        page,
        ...options
      }

      const response = await this.client.get('media/search', params)
      
      // Apply client-side sorting if results need additional sorting
      if (response.results && options.sort_by) {
        response.results = this.applySorting(response.results, options.sort_by)
      }
      
      return response
    } catch (error) {
      console.error('Failed to search media:', error)
      throw error
    }
  }

  /**
   * Get content details
   * @param {string} type - Content type ('movie' or 'tv')
   * @param {number|string} id - Content ID
   * @returns {Promise<Object>} Content details
   */
  async getDetails(type, id) {
    const cacheKey = `details_${type}_${id}`
    
    // Check cache first
    const cached = this.getFromCache(cacheKey)
    if (cached) {
      return cached
    }

    try {
      const response = await this.client.get(`media/${type}/${id}`)
      
      // Cache the response
      this.setCache(cacheKey, response)
      
      return response
    } catch (error) {
      console.error('Failed to get content details:', error)
      throw error
    }
  }

  /**
   * Get genres for content type
   * @param {string} type - Content type ('movie' or 'tv')
   * @returns {Promise<Array>} Genres list
   */
  async getGenres(type = 'movie') {
    const cacheKey = `genres_${type}`
    
    // Check cache first
    const cached = this.getFromCache(cacheKey)
    if (cached) {
      return cached
    }

    try {
      const response = await this.client.get(`media/genres/${type}`)
      
      // Cache the response with longer timeout for genres
      this.setCache(cacheKey, response, 60 * 60 * 1000) // 1 hour
      
      return response
    } catch (error) {
      console.error('Failed to get genres:', error)
      throw error
    }
  }

  /**
   * Discover content with filters
   * @param {string} type - Content type ('movie' or 'tv')
   * @param {Object} filters - Discovery filters
   * @returns {Promise<Object>} Discovered content with pagination
   */
  async discover(type = 'movie', filters = {}) {
    try {
      const response = await this.client.get(`media/discover/${type}`, filters)
      return response
    } catch (error) {
      console.error('Failed to discover content:', error)
      throw error
    }
  }

  /**
   * Get content by genre
   * @param {string} type - Content type ('movie' or 'tv')
   * @param {number} genreId - Genre ID
   * @param {number} page - Page number
   * @returns {Promise<Object>} Content list with pagination
   */
  async getByGenre(type, genreId, page = 1) {
    try {
      const response = await this.discover(type, {
        with_genres: genreId,
        page
      })
      return response
    } catch (error) {
      console.error('Failed to get content by genre:', error)
      throw error
    }
  }

  /**
   * Get streaming availability for content
   * @param {string} type - Content type ('movie' or 'tv')
   * @param {number|string} id - Content ID
   * @returns {Promise<Object>} Streaming availability data
   */
  async getStreamingAvailability(type, id) {
    try {
      const response = await this.client.get(`media/${type}/${id}/watch-providers`)
      return response
    } catch (error) {
      console.error('Failed to get streaming availability:', error)
      throw error
    }
  }

  /**
   * Get similar content
   * @param {string} type - Content type ('movie' or 'tv')
   * @param {number|string} id - Content ID
   * @returns {Promise<Array>} Similar content list
   */
  async getSimilar(type, id) {
    try {
      const response = await this.client.get(`media/${type}/${id}/similar`)
      return response
    } catch (error) {
      console.error('Failed to get similar content:', error)
      throw error
    }
  }

  /**
   * Get content recommendations
   * @param {string} type - Content type ('movie' or 'tv')
   * @param {number|string} id - Content ID
   * @returns {Promise<Array>} Recommended content list
   */
  async getRecommendations(type, id) {
    try {
      const response = await this.client.get(`media/${type}/${id}/recommendations`)
      return response
    } catch (error) {
      console.error('Failed to get recommendations:', error)
      throw error
    }
  }

  /**
   * Get content credits (cast and crew)
   * @param {string} type - Content type ('movie' or 'tv')
   * @param {number|string} id - Content ID
   * @returns {Promise<Object>} Credits data
   */
  async getCredits(type, id) {
    try {
      const response = await this.client.get(`media/${type}/${id}/credits`)
      return response
    } catch (error) {
      console.error('Failed to get credits:', error)
      throw error
    }
  }

  /**
   * Get content videos (trailers, teasers, etc.)
   * @param {string} type - Content type ('movie' or 'tv')
   * @param {number|string} id - Content ID
   * @returns {Promise<Array>} Videos list
   */
  async getVideos(type, id) {
    try {
      const response = await this.client.get(`media/${type}/${id}/videos`)
      return response
    } catch (error) {
      console.error('Failed to get videos:', error)
      throw error
    }
  }

  /**
   * Clear media cache
   * @returns {Promise<void>}
   */
  async clearCache() {
    try {
      // Clear server-side cache
      await this.client.delete('media/cache')
      
      // Clear local cache
      this.cache.clear()
    } catch (error) {
      console.error('Failed to clear cache:', error)
      throw error
    }
  }

  /**
   * Get cache statistics
   * @returns {Promise<Object>} Cache statistics
   */
  async getCacheStats() {
    try {
      const serverStats = await this.client.get('media/cache/stats')
      
      const localStats = {
        entries: this.cache.size,
        keys: Array.from(this.cache.keys())
      }
      
      return {
        server: serverStats,
        local: localStats
      }
    } catch (error) {
      console.error('Failed to get cache stats:', error)
      throw error
    }
  }

  /**
   * Get item from cache
   * @param {string} key - Cache key
   * @returns {any|null} Cached item or null
   */
  getFromCache(key) {
    const item = this.cache.get(key)
    if (!item) {
      return null
    }
    
    // Check if item has expired
    if (Date.now() > item.expires) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }

  /**
   * Set item in cache
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   * @param {number} timeout - Cache timeout in milliseconds
   */
  setCache(key, data, timeout = this.cacheTimeout) {
    this.cache.set(key, {
      data,
      expires: Date.now() + timeout
    })
  }

  /**
   * Build image URL for TMDB images
   * @param {string} path - Image path
   * @param {string} size - Image size (w185, w300, w500, original, etc.)
   * @returns {string} Full image URL
   */
  buildImageUrl(path, size = 'w500') {
    if (!path) {
      return null
    }
    
    const baseUrl = 'https://image.tmdb.org/t/p/'
    return `${baseUrl}${size}${path}`
  }

  /**
   * Build backdrop URL
   * @param {string} path - Backdrop path
   * @param {string} size - Image size
   * @returns {string} Full backdrop URL
   */
  buildBackdropUrl(path, size = 'w1280') {
    return this.buildImageUrl(path, size)
  }

  /**
   * Build poster URL
   * @param {string} path - Poster path
   * @param {string} size - Image size
   * @returns {string} Full poster URL
   */
  buildPosterUrl(path, size = 'w500') {
    return this.buildImageUrl(path, size)
  }

  /**
   * Format release date
   * @param {string} dateString - Date string
   * @returns {string} Formatted date
   */
  formatReleaseDate(dateString) {
    if (!dateString) {
      return 'Unknown'
    }
    
    try {
      const date = new Date(dateString)
      return date.getFullYear().toString()
    } catch (error) {
      return 'Unknown'
    }
  }

  /**
   * Format runtime
   * @param {number} minutes - Runtime in minutes
   * @returns {string} Formatted runtime
   */
  formatRuntime(minutes) {
    if (!minutes || minutes <= 0) {
      return 'Unknown'
    }
    
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    
    if (hours > 0) {
      return `${hours}h ${mins}m`
    } else {
      return `${mins}m`
    }
  }

  /**
   * Format vote average
   * @param {number} voteAverage - Vote average
   * @returns {string} Formatted rating
   */
  formatRating(voteAverage) {
    if (!voteAverage || voteAverage <= 0) {
      return 'N/A'
    }
    
    return voteAverage.toFixed(1)
  }

  /**
   * Apply client-side sorting to results
   * @param {Array} results - Media results array
   * @param {string} sortBy - Sort criteria
   * @returns {Array} Sorted results
   */
  applySorting(results, sortBy) {
    if (!results || !Array.isArray(results)) {
      return results
    }

    const [field, direction] = sortBy.split('.')
    const isAscending = direction === 'asc'

    return [...results].sort((a, b) => {
      let valueA, valueB

      switch (field) {
        case 'popularity':
          valueA = a.popularity || 0
          valueB = b.popularity || 0
          break
        case 'vote_average':
          valueA = a.vote_average || 0
          valueB = b.vote_average || 0
          break
        case 'release_date':
          valueA = new Date(a.release_date || a.first_air_date || '1900-01-01')
          valueB = new Date(b.release_date || b.first_air_date || '1900-01-01')
          break
        case 'title':
          valueA = (a.title || a.name || '').toLowerCase()
          valueB = (b.title || b.name || '').toLowerCase()
          break
        default:
          return 0
      }

      if (valueA < valueB) {
        return isAscending ? -1 : 1
      }
      if (valueA > valueB) {
        return isAscending ? 1 : -1
      }
      return 0
    })
  }
}

// Create default media service instance
export const mediaService = new MediaService()

export default MediaService