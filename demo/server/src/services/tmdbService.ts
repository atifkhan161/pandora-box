import axios from 'axios';
import { logger } from '../utils/logger';
import { MediaItem } from '../types/api';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

class TMDBService {
  private apiKey: string;
  
  constructor() {
    this.apiKey = process.env.TMDB_API_KEY!;
    if (!this.apiKey) {
      logger.error('TMDB_API_KEY is not configured');
    }
  }
  
  async getTrending(mediaType: 'movie' | 'tv' | 'all' = 'all', timeWindow: 'day' | 'week' = 'week'): Promise<MediaItem[]> {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}/trending/${mediaType}/${timeWindow}`, {
        params: {
          api_key: this.apiKey
        }
      });
      
      return response.data.results.map(this.transformMediaItem);
    } catch (error) {
      logger.error('TMDB getTrending error:', error);
      throw new Error('Failed to fetch trending content');
    }
  }
  
  async getPopular(mediaType: 'movie' | 'tv'): Promise<MediaItem[]> {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}/${mediaType}/popular`, {
        params: {
          api_key: this.apiKey
        }
      });
      
      return response.data.results.map(this.transformMediaItem);
    } catch (error) {
      logger.error('TMDB getPopular error:', error);
      throw new Error('Failed to fetch popular content');
    }
  }
  
  async search(query: string, mediaType: 'movie' | 'tv' | 'multi' = 'multi'): Promise<MediaItem[]> {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}/search/${mediaType}`, {
        params: {
          api_key: this.apiKey,
          query
        }
      });
      
      return response.data.results.map(this.transformMediaItem);
    } catch (error) {
      logger.error('TMDB search error:', error);
      throw new Error('Failed to search content');
    }
  }
  
  async getDetails(mediaType: 'movie' | 'tv', id: number): Promise<MediaItem> {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}/${mediaType}/${id}`, {
        params: {
          api_key: this.apiKey
        }
      });
      
      return this.transformMediaItem(response.data);
    } catch (error) {
      logger.error('TMDB getDetails error:', error);
      throw new Error('Failed to fetch content details');
    }
  }
  
  private transformMediaItem = (item: any): MediaItem => {
    const isMovie = item.title !== undefined;
    return {
      id: item.id,
      title: isMovie ? item.title : item.name,
      year: parseInt((isMovie ? item.release_date : item.first_air_date)?.substring(0, 4) || '0'),
      poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '',
      rating: Math.round(item.vote_average * 10) / 10,
      genre: item.genres?.map((g: any) => g.name) || [],
      overview: item.overview || '',
      category: 'tmdb',
      type: isMovie ? 'movie' : 'tv'
    };
  };
}

export const tmdbService = new TMDBService();