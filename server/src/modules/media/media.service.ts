import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { TmdbService } from './tmdb.service';
import { WatchmodeService } from './watchmode.service';
import { MediaCacheEntry } from './dto/media.dto';

@Injectable()
export class MediaService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly tmdbService: TmdbService,
    private readonly watchmodeService: WatchmodeService,
  ) {}

  private generateCacheKey(source: string, externalId: string, mediaType?: string): string {
    return `${source}_${externalId}_${mediaType || 'general'}`;
  }

  private async getCachedData(source: 'tmdb' | 'watchmode', externalId: string, mediaType?: string): Promise<any> {
    const mediaCacheCollection = this.databaseService.getMediaCacheCollection();
    const cacheKey = this.generateCacheKey(source, externalId, mediaType);
    
    const cached = mediaCacheCollection.findOne({ 
      source, 
      externalId, 
      mediaType: mediaType || 'general'
    });
    
    if (cached && new Date(cached.expiresAt) > new Date()) {
      return cached.metadata;
    }
    
    return null;
  }

  private async setCachedData(
    source: 'tmdb' | 'watchmode', 
    externalId: string, 
    data: any, 
    mediaType?: string,
    ttlHours = 24
  ): Promise<void> {
    const mediaCacheCollection = this.databaseService.getMediaCacheCollection();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (ttlHours * 60 * 60 * 1000));
    
    const cacheEntry: MediaCacheEntry = {
      id: this.generateCacheKey(source, externalId, mediaType),
      source,
      mediaType: (mediaType === 'movie' || mediaType === 'tv') ? mediaType : 'general',
      externalId,
      title: data.title || data.name || 'Unknown',
      metadata: data,
      cachedAt: now,
      expiresAt
    };

    // Remove existing cache entry
    const existing = mediaCacheCollection.findOne({ 
      source, 
      externalId, 
      mediaType: mediaType || 'general'
    });
    
    if (existing) {
      mediaCacheCollection.remove(existing);
    }
    
    mediaCacheCollection.insert(cacheEntry);
  }

  async getTrending(type: 'movie' | 'tv' | 'all' = 'all', page = 1, limit = 20): Promise<any> {
    const cacheKey = `trending_${type}_${page}`;
    let cached = await this.getCachedData('tmdb', cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const data = await this.tmdbService.getTrending(type, page);
    
    // Limit results if specified
    if (limit && data.results) {
      data.results = data.results.slice(0, limit);
    }
    
    await this.setCachedData('tmdb', cacheKey, data, 'trending', 6); // Cache for 6 hours
    return data;
  }

  async getLatestMovies(page = 1): Promise<any> {
    const cacheKey = `latest_movies_${page}`;
    let cached = await this.getCachedData('tmdb', cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const data = await this.tmdbService.getLatestMovies(page);
    await this.setCachedData('tmdb', cacheKey, data, 'movie', 6); // Cache for 6 hours
    return data;
  }

  async getLatestTvShows(page = 1): Promise<any> {
    const cacheKey = `latest_tv_${page}`;
    let cached = await this.getCachedData('tmdb', cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const data = await this.tmdbService.getLatestTvShows(page);
    await this.setCachedData('tmdb', cacheKey, data, 'tv', 6); // Cache for 6 hours
    return data;
  }

  async getMediaDetails(mediaType: 'movie' | 'tv', id: string): Promise<any> {
    // Check TMDB cache first
    let tmdbData = await this.getCachedData('tmdb', id, mediaType);
    
    if (!tmdbData) {
      // Fetch from TMDB
      if (mediaType === 'movie') {
        tmdbData = await this.tmdbService.getMovieDetails(id);
      } else {
        tmdbData = await this.tmdbService.getTvShowDetails(id);
      }
      
      await this.setCachedData('tmdb', id, tmdbData, mediaType);
    }

    // Try to get streaming data from Watchmode
    let streamingData = await this.getCachedData('watchmode', id, mediaType);
    
    if (!streamingData) {
      try {
        streamingData = await this.watchmodeService.getStreamingSources(id, mediaType);
        await this.setCachedData('watchmode', id, streamingData, `${mediaType}_streaming`, 12);
      } catch (error) {
        streamingData = { sources: [] };
      }
    }

    return {
      ...tmdbData,
      streaming: streamingData
    };
  }

  async searchMedia(query: string, type?: 'movie' | 'tv' | 'person', page = 1): Promise<any> {
    const cacheKey = `search_${query}_${type || 'all'}_${page}`;
    let cached = await this.getCachedData('tmdb', cacheKey);
    
    if (cached) {
      return cached;
    }
    
    let data;
    
    if (!type) {
      data = await this.tmdbService.searchMulti(query, page);
    } else if (type === 'movie') {
      data = await this.tmdbService.searchMovies(query, page);
    } else if (type === 'tv') {
      data = await this.tmdbService.searchTvShows(query, page);
    } else if (type === 'person') {
      data = await this.tmdbService.searchPeople(query, page);
    }
    
    await this.setCachedData('tmdb', cacheKey, data, 'search', 2); // Cache for 2 hours
    return data;
  }

  async clearCache(): Promise<void> {
    const mediaCacheCollection = this.databaseService.getMediaCacheCollection();
    mediaCacheCollection.clear();
  }

  async clearExpiredCache(): Promise<void> {
    const mediaCacheCollection = this.databaseService.getMediaCacheCollection();
    const now = new Date();
    
    const expired = mediaCacheCollection.find({
      expiresAt: { '$lt': now }
    });
    
    expired.forEach(entry => {
      mediaCacheCollection.remove(entry);
    });
  }
}