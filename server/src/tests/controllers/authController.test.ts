import { Request, Response } from 'express';
import { login, refreshToken, logout, registerUser, changePassword } from '../../controllers/authController';
import * as database from '../../services/database';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Mock dependencies
jest.mock('../../services/database');
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');

describe('Auth Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseObject: any = {};

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup request and response objects
    mockRequest = {
      body: {},
      user: { id: 'user123', username: 'testuser', role: 'user' }
    };
    
    responseObject = {
      statusCode: 0,
      json: jest.fn().mockReturnThis(),
    };
    
    mockResponse = {
      status: jest.fn().mockImplementation((code) => {
        responseObject.statusCode = code;
        return responseObject;
      }),
      json: responseObject.json,
    };
  });

  describe('login', () => {
    it('should return 400 if username or password is missing', async () => {
      await login(mockRequest as Request, mockResponse as Response);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseObject.json).toHaveBeenCalledWith({ error: 'Username and password are required' });
    });

    it('should return 401 if user is not found', async () => {
      mockRequest.body = { username: 'testuser', password: 'password123' };
      (database.getUserByUsername as jest.Mock).mockResolvedValue(null);
      
      await login(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(responseObject.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
    });

    it('should return 401 if password is incorrect', async () => {
      mockRequest.body = { username: 'testuser', password: 'password123' };
      (database.getUserByUsername as jest.Mock).mockResolvedValue({
        id: 'user123',
        username: 'testuser',
        password: 'hashedpassword',
        role: 'user'
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      
      await login(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(responseObject.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
    });

    it('should return 200 with tokens if login is successful', async () => {
      mockRequest.body = { username: 'testuser', password: 'password123' };
      (database.getUserByUsername as jest.Mock).mockResolvedValue({
        id: 'user123',
        username: 'testuser',
        password: 'hashedpassword',
        role: 'user'
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValueOnce('access_token');
      (jwt.sign as jest.Mock).mockReturnValueOnce('refresh_token');
      (database.logActivity as jest.Mock).mockResolvedValue(undefined);
      
      await login(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject.json).toHaveBeenCalledWith({
        user: {
          id: 'user123',
          username: 'testuser',
          role: 'user'
        },
        tokens: {
          accessToken: 'access_token',
          refreshToken: 'refresh_token'
        }
      });
      expect(database.logActivity).toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    it('should return 400 if refresh token is missing', async () => {
      await refreshToken(mockRequest as Request, mockResponse as Response);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(responseObject.json).toHaveBeenCalledWith({ error: 'Refresh token is required' });
    });

    it('should return 401 if refresh token is invalid', async () => {
      mockRequest.body = { refreshToken: 'invalid_token' };
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      await refreshToken(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(responseObject.json).toHaveBeenCalledWith({ error: 'Invalid refresh token' });
    });

    it('should return 200 with new tokens if refresh is successful', async () => {
      mockRequest.body = { refreshToken: 'valid_refresh_token' };
      (jwt.verify as jest.Mock).mockReturnValue({ id: 'user123', username: 'testuser', role: 'user' });
      (jwt.sign as jest.Mock).mockReturnValueOnce('new_access_token');
      (jwt.sign as jest.Mock).mockReturnValueOnce('new_refresh_token');
      
      await refreshToken(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject.json).toHaveBeenCalledWith({
        tokens: {
          accessToken: 'new_access_token',
          refreshToken: 'new_refresh_token'
        }
      });
    });
  });

  // Additional tests for logout, registerUser, and changePassword would follow the same pattern
});