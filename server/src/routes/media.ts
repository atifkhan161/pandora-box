import { Router } from 'express'
import MediaController from '@/controllers/media.js'
import { ApiProxyService } from '@/services/apiProxy.js'

const router = Router()

// Create a function to initialize routes with services
export const createMediaRoutes = (apiProxy: ApiProxyService, dbService: any) => {
  const mediaController = new MediaController(apiProxy, dbService)

  // Trending content
  router.get('/trending/:type/:timeWindow', mediaController.getTrending)

  // Popular content
  router.get('/popular/:type', mediaController.getPopular)

  // Top rated content
  router.get('/top-rated/:type', mediaController.getTopRated)

  // Search content
  router.get('/search', mediaController.search)

  // Content details
  router.get('/:type/:id', mediaController.getDetails)

  // Genres
  router.get('/genres/:type', mediaController.getGenres)

  // Cache management
  router.delete('/cache', mediaController.clearCache)
  router.get('/cache/stats', mediaController.getCacheStats)

  return router
}

export default router