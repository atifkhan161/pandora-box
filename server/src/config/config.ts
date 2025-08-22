import { config as dotenvConfig } from 'dotenv'
import { join } from 'path'

// Load environment variables
dotenvConfig()

// Configuration interface
export interface Config {
  server: {
    port: number
    host: string
    env: string
  }
  database: {
    path: string
    autoSave: boolean
    autoSaveInterval: number
  }
  auth: {
    jwtSecret: string
    jwtExpiry: string
    jwtRefreshExpiry: string
    bcryptRounds: number
  }
  websocket: {
    port: number
    heartbeatInterval: number
  }
  rateLimit: {
    windowMs: number
    max: number
  }
  cors: {
    origins: string[]
  }
  logging: {
    level: string
    file: string
  }
  cache: {
    ttlTrending: number
    ttlSearch: number
    ttlDetails: number
    ttlAvailability: number
  }
  apis: {
    tmdb: {
      apiKey: string
      baseUrl: string
    }
    watchmode: {
      apiKey: string
      baseUrl: string
    }
    jackett: {
      url: string
      apiKey: string
    }
    qbittorrent: {
      url: string
      username: string
      password: string
    }
    cloudCommander: {
      url: string
      username: string
      password: string
    }
    portainer: {
      url: string
      apiKey: string
    }
    jellyfin: {
      url: string
      apiKey: string
    }
  }
  paths: {
    downloads: string
    movies: string
    tvShows: string
  }
  notifications: {
    enabled: boolean
    sound: boolean
  }
}

// Default configuration
const defaultConfig: Config = {
  server: {
    port: parseInt(process.env.PORT || '8080'),
    host: process.env.HOST || '0.0.0.0',
    env: process.env.NODE_ENV || 'development'
  },
  database: {
    path: process.env.DB_PATH || './data/pandora.db',
    autoSave: process.env.DB_AUTO_SAVE === 'true',
    autoSaveInterval: parseInt(process.env.DB_AUTO_SAVE_INTERVAL || '5000')
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
    jwtExpiry: process.env.JWT_EXPIRY || '24h',
    jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY || '90d',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12')
  },
  websocket: {
    port: parseInt(process.env.WS_PORT || '8081'),
    heartbeatInterval: parseInt(process.env.WS_HEARTBEAT_INTERVAL || '30000')
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '15') * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100')
  },
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:8080',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:8080'
    ]
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/pandora.log'
  },
  cache: {
    ttlTrending: parseInt(process.env.CACHE_TTL_TRENDING || '21600'), // 6 hours
    ttlSearch: parseInt(process.env.CACHE_TTL_SEARCH || '3600'), // 1 hour
    ttlDetails: parseInt(process.env.CACHE_TTL_DETAILS || '86400'), // 24 hours
    ttlAvailability: parseInt(process.env.CACHE_TTL_AVAILABILITY || '86400') // 24 hours
  },
  apis: {
    tmdb: {
      apiKey: process.env.TMDB_API_KEY || '',
      baseUrl: 'https://api.themoviedb.org/3'
    },
    watchmode: {
      apiKey: process.env.WATCHMODE_API_KEY || '',
      baseUrl: 'https://api.watchmode.com/v1'
    },
    jackett: {
      url: process.env.JACKETT_URL || 'http://localhost:9117',
      apiKey: process.env.JACKETT_API_KEY || ''
    },
    qbittorrent: {
      url: process.env.QBITTORRENT_URL || 'http://localhost:8080',
      username: process.env.QBITTORRENT_USERNAME || 'admin',
      password: process.env.QBITTORRENT_PASSWORD || 'adminpass'
    },
    cloudCommander: {
      url: process.env.CLOUD_COMMANDER_URL || 'http://localhost:8000',
      username: process.env.CLOUD_COMMANDER_USERNAME || 'admin',
      password: process.env.CLOUD_COMMANDER_PASSWORD || 'admin'
    },
    portainer: {
      url: process.env.PORTAINER_URL || 'http://localhost:9000',
      apiKey: process.env.PORTAINER_API_KEY || ''
    },
    jellyfin: {
      url: process.env.JELLYFIN_URL || 'http://localhost:8096',
      apiKey: process.env.JELLYFIN_API_KEY || ''
    }
  },
  paths: {
    downloads: process.env.DOWNLOADS_PATH || '/mnt/samba/Downloads',
    movies: process.env.MOVIES_PATH || '/mnt/samba/Movies',
    tvShows: process.env.TV_SHOWS_PATH || '/mnt/samba/TV Shows'
  },
  notifications: {
    enabled: process.env.ENABLE_NOTIFICATIONS === 'true',
    sound: process.env.NOTIFICATION_SOUND === 'true'
  }
}

// Validation functions
function validateConfig(config: Config): void {
  const errors: string[] = []

  // Check required environment variables
  if (!config.auth.jwtSecret || config.auth.jwtSecret === 'your-super-secret-jwt-key-change-this-in-production') {
    if (config.server.env === 'production') {
      errors.push('JWT_SECRET must be set in production')
    }
  }

  // Validate API keys for external services
  const apiServices = [
    { name: 'TMDB', key: config.apis.tmdb.apiKey },
    { name: 'Watchmode', key: config.apis.watchmode.apiKey },
    { name: 'Jackett', key: config.apis.jackett.apiKey },
    { name: 'Portainer', key: config.apis.portainer.apiKey },
    { name: 'Jellyfin', key: config.apis.jellyfin.apiKey }
  ]

  apiServices.forEach(service => {
    if (!service.key) {
      console.warn(`Warning: ${service.name} API key not configured`)
    }
  })

  // Validate ports
  if (config.server.port < 1 || config.server.port > 65535) {
    errors.push('Server port must be between 1 and 65535')
  }

  if (config.websocket.port < 1 || config.websocket.port > 65535) {
    errors.push('WebSocket port must be between 1 and 65535')
  }

  // Validate bcrypt rounds
  if (config.auth.bcryptRounds < 10 || config.auth.bcryptRounds > 15) {
    errors.push('Bcrypt rounds should be between 10 and 15')
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`)
  }
}

// Create and validate configuration
const config = { ...defaultConfig }

try {
  validateConfig(config)
} catch (error) {
  console.error('Configuration error:', error)
  if (config.server.env === 'production') {
    process.exit(1)
  }
}

// Helper functions
export function isProduction(): boolean {
  return config.server.env === 'production'
}

export function isDevelopment(): boolean {
  return config.server.env === 'development'
}

export function isTest(): boolean {
  return config.server.env === 'test'
}

// Configuration getters
export function getApiConfig(service: keyof Config['apis']) {
  return config.apis[service]
}

export function getDatabasePath(): string {
  return config.database.path
}

export function getJwtSecret(): string {
  return config.auth.jwtSecret
}

export function getCacheConfig() {
  return config.cache
}

export function getPathsConfig() {
  return config.paths
}

// Export configuration
export { config }