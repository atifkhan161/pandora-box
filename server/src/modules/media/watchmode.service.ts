import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { SettingsService } from '../settings/settings.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class WatchmodeService {
  private readonly baseUrl = 'https://api.watchmode.com/v1';

  constructor(
    private readonly httpService: HttpService,
    private readonly settingsService: SettingsService,
  ) {}

  private async getApiKey(): Promise<string> {
    const apiKeys = await this.settingsService.getApiKeys();
    const watchmodeKey = apiKeys.keys?.watchmode;
    
    if (!watchmodeKey) {
      throw new Error('Watchmode API key not configured');
    }
    
    return watchmodeKey;
  }

  async getStreamingSources(tmdbId: string, mediaType: 'movie' | 'tv'): Promise<any> {
    try {
      const apiKey = await this.getApiKey();
      const url = `${this.baseUrl}/title/${tmdbId}/sources`;
      
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: { 
            apiKey,
            source_type: 'sub'
          }
        })
      );
      
      return response.data;
    } catch (error) {
      // Return empty sources if Watchmode fails
      return { sources: [] };
    }
  }

  async searchTitle(title: string, mediaType?: 'movie' | 'tv'): Promise<any> {
    try {
      const apiKey = await this.getApiKey();
      const url = `${this.baseUrl}/search`;
      
      const params: any = { 
        apiKey,
        search_field: 'name',
        search_value: title
      };

      if (mediaType) {
        params.types = mediaType === 'tv' ? 'tv_series' : 'movie';
      }
      
      const response = await firstValueFrom(
        this.httpService.get(url, { params })
      );
      
      return response.data;
    } catch (error) {
      return { title_results: [] };
    }
  }

  async getTitleDetails(watchmodeId: string): Promise<any> {
    try {
      const apiKey = await this.getApiKey();
      const url = `${this.baseUrl}/title/${watchmodeId}/details`;
      
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: { apiKey }
        })
      );
      
      return response.data;
    } catch (error) {
      return null;
    }
  }
}