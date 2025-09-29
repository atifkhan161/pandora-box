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
    await this.ensureAuthenticated();
    const config = await this.getQbittorrentConfig();

    await this.httpService.axiosRef.post(
      `${config.url}/api/v2/torrents/pause`,
      new URLSearchParams({ hashes: hash }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Cookie: this.sessionCookie,
        },
      }
    );

    return { success: true };
  }

  async resumeTorrent(hash: string): Promise<any> {
    await this.ensureAuthenticated();
    const config = await this.getQbittorrentConfig();

    await this.httpService.axiosRef.post(
      `${config.url}/api/v2/torrents/resume`,
      new URLSearchParams({ hashes: hash }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Cookie: this.sessionCookie,
        },
      }
    );

    return { success: true };
  }

  async removeTorrent(hash: string): Promise<any> {
    await this.ensureAuthenticated();
    const config = await this.getQbittorrentConfig();

    await this.httpService.axiosRef.post(
      `${config.url}/api/v2/torrents/delete`,
      new URLSearchParams({ hashes: hash, deleteFiles: 'false' }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Cookie: this.sessionCookie,
        },
      }
    );

    return { success: true };
  }

  private async ensureAuthenticated(): Promise<void> {
    if (this.sessionCookie) return;

    const config = await this.getQbittorrentConfig();
    const response = await this.httpService.axiosRef.post(
      `${config.url}/api/v2/auth/login`,
      new URLSearchParams({
        username: config.username,
        password: config.password,
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    this.sessionCookie = response.headers['set-cookie']?.[0];
  }

  private async getQbittorrentConfig(): Promise<any> {
    const configCollection = this.databaseService.getConfigCollection();
    const config = configCollection.findOne({ type: 'qbittorrent-config' });
    
    if (!config?.config) {
      throw new Error('qBittorrent configuration not found');
    }

    return {
      url: config.config.url,
      username: config.config.username,
      password: this.encryptionService.decrypt(config.config.password),
    };
  }
}