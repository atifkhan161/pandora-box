import { Request, Response } from 'express';
import jellyfinService from '../services/jellyfinService';
import { logActivity } from '../services/database';
import { logger } from '../utils/logger';

/**
 * Get Jellyfin users
 */
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await jellyfinService.getUsers();
    
    // Log activity
    logActivity(req.user.id, 'view_jellyfin_users', {});
    
    res.status(200).json(users);
  } catch (error) {
    logger.error('Error in getUsers controller', error);
    res.status(500).json({ error: 'Failed to get Jellyfin users' });
  }
};

/**
 * Get media libraries
 */
export const getLibraries = async (req: Request, res: Response): Promise<void> => {
  try {
    const libraries = await jellyfinService.getLibraries();
    
    // Log activity
    logActivity(req.user.id, 'view_media_libraries', {});
    
    res.status(200).json(libraries);
  } catch (error) {
    logger.error('Error in getLibraries controller', error);
    res.status(500).json({ error: 'Failed to get media libraries' });
  }
};

/**
 * Get library items
 */
export const getLibraryItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const { libraryId } = req.params;
    const { limit, startIndex, sortBy, sortOrder, filters } = req.query;
    
    const items = await jellyfinService.getLibraryItems(
      libraryId,
      limit ? parseInt(limit as string, 10) : 50,
      startIndex ? parseInt(startIndex as string, 10) : 0,
      sortBy as string,
      sortOrder as string,
      filters as Record<string, string>
    );
    
    // Log activity
    logActivity(req.user.id, 'view_library_items', { libraryId });
    
    res.status(200).json(items);
  } catch (error) {
    logger.error(`Error in getLibraryItems controller for library ${req.params.libraryId}`, error);
    res.status(500).json({ error: 'Failed to get library items' });
  }
};

/**
 * Get item details
 */
export const getItemDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { itemId } = req.params;
    
    const item = await jellyfinService.getItemDetails(itemId);
    
    // Log activity
    logActivity(req.user.id, 'view_item_details', { itemId });
    
    res.status(200).json(item);
  } catch (error) {
    logger.error(`Error in getItemDetails controller for item ${req.params.itemId}`, error);
    res.status(500).json({ error: 'Failed to get item details' });
  }
};

/**
 * Search items
 */
export const searchItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query } = req.query;
    
    if (!query) {
      res.status(400).json({ error: 'Search query is required' });
      return;
    }
    
    const results = await jellyfinService.searchItems(query as string);
    
    // Log activity
    logActivity(req.user.id, 'search_media', { query });
    
    res.status(200).json(results);
  } catch (error) {
    logger.error(`Error in searchItems controller for query ${req.query.query}`, error);
    res.status(500).json({ error: 'Failed to search items' });
  }
};

/**
 * Get stream URL
 */
export const getStreamUrl = async (req: Request, res: Response): Promise<void> => {
  try {
    const { itemId } = req.params;
    
    const streamUrl = await jellyfinService.getStreamUrl(itemId);
    
    // Log activity
    logActivity(req.user.id, 'get_stream_url', { itemId });
    
    res.status(200).json({ streamUrl });
  } catch (error) {
    logger.error(`Error in getStreamUrl controller for item ${req.params.itemId}`, error);
    res.status(500).json({ error: 'Failed to get stream URL' });
  }
};

/**
 * Refresh library
 */
export const refreshLibrary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { libraryId } = req.params;
    
    await jellyfinService.refreshLibrary(libraryId);
    
    // Log activity
    logActivity(req.user.id, 'refresh_library', { libraryId });
    logger.info(`User ${req.user.username} refreshed library: ${libraryId}`);
    
    res.status(200).json({ message: 'Library refresh initiated successfully' });
  } catch (error) {
    logger.error(`Error in refreshLibrary controller for library ${req.params.libraryId}`, error);
    res.status(500).json({ error: 'Failed to refresh library' });
  }
};

/**
 * Get recently added items
 */
export const getRecentlyAdded = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit } = req.query;
    
    const items = await jellyfinService.getRecentlyAdded(
      limit ? parseInt(limit as string, 10) : 20
    );
    
    // Log activity
    logActivity(req.user.id, 'view_recently_added', {});
    
    res.status(200).json(items);
  } catch (error) {
    logger.error('Error in getRecentlyAdded controller', error);
    res.status(500).json({ error: 'Failed to get recently added items' });
  }
};