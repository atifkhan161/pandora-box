import express, { Express, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import path from 'path'
import { config } from '@/config/config.js'
import { logger } from '@/utils/logger.js'
import { errorHandler } from '@/middleware/errorHandler.js'
import { initAuthMiddleware, authenticate } from '@/middleware/auth.js'
import { DatabaseService } from '@/services/database.js'
import { WebSocketService } from '@/services/websocket.js'
import { ApiProxyService } from '@/services/apiProxy.js'

// Import routes
import { createAuthRoutes } from '@/routes/auth.js'
import { createMediaRoutes } from '@/routes/media.js'
import { createStreamingRoutes } from '@/routes/streaming.js'
import { createDownloadsRoutes } from '@/routes/downloads.js'
import { createHealthRoutes } from '@/routes/health.js'
import { createFilesRoutes } from '@/routes/files.js'
import { createDockerRoutes } from '@/routes/docker.js'
import { createJellyfinRoutes } from '@/routes/jellyfin.js'
import settingsRoutes from '@/routes/settings.js'

class PandoraBoxServer {
  private app: Express
  private databaseService: DatabaseService
  private wsService: WebSocketService
  private apiProxyService: ApiProxyService

  constructor() {
    this.app = express()
    this.databaseService = new DatabaseService()
    this.wsService = new WebSocketService()
    this.apiProxyService = new ApiProxyService(this.databaseService)
  }

  // Initialize the server
  public async init(): Promise<void> {
    try {
      logger.info('Starting server initialization...')
      
      // Initialize database
      logger.info('Initializing database...')
      await this.databaseService.init()
      logger.info('Database initialized successfully')

      // Initialize authentication middleware
      logger.info('Initializing authentication middleware...')
      initAuthMiddleware(this.databaseService)
      logger.info('Authentication middleware initialized successfully')

      // Initialize API proxy service
      logger.info('Initializing API proxy service...')
      await this.apiProxyService.init()
      logger.info('API Proxy Service initialized successfully')

      // Initialize WebSocket service
      logger.info('Initializing WebSocket service...')
      await this.wsService.init()
      logger.info('WebSocket service initialized successfully')

      // Setup middleware
      logger.info('Setting up middleware...')
      this.setupMiddleware()
      logger.info('Middleware setup completed')

      // Setup routes
      logger.info('Setting up routes...')
      this.setupRoutes()
      logger.info('Routes setup completed')

      // Setup error handling
      logger.info('Setting up error handling...')
      this.setupErrorHandling()
      logger.info('Error handling setup completed')

      logger.info('Pandora Box Server initialized successfully')
    } catch (error) {
      logger.error('Failed to initialize server:', error)
      throw error
    }
  }

  // Setup middleware
  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "ws:", "wss:"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"]
        }
      },
      crossOriginEmbedderPolicy: false
    }))

    // CORS configuration
    this.app.use(cors({
      origin: config.cors.origins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }))

    // Compression
    this.app.use(compression())

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.max,
      message: {
        error: 'Too many requests from this IP, please try again later.'
      },
      standardHeaders: true,
      legacyHeaders: false
    })
    this.app.use('/api/', limiter)

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }))
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }))

    // Request logging
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const start = Date.now()
      const requestId = Math.random().toString(36).substring(7)
      
      req.requestId = requestId
      
      logger.info({
        requestId,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }, 'Request received')

      res.on('finish', () => {
        const duration = Date.now() - start
        logger.info({
          requestId,
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration: `${duration}ms`
        }, 'Request completed')
      })

      next()
    })

    // API base path
    this.app.use('/api/v1', this.createApiRouter())
  }

  // Create API router
  private createApiRouter(): express.Router {
    const router = express.Router()

    // Public routes (no authentication required)
    router.use('/health', createHealthRoutes(this.databaseService, this.wsService))
    router.use('/auth', createAuthRoutes(this.databaseService))

    // Protected routes (authentication required)
    router.use('/media', authenticate, createMediaRoutes(this.apiProxyService, this.databaseService))
    router.use('/streaming', authenticate, createStreamingRoutes(this.apiProxyService, this.databaseService))
    router.use('/downloads', authenticate, createDownloadsRoutes(this.apiProxyService, this.databaseService, this.wsService))
    router.use('/files', authenticate, createFilesRoutes(this.apiProxyService, this.databaseService, this.wsService))
    router.use('/docker', authenticate, createDockerRoutes(this.apiProxyService, this.databaseService, this.wsService))
    router.use('/jellyfin', authenticate, createJellyfinRoutes(this.apiProxyService, this.databaseService, this.wsService))
    router.use('/settings', authenticate, settingsRoutes)

    return router
  }

  // Setup routes
  private setupRoutes(): void {
    // Root endpoint - serve the PWA
    this.app.get('/', (req: Request, res: Response) => {
      const clientPath = path.join(process.cwd(), '..', 'client', 'dist')
      res.sendFile(path.join(clientPath, 'index.html'))
    })

    // API documentation
    this.app.get('/api', (req: Request, res: Response) => {
      res.json({
        name: 'Pandora Box API',
        version: '1.0.0',
        description: 'Self-hosted media management API',
        endpoints: {
          health: '/api/v1/health',
          auth: '/api/v1/auth',
          media: '/api/v1/media',
          downloads: '/api/v1/downloads',
          files: '/api/v1/files',
          docker: '/api/v1/docker',
          jellyfin: '/api/v1/jellyfin',
          settings: '/api/v1/settings'
        }
      })
    })

    // Serve static files from client build
    const clientPath = path.join(process.cwd(), '..', 'client', 'dist')
    this.app.use(express.static(clientPath))

    // Serve PWA files at root
    this.app.get('/manifest.json', (req: Request, res: Response) => {
      res.sendFile(path.join(clientPath, 'manifest.json'))
    })

    this.app.get('/sw.js', (req: Request, res: Response) => {
      res.sendFile(path.join(clientPath, 'sw.js'))
    })

    // SPA fallback - serve index.html for all non-API routes
    this.app.get('*', (req: Request, res: Response) => {
      // Don't serve index.html for API routes
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({
          error: 'API endpoint not found',
          path: req.path,
          method: req.method
        })
      }
      
      res.sendFile(path.join(clientPath, 'index.html'))
    })


  }

  // Setup error handling
  private setupErrorHandling(): void {
    // Global error handler
    this.app.use(errorHandler)

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', error)
      process.exit(1)
    })

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason)
      process.exit(1)
    })

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully')
      this.shutdown()
    })

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully')
      this.shutdown()
    })
  }

  // Start the server
  public async start(): Promise<void> {
    try {
      await this.init()

      const port = config.server.port
      const host = config.server.host

      this.app.listen(port, host, () => {
        console.log(`🚀 Pandora Box Server running on http://${host}:${port}`)
        console.log(`📚 API documentation available at http://${host}:${port}/api`)
        console.log(`🔌 WebSocket server running on ws://${host}:${config.websocket.port}`)
        logger.info(`Pandora Box Server running on http://${host}:${port}`)
        logger.info(`API documentation available at http://${host}:${port}/api`)
        logger.info(`WebSocket server running on ws://${host}:${config.websocket.port}`)
      })
    } catch (error) {
      logger.error('Failed to start server:', error)
      process.exit(1)
    }
  }

  // Shutdown the server
  private async shutdown(): Promise<void> {
    try {
      logger.info('Shutting down server...')

      // Close WebSocket connections
      await this.wsService.close()

      // Close database connections
      await this.databaseService.close()

      logger.info('Server shutdown complete')
      process.exit(0)
    } catch (error) {
      logger.error('Error during shutdown:', error)
      process.exit(1)
    }
  }

  // Get Express app instance
  public getApp(): Express {
    return this.app
  }

  // Get database service
  public getDatabaseService(): DatabaseService {
    return this.databaseService
  }

  // Get WebSocket service
  public getWebSocketService(): WebSocketService {
    return this.wsService
  }

  // Get API proxy service
  public getApiProxyService(): ApiProxyService {
    return this.apiProxyService
  }
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      requestId?: string
      user?: {
        id: string
        username: string
        email: string
        role: string
      }
    }
  }
}

// Create and start server
const server = new PandoraBoxServer()

// Start server if this file is run directly
import { fileURLToPath } from 'url'
import { resolve } from 'path'

const currentFile = fileURLToPath(import.meta.url)
const runFile = resolve(process.argv[1])

if (currentFile === runFile) {
  server.start().catch((error) => {
    logger.error('Failed to start Pandora Box Server:', error)
    process.exit(1)
  })
}

export default server
export { PandoraBoxServer }