import { Router } from 'express'
import CloudCommanderController from '@/controllers/cloudcommander.js'
import { ApiProxyService } from '@/services/apiProxy.js'
import { DatabaseService } from '@/services/database.js'
import { WebSocketService } from '@/services/websocket.js'
import { authenticate } from '@/middleware/auth.js'

const router = Router()

// Create a function to initialize routes with services
export const createFilesRoutes = (apiProxy: ApiProxyService, dbService: DatabaseService, wsService: WebSocketService) => {
  const cloudCmdController = new CloudCommanderController(apiProxy, dbService, wsService)

  // Apply authentication middleware to all routes
  router.use(authenticate)

  // File browsing
  router.get('/browse', cloudCmdController.browseDirectory)
  
  // File operations
  router.post('/operation', cloudCmdController.performFileOperation)
  router.post('/move-to-media', cloudCmdController.moveToMediaFolder)
  
  // Operation history
  router.get('/operations', cloudCmdController.getFileOperationHistory)

  return router
}

export default router