import { Router, Request, Response } from 'express'
import { asyncHandler } from '@/middleware/errorHandler.js'
import { logger } from '@/utils/logger.js'
import server from '@/app.js'

const router = Router()

// Basic health check
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const dbService = server.getDatabaseService()
  const wsService = server.getWebSocketService()
  
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime(),
    services: {
      database: dbService.isHealthy(),
      websocket: wsService.isHealthy()
    },
    memory: process.memoryUsage(),
    system: {
      platform: process.platform,
      nodeVersion: process.version,
      pid: process.pid
    }
  }

  // Check if any service is unhealthy
  const isUnhealthy = !Object.values(health.services).every(status => status)
  
  if (isUnhealthy) {
    health.status = 'unhealthy'
    res.status(503)
  }

  res.json({
    success: true,
    data: health
  })
}))

// Detailed health check
router.get('/detailed', asyncHandler(async (req: Request, res: Response) => {
  const dbService = server.getDatabaseService()
  const wsService = server.getWebSocketService()
  
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime(),
    services: {
      database: {
        status: dbService.isHealthy(),
        stats: dbService.getStats()
      },
      websocket: {
        status: wsService.isHealthy(),
        stats: wsService.getStats()
      }
    },
    system: {
      platform: process.platform,
      nodeVersion: process.version,
      pid: process.pid,
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      environment: process.env.NODE_ENV
    }
  }

  const isUnhealthy = !health.services.database.status || !health.services.websocket.status
  
  if (isUnhealthy) {
    health.status = 'unhealthy'
    res.status(503)
  }

  res.json({
    success: true,
    data: health
  })
}))

export default router