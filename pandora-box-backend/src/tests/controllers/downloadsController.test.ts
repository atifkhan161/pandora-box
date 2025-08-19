import { Request, Response } from 'express';
import * as downloadsController from '../../controllers/downloadsController';
import * as jackettService from '../../services/jackettService';
import * as qbittorrentService from '../../services/qbittorrentService';
import * as database from '../../services/database';
import * as logger from '../../utils/logger';

// Mock dependencies
jest.mock('../../services/jackettService');
jest.mock('../../services/qbittorrentService');
jest.mock('../../services/database');
jest.mock('../../utils/logger');

describe('Downloads Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup request and response objects
    mockRequest = {
      params: {},
      query: {},
      body: {},
      user: { id: 'user123', username: 'testuser', role: 'user' }
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('searchTorrents', () => {
    it('should return search results from Jackett', async () => {
      // Mock data
      const searchResults = [{ Title: 'Test Torrent', Size: 1000000 }];
      mockRequest.query = { query: 'test', category: 'movies' };
      
      // Mock service response
      (jackettService.searchTorrents as jest.Mock).mockResolvedValue(searchResults);
      
      // Call the controller
      await downloadsController.searchTorrents(mockRequest as Request, mockResponse as Response);
      
      // Assertions
      expect(jackettService.searchTorrents).toHaveBeenCalledWith('test', 'movies');
      expect(mockResponse.json).toHaveBeenCalledWith(searchResults);
      expect(database.logActivity).toHaveBeenCalled();
    });

    it('should return 400 if query is missing', async () => {
      // Mock data - missing query
      mockRequest.query = { category: 'movies' };
      
      // Call the controller
      await downloadsController.searchTorrents(mockRequest as Request, mockResponse as Response);
      
      // Assertions
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Search query is required' });
      expect(jackettService.searchTorrents).not.toHaveBeenCalled();
    });
  });

  describe('getIndexers', () => {
    it('should return indexers from Jackett', async () => {
      // Mock data
      const indexers = [{ id: 'indexer1', name: 'Test Indexer' }];
      
      // Mock service response
      (jackettService.getIndexers as jest.Mock).mockResolvedValue(indexers);
      
      // Call the controller
      await downloadsController.getIndexers(mockRequest as Request, mockResponse as Response);
      
      // Assertions
      expect(jackettService.getIndexers).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(indexers);
    });
  });

  describe('addTorrent', () => {
    it('should add torrent from URL', async () => {
      // Mock data
      mockRequest.body = { url: 'http://test.com/torrent', title: 'Test Torrent' };
      
      // Mock service response
      (qbittorrentService.addTorrentFromUrl as jest.Mock).mockResolvedValue(true);
      
      // Call the controller
      await downloadsController.addTorrent(mockRequest as Request, mockResponse as Response);
      
      // Assertions
      expect(qbittorrentService.addTorrentFromUrl).toHaveBeenCalledWith('http://test.com/torrent');
      expect(mockResponse.json).toHaveBeenCalledWith({ success: true, message: 'Torrent added successfully' });
      expect(database.logActivity).toHaveBeenCalled();
      expect(database.addDownloadHistory).toHaveBeenCalled();
    });

    it('should return 400 if URL is missing', async () => {
      // Mock data - missing URL
      mockRequest.body = { title: 'Test Torrent' };
      
      // Call the controller
      await downloadsController.addTorrent(mockRequest as Request, mockResponse as Response);
      
      // Assertions
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Torrent URL is required' });
      expect(qbittorrentService.addTorrentFromUrl).not.toHaveBeenCalled();
    });
  });

  describe('getTorrents', () => {
    it('should return torrents from qBittorrent', async () => {
      // Mock data
      const torrents = [{ hash: 'hash1', name: 'Test Torrent' }];
      
      // Mock service response
      (qbittorrentService.getTorrents as jest.Mock).mockResolvedValue(torrents);
      
      // Call the controller
      await downloadsController.getTorrents(mockRequest as Request, mockResponse as Response);
      
      // Assertions
      expect(qbittorrentService.getTorrents).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(torrents);
    });
  });

  // Add more tests for other controller methods as needed
});