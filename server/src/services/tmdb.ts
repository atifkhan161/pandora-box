import axios, { AxiosInstance } from 'axios';

interface TmdbConfig {
  apiKey: string;
  baseUrl: string;
}

interface Movie {
  id: number;
  title: string;
  poster_path: string;
  release_date: string;
  vote_average: number;
  genre_ids: number[];
}

interface TvShow {
  id: number;
  name: string;
  poster_path: string;
  first_air_date: string;
  vote_average: number;
  genre_ids: number[];
}

interface SearchResult {
  page: number;
  results: (Movie | TvShow)[];
  total_pages: number;
  total_results: number;
}

export class TmdbService {
  private api: AxiosInstance;
  private apiKey: string;

  constructor(config: TmdbConfig) {
    this.apiKey = config.apiKey;
    this.api = axios.create({
      baseURL: config.baseUrl,
      params: {
        api_key: this.apiKey,
      },
    });
  }

  public async getTrending(type: 'movie' | 'tv', timeWindow: 'day' | 'week'): Promise<SearchResult> {
    const response = await this.api.get(`/trending/${type}/${timeWindow}`);
    return response.data;
  }

  public async search(query: string, type: 'movie' | 'tv' | 'multi'): Promise<SearchResult> {
    const response = await this.api.get(`/search/${type}`, {
      params: {
        query,
      },
    });
    return response.data;
  }

  public async getDetails(type: 'movie' | 'tv', id: number): Promise<any> {
    const response = await this.api.get(`/${type}/${id}`);
    return response.data;
  }

  public async getPopular(type: 'movie' | 'tv'): Promise<SearchResult> {
    const response = await this.api.get(`/${type}/popular`);
    return response.data;
  }

  public async getGenres(type: 'movie' | 'tv'): Promise<any> {
    const response = await this.api.get(`/genre/${type}/list`);
    return response.data;
  }

  public getImageUrl(path: string, size: string = 'w500'): string {
    return `https://image.tmdb.org/t/p/${size}${path}`;
  }
}