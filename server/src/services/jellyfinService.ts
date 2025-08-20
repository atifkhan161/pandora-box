import axios from 'axios';
import { getEnv } from '../config/env';
import { logger } from '../utils/logger';

const env = getEnv();

/**
 * Jellyfin API Service
 * Provides methods to interact with Jellyfin API for media management
 */
export class JellyfinService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = env.JELLYFIN_URL;
    this.apiKey = env.JELLYFIN_API_KEY;
    
    if (!this.apiKey) {
      logger.warn('Jellyfin API key not provided. Jellyfin service will not work properly.');
    }
  }

  /**
   * Get request headers with API key
   */
  private getHeaders(): any {
    return {
      'X-MediaBrowser-Token': this.apiKey
    };
  }

  /**
   * Get users
   */
  async getUsers(): Promise<any[]> {
    try {
      const headers = this.getHeaders();
      const response = await axios.get(`${this.baseUrl}/Users`, { headers });

      return response.data;
    } catch (error) {
      logger.error('Error getting users from Jellyfin', error);
      throw new Error('Failed to get users');
    }
  }

  /**
   * Get libraries
   */
  async getLibraries(): Promise<any[]> {
    try {
      const headers = this.getHeaders();
      const response = await axios.get(`${this.baseUrl}/Library/VirtualFolders`, { headers });

      return response.data;
    } catch (error) {
      logger.error('Error getting libraries from Jellyfin', error);
      throw new Error('Failed to get libraries');
    }
  }

  /**
   * Get items from a library
   */
  async getLibraryItems(libraryId: string, startIndex: number = 0, limit: number = 100): Promise<any> {
    try {
      const headers = this.getHeaders();
      const response = await axios.get(`${this.baseUrl}/Items`, {
        headers,
        params: {
          parentId: libraryId,
          startIndex,
          limit,
          sortBy: 'SortName',
          sortOrder: 'Ascending'
        }
      });

      return response.data;
    } catch (error) {
      logger.error(`Error getting items for library ${libraryId} from Jellyfin`, error);
      throw new Error('Failed to get library items');
    }
  }

  /**
   * Get item details
   */
  async getItemDetails(itemId: string): Promise<any> {
    try {
      const headers = this.getHeaders();
      const response = await axios.get(`${this.baseUrl}/Items/${itemId}`, { headers });

      return response.data;
    } catch (error) {
      logger.error(`Error getting item details for item ${itemId} from Jellyfin`, error);
      throw new Error('Failed to get item details');
    }
  }

  /**
   * Search items
   */
  async searchItems(query: string, limit: number = 50): Promise<any> {
    try {
      const headers = this.getHeaders();
      const response = await axios.get(`${this.baseUrl}/Items`, {
        headers,
        params: {
          searchTerm: query,
          limit,
          recursive: true,
          includeItemTypes: 'Movie,Series,Episode'
        }
      });

      return response.data;
    } catch (error) {
      logger.error(`Error searching items with query "${query}" from Jellyfin`, error);
      throw new Error('Failed to search items');
    }
  }

  /**
   * Get streaming URL for an item
   */
  getStreamUrl(itemId: string): string {
    return `${this.baseUrl}/Videos/${itemId}/stream?static=true&api_key=${this.apiKey}`;
  }

  /**
   * Refresh library metadata
   */
  async refreshLibrary(libraryId: string): Promise<boolean> {
    try {
      const headers = this.getHeaders();
      await axios.post(`${this.baseUrl}/Items/${libraryId}/Refresh`, {}, { headers });

      return true;
    } catch (error) {
      logger.error(`Error refreshing library ${libraryId} in Jellyfin`, error);
      throw new Error('Failed to refresh library');
    }
  }

  /**
   * Get recently added items
   */
  async getRecentlyAdded(limit: number = 20): Promise<any> {
    try {
      const headers = this.getHeaders();
      const response = await axios.get(`${this.baseUrl}/Items/Latest`, {
        headers,
        params: {
          limit,
          includeItemTypes: 'Movie,Series,Episode'
        }
      });

      return response.data;
    } catch (error) {
      logger.error('Error getting recently added items from Jellyfin', error);
      throw new Error('Failed to get recently added items');
    }
  }
}

export default new JellyfinService();