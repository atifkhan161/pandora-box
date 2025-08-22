// Database Model Interfaces for Pandora Box

export interface User {
  $loki?: number
  id: string
  username: string
  email: string
  password: string // bcrypt hashed
  role: 'admin' | 'team'
  createdAt: string
  updatedAt: string
  lastLogin?: string
  isActive: boolean
}

export interface Session {
  $loki?: number
  id: string
  userId: string
  token: string
  refreshToken: string
  expiresAt: string
  refreshExpiresAt: string
  rememberMe: boolean
  createdAt: string
  lastAccessedAt: string
  ipAddress: string
  userAgent: string
  isActive: boolean
}

export interface Setting {
  $loki?: number
  id: string
  key: string
  value: any
  category: 'api' | 'user' | 'system' | 'theme' | 'notification'
  encrypted: boolean
  userId?: string // null for global settings
  description?: string
  updatedAt: string
  createdAt: string
}

export interface Download {
  $loki?: number
  id: string
  userId: string
  name: string
  magnetUrl: string
  infoHash: string
  status: 'downloading' | 'completed' | 'paused' | 'error' | 'queued'
  progress: number
  speed: string
  eta: string
  size: string
  downloaded: string
  seeders: number
  leechers: number
  ratio: number
  category: 'movie' | 'tv' | 'other'
  quality?: string
  tmdbId?: string
  addedAt: string
  completedAt?: string
  errorMessage?: string
  savePath: string
}

export interface MediaCache {
  $loki?: number
  id: string
  type: 'trending' | 'popular' | 'search' | 'details' | 'availability'
  category: string
  query?: string
  data: any
  expiresAt: string
  createdAt: string
  updatedAt: string
}

export interface FileOperation {
  $loki?: number
  id: string
  userId: string
  operation: 'move' | 'copy' | 'delete' | 'rename' | 'create'
  sourcePath: string
  targetPath?: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  progress: number
  errorMessage?: string
  createdAt: string
  completedAt?: string
}

export interface ContainerLog {
  $loki?: number
  id: string
  containerId: string
  containerName: string
  action: 'start' | 'stop' | 'restart' | 'remove' | 'update'
  status: 'success' | 'failed'
  message?: string
  userId: string
  createdAt: string
}

export interface ApiLog {
  $loki?: number
  id: string
  service: string
  endpoint: string
  method: string
  statusCode: number
  duration: number
  cached: boolean
  userId?: string
  requestId: string
  errorMessage?: string
  createdAt: string
}

export interface Notification {
  $loki?: number
  id: string
  userId: string
  type: 'download' | 'system' | 'error' | 'info' | 'warning'
  title: string
  message: string
  data?: any
  read: boolean
  createdAt: string
  readAt?: string
  expiresAt?: string
}

export interface TorrentSearch {
  $loki?: number
  id: string
  userId: string
  query: string
  category: 'movie' | 'tv' | 'all'
  results: any[]
  indexers: string[]
  createdAt: string
}

export interface JellyfinScan {
  $loki?: number
  id: string
  userId: string
  libraryType: 'movies' | 'tv' | 'collections' | 'all'
  status: 'running' | 'completed' | 'failed'
  progress: number
  itemsAdded: number
  itemsUpdated: number
  startedAt: string
  completedAt?: string
  errorMessage?: string
}

// Database collection names
export const COLLECTIONS = {
  USERS: 'users',
  SESSIONS: 'sessions',
  SETTINGS: 'settings',
  DOWNLOADS: 'downloads',
  MEDIA_CACHE: 'media_cache',
  FILE_OPERATIONS: 'file_operations',
  CONTAINER_LOGS: 'container_logs',
  API_LOGS: 'api_logs',
  NOTIFICATIONS: 'notifications',
  TORRENT_SEARCHES: 'torrent_searches',
  JELLYFIN_SCANS: 'jellyfin_scans'
} as const

// Index configurations for collections
export const COLLECTION_INDEXES = {
  [COLLECTIONS.USERS]: ['username', 'email', 'role'],
  [COLLECTIONS.SESSIONS]: ['userId', 'token', 'expiresAt'],
  [COLLECTIONS.SETTINGS]: ['key', 'category', 'userId'],
  [COLLECTIONS.DOWNLOADS]: ['userId', 'status', 'category', 'addedAt'],
  [COLLECTIONS.MEDIA_CACHE]: ['type', 'category', 'expiresAt'],
  [COLLECTIONS.FILE_OPERATIONS]: ['userId', 'status', 'createdAt'],
  [COLLECTIONS.CONTAINER_LOGS]: ['containerId', 'userId', 'createdAt'],
  [COLLECTIONS.API_LOGS]: ['service', 'userId', 'createdAt'],
  [COLLECTIONS.NOTIFICATIONS]: ['userId', 'read', 'type', 'createdAt'],
  [COLLECTIONS.TORRENT_SEARCHES]: ['userId', 'query', 'createdAt'],
  [COLLECTIONS.JELLYFIN_SCANS]: ['userId', 'status', 'startedAt']
} as const

// Database query types
export interface QueryOptions {
  limit?: number
  offset?: number
  sort?: string
  order?: 'asc' | 'desc'
}

export interface UserQuery extends QueryOptions {
  role?: 'admin' | 'team'
  isActive?: boolean
}

export interface DownloadQuery extends QueryOptions {
  userId?: string
  status?: Download['status']
  category?: Download['category']
  dateFrom?: string
  dateTo?: string
}

export interface NotificationQuery extends QueryOptions {
  userId: string
  read?: boolean
  type?: Notification['type']
}

export interface MediaCacheQuery extends QueryOptions {
  type?: MediaCache['type']
  category?: string
  expired?: boolean
}

// Validation schemas
export interface UserCreateData {
  username: string
  email: string
  password: string
  role?: 'admin' | 'team'
}

export interface UserUpdateData {
  email?: string
  password?: string
  role?: 'admin' | 'team'
  isActive?: boolean
}

export interface DownloadCreateData {
  name: string
  magnetUrl: string
  infoHash: string
  category: 'movie' | 'tv' | 'other'
  quality?: string
  tmdbId?: string
  savePath: string
}

export interface SettingData {
  key: string
  value: any
  category: Setting['category']
  encrypted?: boolean
  userId?: string
  description?: string
}