/**
 * Media Manager for Pandora Box PWA
 * Handles media library operations, caching, and playback
 */

class MediaManager {
  constructor() {
    this.mediaCache = new Map();
    this.recentMedia = [];
    this.favorites = [];
    this.currentPlayback = null;
    this.db = window.DB; // Reference to the DB utility
    this.api = window.ApiClient; // Reference to the API client
    
    // Bind methods
    this.initialize = this.initialize.bind(this);
    this.getMedia = this.getMedia.bind(this);
    this.searchMedia = this.searchMedia.bind(this);
    this.toggleFavorite = this.toggleFavorite.bind(this);
    this.getRecentMedia = this.getRecentMedia.bind(this);
    this.getFavorites = this.getFavorites.bind(this);
    this.playMedia = this.playMedia.bind(this);
    this.stopPlayback = this.stopPlayback.bind(this);
  }
  
  /**
   * Initialize the media manager
   * @returns {Promise<boolean>} - Whether initialization was successful
   */
  async initialize() {
    try {
      // Load favorites from IndexedDB
      const savedFavorites = await this.db.get('media', 'favorites');
      if (savedFavorites && Array.isArray(savedFavorites.items)) {
        this.favorites = savedFavorites.items;
      }
      
      // Load recent media from IndexedDB
      const savedRecent = await this.db.get('media', 'recentMedia');
      if (savedRecent && Array.isArray(savedRecent.items)) {
        this.recentMedia = savedRecent.items;
      }
      
      return true;
    } catch (error) {
      console.error('Media manager initialization error:', error);
      return false;
    }
  }
  
  /**
   * Get media by ID
   * @param {string} id - The media ID
   * @param {boolean} [forceRefresh=false] - Whether to force a refresh from the API
   * @returns {Promise<Object|null>} - The media object
   */
  async getMedia(id, forceRefresh = false) {
    try {
      // Check cache first if not forcing refresh
      if (!forceRefresh && this.mediaCache.has(id)) {
        return this.mediaCache.get(id);
      }
      
      // Check IndexedDB if not in memory cache
      if (!forceRefresh) {
        const cachedMedia = await this.db.get('media', id);
        if (cachedMedia) {
          // Update memory cache
          this.mediaCache.set(id, cachedMedia);
          return cachedMedia;
        }
      }
      
      // Fetch from API
      const media = await this.api.get(`/media/${id}`);
      
      if (media) {
        // Update cache
        this.mediaCache.set(id, media);
        
        // Save to IndexedDB
        await this.db.put('media', { id, ...media });
        
        // Add to recent media
        this._addToRecentMedia(media);
        
        return media;
      }
      
      return null;
    } catch (error) {
      console.error(`Error getting media ${id}:`, error);
      return null;
    }
  }
  
  /**
   * Search media by query
   * @param {string} query - The search query
   * @param {Object} [options={}] - Search options
   * @param {string} [options.type] - The media type filter ('movie', 'tv', 'music')
   * @param {string} [options.genre] - The genre filter
   * @param {string} [options.sortBy] - The sort field
   * @param {string} [options.sortOrder] - The sort order ('asc', 'desc')
   * @param {number} [options.page=1] - The page number
   * @param {number} [options.limit=20] - The page size
   * @returns {Promise<Object>} - The search results
   */
  async searchMedia(query, options = {}) {
    try {
      const params = {
        q: query,
        type: options.type,
        genre: options.genre,
        sortBy: options.sortBy,
        sortOrder: options.sortOrder,
        page: options.page || 1,
        limit: options.limit || 20
      };
      
      // Remove undefined params
      Object.keys(params).forEach(key => {
        if (params[key] === undefined) {
          delete params[key];
        }
      });
      
      // Build query string
      const queryString = Object.keys(params)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');
      
      // Fetch from API
      const results = await this.api.get(`/media/search?${queryString}`);
      
      if (results && results.items) {
        // Cache results
        results.items.forEach(item => {
          this.mediaCache.set(item.id, item);
          this.db.put('media', { id: item.id, ...item });
        });
        
        return results;
      }
      
      return { items: [], total: 0, page: params.page, limit: params.limit };
    } catch (error) {
      console.error('Error searching media:', error);
      return { items: [], total: 0, page: 1, limit: 20, error: error.message };
    }
  }
  
  /**
   * Toggle favorite status for a media item
   * @param {string|Object} mediaOrId - The media object or ID
   * @returns {Promise<boolean>} - Whether the media is now a favorite
   */
  async toggleFavorite(mediaOrId) {
    try {
      // Get media object
      const media = typeof mediaOrId === 'string' 
        ? await this.getMedia(mediaOrId)
        : mediaOrId;
      
      if (!media || !media.id) {
        throw new Error('Invalid media');
      }
      
      // Check if already a favorite
      const index = this.favorites.findIndex(item => item.id === media.id);
      const isFavorite = index !== -1;
      
      if (isFavorite) {
        // Remove from favorites
        this.favorites.splice(index, 1);
      } else {
        // Add to favorites
        this.favorites.push({
          id: media.id,
          title: media.title,
          type: media.type,
          poster: media.poster,
          addedAt: new Date().toISOString()
        });
      }
      
      // Save to IndexedDB
      await this.db.put('media', {
        id: 'favorites',
        items: this.favorites,
        lastUpdated: new Date().toISOString()
      });
      
      // Dispatch event
      this._dispatchMediaEvent('favorite-changed', {
        media,
        isFavorite: !isFavorite
      });
      
      return !isFavorite;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      return false;
    }
  }
  
  /**
   * Check if a media item is a favorite
   * @param {string} id - The media ID
   * @returns {boolean} - Whether the media is a favorite
   */
  isFavorite(id) {
    return this.favorites.some(item => item.id === id);
  }
  
  /**
   * Get recent media
   * @param {number} [limit=10] - The maximum number of items to return
   * @returns {Array} - The recent media items
   */
  getRecentMedia(limit = 10) {
    return this.recentMedia.slice(0, limit);
  }
  
  /**
   * Get favorite media
   * @param {number} [limit=0] - The maximum number of items to return (0 for all)
   * @returns {Array} - The favorite media items
   */
  getFavorites(limit = 0) {
    return limit > 0 ? this.favorites.slice(0, limit) : [...this.favorites];
  }
  
  /**
   * Play media
   * @param {string|Object} mediaOrId - The media object or ID
   * @param {Object} [options={}] - Playback options
   * @param {string} [options.quality='auto'] - The playback quality
   * @param {boolean} [options.autoplay=true] - Whether to autoplay
   * @param {number} [options.startTime=0] - The start time in seconds
   * @param {string} [options.audioTrack] - The audio track ID
   * @param {string} [options.subtitleTrack] - The subtitle track ID
   * @returns {Promise<Object|null>} - The playback object
   */
  async playMedia(mediaOrId, options = {}) {
    try {
      // Stop current playback if any
      if (this.currentPlayback) {
        await this.stopPlayback();
      }
      
      // Get media object
      const media = typeof mediaOrId === 'string' 
        ? await this.getMedia(mediaOrId)
        : mediaOrId;
      
      if (!media || !media.id) {
        throw new Error('Invalid media');
      }
      
      // Get playback URL
      const playbackOptions = {
        quality: options.quality || window.SettingsManager.get('media.defaultQuality', 'auto'),
        audioTrack: options.audioTrack,
        subtitleTrack: options.subtitleTrack
      };
      
      const playbackInfo = await this.api.post(`/media/${media.id}/play`, playbackOptions);
      
      if (!playbackInfo || !playbackInfo.url) {
        throw new Error('Failed to get playback URL');
      }
      
      // Create playback object
      this.currentPlayback = {
        media,
        url: playbackInfo.url,
        startTime: options.startTime || 0,
        autoplay: options.autoplay !== false,
        quality: playbackOptions.quality,
        audioTrack: playbackOptions.audioTrack,
        subtitleTrack: playbackOptions.subtitleTrack,
        startedAt: new Date().toISOString()
      };
      
      // Add to recent media
      this._addToRecentMedia(media);
      
      // Dispatch event
      this._dispatchMediaEvent('playback-started', {
        playback: this.currentPlayback
      });
      
      return this.currentPlayback;
    } catch (error) {
      console.error('Error playing media:', error);
      return null;
    }
  }
  
  /**
   * Stop current playback
   * @returns {Promise<boolean>} - Whether playback was stopped
   */
  async stopPlayback() {
    try {
      if (!this.currentPlayback) {
        return false;
      }
      
      // Dispatch event
      this._dispatchMediaEvent('playback-stopped', {
        playback: this.currentPlayback
      });
      
      // Clear current playback
      this.currentPlayback = null;
      
      return true;
    } catch (error) {
      console.error('Error stopping playback:', error);
      return false;
    }
  }
  
  /**
   * Update playback progress
   * @param {number} currentTime - The current playback time in seconds
   * @param {number} duration - The total duration in seconds
   * @returns {Promise<boolean>} - Whether progress was updated
   */
  async updatePlaybackProgress(currentTime, duration) {
    try {
      if (!this.currentPlayback || !this.currentPlayback.media) {
        return false;
      }
      
      const media = this.currentPlayback.media;
      
      // Calculate progress percentage
      const progress = Math.round((currentTime / duration) * 100);
      
      // Only update if progress has changed significantly
      if (media.progress === progress) {
        return false;
      }
      
      // Update media object
      media.progress = progress;
      media.currentTime = currentTime;
      media.duration = duration;
      media.lastPlayed = new Date().toISOString();
      
      // Update cache
      this.mediaCache.set(media.id, media);
      
      // Save to IndexedDB
      await this.db.put('media', { id: media.id, ...media });
      
      // Update recent media
      this._updateRecentMediaProgress(media.id, progress, currentTime);
      
      // Send progress to server if progress is significant
      if (progress % 5 === 0 || progress >= 90) {
        await this.api.post(`/media/${media.id}/progress`, {
          progress,
          currentTime,
          duration
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error updating playback progress:', error);
      return false;
    }
  }
  
  /**
   * Get media recommendations
   * @param {string} [mediaId] - The media ID to base recommendations on
   * @param {number} [limit=10] - The maximum number of recommendations
   * @returns {Promise<Array>} - The recommended media items
   */
  async getRecommendations(mediaId, limit = 10) {
    try {
      let endpoint = '/media/recommendations';
      
      if (mediaId) {
        endpoint = `/media/${mediaId}/recommendations`;
      }
      
      const params = { limit };
      
      // Build query string
      const queryString = Object.keys(params)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');
      
      // Fetch from API
      const results = await this.api.get(`${endpoint}?${queryString}`);
      
      if (results && Array.isArray(results.items)) {
        // Cache results
        results.items.forEach(item => {
          this.mediaCache.set(item.id, item);
          this.db.put('media', { id: item.id, ...item });
        });
        
        return results.items;
      }
      
      return [];
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return [];
    }
  }
  
  /**
   * Add a media item to recent media
   * @private
   * @param {Object} media - The media object
   */
  async _addToRecentMedia(media) {
    if (!media || !media.id) return;
    
    try {
      // Create simplified media object
      const recentItem = {
        id: media.id,
        title: media.title,
        type: media.type,
        poster: media.poster,
        progress: media.progress || 0,
        currentTime: media.currentTime || 0,
        duration: media.duration || 0,
        lastPlayed: new Date().toISOString()
      };
      
      // Remove if already in recent media
      const index = this.recentMedia.findIndex(item => item.id === media.id);
      if (index !== -1) {
        this.recentMedia.splice(index, 1);
      }
      
      // Add to beginning of recent media
      this.recentMedia.unshift(recentItem);
      
      // Limit to 50 items
      if (this.recentMedia.length > 50) {
        this.recentMedia = this.recentMedia.slice(0, 50);
      }
      
      // Save to IndexedDB
      await this.db.put('media', {
        id: 'recentMedia',
        items: this.recentMedia,
        lastUpdated: new Date().toISOString()
      });
      
      // Dispatch event
      this._dispatchMediaEvent('recent-updated', {
        recentMedia: this.recentMedia
      });
    } catch (error) {
      console.error('Error adding to recent media:', error);
    }
  }
  
  /**
   * Update progress in recent media
   * @private
   * @param {string} id - The media ID
   * @param {number} progress - The progress percentage
   * @param {number} currentTime - The current time in seconds
   */
  async _updateRecentMediaProgress(id, progress, currentTime) {
    try {
      // Find media in recent list
      const index = this.recentMedia.findIndex(item => item.id === id);
      
      if (index !== -1) {
        // Update progress
        this.recentMedia[index].progress = progress;
        this.recentMedia[index].currentTime = currentTime;
        this.recentMedia[index].lastPlayed = new Date().toISOString();
        
        // Save to IndexedDB
        await this.db.put('media', {
          id: 'recentMedia',
          items: this.recentMedia,
          lastUpdated: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error updating recent media progress:', error);
    }
  }
  
  /**
   * Dispatch a media event
   * @private
   * @param {string} type - The event type
   * @param {Object} detail - The event detail
   */
  _dispatchMediaEvent(type, detail) {
    const event = new CustomEvent('media', {
      detail: {
        type,
        ...detail
      }
    });
    
    document.dispatchEvent(event);
  }
}

// Create and export the media manager instance
window.MediaManager = new MediaManager();