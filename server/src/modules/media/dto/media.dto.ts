export interface MediaSearchDto {
  query: string;
  type?: 'movie' | 'tv' | 'person';
  page?: number;
}

export interface MediaDetailsDto {
  mediaType: 'movie' | 'tv';
  id: string;
}

export interface TrendingMediaDto {
  type?: 'movie' | 'tv' | 'all';
  page?: number;
  limit?: number;
}

export interface MediaCacheEntry {
  id: string;
  source: 'tmdb' | 'watchmode';
  mediaType: 'movie' | 'tv' | 'general';
  externalId: string;
  title: string;
  metadata: any;
  cachedAt: Date;
  expiresAt: Date;
}

export interface TmdbMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
}

export interface TmdbTvShow {
  id: number;
  name: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
}

export interface WatchmodeStreamingInfo {
  id: number;
  title: string;
  streaming_sources: Array<{
    source: string;
    link: string;
    type: string;
  }>;
}