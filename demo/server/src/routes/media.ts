import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { tmdbService } from '../services/tmdbService';
import { watchmodeService } from '../services/watchmodeService';
import { getMediaCache } from '../services/database';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types/api';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get trending content
router.get('/trending', async (req, res) => {
  try {
    const { type = 'all', timeWindow = 'week' } = req.query;
    
    // Check cache first
    const mediaCache = getMediaCache();
    const cacheKey = `trending_${type}_${timeWindow}`;
    const cached = mediaCache.findOne({ id: cacheKey });
    
    if (cached && (Date.now() - new Date(cached.createdAt).getTime()) < 3600000) { // 1 hour cache
      return res.json({
        success: true,
        data: cached.data
      } as ApiResponse);
    }
    
    const trending = await tmdbService.getTrending(type as any, timeWindow as any);
    
    // Cache the result
    if (cached) {
      cached.data = trending;
      cached.createdAt = new Date().toISOString();
      mediaCache.update(cached);
    } else {
      mediaCache.insert({
        id: cacheKey,
        data: trending,
        type: 'trending',
        category: type as string,
        createdAt: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      data: trending
    } as ApiResponse);
    
  } catch (error) {
    logger.error('Get trending error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trending content'
    } as ApiResponse);
  }
});

// Get popular content
router.get('/popular', async (req, res) => {
  try {
    const { type = 'movie' } = req.query;
    
    const cacheKey = `popular_${type}`;
    const mediaCache = getMediaCache();
    const cached = mediaCache.findOne({ id: cacheKey });
    
    if (cached && (Date.now() - new Date(cached.createdAt).getTime()) < 3600000) {
      return res.json({
        success: true,
        data: cached.data
      } as ApiResponse);
    }
    
    const popular = await tmdbService.getPopular(type as 'movie' | 'tv');
    
    // Cache the result
    if (cached) {
      cached.data = popular;
      cached.createdAt = new Date().toISOString();
      mediaCache.update(cached);
    } else {
      mediaCache.insert({
        id: cacheKey,
        data: popular,
        type: 'popular',
        category: type as string,
        createdAt: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      data: popular
    } as ApiResponse);
    
  } catch (error) {
    logger.error('Get popular error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch popular content'
    } as ApiResponse);
  }
});

// Search content
router.get('/search', async (req, res) => {
  try {
    const { query, type = 'multi' } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Query parameter is required'
      } as ApiResponse);
    }
    
    const results = await tmdbService.search(query, type as any);
    
    res.json({
      success: true,
      data: results
    } as ApiResponse);
    
  } catch (error) {
    logger.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search content'
    } as ApiResponse);
  }
});

// Get content details
router.get('/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    
    if (!['movie', 'tv'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid media type'
      } as ApiResponse);
    }
    
    const details = await tmdbService.getDetails(type as 'movie' | 'tv', parseInt(id));
    
    res.json({
      success: true,
      data: details
    } as ApiResponse);
    
  } catch (error) {
    logger.error('Get details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch content details'
    } as ApiResponse);
  }
});

export default router;