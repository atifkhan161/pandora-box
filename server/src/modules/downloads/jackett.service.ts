import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { DatabaseService } from '../database/database.service';
import { EncryptionService } from '../settings/encryption.service';

@Injectable()
export class JackettService {
  constructor(
    private readonly httpService: HttpService,
    private readonly databaseService: DatabaseService,
    private readonly encryptionService: EncryptionService,
  ) {}

  async searchTorrents(query: string): Promise<any> {
    const config = await this.getJackettConfig();
    if (!config.url || !config.apiKey) {
      throw new Error('Jackett configuration not found');
    }

    const response = await this.httpService.axiosRef.get(
      `${config.url}/api/v2.0/indexers/all/results`,
      {
        params: {
          apikey: config.apiKey,
          Query: query,
          Category: '2000,5000', // Movies and TV
        },
        timeout: 10000,
      }
    );

    return response.data.Results || [];
  }

  private async getJackettConfig(): Promise<any> {
    const configCollection = this.databaseService.getConfigCollection();
    const config = configCollection.findOne({ type: 'api-keys' });
    
    if (!config?.keys?.jackett) {
      return { url: null, apiKey: null };
    }

    return {
      url: process.env.JACKETT_URL || 'http://localhost:9117',
      apiKey: this.encryptionService.decrypt(config.keys.jackett),
    };
  }
}