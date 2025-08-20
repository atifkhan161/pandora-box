import Loki, { Collection } from 'lokijs';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// Define collection types
export interface User {
  id: string;
  username: string;
  password: string;
  email?: string;
  role: 'admin' | 'user';
  createdAt: Date;
  lastLogin?: Date;
}

export interface Download {
  id: string;
  hash?: string;
  name?: string;
  title?: string;
  url?: string;
  mediaId?: string;
  mediaType?: string;
  status: 'downloading' | 'seeding' | 'completed' | 'error' | 'paused' | 'deleted';
  progress?: number;
  size?: number;
  downloadSpeed?: number;
  uploadSpeed?: number;
  eta?: number;
  path?: string;
  userId?: string;
  addedBy?: string;
  createdAt: Date;
  addedAt?: Date;
  completedAt?: Date;
}

export interface Setting {
  key: string;
  value: string;
  category: string;
  encrypted: boolean;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  details?: any;
  timestamp: Date;
}

export interface MediaCacheItem {
  id: string;
  tmdbId?: number;
  type: 'movie' | 'tv' | 'person';
  mediaType?: string;
  seasonNumber?: number;
  category: 'trending' | 'popular' | 'top_rated' | 'upcoming' | 'search';
  data: any;
  createdAt: Date;
  expiresAt: Date;
  cachedAt?: Date;
}

// Database and collections
let db: Loki;
let users: Collection<User>;
let downloads: Collection<Download>;
let settings: Collection<Setting>;
let activityLogs: Collection<ActivityLog>;
let mediaCache: Collection<MediaCacheItem>;

/**
 * Initialize the LokiJS database and collections
 */
export function initializeDatabase(): void {
  const dbPath = process.env.DATABASE_PATH || './data/database.db';
  
  db = new Loki(dbPath, {
    autoload: true,
    autoloadCallback: initializeCollections,
    autosave: true,
    autosaveInterval: 10000, // Save every 10 seconds
    persistenceMethod: 'fs'
  });
}

/**
 * Initialize collections and create default data if needed
 */
function initializeCollections(): void {
  // Users collection
  users = db.getCollection<User>('users');
  if (!users) {
    users = db.addCollection<User>('users', {
      unique: ['id', 'username'],
      indices: ['username', 'email', 'role']
    });
    // Create default admin user
    createDefaultAdmin();
  }

  // Downloads collection
  downloads = db.getCollection<Download>('downloads');
  if (!downloads) {
    downloads = db.addCollection<Download>('downloads', {
      unique: ['id', 'hash'],
      indices: ['status', 'userId', 'createdAt']
    });
  }

  // Settings collection
  settings = db.getCollection<Setting>('settings');
  if (!settings) {
    settings = db.addCollection<Setting>('settings', {
      unique: ['key'],
      indices: ['category', 'encrypted']
    });
    // Initialize default settings
    initializeDefaultSettings();
  }

  // Activity logs collection
  activityLogs = db.getCollection<ActivityLog>('activityLogs');
  if (!activityLogs) {
    activityLogs = db.addCollection<ActivityLog>('activityLogs', {
      indices: ['userId', 'action', 'timestamp']
    });
  }

  // Media cache collection
  mediaCache = db.getCollection<MediaCacheItem>('mediaCache');
  if (!mediaCache) {
    mediaCache = db.addCollection<MediaCacheItem>('mediaCache', {
      unique: ['id'],
      indices: ['type', 'category', 'createdAt', 'expiresAt']
    });
  }

  console.log('Database initialized successfully');
}

/**
 * Create default admin user if it doesn't exist
 */
function createDefaultAdmin(): void {
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  
  users.insert({
    id: uuidv4(),
    username: 'admin',
    password: hashedPassword,
    role: 'admin',
    createdAt: new Date()
  });

  console.log('Default admin user created');
}

/**
 * Initialize default settings
 */
function initializeDefaultSettings(): void {
  const defaultSettings: Setting[] = [
    { key: 'app_name', value: 'Pandora Box', category: 'general', encrypted: false },
    { key: 'theme', value: 'dark', category: 'ui', encrypted: false },
    { key: 'session_timeout', value: '86400', category: 'security', encrypted: false }, // 24 hours in seconds
  ];

  defaultSettings.forEach(setting => settings.insert(setting));
  console.log('Default settings initialized');
}

// Export database collections for use in other modules
export function getUsers(): Collection<User> {
  return users;
}

export function getDownloads(): Collection<Download> {
  return downloads;
}

export function getSettings(): Collection<Setting> {
  return settings;
}

export function getActivityLogs(): Collection<ActivityLog> {
  return activityLogs;
}

export function getMediaCache(): Collection<MediaCacheItem> {
  return mediaCache;
}

/**
 * Add an activity log entry
 */
export function logActivity(userId: string, action: string, details?: any): void {
  activityLogs.insert({
    id: uuidv4(),
    userId,
    action,
    details,
    timestamp: new Date()
  });
}

/**
 * Clean up expired media cache items
 */
export function cleanupMediaCache(): void {
  const now = new Date();
  const expiredItems = mediaCache.find({ expiresAt: { $lt: now } });
  
  expiredItems.forEach(item => mediaCache.remove(item));
  console.log(`Cleaned up ${expiredItems.length} expired media cache items`);
}

/**
 * Get user by username
 */
export function getUserByUsername(username: string): User | null {
  return users.findOne({ username });
}

/**
 * Create a new user
 */
export function createUser(userData: Omit<User, 'id' | 'createdAt'>): User {
  const user: User = {
    id: uuidv4(),
    ...userData,
    createdAt: new Date()
  };
  return users.insert(user);
}

/**
 * Update settings
 */
export function updateSettings(key: string, value: string): void {
  const setting = settings.findOne({ key });
  if (setting) {
    setting.value = value;
    settings.update(setting);
  } else {
    settings.insert({ key, value, category: 'general', encrypted: false });
  }
}

/**
 * Add download history
 */
export function addDownloadHistory(downloadData: Omit<Download, 'id' | 'createdAt'>): Download {
  const download: Download = {
    id: uuidv4(),
    ...downloadData,
    createdAt: new Date()
  };
  return downloads.insert(download);
}

// Set up a periodic cleanup task for media cache
setInterval(cleanupMediaCache, 3600000); // Run every hour