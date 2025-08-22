import { Router } from 'express'
import StreamingController from '@/controllers/streaming.js'
import { ApiProxyService } from '@/services/apiProxy.js'

const router = Router()

// Create a function to initialize routes with services
export const createStreamingRoutes = (apiProxy: ApiProxyService, dbService: any) => {
  const streamingController = new StreamingController(apiProxy, dbService)

  // Get streaming availability for specific content
  router.get('/availability/:type/:tmdbId', streamingController.getAvailability)

  // Get streaming providers
  router.get('/providers', streamingController.getProviders)

  // Search content on streaming platforms
  router.get('/search', streamingController.searchStreaming)

  // Get popular content on streaming platforms
  router.get('/popular/:type', streamingController.getPopularStreaming)

  // Cache management
  router.delete('/cache', streamingController.clearCache)
  router.get('/cache/stats', streamingController.getCacheStats)

  return router
}

export default router