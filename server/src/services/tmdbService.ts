import axios from 'axios';
import { getEnv } from '../config/env';
import { logger } from '../utils/logger';

const env = getEnv();
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

/**
 * TMDB API Service
 * Provides methods to interact with The Movie Database API
 */
export class TMDBService {
  private apiKey: string;

  constructor() {
    this.apiKey = env.TMDB_API_KEY;
    if (!this.apiKey) {
      logger.warn('TMDB API key not provided. TMDB service will not work properly.');
    }
  }

  /**
   * Search for movies
   */
  async searchMovies(query: string, page: number = 1): Promise<any> {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
        params: {
          api_key: this.apiKey,
          query,
          page
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Error searching movies from TMDB', error);
      throw new Error('Failed to search movies');
    }
  }

  /**
   * Search for TV shows
   */
  async searchTVShows(query: string, page: number = 1): Promise<any> {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}/search/tv`, {
        params: {
          api_key: this.apiKey,
          query,
          page
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Error searching TV shows from TMDB', error);
      throw new Error('Failed to search TV shows');
    }
  }

  /**
   * Get movie details
   */
  async getMovieDetails(movieId: number): Promise<any> {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}/movie/${movieId}`, {
        params: {
          api_key: this.apiKey,
          append_to_response: 'credits,videos,images,recommendations'
        }
      });
      return response.data;
    } catch (error) {
      logger.error(`Error getting movie details for ID ${movieId} from TMDB`, error);
      throw new Error('Failed to get movie details');
    }
  }

  /**
   * Get TV show details
   */
  async getTVShowDetails(tvId: number): Promise<any> {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}/tv/${tvId}`, {
        params: {
          api_key: this.apiKey,
          append_to_response: 'credits,videos,images,recommendations,seasons'
        }
      });
      return response.data;
    } catch (error) {
      logger.error(`Error getting TV show details for ID ${tvId} from TMDB`, error);
      throw new Error('Failed to get TV show details');
    }
  }

  /**
   * Get TV season details
   */
  async getTVSeasonDetails(tvId: number, seasonNumber: number): Promise<any> {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}/tv/${tvId}/season/${seasonNumber}`, {
        params: {
          api_key: this.apiKey
        }
      });
      return response.data;
    } catch (error) {
      logger.error(`Error getting TV season details for TV ID ${tvId}, season ${seasonNumber} from TMDB`, error);
      throw new Error('Failed to get TV season details');
    }
  }

  /**
   * Get popular movies
   */
  async getPopularMovies(page: number = 1): Promise<any> {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}/movie/popular`, {
        params: {
          api_key: this.apiKey,
          page
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Error getting popular movies from TMDB', error);
      throw new Error('Failed to get popular movies');
    }
  }

  /**
   * Get popular TV shows
   */
  async getPopularTVShows(page: number = 1): Promise<any> {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}/tv/popular`, {
        params: {
          api_key: this.apiKey,
          page
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Error getting popular TV shows from TMDB', error);
      throw new Error('Failed to get popular TV shows');
    }
  }
}

export default new TMDBService();