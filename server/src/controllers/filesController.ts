import { Request, Response } from 'express';
import cloudCommanderService from '../services/cloudCommanderService';
import { logActivity } from '../services/database';
import { logger } from '../utils/logger';

/**
 * Get directory contents
 */
export const getDirectoryContents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { path } = req.query;
    const dirPath = path ? path as string : '/';
    
    const contents = await cloudCommanderService.getDirectoryContents(dirPath);
    
    // Log activity
    if (req.user) {
      logActivity(req.user.id, 'browse_directory', { path: dirPath });
    }

    res.status(200).json(contents);
  } catch (error) {
    logger.error('Error in getDirectoryContents controller', error);
    res.status(500).json({ error: 'Failed to get directory contents' });
  }
};

/**
 * Create directory
 */
export const createDirectory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { path } = req.body;
    
    if (!path) {
      res.status(400).json({ error: 'Path is required' });
      return;
    }

    const result = await cloudCommanderService.createDirectory(path);
    
    // Log activity
    logActivity(req.user.id, 'create_directory', { path });
    logger.info(`User ${req.user.username} created directory: ${path}`);

    res.status(201).json({ message: 'Directory created successfully', result });
  } catch (error) {
    logger.error('Error in createDirectory controller', error);
    res.status(500).json({ error: 'Failed to create directory' });
  }
};

/**
 * Remove file or directory
 */
export const removeFileOrDirectory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { path } = req.params;
    const { recursive } = req.query;
    
    if (!path) {
      res.status(400).json({ error: 'Path is required' });
      return;
    }

    const isRecursive = recursive === 'true';
    const result = await cloudCommanderService.remove(path, isRecursive);
    
    // Log activity
    logActivity(req.user.id, 'remove_file_or_directory', { path, recursive: isRecursive });
    logger.info(`User ${req.user.username} removed path: ${path}`);

    res.status(200).json({ message: 'File or directory removed successfully', result });
  } catch (error) {
    logger.error(`Error in removeFileOrDirectory controller for path ${req.params.path}`, error);
    res.status(500).json({ error: 'Failed to remove file or directory' });
  }
};

/**
 * Rename file or directory
 */
export const renameFileOrDirectory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { oldPath } = req.params;
    const { newPath } = req.body;
    
    if (!oldPath || !newPath) {
      res.status(400).json({ error: 'Old path and new path are required' });
      return;
    }

    const result = await cloudCommanderService.rename(oldPath, newPath);
    
    // Log activity
    logActivity(req.user.id, 'rename_file_or_directory', { oldPath, newPath });
    logger.info(`User ${req.user.username} renamed path from ${oldPath} to ${newPath}`);

    res.status(200).json({ message: 'File or directory renamed successfully', result });
  } catch (error) {
    logger.error(`Error in renameFileOrDirectory controller for path ${req.params.oldPath}`, error);
    res.status(500).json({ error: 'Failed to rename file or directory' });
  }
};

/**
 * Copy file or directory
 */
export const copyFileOrDirectory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fromPath, toPath } = req.body;
    
    if (!fromPath || !toPath) {
      res.status(400).json({ error: 'Source and destination paths are required' });
      return;
    }

    const result = await cloudCommanderService.copy(fromPath, toPath);
    
    // Log activity
    logActivity(req.user.id, 'copy_file_or_directory', { fromPath, toPath });
    logger.info(`User ${req.user.username} copied from ${fromPath} to ${toPath}`);

    res.status(200).json({ message: 'File or directory copied successfully', result });
  } catch (error) {
    logger.error('Error in copyFileOrDirectory controller', error);
    res.status(500).json({ error: 'Failed to copy file or directory' });
  }
};

/**
 * Get file content
 */
export const getFileContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { path } = req.params;
    
    if (!path) {
      res.status(400).json({ error: 'Path is required' });
      return;
    }

    const content = await cloudCommanderService.getFileContent(path);
    
    // Log activity
    logActivity(req.user.id, 'view_file_content', { path });

    res.status(200).json({ content });
  } catch (error) {
    logger.error(`Error in getFileContent controller for path ${req.params.path}`, error);
    res.status(500).json({ error: 'Failed to get file content' });
  }
};

/**
 * Update file content
 */
export const updateFileContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { path } = req.params;
    const { content } = req.body;
    
    if (!path || content === undefined) {
      res.status(400).json({ error: 'Path and content are required' });
      return;
    }

    const result = await cloudCommanderService.updateFileContent(path, content);
    
    // Log activity
    logActivity(req.user.id, 'update_file_content', { path });
    logger.info(`User ${req.user.username} updated file content: ${path}`);

    res.status(200).json({ message: 'File content updated successfully', result });
  } catch (error) {
    logger.error(`Error in updateFileContent controller for path ${req.params.path}`, error);
    res.status(500).json({ error: 'Failed to update file content' });
  }
};