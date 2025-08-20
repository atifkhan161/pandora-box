import { Request, Response } from 'express';
import * as libraryController from '../../controllers/libraryController';
import * as jellyfinService from '../../services/jellyfinService';
import * as database from '../../services/database';
import * as logger from '../../utils/logger';

// Mock dependencies
jest.mock('../../services/jellyfinService');
jest.mock('../../services/database');
jest.mock('../../utils/logger');

describe('Library Controller', () => {
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

  describe('getUsers', () => {
    it('should return Jellyfin users', async () => {
      // Mock data
      const users = [{ Id: 'user1', Name: 'Test User' }];
      
      // Mock service response
      (jellyfinService.getUsers as jest.Mock).mockResolvedValue(users);
      
      // Call the controller
      await libraryController.getUsers(mockRequest as Request, mockResponse as Response);
      
      // Assertions
      expect(jellyfinService.getUsers).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(users);
    });
  });

  describe('getLibraries', () => {
    it('should return Jellyfin libraries', async () => {
      // Mock data
      const libraries = [{ Id: 'lib1', Name: 'Movies' }];
      
      // Mock service response
      (jellyfinService.getLibraries as jest.Mock).mockResolvedValue(libraries);
      
      // Call the controller
      await libraryController.getLibraries(mockRequest as Request, mockResponse as Response);
      
      // Assertions
      expect(jellyfinService.getLibraries).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(libraries);
      expect(database.logActivity).toHaveBeenCalled();
    });
  });

  describe('getLibraryItems', () => {
    it('should return library items', async () => {
      // Mock data
      const items = [{ Id: 'item1', Name: 'Test Movie' }];
      mockRequest.params = { libraryId: 'lib1' };
      
      // Mock service response
      (jellyfinService.getLibraryItems as jest.Mock).mockResolvedValue(items);
      
      // Call the controller
      await libraryController.getLibraryItems(mockRequest as Request, mockResponse as Response);
      
      // Assertions
      expect(jellyfinService.getLibraryItems).toHaveBeenCalledWith('lib1');
      expect(mockResponse.json).toHaveBeenCalledWith(items);
      expect(database.logActivity).toHaveBeenCalled();
    });

    it('should return 400 if library ID is missing', async () => {
      // Mock data - missing ID
      mockRequest.params = {};
      
      // Call the controller
      await libraryController.getLibraryItems(mockRequest as Request, mockResponse as Response);
      
      // Assertions
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Library ID is required' });
      expect(jellyfinService.getLibraryItems).not.toHaveBeenCalled();
    });
  });

  describe('getItemDetails', () => {
    it('should return item details', async () => {
      // Mock data
      const itemDetails = { Id: 'item1', Name: 'Test Movie', Overview: 'Test overview' };
      mockRequest.params = { itemId: 'item1' };
      
      // Mock service response
      (jellyfinService.getItemDetails as jest.Mock).mockResolvedValue(itemDetails);
      
      // Call the controller
      await libraryController.getItemDetails(mockRequest as Request, mockResponse as Response);
      
      // Assertions
      expect(jellyfinService.getItemDetails).toHaveBeenCalledWith('item1');
      expect(mockResponse.json).toHaveBeenCalledWith(itemDetails);
      expect(database.logActivity).toHaveBeenCalled();
    });

    it('should return 400 if item ID is missing', async () => {
      // Mock data - missing ID
      mockRequest.params = {};
      
      // Call the controller
      await libraryController.getItemDetails(mockRequest as Request, mockResponse as Response);
      
      // Assertions
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Item ID is required' });
      expect(jellyfinService.getItemDetails).not.toHaveBeenCalled();
    });
  });

  // Add more tests for other controller methods as needed
});