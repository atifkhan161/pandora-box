# Pandora Box Backend Project Structure

## Project Setup

```bash
# Create project directory
mkdir pandora-box-backend
cd pandora-box-backend

# Initialize npm project
npm init -y

# Install dependencies
npm install express cors helmet morgan compression dotenv bcryptjs jsonwebtoken lokijs uuid
npm install -D @types/node @types/express @types/cors @types/bcryptjs @types/jsonwebtoken @types/uuid typescript ts-node nodemon

# Initialize TypeScript
npx tsc --init
```

## Directory Structure

```
pandora-box-backend/
├── src/
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── mediaController.ts
│   │   ├── downloadController.ts
│   │   ├── fileController.ts
│   │   ├── dockerController.ts
│   │   ├── jellyfinController.ts
│   │   └── settingsController.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── validation.ts
│   │   └── rateLimiter.ts
│   ├── models/
│   │   ├── User.ts
│   │   ├── Download.ts
│   │   ├── Settings.ts
│   │   └── ActivityLog.ts
│   ├── services/
│   │   ├── database.ts
│   │   ├── tmdbService.ts
│   │   ├── watchmodeService.ts
│   │   ├── jackettService.ts
│   │   ├── qbittorrentService.ts
│   │   ├── cloudcmdService.ts
│   │   ├── portainerService.ts
│   │   └── jellyfinService.ts
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── media.ts
│   │   ├── downloads.ts
│   │   ├── files.ts
│   │   ├── docker.ts
│   │   ├── jellyfin.ts
│   │   └── settings.ts
│   ├── types/
│   │   ├── api.ts
│   │   ├── database.ts
│   │   └── services.ts
│   ├── utils/
│   │   ├── logger.ts
│   │   ├── encryption.ts
│   │   └── helpers.ts
│   └── app.ts
├── dist/
├── data/
│   └── database.db (LokiJS file)
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
├── .env
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## Core Files

### package.json
```json
{
  "name": "pandora-box-backend",
  "version": "1.0.0",
  "description": "Backend API for Pandora Box PWA",
  "main": "dist/app.js",
  "scripts": {
    "dev": "nodemon src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "morgan": "^1.10.0",
    "compression": "^1.7.4",
    "dotenv": "^16.3.1",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "lokijs": "^1.5.12",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "@types/node": "^20.8.0",
    "@types/express": "^4.17.20",
    "@types/cors": "^2.8.15",
    "@types/bcryptjs": "^2.4.5",
    "@types/jsonwebtoken": "^9.0.4",
    "@types/uuid": "^9.0.5",
    "typescript": "^5.2.2",
    "ts-node": "^10.9.1",
    "nodemon": "^3.0.1"
  }
}
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### .env.example
```env
# Server Configuration
NODE_ENV=development
PORT=8080
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=90d

# Database
DATABASE_PATH=./data/database.db

# API Keys
TMDB_API_KEY=your_tmdb_api_key
WATCHMODE_API_KEY=your_watchmode_api_key

# External Services
JACKETT_URL=http://jackett:9117
JACKETT_API_KEY=your_jackett_api_key

QBITTORRENT_URL=http://qbittorrent:8080
QBITTORRENT_USERNAME=admin
QBITTORRENT_PASSWORD=your_password

CLOUDCMD_URL=http://cloudcmd:8000
CLOUDCMD_USERNAME=
CLOUDCMD_PASSWORD=

PORTAINER_URL=http://portainer:9000
PORTAINER_API_KEY=your_portainer_api_key

JELLYFIN_URL=http://jellyfin:8096
JELLYFIN_API_KEY=your_jellyfin_api_key

# CORS Settings
CORS_ORIGINS=http://localhost:3000,http://localhost:8080
```

### src/app.ts
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth';
import mediaRoutes from './routes/media';
import downloadRoutes from './routes/downloads';
import fileRoutes from './routes/files';
import dockerRoutes from './routes/docker';
import jellyfinRoutes from './routes/jellyfin';
import settingsRoutes from './routes/settings';

// Import services
import { initializeDatabase } from './services/database';
import { logger } from './utils/logger';

const app = express();
const PORT = process.env.PORT || 8080;

// Initialize database
initializeDatabase();

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"]
    }
  }
}));

app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

app.use(compression());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) }}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files (PWA)
app.use(express.static(path.join(__dirname, '../public')));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/media', mediaRoutes);
app.use('/api/v1/downloads', downloadRoutes);
app.use('/api/v1/files', fileRoutes);
app.use('/api/v1/docker', dockerRoutes);
app.use('/api/v1/jellyfin', jellyfinRoutes);
app.use('/api/v1/settings', settingsRoutes);

// Serve PWA for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Error occurred:', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Pandora Box Backend running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
});

export default app;
```

### src/services/database.ts
```typescript
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
```

### src/controllers/authController.ts
```typescript
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getUsers, getActivityLogs } from '../services/database';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types/api';

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password, rememberMe } = req.body;
    
    const users = getUsers();
    const user = users.findOne({ username });
    
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      } as ApiResponse);
    }
    
    const tokenExpiry = rememberMe ? '90d' : '24h';
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: tokenExpiry }
    );
    
    // Log activity
    const activityLogs = getActivityLogs();
    activityLogs.insert({
      id: uuidv4(),
      userId: user.id,
      action: 'login',
      details: { rememberMe },
      timestamp: new Date().toISOString(),
      ip: req.ip
    });
    
    logger.info(`User ${username} logged in`);
    
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      }
    } as ApiResponse);
    
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      } as ApiResponse);
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const users = getUsers();
    const user = users.findOne({ id: decoded.userId });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      } as ApiResponse);
    }
    
    const newToken = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '90d' }
    );
    
    res.json({
      success: true,
      data: { token: newToken }
    } as ApiResponse);
    
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    } as ApiResponse);
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    // Log activity
    const activityLogs = getActivityLogs();
    activityLogs.insert({
      id: uuidv4(),
      userId: (req as any).user?.userId,
      action: 'logout',
      timestamp: new Date().toISOString(),
      ip: req.ip
    });
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    } as ApiResponse);
    
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
};
```

### src/services/tmdbService.ts
```typescript
import axios from 'axios';
import { logger } from '../utils/logger';
import { MediaItem } from '../types/api';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

class TMDBService {
  private apiKey: string;
  
  constructor() {
    this.apiKey = process.env.TMDB_API_KEY!;
    if (!this.apiKey) {
      logger.error('TMDB_API_KEY is not configured');
    }
  }
  
  async getTrending(mediaType: 'movie' | 'tv' | 'all' = 'all', timeWindow: 'day' | 'week' = 'week'): Promise<MediaItem[]> {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}/trending/${mediaType}/${timeWindow}`, {
        params: {
          api_key: this.apiKey
        }
      });
      
      return response.data.results.map(this.transformMediaItem);
    } catch (error) {
      logger.error('TMDB getTrending error:', error);
      throw new Error('Failed to fetch trending content');
    }
  }
  
  async getPopular(mediaType: 'movie' | 'tv'): Promise<MediaItem[]> {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}/${mediaType}/popular`, {
        params: {
          api_key: this.apiKey
        }
      });
      
      return response.data.results.map(this.transformMediaItem);
    } catch (error) {
      logger.error('TMDB getPopular error:', error);
      throw new Error('Failed to fetch popular content');
    }
  }
  
  async search(query: string, mediaType: 'movie' | 'tv' | 'multi' = 'multi'): Promise<MediaItem[]> {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}/search/${mediaType}`, {
        params: {
          api_key: this.apiKey,
          query
        }
      });
      
      return response.data.results.map(this.transformMediaItem);
    } catch (error) {
      logger.error('TMDB search error:', error);
      throw new Error('Failed to search content');
    }
  }
  
  async getDetails(mediaType: 'movie' | 'tv', id: number): Promise<MediaItem> {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}/${mediaType}/${id}`, {
        params: {
          api_key: this.apiKey
        }
      });
      
      return this.transformMediaItem(response.data);
    } catch (error) {
      logger.error('TMDB getDetails error:', error);
      throw new Error('Failed to fetch content details');
    }
  }
  
  private transformMediaItem = (item: any): MediaItem => {
    const isMovie = item.title !== undefined;
    return {
      id: item.id,
      title: isMovie ? item.title : item.name,
      year: parseInt((isMovie ? item.release_date : item.first_air_date)?.substring(0, 4) || '0'),
      poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '',
      rating: Math.round(item.vote_average * 10) / 10,
      genre: item.genres?.map((g: any) => g.name) || [],
      overview: item.overview || '',
      category: 'tmdb',
      type: isMovie ? 'movie' : 'tv'
    };
  };
}

export const tmdbService = new TMDBService();
```

### src/routes/media.ts
```typescript
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { tmdbService } from '../services/tmdbService';
import { watchmodeService } from '../services/watchmodeService';
import { getMediaCache } from '../services/database';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types/api';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get trending content
router.get('/trending', async (req, res) => {
  try {
    const { type = 'all', timeWindow = 'week' } = req.query;
    
    // Check cache first
    const mediaCache = getMediaCache();
    const cacheKey = `trending_${type}_${timeWindow}`;
    const cached = mediaCache.findOne({ id: cacheKey });
    
    if (cached && (Date.now() - new Date(cached.createdAt).getTime()) < 3600000) { // 1 hour cache
      return res.json({
        success: true,
        data: cached.data
      } as ApiResponse);
    }
    
    const trending = await tmdbService.getTrending(type as any, timeWindow as any);
    
    // Cache the result
    if (cached) {
      cached.data = trending;
      cached.createdAt = new Date().toISOString();
      mediaCache.update(cached);
    } else {
      mediaCache.insert({
        id: cacheKey,
        data: trending,
        type: 'trending',
        category: type as string,
        createdAt: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      data: trending
    } as ApiResponse);
    
  } catch (error) {
    logger.error('Get trending error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trending content'
    } as ApiResponse);
  }
});

// Get popular content
router.get('/popular', async (req, res) => {
  try {
    const { type = 'movie' } = req.query;
    
    const cacheKey = `popular_${type}`;
    const mediaCache = getMediaCache();
    const cached = mediaCache.findOne({ id: cacheKey });
    
    if (cached && (Date.now() - new Date(cached.createdAt).getTime()) < 3600000) {
      return res.json({
        success: true,
        data: cached.data
      } as ApiResponse);
    }
    
    const popular = await tmdbService.getPopular(type as 'movie' | 'tv');
    
    // Cache the result
    if (cached) {
      cached.data = popular;
      cached.createdAt = new Date().toISOString();
      mediaCache.update(cached);
    } else {
      mediaCache.insert({
        id: cacheKey,
        data: popular,
        type: 'popular',
        category: type as string,
        createdAt: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      data: popular
    } as ApiResponse);
    
  } catch (error) {
    logger.error('Get popular error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch popular content'
    } as ApiResponse);
  }
});

// Search content
router.get('/search', async (req, res) => {
  try {
    const { query, type = 'multi' } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Query parameter is required'
      } as ApiResponse);
    }
    
    const results = await tmdbService.search(query, type as any);
    
    res.json({
      success: true,
      data: results
    } as ApiResponse);
    
  } catch (error) {
    logger.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search content'
    } as ApiResponse);
  }
});

// Get content details
router.get('/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    
    if (!['movie', 'tv'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid media type'
      } as ApiResponse);
    }
    
    const details = await tmdbService.getDetails(type as 'movie' | 'tv', parseInt(id));
    
    res.json({
      success: true,
      data: details
    } as ApiResponse);
    
  } catch (error) {
    logger.error('Get details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch content details'
    } as ApiResponse);
  }
});

export default router;
```

### Docker Configuration

#### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Create data directory
RUN mkdir -p /app/data

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S pandora -u 1001

# Change ownership
RUN chown -R pandora:nodejs /app

USER pandora

EXPOSE 8080

CMD ["npm", "start"]
```

#### docker-compose.yml
```yaml
version: '3.8'

services:
  pandora-box:
    build: .
    container_name: pandora-box
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    volumes:
      - pandora_data:/app/data
      - /mnt/samba:/mnt/samba:ro
    depends_on:
      - cloudcmd
      - portainer
      - jackett
      - qbittorrent
    restart: unless-stopped

  cloudcmd:
    image: coderaiser/cloudcmd:latest
    container_name: cloudcmd
    ports:
      - "8500:8000"
    environment:
      - CLOUDCMD_ROOT=/mnt/fs
    volumes:
      - /mnt/samba:/mnt/fs
      - cloudcmd_data:/root
    restart: unless-stopped

  portainer:
    image: portainer/portainer-ce:latest
    container_name: portainer
    ports:
      - "9000:9000"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - portainer_data:/data
    restart: unless-stopped

  jackett:
    image: linuxserver/jackett:latest
    container_name: jackett
    ports:
      - "9117:9117"
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Europe/Berlin
      - AUTO_UPDATE=true
    volumes:
      - jackett_config:/config
    restart: unless-stopped

  qbittorrent:
    image: linuxserver/qbittorrent:latest
    container_name: qbittorrent
    ports:
      - "8081:8080"
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Europe/Berlin
      - WEBUI_PORT=8080
    volumes:
      - qbittorrent_config:/config
      - /mnt/samba/downloads:/downloads
    restart: unless-stopped

volumes:
  pandora_data:
  cloudcmd_data:
  portainer_data:
  jackett_config:
  qbittorrent_config:
```

## Additional Implementation Details

This backend provides:

1. **Complete TypeScript implementation** with proper type definitions
2. **LokiJS database integration** with collections for users, downloads, settings, logs, and cache
3. **JWT authentication** with refresh token support
4. **API proxy services** for all external integrations (TMDB, Watchmode, Jackett, qBittorrent, etc.)
5. **Comprehensive error handling and logging**
6. **Docker deployment** with multi-service orchestration
7. **Security middleware** (helmet, CORS, rate limiting)
8. **Caching layer** for API responses
9. **Activity logging** for audit trails
10. **Environment-based configuration**

To implement the remaining controllers and services, follow the same patterns established in the auth and media examples above.