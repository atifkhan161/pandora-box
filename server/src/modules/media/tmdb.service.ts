import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { SettingsService } from '../settings/settings.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class TmdbService {
  private readonly baseUrl = 'https://api.themoviedb.org/3';

  constructor(
    private readonly httpService: HttpService,
    private readonly settingsService: SettingsService,
  ) {}

  private async getApiKey(): Promise<string> {
    const apiKeys = await this.settingsService.getApiKeys();
    const tmdbKey = apiKeys.keys?.tmdb;
    
    if (!tmdbKey) {
      throw new Error('TMDB API key not configured');
    }
    
    return tmdbKey;
  }

  async getTrending(mediaType: 'movie' | 'tv' | 'all' = 'all', page = 1): Promise<any> {
    const apiKey = await this.getApiKey();
    const url = `${this.baseUrl}/trending/${mediaType}/day`;
    
    const response = await firstValueFrom(
      this.httpService.get(url, {
        params: { api_key: apiKey, page }
      })
    );
    
    return response.data;
  }

  async getLatestMovies(page = 1): Promise<any> {
    const apiKey = await this.getApiKey();
    const url = `${this.baseUrl}/movie/now_playing`;
    
    const response = await firstValueFrom(
      this.httpService.get(url, {
        params: { api_key: apiKey, page }
      })
    );
    
    return response.data;
  }

  async getLatestTvShows(page = 1): Promise<any> {
    const apiKey = await this.getApiKey();
    const url = `${this.baseUrl}/tv/on_the_air`;
    
    const response = await firstValueFrom(
      this.httpService.get(url, {
        params: { api_key: apiKey, page }
      })
    );
    
    return response.data;
  }

  async getMovieDetails(id: string): Promise<any> {
    const apiKey = await this.getApiKey();
    const url = `${this.baseUrl}/movie/${id}`;
    
    const response = await firstValueFrom(
      this.httpService.get(url, {
        params: { 
          api_key: apiKey,
          append_to_response: 'credits,videos,similar'
        }
      })
    );
    
    return response.data;
  }

  async getTvShowDetails(id: string): Promise<any> {
    const apiKey = await this.getApiKey();
    const url = `${this.baseUrl}/tv/${id}`;
    
    const response = await firstValueFrom(
      this.httpService.get(url, {
        params: { 
          api_key: apiKey,
          append_to_response: 'credits,videos,similar'
        }
      })
    );
    
    return response.data;
  }

  async searchMulti(query: string, page = 1): Promise<any> {
    const apiKey = await this.getApiKey();
    const url = `${this.baseUrl}/search/multi`;
    
    const response = await firstValueFrom(
      this.httpService.get(url, {
        params: { api_key: apiKey, query, page }
      })
    );
    
    return response.data;
  }

  async searchMovies(query: string, page = 1): Promise<any> {
    const apiKey = await this.getApiKey();
    const url = `${this.baseUrl}/search/movie`;
    
    const response = await firstValueFrom(
      this.httpService.get(url, {
        params: { api_key: apiKey, query, page }
      })
    );
    
    return response.data;
  }

  async searchTvShows(query: string, page = 1): Promise<any> {
    const apiKey = await this.getApiKey();
    const url = `${this.baseUrl}/search/tv`;
    
    const response = await firstValueFrom(
      this.httpService.get(url, {
        params: { api_key: apiKey, query, page }
      })
    );
    
    return response.data;
  }

  async searchPeople(query: string, page = 1): Promise<any> {
    const apiKey = await this.getApiKey();
    const url = `${this.baseUrl}/search/person`;
    
    const response = await firstValueFrom(
      this.httpService.get(url, {
        params: { api_key: apiKey, query, page }
      })
    );
    
    return response.data;
  }
}