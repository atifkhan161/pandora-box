import axios from 'axios';
import { getEnv } from '../config/env';
import { logger } from '../utils/logger';

const env = getEnv();

/**
 * Jackett API Service
 * Provides methods to interact with Jackett API for torrent searching
 */
export class JackettService {
  private apiUrl: string;
  private apiKey: string;

  constructor() {
    this.apiUrl = env.JACKETT_API_URL;
    this.apiKey = env.JACKETT_API_KEY;
    
    if (!this.apiKey) {
      logger.warn('Jackett API key not provided. Jackett service will not work properly.');
    }
  }

  /**
   * Search for torrents
   */
  async searchTorrents(query: string, category?: string): Promise<any> {
    try {
      const response = await axios.get(`${this.apiUrl}/indexers/all/results`, {
        params: {
          apikey: this.apiKey,
          Query: query,
          Category: category || '2000,5000', // Default to Movies and TV
          _: Date.now()
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Error searching torrents from Jackett', error);
      throw new Error('Failed to search torrents');
    }
  }

  /**
   * Get all indexers
   */
  async getIndexers(): Promise<any> {
    try {
      const response = await axios.get(`${this.apiUrl}/indexers`, {
        params: {
          apikey: this.apiKey
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Error getting indexers from Jackett', error);
      throw new Error('Failed to get indexers');
    }
  }

  /**
   * Test indexer
   */
  async testIndexer(indexerId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.apiUrl}/indexers/${indexerId}/test`, {
        params: {
          apikey: this.apiKey
        }
      });
      return response.data;
    } catch (error) {
      logger.error(`Error testing indexer ${indexerId} from Jackett`, error);
      throw new Error('Failed to test indexer');
    }
  }
}

export default new JackettService();