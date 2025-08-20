import axios from 'axios';
import * as tmdbService from '../../services/tmdbService';

// Mock dependencies
jest.mock('axios');

describe('TMDB Service', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock environment variables
    process.env.TMDB_API_KEY = 'test_api_key';
  });

  describe('searchMovies', () => {
    it('should search movies with the provided query', async () => {
      // Mock data
      const searchResults = { results: [{ id: 1, title: 'Test Movie' }] };
      
      // Mock axios response
      (axios.get as jest.Mock).mockResolvedValue({ data: searchResults });
      
      // Call the service
      const result = await tmdbService.searchMovies('test');
      
      // Assertions
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/search/movie'),
        expect.objectContaining({
          params: expect.objectContaining({
            api_key: 'test_api_key',
            query: 'test'
          })
        })
      );
      expect(result).toEqual(searchResults);
    });

    it('should handle errors', async () => {
      // Mock axios error
      (axios.get as jest.Mock).mockRejectedValue(new Error('API error'));
      
      // Call the service and expect it to throw
      await expect(tmdbService.searchMovies('test')).rejects.toThrow();
    });
  });

  describe('searchTVShows', () => {
    it('should search TV shows with the provided query', async () => {
      // Mock data
      const searchResults = { results: [{ id: 1, name: 'Test Show' }] };
      
      // Mock axios response
      (axios.get as jest.Mock).mockResolvedValue({ data: searchResults });
      
      // Call the service
      const result = await tmdbService.searchTVShows('test');
      
      // Assertions
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/search/tv'),
        expect.objectContaining({
          params: expect.objectContaining({
            api_key: 'test_api_key',
            query: 'test'
          })
        })
      );
      expect(result).toEqual(searchResults);
    });
  });

  describe('getMovieDetails', () => {
    it('should get movie details with the provided ID', async () => {
      // Mock data
      const movieDetails = { id: 123, title: 'Test Movie', overview: 'Test overview' };
      
      // Mock axios response
      (axios.get as jest.Mock).mockResolvedValue({ data: movieDetails });
      
      // Call the service
      const result = await tmdbService.getMovieDetails(123);
      
      // Assertions
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/movie/123'),
        expect.objectContaining({
          params: expect.objectContaining({
            api_key: 'test_api_key'
          })
        })
      );
      expect(result).toEqual(movieDetails);
    });
  });

  describe('getTVShowDetails', () => {
    it('should get TV show details with the provided ID', async () => {
      // Mock data
      const tvShowDetails = { id: 123, name: 'Test Show', overview: 'Test overview' };
      
      // Mock axios response
      (axios.get as jest.Mock).mockResolvedValue({ data: tvShowDetails });
      
      // Call the service
      const result = await tmdbService.getTVShowDetails(123);
      
      // Assertions
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/tv/123'),
        expect.objectContaining({
          params: expect.objectContaining({
            api_key: 'test_api_key'
          })
        })
      );
      expect(result).toEqual(tvShowDetails);
    });
  });

  // Add more tests for other service methods as needed
});