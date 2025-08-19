import { Request, Response } from 'express';
import * as systemController from '../../controllers/systemController';
import * as portainerService from '../../services/portainerService';
import * as database from '../../services/database';
import * as logger from '../../utils/logger';

// Mock dependencies
jest.mock('../../services/portainerService');
jest.mock('../../services/database');
jest.mock('../../utils/logger');

describe('System Controller', () => {
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
      user: { id: 'user123', username: 'testuser', role: 'admin' }
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('getSettings', () => {
    it('should return system settings', async () => {
      // Mock data
      const settings = { 
        tmdbApiKey: '***', 
        jellyfinUrl: 'http://jellyfin:8096',
        downloadPath: '/downloads'
      };
      
      // Mock service response
      (database.getSettings as jest.Mock).mockResolvedValue(settings);
      
      // Call the controller
      await systemController.getSettings(mockRequest as Request, mockResponse as Response);
      
      // Assertions
      expect(database.getSettings).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(settings);
    });
  });

  describe('updateSettings', () => {
    it('should update system settings', async () => {
      // Mock data
      const newSettings = { 
        tmdbApiKey: 'new_api_key', 
        jellyfinUrl: 'http://jellyfin:8096',
        downloadPath: '/new/downloads'
      };
      mockRequest.body = newSettings;
      
      // Mock service response
      (database.getSettings as jest.Mock).mockResolvedValue({ tmdbApiKey: 'old_api_key' });
      (database.updateSettings as jest.Mock).mockResolvedValue(newSettings);
      
      // Call the controller
      await systemController.updateSettings(mockRequest as Request, mockResponse as Response);
      
      // Assertions
      expect(database.updateSettings).toHaveBeenCalledWith(expect.objectContaining(newSettings));
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining(newSettings));
      expect(database.logActivity).toHaveBeenCalled();
    });

    it('should return 400 if settings object is missing', async () => {
      // Mock data - missing settings
      mockRequest.body = {};
      
      // Call the controller
      await systemController.updateSettings(mockRequest as Request, mockResponse as Response);
      
      // Assertions
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Settings object is required' });
      expect(database.updateSettings).not.toHaveBeenCalled();
    });
  });

  describe('getContainers', () => {
    it('should return containers from Portainer', async () => {
      // Mock data
      const containers = [{ Id: 'container1', Names: ['test-container'] }];
      
      // Mock service response
      (portainerService.getContainers as jest.Mock).mockResolvedValue(containers);
      
      // Call the controller
      await systemController.getContainers(mockRequest as Request, mockResponse as Response);
      
      // Assertions
      expect(portainerService.getContainers).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(containers);
    });
  });

  describe('getContainerLogs', () => {
    it('should return container logs', async () => {
      // Mock data
      const logs = 'Container log output';
      mockRequest.params = { id: 'container1' };
      
      // Mock service response
      (portainerService.getContainerLogs as jest.Mock).mockResolvedValue(logs);
      
      // Call the controller
      await systemController.getContainerLogs(mockRequest as Request, mockResponse as Response);
      
      // Assertions
      expect(portainerService.getContainerLogs).toHaveBeenCalledWith('container1');
      expect(mockResponse.json).toHaveBeenCalledWith({ logs });
    });

    it('should return 400 if container ID is missing', async () => {
      // Mock data - missing ID
      mockRequest.params = {};
      
      // Call the controller
      await systemController.getContainerLogs(mockRequest as Request, mockResponse as Response);
      
      // Assertions
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Container ID is required' });
      expect(portainerService.getContainerLogs).not.toHaveBeenCalled();
    });
  });

  // Add more tests for other controller methods as needed
});