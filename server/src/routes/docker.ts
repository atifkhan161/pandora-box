import { Router } from 'express'
import PortainerController from '@/controllers/portainer.js'
import { ApiProxyService } from '@/services/apiProxy.js'
import { DatabaseService } from '@/services/database.js'
import { WebSocketService } from '@/services/websocket.js'
import { authenticate, requireAdmin } from '@/middleware/auth.js'

const router = Router()

// Create a function to initialize routes with services
export const createDockerRoutes = (apiProxy: ApiProxyService, dbService: DatabaseService, wsService: WebSocketService) => {
  const portainerController = new PortainerController(apiProxy, dbService, wsService)

  // Apply authentication middleware to all routes
  router.use(authenticate)
  router.use(requireAdmin) // Docker management requires admin role

  // Container management
  router.get('/containers', portainerController.getContainers)
  router.post('/containers/:containerId/control', portainerController.controlContainer)
  router.get('/containers/:containerId/logs', portainerController.getContainerLogs)
  router.get('/containers/:containerId/stats', portainerController.getContainerStats)

  // Stack management
  router.get('/stacks', portainerController.getStacks)
  router.post('/stacks/:stackId/control', portainerController.controlStack)

  return router
}

export default router