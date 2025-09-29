import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { DatabaseService } from '../database/database.service';
import { EncryptionService } from '../settings/encryption.service';

@Injectable()
export class QbittorrentService {
  private sessionCookie: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly databaseService: DatabaseService,
    private readonly encryptionService: EncryptionService,
  ) {}

  async addTorrent(magnetLink: string): Promise<any> {
    await this.ensureAuthenticated();
    const config = await this.getQbittorrentConfig();

    const response = await this.httpService.axiosRef.post(
      `${config.url}/api/v2/torrents/add`,
      new URLSearchParams({ urls: magnetLink }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Cookie: this.sessionCookie,
        },
      }
    );

    return { success: response.status === 200 };
  }

  async getTorrents(): Promise<any> {
    await this.ensureAuthenticated();
    const config = await this.getQbittorrentConfig();

    const response = await this.httpService.axiosRef.get(
      `${config.url}/api/v2/torrents/info`,
      {
        headers: { Cookie: this.sessionCookie },
      }
    );


    return response.data;
  }

  async pauseTorrent(hash: string): Promise<any> {
    try {
      this.sessionCookie = null;
      await this.ensureAuthenticated();
      const config = await this.getQbittorrentConfig();

      const response = await this.httpService.axiosRef.post(
        `${config.url}/api/v2/torrents/stop`,
        new URLSearchParams({ hashes: hash }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Cookie: this.sessionCookie,
          },
        }
      );

      return { success: response.status === 200 };
    } catch (error) {
      throw new Error(`Failed to pause torrent: ${error.message}`);
    }
  }

  async resumeTorrent(hash: string): Promise<any> {
    try {
      this.sessionCookie = null;
      await this.ensureAuthenticated();
      const config = await this.getQbittorrentConfig();

      const response = await this.httpService.axiosRef.post(
        `${config.url}/api/v2/torrents/start`,
        new URLSearchParams({ hashes: hash }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Cookie: this.sessionCookie,
          },
        }
      );

      return { success: response.status === 200 };
    } catch (error) {
      throw new Error(`Failed to resume torrent: ${error.message}`);
    }
  }

  async removeTorrent(hash: string): Promise<any> {
    try {
      this.sessionCookie = null; // Force re-authentication
      await this.ensureAuthenticated();
      const config = await this.getQbittorrentConfig();

      const response = await this.httpService.axiosRef.post(
        `${config.url}/api/v2/torrents/delete`,
        new URLSearchParams({ hashes: hash, deleteFiles: 'false' }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Cookie: this.sessionCookie,
          },
        }
      );

      return { success: response.status === 200 };
    } catch (error) {
      console.error('Error removing torrent:', error.message);
      throw new Error(`Failed to remove torrent: ${error.message}`);
    }
  }

  private async ensureAuthenticated(): Promise<void> {
    const config = await this.getQbittorrentConfig();
    const baseUrl = config.url.replace(/\/$/, '');
    
    try {
      const response = await this.httpService.axiosRef.post(
        `${baseUrl}/api/v2/auth/login`,
        `username=${encodeURIComponent(config.username)}&password=${encodeURIComponent(config.password)}`,
        {
          headers: { 
            'Content-Type': 'application/x-www-form-urlencoded',
            'Referer': baseUrl
          },
        }
      );

      const cookies = response.headers['set-cookie'];
      if (cookies) {
        this.sessionCookie = cookies.join('; ');

      } else {
        throw new Error('No session cookie received from qBittorrent');
      }
    } catch (error) {
      console.error('qBittorrent authentication failed:', error.message);
      this.sessionCookie = null;
      throw new Error(`qBittorrent authentication failed: ${error.message}`);
    }
  }

  private async getQbittorrentConfig(): Promise<any> {
    const configCollection = this.databaseService.getConfigCollection();
    const config = configCollection.findOne({ type: 'qbittorrent-config' });
    
    if (!config?.config) {
      throw new Error('qBittorrent configuration not found. Please configure qBittorrent in settings.');
    }

    return {
      url: config.config.url.replace(/\/$/, ''),
      username: config.config.username,
      password: this.encryptionService.decrypt(config.config.password),
    };
  }
}