import axios from 'axios';
import FormData from 'form-data';
import { getEnv } from '../config/env';
import { logger } from '../utils/logger';

const env = getEnv();

/**
 * qBittorrent API Service
 * Provides methods to interact with qBittorrent WebUI API
 */
export class QBittorrentService {
  private baseUrl: string;
  private username: string;
  private password: string;
  private cookie: string | null = null;

  constructor() {
    this.baseUrl = env.QBITTORRENT_URL;
    this.username = env.QBITTORRENT_USERNAME;
    this.password = env.QBITTORRENT_PASSWORD;
  }

  /**
   * Login to qBittorrent WebUI
   */
  async login(): Promise<boolean> {
    try {
      const formData = new FormData();
      formData.append('username', this.username);
      formData.append('password', this.password);

      const response = await axios.post(`${this.baseUrl}/api/v2/auth/login`, formData, {
        headers: formData.getHeaders()
      });

      if (response.headers['set-cookie']) {
        this.cookie = response.headers['set-cookie'][0];
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('Error logging in to qBittorrent', error);
      return false;
    }
  }

  /**
   * Get request headers with authentication cookie
   */
  private async getHeaders(): Promise<any> {
    if (!this.cookie) {
      await this.login();
    }

    return {
      Cookie: this.cookie
    };
  }

  /**
   * Add torrent from URL
   */
  async addTorrentFromUrl(url: string, savePath?: string): Promise<boolean> {
    try {
      const formData = new FormData();
      formData.append('urls', url);
      
      if (savePath) {
        formData.append('savepath', savePath);
      }

      const headers = await this.getHeaders();
      const response = await axios.post(`${this.baseUrl}/api/v2/torrents/add`, formData, {
        headers: { ...headers, ...formData.getHeaders() }
      });

      return response.data === 'Ok.';
    } catch (error) {
      logger.error('Error adding torrent from URL to qBittorrent', error);
      throw new Error('Failed to add torrent');
    }
  }

  /**
   * Get torrent list
   */
  async getTorrents(filter: string = 'all'): Promise<any[]> {
    try {
      const headers = await this.getHeaders();
      const response = await axios.get(`${this.baseUrl}/api/v2/torrents/info`, {
        params: { filter },
        headers
      });

      return response.data;
    } catch (error) {
      logger.error('Error getting torrents from qBittorrent', error);
      throw new Error('Failed to get torrents');
    }
  }

  /**
   * Get torrent properties
   */
  async getTorrentProperties(hash: string): Promise<any> {
    try {
      const headers = await this.getHeaders();
      const response = await axios.get(`${this.baseUrl}/api/v2/torrents/properties`, {
        params: { hash },
        headers
      });

      return response.data;
    } catch (error) {
      logger.error(`Error getting torrent properties for hash ${hash} from qBittorrent`, error);
      throw new Error('Failed to get torrent properties');
    }
  }

  /**
   * Get torrent contents
   */
  async getTorrentContents(hash: string): Promise<any[]> {
    try {
      const headers = await this.getHeaders();
      const response = await axios.get(`${this.baseUrl}/api/v2/torrents/files`, {
        params: { hash },
        headers
      });

      return response.data;
    } catch (error) {
      logger.error(`Error getting torrent contents for hash ${hash} from qBittorrent`, error);
      throw new Error('Failed to get torrent contents');
    }
  }

  /**
   * Pause torrent
   */
  async pauseTorrent(hash: string): Promise<boolean> {
    try {
      const formData = new FormData();
      formData.append('hashes', hash);

      const headers = await this.getHeaders();
      await axios.post(`${this.baseUrl}/api/v2/torrents/pause`, formData, {
        headers: { ...headers, ...formData.getHeaders() }
      });

      return true;
    } catch (error) {
      logger.error(`Error pausing torrent with hash ${hash} in qBittorrent`, error);
      throw new Error('Failed to pause torrent');
    }
  }

  /**
   * Resume torrent
   */
  async resumeTorrent(hash: string): Promise<boolean> {
    try {
      const formData = new FormData();
      formData.append('hashes', hash);

      const headers = await this.getHeaders();
      await axios.post(`${this.baseUrl}/api/v2/torrents/resume`, formData, {
        headers: { ...headers, ...formData.getHeaders() }
      });

      return true;
    } catch (error) {
      logger.error(`Error resuming torrent with hash ${hash} in qBittorrent`, error);
      throw new Error('Failed to resume torrent');
    }
  }

  /**
   * Delete torrent
   */
  async deleteTorrent(hash: string, deleteFiles: boolean = false): Promise<boolean> {
    try {
      const formData = new FormData();
      formData.append('hashes', hash);
      formData.append('deleteFiles', deleteFiles ? 'true' : 'false');

      const headers = await this.getHeaders();
      await axios.post(`${this.baseUrl}/api/v2/torrents/delete`, formData, {
        headers: { ...headers, ...formData.getHeaders() }
      });

      return true;
    } catch (error) {
      logger.error(`Error deleting torrent with hash ${hash} from qBittorrent`, error);
      throw new Error('Failed to delete torrent');
    }
  }

  /**
   * Get global transfer info
   */
  async getTransferInfo(): Promise<any> {
    try {
      const headers = await this.getHeaders();
      const response = await axios.get(`${this.baseUrl}/api/v2/transfer/info`, { headers });

      return response.data;
    } catch (error) {
      logger.error('Error getting transfer info from qBittorrent', error);
      throw new Error('Failed to get transfer info');
    }
  }
}

export default new QBittorrentService();