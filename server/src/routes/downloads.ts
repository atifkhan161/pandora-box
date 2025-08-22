import { Router } from 'express'
import TorrentController from '@/controllers/torrent.js'
import { ApiProxyService } from '@/services/apiProxy.js'

const router = Router()

// Create a function to initialize routes with services
export const createDownloadsRoutes = (apiProxy: ApiProxyService, dbService: any) => {
  const torrentController = new TorrentController(apiProxy, dbService)

  // Downloads management routes
  router.get('/', (req, res) => {
    res.status(501).json({ success: false, message: 'Downloads list endpoint not yet implemented' })
  })

  // Torrent search routes
  router.get('/search-torrents', torrentController.searchTorrents)
  router.get('/indexers', torrentController.getIndexers)
  router.get('/categories', torrentController.getCategories)
  
  // Search history
  router.get('/search-history', torrentController.getSearchHistory)
  router.delete('/search-history', torrentController.clearSearchHistory)

  // Download management (placeholder for qBittorrent integration)
  router.post('/add', (req, res) => {
    res.status(501).json({ success: false, message: 'Add download endpoint not yet implemented' })
  })

  router.post('/:id/control', (req, res) => {
    res.status(501).json({ success: false, message: 'Download control endpoint not yet implemented' })
  })

  router.delete('/:id', (req, res) => {
    res.status(501).json({ success: false, message: 'Delete download endpoint not yet implemented' })
  })

  return router
}

export default router