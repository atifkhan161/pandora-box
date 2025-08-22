import { Router } from 'express'
import JellyfinController from '@/controllers/jellyfin.js'
import { ApiProxyService } from '@/services/apiProxy.js'
import { DatabaseService } from '@/services/database.js'
import { WebSocketService } from '@/services/websocket.js'
import { requireAuth } from '@/middleware/auth.js'

const router = Router()

// Create a function to initialize routes with services
export const createJellyfinRoutes = (apiProxy: ApiProxyService, dbService: DatabaseService, wsService: WebSocketService) => {
  const jellyfinController = new JellyfinController(apiProxy, dbService, wsService)

  // Apply authentication middleware to all routes
  router.use(requireAuth)

  // Server info and status
  router.get('/info', jellyfinController.getServerInfo)
  router.get('/libraries', jellyfinController.getLibraries)
  router.get('/stats', jellyfinController.getLibraryStats)

  // Library scanning
  router.post('/scan', jellyfinController.scanLibrary)
  router.get('/scan/status', jellyfinController.getScanStatus)

  // Library maintenance
  router.post('/libraries/:libraryId/clean', jellyfinController.cleanLibrary)

  return router
}

export default router