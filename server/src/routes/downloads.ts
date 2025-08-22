import { Router } from 'express'
import TorrentController from '@/controllers/torrent.js'
import { QBittorrentController } from '@/controllers/qbittorrent.js'
import { ApiProxyService } from '@/services/apiProxy.js'
import { DatabaseService } from '@/services/database.js'
import { WebSocketService } from '@/services/websocket.js'
import { authenticate } from '@/middleware/auth.js'

const router = Router()

// Create a function to initialize routes with services
export const createDownloadsRoutes = (apiProxy: ApiProxyService, dbService: DatabaseService, wsService: WebSocketService) => {
  const torrentController = new TorrentController(apiProxy, dbService)
  const qbController = new QBittorrentController(apiProxy, dbService, wsService)

  // Apply authentication middleware to all routes
  router.use(authenticate)

  // Downloads management routes
  router.get('/', qbController.listTorrents)
  router.get('/transfer-info', qbController.getTransferInfo)
  router.get('/preferences', qbController.getPreferences)
  router.get('/:hash/details', qbController.getTorrentDetails)

  // Torrent search routes (Jackett integration)
  router.get('/search-torrents', torrentController.searchTorrents)
  router.get('/indexers', torrentController.getIndexers)
  router.get('/categories', torrentController.getCategories)
  
  // Search history
  router.get('/search-history', torrentController.getSearchHistory)
  router.delete('/search-history', torrentController.clearSearchHistory)

  // Download management (qBittorrent integration)
  router.post('/add', qbController.addTorrent)
  router.post('/:hash/control', qbController.controlTorrent)

  return router
}

export default router