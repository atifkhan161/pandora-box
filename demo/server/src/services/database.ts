import Loki from 'lokijs';
import { logger } from '../utils/logger';

let db: Loki;
let users: Collection<any>;
let downloads: Collection<any>;
let settings: Collection<any>;
let activityLogs: Collection<any>;
let mediaCache: Collection<any>;

export function initializeDatabase() {
  const dbPath = process.env.DATABASE_PATH || './data/database.db';
  
  db = new Loki(dbPath, {
    autoload: true,
    autoloadCallback: initializeCollections,
    autosave: true,
    autosaveInterval: 10000,
    persistenceMethod: 'fs'
  });
}

function initializeCollections() {
  // Users collection
  users = db.getCollection('users') || db.addCollection('users', {
    unique: ['id', 'username'],
    indices: ['username', 'email']
  });

  // Downloads collection
  downloads = db.getCollection('downloads') || db.addCollection('downloads', {
    unique: ['id'],
    indices: ['status', 'userId', 'createdAt']
  });

  // Settings collection
  settings = db.getCollection('settings') || db.addCollection('settings', {
    unique: ['key'],
    indices: ['category']
  });

  // Activity logs collection
  activityLogs = db.getCollection('activityLogs') || db.addCollection('activityLogs', {
    indices: ['userId', 'action', 'timestamp']
  });

  // Media cache collection
  mediaCache = db.getCollection('mediaCache') || db.addCollection('mediaCache', {
    unique: ['id'],
    indices: ['type', 'category', 'createdAt']
  });

  // Create default admin user if not exists
  createDefaultUser();
  
  logger.info('Database collections initialized');
}

function createDefaultUser() {
  const existingAdmin = users.findOne({ username: 'admin' });
  
  if (!existingAdmin) {
    const bcrypt = require('bcryptjs');
    const defaultPassword = bcrypt.hashSync('admin123', 10);
    
    users.insert({
      id: 'admin',
      username: 'admin',
      email: 'admin@pandorabox.local',
      password: defaultPassword,
      role: 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    logger.info('Default admin user created');
  }
}

export function getDatabase() {
  return db;
}

export function getUsers() {
  return users;
}

export function getDownloads() {
  return downloads;
}

export function getSettings() {
  return settings;
}

export function getActivityLogs() {
  return activityLogs;
}

export function getMediaCache() {
  return mediaCache;
}
```

### src/types/api.ts
```typescript
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MediaItem {
  id: number;
  title: string;
  year: number;
  poster: string;
  rating: number;
  genre: string[];
  overview: string;
  category: string;
  type: 'movie' | 'tv';
}

export interface TorrentResult {
  title: string;
  magnetUrl: string;
  size: string;
  seeders: number;
  leechers: number;
  category: string;
  indexer: string;
}

export interface DownloadItem {
  id: string;
  name: string;
  progress: number;
  status: 'downloading' | 'completed' | 'paused' | 'error';
  speed: string;
  eta: string;
  size: string;
  seeders: number;
  leechers: number;
  addedAt: string;
  completedAt?: string;
}

export interface FileItem {
  name: string;
  type: 'file' | 'folder';
  path: string;
  size?: string;
  modified: string;
}

export interface ContainerInfo {
  id: string;
  name: string;
  image: string;
  status: 'running' | 'stopped' | 'error';
  uptime: string;
  cpu?: string;
  memory?: string;
  type?: 'container' | 'stack';
  services?: number;
  containers?: string[];
}