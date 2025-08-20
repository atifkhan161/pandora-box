import { Request, Response } from 'express';
import * as mediaController from '../../controllers/mediaController';
import * as tmdbService from '../../services/tmdbService';
import * as database from '../../services/database';
import * as logger from '../../utils/logger';

// Mock dependencies
jest.mock('../../services/tmdbService');
jest.mock('../../services/database');
jest.mock('../../utils/logger');

describe('Media Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup request and response objects
    mockRequest = {
      params: {},
      query: {},
      user: { id: 'user123', username: 'testuser', role: 'user' }
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('searchMovies', () => {
    it('should return search results from TMDB', async () => {
      // Mock data
      const searchResults = { results: [{ id: 1, title: 'Test Movie' }] };
      mockRequest.query = { query: 'test' };
      
      // Mock service response
      (tmdbService.searchMovies as jest.Mock).mockResolvedValue(searchResults);
      
      // Call the controller
      await mediaController.searchMovies(mockRequest as Request, mockResponse as Response);
      
      // Assertions
      expect(tmdbService.searchMovies).toHaveBeenCalledWith('test');
      expect(mockResponse.json).toHaveBeenCalledWith(searchResults);
      expect(database.logActivity).toHaveBeenCalled();
    });

    it('should return 400 if query is missing', async () => {
      // Mock data - missing query
      mockRequest.query = {};
      
      // Call the controller
      await mediaController.searchMovies(mockRequest as Request, mockResponse as Response);
      
      // Assertions
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Search query is required' });
      expect(tmdbService.searchMovies).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      // Mock data
      mockRequest.query = { query: 'test' };
      
      // Mock service error
      const error = new Error('TMDB API error');
      (tmdbService.searchMovies as jest.Mock).mockRejectedValue(error);
      
      // Call the controller
      await mediaController.searchMovies(mockRequest as Request, mockResponse as Response);
      
      // Assertions
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Failed to search movies' });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getMovieDetails', () => {
    it('should return movie details from TMDB', async () => {
      // Mock data
      const movieDetails = { id: 123, title: 'Test Movie', overview: 'Test overview' };
      mockRequest.params = { id: '123' };
      
      // Mock service response
      (tmdbService.getMovieDetails as jest.Mock).mockResolvedValue(movieDetails);
      
      // Call the controller
      await mediaController.getMovieDetails(mockRequest as Request, mockResponse as Response);
      
      // Assertions
      expect(tmdbService.getMovieDetails).toHaveBeenCalledWith(123);
      expect(mockResponse.json).toHaveBeenCalledWith(movieDetails);
      expect(database.logActivity).toHaveBeenCalled();
    });

    it('should return 400 if id is invalid', async () => {
      // Mock data - invalid id
      mockRequest.params = { id: 'invalid' };
      
      // Call the controller
      await mediaController.getMovieDetails(mockRequest as Request, mockResponse as Response);
      
      // Assertions
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid movie ID' });
      expect(tmdbService.getMovieDetails).not.toHaveBeenCalled();
    });
  });

  describe('getPopularMovies', () => {
    it('should return popular movies from TMDB', async () => {
      // Mock data
      const popularMovies = { results: [{ id: 1, title: 'Popular Movie' }] };
      
      // Mock service response
      (tmdbService.getPopularMovies as jest.Mock).mockResolvedValue(popularMovies);
      
      // Call the controller
      await mediaController.getPopularMovies(mockRequest as Request, mockResponse as Response);
      
      // Assertions
      expect(tmdbService.getPopularMovies).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(popularMovies);
      expect(database.logActivity).toHaveBeenCalled();
    });
  });

  // Add more tests for other controller methods as needed
});