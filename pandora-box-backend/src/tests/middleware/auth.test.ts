import { Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import jwt from 'jsonwebtoken';
import * as database from '../../services/database';

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('../../services/database');

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction = jest.fn();

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup request and response objects
    mockRequest = {
      headers: {},
      user: undefined
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('authenticate', () => {
    it('should return 401 if no token is provided', () => {
      authenticate(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 if token format is invalid', () => {
      mockRequest.headers = { authorization: 'InvalidFormat token123' };
      
      authenticate(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid token format' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 if token verification fails', () => {
      mockRequest.headers = { authorization: 'Bearer invalid_token' };
      
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      authenticate(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should set req.user and call next if token is valid', () => {
      mockRequest.headers = { authorization: 'Bearer valid_token' };
      
      const decodedToken = { id: 'user123', username: 'testuser', role: 'user' };
      (jwt.verify as jest.Mock).mockReturnValue(decodedToken);
      
      authenticate(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(mockRequest.user).toEqual(decodedToken);
      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('authorize', () => {
    it('should return 403 if user role is not in allowed roles', () => {
      mockRequest.user = { id: 'user123', username: 'testuser', role: 'user' };
      
      const authorizeAdmin = authorize(['admin']);
      authorizeAdmin(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Access denied' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should call next if user role is in allowed roles', () => {
      mockRequest.user = { id: 'user123', username: 'testuser', role: 'admin' };
      
      const authorizeAdmin = authorize(['admin']);
      authorizeAdmin(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should call next if user role is one of multiple allowed roles', () => {
      mockRequest.user = { id: 'user123', username: 'testuser', role: 'editor' };
      
      const authorizeMultipleRoles = authorize(['admin', 'editor']);
      authorizeMultipleRoles(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });
});