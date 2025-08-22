import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import { config } from '@/config/config.js'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

// Ensure logs directory exists
const logsDir = join(process.cwd(), 'logs')
if (!existsSync(logsDir)) {
  mkdirSync(logsDir, { recursive: true })
}

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`
    
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`
    }
    
    if (stack) {
      log += `\n${stack}`
    }
    
    return log
  })
)

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} ${level}: ${message}`
    
    if (Object.keys(meta).length > 0 && !meta.stack) {
      log += ` ${JSON.stringify(meta, null, 2)}`
    }
    
    return log
  })
)

// Create transports
const transports: winston.transport[] = []

// Console transport
transports.push(
  new winston.transports.Console({
    level: config.logging.level,
    format: consoleFormat,
    handleExceptions: true,
    handleRejections: true
  })
)

// File transport with rotation
transports.push(
  new DailyRotateFile({
    filename: join(logsDir, 'pandora-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: config.logging.level,
    format: logFormat,
    maxSize: '20m',
    maxFiles: '14d',
    handleExceptions: true,
    handleRejections: true,
    createSymlink: true,
    symlinkName: 'pandora-current.log'
  })
)

// Error file transport
transports.push(
  new DailyRotateFile({
    filename: join(logsDir, 'pandora-error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    format: logFormat,
    maxSize: '20m',
    maxFiles: '30d',
    handleExceptions: true,
    handleRejections: true,
    createSymlink: true,
    symlinkName: 'pandora-error-current.log'
  })
)

// Create logger
export const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  transports,
  exitOnError: false
})

// API request logger
export const apiLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    new DailyRotateFile({
      filename: join(logsDir, 'api-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '7d',
      createSymlink: true,
      symlinkName: 'api-current.log'
    })
  ]
})

// Security logger for authentication events
export const securityLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    new DailyRotateFile({
      filename: join(logsDir, 'security-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      createSymlink: true,
      symlinkName: 'security-current.log'
    }),
    new winston.transports.Console({
      level: 'warn',
      format: consoleFormat
    })
  ]
})

// Performance logger
export const performanceLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    new DailyRotateFile({
      filename: join(logsDir, 'performance-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '7d',
      createSymlink: true,
      symlinkName: 'performance-current.log'
    })
  ]
})

// Log helper functions
export const logHelpers = {
  // Log API request
  logApiRequest(method: string, url: string, statusCode: number, duration: number, userId?: string) {
    apiLogger.info({
      type: 'api_request',
      method,
      url,
      statusCode,
      duration,
      userId,
      timestamp: new Date().toISOString()
    })
  },

  // Log authentication event
  logAuthEvent(event: string, userId: string, ip: string, userAgent?: string, success: boolean = true) {
    securityLogger.info({
      type: 'auth_event',
      event,
      userId,
      ip,
      userAgent,
      success,
      timestamp: new Date().toISOString()
    })
  },

  // Log security event
  logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high', details: any, ip?: string) {
    const logMethod = severity === 'high' ? 'error' : severity === 'medium' ? 'warn' : 'info'
    securityLogger[logMethod]({
      type: 'security_event',
      event,
      severity,
      details,
      ip,
      timestamp: new Date().toISOString()
    })
  },

  // Log performance metric
  logPerformance(operation: string, duration: number, details?: any) {
    performanceLogger.info({
      type: 'performance',
      operation,
      duration,
      details,
      timestamp: new Date().toISOString()
    })
  },

  // Log external API call
  logExternalApi(service: string, endpoint: string, method: string, statusCode: number, duration: number, cached: boolean = false) {
    apiLogger.info({
      type: 'external_api',
      service,
      endpoint,
      method,
      statusCode,
      duration,
      cached,
      timestamp: new Date().toISOString()
    })
  },

  // Log database operation
  logDatabase(operation: string, collection: string, duration: number, recordCount?: number) {
    performanceLogger.info({
      type: 'database',
      operation,
      collection,
      duration,
      recordCount,
      timestamp: new Date().toISOString()
    })
  },

  // Log WebSocket event
  logWebSocket(event: string, clientId: string, details?: any) {
    logger.info({
      type: 'websocket',
      event,
      clientId,
      details,
      timestamp: new Date().toISOString()
    })
  }
}

// Stream for Morgan HTTP request logging
export const morganStream = {
  write: (message: string) => {
    apiLogger.info(message.trim())
  }
}

// Add metadata to logger
logger.info('Logger initialized', {
  level: config.logging.level,
  environment: config.server.env,
  logsDir
})

export default logger