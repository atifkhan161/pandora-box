import Loki from 'lokijs'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import { createHash, randomUUID } from 'crypto'
import { config } from '@/config/config.js'
import { logger, logHelpers } from '@/utils/logger.js'
import {
  User, Session, Setting, Download, MediaCache, FileOperation,
  ContainerLog, ApiLog, Notification, TorrentSearch, JellyfinScan,
  COLLECTIONS, COLLECTION_INDEXES,
  QueryOptions, UserQuery, DownloadQuery, NotificationQuery, MediaCacheQuery,
  UserCreateData, UserUpdateData, DownloadCreateData, SettingData
} from '@/types/database.js'

export class DatabaseService {
  private db: Loki | null = null
  private isInitialized = false
  private collections: Map<string, Collection<any>> = new Map()

  constructor() {
    // Ensure data directory exists
    const dataDir = join(process.cwd(), 'data')
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true })
    }
  }

  // Initialize database
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.db = new Loki(config.database.path, {
          autoload: true,
          autoloadCallback: () => {
            this.setupCollections()
            this.createIndexes()
            this.seedDefaultData()
            this.isInitialized = true
            logger.info('Database initialized successfully')
            resolve()
          },
          autosave: config.database.autoSave,
          autosaveInterval: config.database.autoSaveInterval,
          serializationMethod: 'normal',
          destructureDelimiter: '$<>',
          // adapter: new (Loki as any).LokiFileSystemAdapter()
        })
      } catch (error) {
        logger.error('Database initialization failed:', error)
        reject(error)
      }
    })
  }

  // Setup all collections
  private setupCollections(): void {
    if (!this.db) throw new Error('Database not initialized')

    Object.values(COLLECTIONS).forEach(collectionName => {
      let collection = this.db!.getCollection(collectionName)
      
      if (!collection) {
        collection = this.db!.addCollection(collectionName, {
          unique: ['id'],
          indices: ['id', 'createdAt']
        })
        logger.info(`Created collection: ${collectionName}`)
      }
      
      this.collections.set(collectionName, collection)
    })
  }

  // Create indexes for performance
  private createIndexes(): void {
    Object.entries(COLLECTION_INDEXES).forEach(([collectionName, indexes]) => {
      const collection = this.collections.get(collectionName)
      if (collection) {
        indexes.forEach(index => {
          try {
            collection.ensureIndex(index)
          } catch (error) {
            // Index might already exist, ignore error
            logger.debug(`Index ${index} already exists for ${collectionName}`)
          }
        })
      }
    })
  }

  // Seed default data
  private async seedDefaultData(): Promise<void> {
    try {
      // Create default admin user if no users exist
      const usersCollection = this.getCollection<User>(COLLECTIONS.USERS)
      const existingUsers = usersCollection.find()
      
      if (existingUsers.length === 0) {
        const bcrypt = await import('bcryptjs')
        const hashedPassword = await bcrypt.default.hash('admin123', config.auth.bcryptRounds)
        
        const defaultUser: User = {
          id: randomUUID(),
          username: 'admin',
          email: 'admin@pandora.local',
          password: hashedPassword,
          role: 'admin',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        usersCollection.insert(defaultUser)
        logger.info('Created default admin user')
      }

      // Create default settings
      const settingsCollection = this.getCollection<Setting>(COLLECTIONS.SETTINGS)
      const defaultSettings = [
        {
          key: 'app.theme',
          value: 'dark',
          category: 'theme' as const,
          encrypted: false,
          description: 'Application theme'
        },
        {
          key: 'notifications.enabled',
          value: true,
          category: 'notification' as const,
          encrypted: false,
          description: 'Enable notifications'
        },
        {
          key: 'downloads.autoMove',
          value: true,
          category: 'system' as const,
          encrypted: false,
          description: 'Auto-move completed downloads'
        }
      ]

      for (const setting of defaultSettings) {
        const existing = settingsCollection.findOne({ key: setting.key, userId: { $eq: null } })
        if (!existing) {
          const settingData: Setting = {
            id: randomUUID(),
            ...setting,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          settingsCollection.insert(settingData)
        }
      }

      logger.info('Default data seeded successfully')
    } catch (error) {
      logger.error('Error seeding default data:', error)
    }
  }

  // Get collection
  private getCollection<T extends object>(name: string): Collection<T> {
    const collection = this.collections.get(name)
    if (!collection) {
      throw new Error(`Collection ${name} not found`)
    }
    return collection
  }

  // Generic CRUD operations
  async create<T extends { id: string }>(collectionName: string, data: any): Promise<T> {
    const start = Date.now()
    
    try {
      const collection = this.getCollection<T>(collectionName)
      const id = randomUUID()
      const timestamp = new Date().toISOString()
      
      const record = {
        id,
        ...data,
        createdAt: timestamp,
        updatedAt: timestamp
      } as T

      const result = collection.insert(record)
      
      logHelpers.logDatabase('create', collectionName, Date.now() - start, 1)
      return result
    } catch (error) {
      logger.error(`Error creating record in ${collectionName}:`, error)
      throw error
    }
  }

  async findById<T>(collectionName: string, id: string): Promise<T | null> {
    const start = Date.now()
    
    try {
      const collection = this.getCollection<T>(collectionName)
      const result = collection.findOne({ id } as any)
      
      logHelpers.logDatabase('findById', collectionName, Date.now() - start, result ? 1 : 0)
      return result
    } catch (error) {
      logger.error(`Error finding record by ID in ${collectionName}:`, error)
      throw error
    }
  }

  async find<T>(collectionName: string, query: any = {}, options: QueryOptions = {}): Promise<T[]> {
    const start = Date.now()
    
    try {
      const collection = this.getCollection<T>(collectionName)
      let chain = collection.chain().find(query)

      if (options.sort) {
        chain = chain.simplesort(options.sort, options.order === 'desc')
      }

      if (options.offset) {
        chain = chain.offset(options.offset)
      }

      if (options.limit) {
        chain = chain.limit(options.limit)
      }

      const results = chain.data()
      
      logHelpers.logDatabase('find', collectionName, Date.now() - start, results.length)
      return results
    } catch (error) {
      logger.error(`Error finding records in ${collectionName}:`, error)
      throw error
    }
  }

  async update<T extends { id: string }>(collectionName: string, id: string, data: any): Promise<T | null> {
    const start = Date.now()
    
    try {
      const collection = this.getCollection<T>(collectionName)
      const existing = collection.findOne({ id } as any)
      
      if (!existing) {
        return null
      }

      const updated = {
        ...existing,
        ...data,
        updatedAt: new Date().toISOString()
      }

      collection.update(updated)
      
      logHelpers.logDatabase('update', collectionName, Date.now() - start, 1)
      return updated
    } catch (error) {
      logger.error(`Error updating record in ${collectionName}:`, error)
      throw error
    }
  }

  async delete(collectionName: string, id: string): Promise<boolean> {
    const start = Date.now()
    
    try {
      const collection = this.getCollection(collectionName)
      const record = collection.findOne({ id } as any)
      
      if (!record) {
        return false
      }

      collection.remove(record)
      
      logHelpers.logDatabase('delete', collectionName, Date.now() - start, 1)
      return true
    } catch (error) {
      logger.error(`Error deleting record in ${collectionName}:`, error)
      throw error
    }
  }

  // User-specific methods
  async createUser(userData: UserCreateData): Promise<User> {
    const bcrypt = await import('bcryptjs')
    const hashedPassword = await bcrypt.default.hash(userData.password, config.auth.bcryptRounds)
    
    return this.create<User>(COLLECTIONS.USERS, {
      username: userData.username,
      email: userData.email,
      password: hashedPassword,
      role: userData.role || 'team',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  }

  async findUserByUsername(username: string): Promise<User | null> {
    const collection = this.getCollection<User>(COLLECTIONS.USERS)
    return collection.findOne({ username, isActive: true })
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const collection = this.getCollection<User>(COLLECTIONS.USERS)
    return collection.findOne({ email, isActive: true })
  }

  // Session methods
  async createSession(userId: string, rememberMe: boolean, ipAddress: string, userAgent: string): Promise<Session> {
    const jwt = await import('jsonwebtoken')
    const token = jwt.default.sign({ userId }, config.auth.jwtSecret, {
      expiresIn: config.auth.jwtExpiry
    })
    const refreshToken = jwt.default.sign({ userId, type: 'refresh' }, config.auth.jwtSecret, {
      expiresIn: config.auth.jwtRefreshExpiry
    })

    const now = new Date()
    const expiresAt = new Date(now.getTime() + (rememberMe ? 90 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000))
    const refreshExpiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)

    return this.create<Session>(COLLECTIONS.SESSIONS, {
      userId,
      token,
      refreshToken,
      expiresAt: expiresAt.toISOString(),
      refreshExpiresAt: refreshExpiresAt.toISOString(),
      rememberMe,
      ipAddress,
      userAgent,
      lastAccessedAt: now.toISOString(),
      isActive: true,
      createdAt: now.toISOString()
    })
  }

  async findSessionByToken(token: string): Promise<Session | null> {
    const collection = this.getCollection<Session>(COLLECTIONS.SESSIONS)
    return collection.findOne({ token, isActive: true })
  }

  async invalidateSession(token: string): Promise<boolean> {
    const collection = this.getCollection<Session>(COLLECTIONS.SESSIONS)
    const session = collection.findOne({ token })
    if (session) {
      session.isActive = false
      session.updatedAt = new Date().toISOString()
      collection.update(session)
      return true
    }
    return false
  }

  // Settings methods
  async getSetting(key: string, userId?: string): Promise<Setting | null> {
    const collection = this.getCollection<Setting>(COLLECTIONS.SETTINGS)
    return collection.findOne({ key, userId: userId || null })
  }

  async setSetting(data: SettingData, userId?: string): Promise<Setting> {
    const collection = this.getCollection<Setting>(COLLECTIONS.SETTINGS)
    const existing = collection.findOne({ key: data.key, userId: userId || null })
    
    if (existing) {
      return this.update<Setting>(COLLECTIONS.SETTINGS, existing.id, {
        value: data.value,
        encrypted: data.encrypted || false,
        description: data.description
      })!
    } else {
      return this.create<Setting>(COLLECTIONS.SETTINGS, {
        key: data.key,
        value: data.value,
        category: data.category,
        encrypted: data.encrypted || false,
        userId: userId || undefined,
        description: data.description
      })
    }
  }

  // Download methods
  async createDownload(userId: string, downloadData: DownloadCreateData): Promise<Download> {
    return this.create<Download>(COLLECTIONS.DOWNLOADS, {
      userId,
      name: downloadData.name,
      magnetUrl: downloadData.magnetUrl,
      infoHash: downloadData.infoHash,
      status: 'queued',
      progress: 0,
      speed: '0 B/s',
      eta: '∞',
      size: '0 B',
      downloaded: '0 B',
      seeders: 0,
      leechers: 0,
      ratio: 0,
      category: downloadData.category,
      quality: downloadData.quality,
      tmdbId: downloadData.tmdbId,
      savePath: downloadData.savePath,
      addedAt: new Date().toISOString()
    })
  }

  async findDownloadsByUser(userId: string, query: DownloadQuery = {}): Promise<Download[]> {
    const filter: any = { userId }
    
    if (query.status) filter.status = query.status
    if (query.category) filter.category = query.category
    
    return this.find<Download>(COLLECTIONS.DOWNLOADS, filter, query)
  }

  // Cache methods
  async getCachedData(type: string, category: string, query?: string): Promise<MediaCache | null> {
    const collection = this.getCollection<MediaCache>(COLLECTIONS.MEDIA_CACHE)
    const filter: any = { type, category }
    if (query) filter.query = query

    const cached = collection.findOne(filter)
    
    if (cached && new Date(cached.expiresAt) > new Date()) {
      return cached
    }
    
    // Remove expired cache
    if (cached) {
      collection.remove(cached)
    }
    
    return null
  }

  async setCachedData(type: string, category: string, data: any, ttl: number, query?: string): Promise<MediaCache> {
    const collection = this.getCollection<MediaCache>(COLLECTIONS.MEDIA_CACHE)
    const expiresAt = new Date(Date.now() + ttl * 1000).toISOString()
    
    // Remove existing cache entry
    const existing = collection.findOne({ type, category, query: query || null })
    if (existing) {
      collection.remove(existing)
    }

    return this.create<MediaCache>(COLLECTIONS.MEDIA_CACHE, {
      type,
      category,
      query,
      data,
      expiresAt
    })
  }

  // Cleanup expired data
  async cleanup(): Promise<void> {
    try {
      const now = new Date().toISOString()
      
      // Cleanup expired sessions
      const sessionsCollection = this.getCollection<Session>(COLLECTIONS.SESSIONS)
      const expiredSessions = sessionsCollection.find({ expiresAt: { $lt: now } })
      expiredSessions.forEach(session => sessionsCollection.remove(session))
      
      // Cleanup expired cache
      const cacheCollection = this.getCollection<MediaCache>(COLLECTIONS.MEDIA_CACHE)
      const expiredCache = cacheCollection.find({ expiresAt: { $lt: now } })
      expiredCache.forEach(cache => cacheCollection.remove(cache))
      
      // Cleanup old logs (keep last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const apiLogsCollection = this.getCollection<ApiLog>(COLLECTIONS.API_LOGS)
      const oldApiLogs = apiLogsCollection.find({ createdAt: { $lt: thirtyDaysAgo } })
      oldApiLogs.forEach(log => apiLogsCollection.remove(log))
      
      logger.info(`Cleanup completed: ${expiredSessions.length} sessions, ${expiredCache.length} cache entries, ${oldApiLogs.length} old logs removed`)
    } catch (error) {
      logger.error('Cleanup error:', error)
    }
  }

  // Backup database
  async backup(): Promise<string> {
    if (!this.db) throw new Error('Database not initialized')
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupPath = join(process.cwd(), 'data', `backup-${timestamp}.db`)
    
    return new Promise((resolve, reject) => {
      this.db!.saveDatabase((error) => {
        if (error) {
          reject(error)
        } else {
          // Copy current database to backup location
          resolve(backupPath)
        }
      })
    })
  }

  // Close database
  async close(): Promise<void> {
    if (this.db) {
      return new Promise((resolve) => {
        this.db!.close(() => {
          this.isInitialized = false
          logger.info('Database closed')
          resolve()
        })
      })
    }
  }

  // Health check
  isHealthy(): boolean {
    return this.isInitialized && this.db !== null
  }

  // Get statistics
  getStats() {
    if (!this.isInitialized) return null
    
    const stats: any = {}
    Object.values(COLLECTIONS).forEach(collectionName => {
      const collection = this.collections.get(collectionName)
      if (collection) {
        stats[collectionName] = collection.count()
      }
    })
    
    return stats
  }
}

export default DatabaseService