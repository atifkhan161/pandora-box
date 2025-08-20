import { Request, Response } from 'express';
import jackettService from '../services/jackettService';
import qbittorrentService from '../services/qbittorrentService';
import { getDownloads, logActivity } from '../services/database';
import { getEnv } from '../config/env';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const env = getEnv();

/**
 * Search for torrents
 */
export const searchTorrents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, category } = req.query;
    
    if (!query) {
      res.status(400).json({ error: 'Search query is required' });
      return;
    }

    const results = await jackettService.searchTorrents(query as string, category as string);
    
    // Log search activity
    logActivity((req as any).user?.id || 'unknown', 'search_torrents', { query, category });

    res.status(200).json(results);
  } catch (error) {
    logger.error('Error in searchTorrents controller', error);
    res.status(500).json({ error: 'Failed to search torrents' });
  }
};

/**
 * Get all indexers
 */
export const getIndexers = async (req: Request, res: Response): Promise<void> => {
  try {
    const indexers = await jackettService.getIndexers();
    res.status(200).json(indexers);
  } catch (error) {
    logger.error('Error in getIndexers controller', error);
    res.status(500).json({ error: 'Failed to get indexers' });
  }
};

/**
 * Test indexer
 */
export const testIndexer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await jackettService.testIndexer(id);
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Error in testIndexer controller for indexer ${req.params.id}`, error);
    res.status(500).json({ error: 'Failed to test indexer' });
  }
};

/**
 * Add torrent from URL
 */
export const addTorrent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { url, title, mediaId, mediaType } = req.body;
    
    if (!url) {
      res.status(400).json({ error: 'Torrent URL is required' });
      return;
    }

    // Add torrent to qBittorrent
    const savePath = env.DOWNLOAD_PATH;
    const success = await qbittorrentService.addTorrentFromUrl(url, savePath);
    
    if (!success) {
      res.status(500).json({ error: 'Failed to add torrent to qBittorrent' });
      return;
    }

    // Store download in database
    const downloads = getDownloads();
    const download = {
      id: uuidv4(),
      title: title || 'Unknown',
      url,
      mediaId: mediaId || null,
      mediaType: mediaType || null,
      status: 'downloading' as const,
      addedBy: (req as any).user?.id || 'unknown',
      createdAt: new Date(),
      addedAt: new Date(),
      completedAt: null
    };
    
    downloads.insert(download);
    
    // Log activity
    logActivity((req as any).user?.id || 'unknown', 'add_torrent', { title, url });
    logger.info(`Torrent added: ${title || url}`);

    res.status(201).json({ message: 'Torrent added successfully', download });
  } catch (error) {
    logger.error('Error in addTorrent controller', error);
    res.status(500).json({ error: 'Failed to add torrent' });
  }
};

/**
 * Get all torrents
 */
export const getTorrents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { filter } = req.query;
    const torrents = await qbittorrentService.getTorrents(filter as string);
    res.status(200).json(torrents);
  } catch (error) {
    logger.error('Error in getTorrents controller', error);
    res.status(500).json({ error: 'Failed to get torrents' });
  }
};

/**
 * Get torrent details
 */
export const getTorrentDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { hash } = req.params;
    
    const properties = await qbittorrentService.getTorrentProperties(hash);
    const files = await qbittorrentService.getTorrentContents(hash);
    
    res.status(200).json({
      properties,
      files
    });
  } catch (error) {
    logger.error(`Error in getTorrentDetails controller for hash ${req.params.hash}`, error);
    res.status(500).json({ error: 'Failed to get torrent details' });
  }
};

/**
 * Pause torrent
 */
export const pauseTorrent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { hash } = req.params;
    const success = await qbittorrentService.pauseTorrent(hash);
    
    if (success) {
      // Log activity
      logActivity((req as any).user?.id || 'unknown', 'pause_torrent', { hash });
      res.status(200).json({ message: 'Torrent paused successfully' });
    } else {
      res.status(500).json({ error: 'Failed to pause torrent' });
    }
  } catch (error) {
    logger.error(`Error in pauseTorrent controller for hash ${req.params.hash}`, error);
    res.status(500).json({ error: 'Failed to pause torrent' });
  }
};

/**
 * Resume torrent
 */
export const resumeTorrent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { hash } = req.params;
    const success = await qbittorrentService.resumeTorrent(hash);
    
    if (success) {
      // Log activity
      logActivity((req as any).user?.id || 'unknown', 'resume_torrent', { hash });
      res.status(200).json({ message: 'Torrent resumed successfully' });
    } else {
      res.status(500).json({ error: 'Failed to resume torrent' });
    }
  } catch (error) {
    logger.error(`Error in resumeTorrent controller for hash ${req.params.hash}`, error);
    res.status(500).json({ error: 'Failed to resume torrent' });
  }
};

/**
 * Delete torrent
 */
export const deleteTorrent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { hash } = req.params;
    const { deleteFiles } = req.query;
    
    const shouldDeleteFiles = deleteFiles === 'true';
    const success = await qbittorrentService.deleteTorrent(hash, shouldDeleteFiles);
    
    if (success) {
      // Update download status in database if exists
      const downloads = getDownloads();
      const download = downloads.findOne({ url: { $regex: hash } });
      
      if (download) {
        download.status = 'deleted';
        downloads.update(download);
      }
      
      // Log activity
      logActivity((req as any).user?.id || 'unknown', 'delete_torrent', { hash, deleteFiles: shouldDeleteFiles });
      res.status(200).json({ message: 'Torrent deleted successfully' });
    } else {
      res.status(500).json({ error: 'Failed to delete torrent' });
    }
  } catch (error) {
    logger.error(`Error in deleteTorrent controller for hash ${req.params.hash}`, error);
    res.status(500).json({ error: 'Failed to delete torrent' });
  }
};

/**
 * Get transfer info
 */
export const getTransferInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    const info = await qbittorrentService.getTransferInfo();
    res.status(200).json(info);
  } catch (error) {
    logger.error('Error in getTransferInfo controller', error);
    res.status(500).json({ error: 'Failed to get transfer info' });
  }
};

/**
 * Get download history
 */
export const getDownloadHistory = (req: Request, res: Response): void => {
  try {
    const downloads = getDownloads();
    const history = downloads.find();
    
    res.status(200).json(history);
  } catch (error) {
    logger.error('Error in getDownloadHistory controller', error);
    res.status(500).json({ error: 'Failed to get download history' });
  }
};