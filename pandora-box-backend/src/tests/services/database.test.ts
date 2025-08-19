import * as fs from 'fs';
import * as path from 'path';
import { initializeDatabase, getUserByUsername, createUser, getSettings, updateSettings, logActivity } from '../../services/database';

// Mock dependencies
jest.mock('fs');
jest.mock('path');
jest.mock('lokijs');

describe('Database Service', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock path.join to return a predictable path
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));
    
    // Mock fs.existsSync to return true
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    
    // Mock fs.mkdirSync to do nothing
    (fs.mkdirSync as jest.Mock).mockImplementation(() => {});
  });

  describe('initializeDatabase', () => {
    it('should initialize the database and collections', () => {
      const db = initializeDatabase();
      
      // Verify that the database was initialized
      expect(db).toBeDefined();
    });
  });

  describe('getUserByUsername', () => {
    it('should return null if user is not found', async () => {
      // Mock the users collection to return null
      const mockCollection = {
        findOne: jest.fn().mockReturnValue(null)
      };
      
      // Replace the internal collection with our mock
      (global as any).usersCollection = mockCollection;
      
      const result = await getUserByUsername('nonexistentuser');
      
      expect(result).toBeNull();
      expect(mockCollection.findOne).toHaveBeenCalledWith({ username: 'nonexistentuser' });
    });

    it('should return user if found', async () => {
      const mockUser = { id: 'user123', username: 'testuser', password: 'hashedpassword', role: 'user' };
      
      // Mock the users collection to return a user
      const mockCollection = {
        findOne: jest.fn().mockReturnValue(mockUser)
      };
      
      // Replace the internal collection with our mock
      (global as any).usersCollection = mockCollection;
      
      const result = await getUserByUsername('testuser');
      
      expect(result).toEqual(mockUser);
      expect(mockCollection.findOne).toHaveBeenCalledWith({ username: 'testuser' });
    });
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const mockUser = { username: 'newuser', password: 'hashedpassword', role: 'user' };
      
      // Mock the users collection
      const mockCollection = {
        insert: jest.fn().mockImplementation((user) => ({ ...user, id: 'generated_id' })),
        findOne: jest.fn().mockReturnValue(null)
      };
      
      // Replace the internal collection with our mock
      (global as any).usersCollection = mockCollection;
      
      const result = await createUser(mockUser.username, mockUser.password, mockUser.role);
      
      expect(result).toBeDefined();
      expect(result.id).toBe('generated_id');
      expect(result.username).toBe(mockUser.username);
      expect(result.role).toBe(mockUser.role);
      expect(mockCollection.insert).toHaveBeenCalled();
    });

    it('should throw an error if user already exists', async () => {
      const mockUser = { id: 'user123', username: 'existinguser', password: 'hashedpassword', role: 'user' };
      
      // Mock the users collection to return an existing user
      const mockCollection = {
        findOne: jest.fn().mockReturnValue(mockUser)
      };
      
      // Replace the internal collection with our mock
      (global as any).usersCollection = mockCollection;
      
      await expect(createUser(mockUser.username, mockUser.password, mockUser.role))
        .rejects
        .toThrow('User already exists');
      
      expect(mockCollection.findOne).toHaveBeenCalledWith({ username: mockUser.username });
    });
  });

  describe('getSettings', () => {
    it('should return settings', async () => {
      const mockSettings = { id: 'settings', theme: 'dark', language: 'en' };
      
      // Mock the settings collection
      const mockCollection = {
        findOne: jest.fn().mockReturnValue(mockSettings)
      };
      
      // Replace the internal collection with our mock
      (global as any).settingsCollection = mockCollection;
      
      const result = await getSettings();
      
      expect(result).toEqual(mockSettings);
      expect(mockCollection.findOne).toHaveBeenCalled();
    });
  });

  describe('updateSettings', () => {
    it('should update settings', async () => {
      const mockSettings = { id: 'settings', theme: 'light', language: 'fr' };
      
      // Mock the settings collection
      const mockCollection = {
        findOne: jest.fn().mockReturnValue({ id: 'settings', theme: 'dark', language: 'en' }),
        update: jest.fn().mockReturnValue(mockSettings)
      };
      
      // Replace the internal collection with our mock
      (global as any).settingsCollection = mockCollection;
      
      const result = await updateSettings(mockSettings);
      
      expect(result).toEqual(mockSettings);
      expect(mockCollection.update).toHaveBeenCalledWith(mockSettings);
    });
  });

  describe('logActivity', () => {
    it('should log activity', async () => {
      const mockActivity = { userId: 'user123', action: 'login', details: { ip: '127.0.0.1' } };
      
      // Mock the activity logs collection
      const mockCollection = {
        insert: jest.fn().mockImplementation((activity) => ({ ...activity, id: 'log_id', timestamp: expect.any(Date) }))
      };
      
      // Replace the internal collection with our mock
      (global as any).activityLogsCollection = mockCollection;
      
      const result = await logActivity(mockActivity.userId, mockActivity.action, mockActivity.details);
      
      expect(result).toBeDefined();
      expect(result.id).toBe('log_id');
      expect(result.userId).toBe(mockActivity.userId);
      expect(result.action).toBe(mockActivity.action);
      expect(result.details).toEqual(mockActivity.details);
      expect(result.timestamp).toBeDefined();
      expect(mockCollection.insert).toHaveBeenCalled();
    });

    it('should return logs when querying', async () => {
      const mockLogs = [
        { id: 'log1', userId: 'user123', action: 'login', timestamp: new Date(), details: {} },
        { id: 'log2', userId: 'user123', action: 'view_media', timestamp: new Date(), details: {} }
      ];
      
      // Mock the activity logs collection
      const mockCollection = {
        chain: jest.fn().mockReturnThis(),
        find: jest.fn().mockReturnThis(),
        simplesort: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        data: jest.fn().mockReturnValue(mockLogs)
      };
      
      // Replace the internal collection with our mock
      (global as any).activityLogsCollection = mockCollection;
      
      const result = await logActivity(null, null, null, { limit: 10, offset: 0 });
      
      expect(result).toEqual(mockLogs);
      expect(mockCollection.chain).toHaveBeenCalled();
      expect(mockCollection.find).toHaveBeenCalled();
      expect(mockCollection.simplesort).toHaveBeenCalled();
      expect(mockCollection.offset).toHaveBeenCalled();
      expect(mockCollection.limit).toHaveBeenCalled();
      expect(mockCollection.data).toHaveBeenCalled();
    });
  });
});