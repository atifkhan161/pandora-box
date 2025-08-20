import { Request, Response } from 'express';
import { getSettings, updateSettings, logActivity } from '../services/database';
import portainerService from '../services/portainerService';
import { logger } from '../utils/logger';

/**
 * Get system settings
 */
export const getSystemSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const settingsCollection = getSettings();
    const allSettings = settingsCollection.find();
    
    // Convert to object format
    const settings: any = {};
    allSettings.forEach(setting => {
      settings[setting.key] = setting.value;
    });
    
    // Remove sensitive information
    const safeSettings = { ...settings };
    delete safeSettings.tmdbApiKey;
    delete safeSettings.jackettApiKey;
    delete safeSettings.qbittorrentPassword;
    delete safeSettings.cloudCommanderPassword;
    delete safeSettings.portainerPassword;
    delete safeSettings.jellyfinApiKey;
    
    res.status(200).json(safeSettings);
  } catch (error) {
    logger.error('Error in getSystemSettings controller', error);
    res.status(500).json({ error: 'Failed to get system settings' });
  }
};

/**
 * Update system settings
 */
export const updateSystemSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const newSettings = req.body;
    
    // Validate required settings
    if (!newSettings) {
      res.status(400).json({ error: 'Settings object is required' });
      return;
    }
    
    // Update each setting
    Object.keys(newSettings).forEach(key => {
      updateSettings(key, newSettings[key]);
    });
    
    // Log activity
    logActivity((req as any).user?.id || 'unknown', 'update_settings', { updatedFields: Object.keys(newSettings) });
    logger.info(`Settings updated`);
    
    res.status(200).json({
      message: 'Settings updated successfully'
    });
  } catch (error) {
    logger.error('Error in updateSystemSettings controller', error);
    res.status(500).json({ error: 'Failed to update system settings' });
  }
};

/**
 * Get Docker containers
 */
export const getContainers = async (req: Request, res: Response): Promise<void> => {
  try {
    // First authenticate with Portainer
    await portainerService.authenticate('admin', process.env.PORTAINER_PASSWORD || 'admin');
    
    // Get endpoints
    const endpoints = await portainerService.getEndpoints();
    
    if (!endpoints || endpoints.length === 0) {
      res.status(404).json({ error: 'No Docker endpoints found' });
      return;
    }
    
    // Use the first endpoint
    const endpointId = endpoints[0].Id;
    
    // Get containers
    const containers = await portainerService.getContainers(endpointId);
    
    // Log activity
    logActivity((req as any).user?.id || 'unknown', 'view_containers', {});
    
    res.status(200).json(containers);
  } catch (error) {
    logger.error('Error in getContainers controller', error);
    res.status(500).json({ error: 'Failed to get containers' });
  }
};

/**
 * Get container details
 */
export const getContainerDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // First authenticate with Portainer
    await portainerService.authenticate('admin', process.env.PORTAINER_PASSWORD || 'admin');
    
    // Get endpoints
    const endpoints = await portainerService.getEndpoints();
    
    if (!endpoints || endpoints.length === 0) {
      res.status(404).json({ error: 'No Docker endpoints found' });
      return;
    }
    
    // Use the first endpoint
    const endpointId = endpoints[0].Id;
    
    // Get container details
    const container = await portainerService.getContainerDetails(endpointId, id);
    
    // Log activity
    logActivity((req as any).user?.id || 'unknown', 'view_container_details', { containerId: id });
    
    res.status(200).json(container);
  } catch (error) {
    logger.error(`Error in getContainerDetails controller for container ${req.params.id}`, error);
    res.status(500).json({ error: 'Failed to get container details' });
  }
};

/**
 * Start container
 */
export const startContainer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // First authenticate with Portainer
    await portainerService.authenticate('admin', process.env.PORTAINER_PASSWORD || 'admin');
    
    // Get endpoints
    const endpoints = await portainerService.getEndpoints();
    
    if (!endpoints || endpoints.length === 0) {
      res.status(404).json({ error: 'No Docker endpoints found' });
      return;
    }
    
    // Use the first endpoint
    const endpointId = endpoints[0].Id;
    
    // Start container
    await portainerService.startContainer(endpointId, id);
    
    // Log activity
    logActivity((req as any).user?.id || 'unknown', 'start_container', { containerId: id });
    logger.info(`Container started: ${id}`);
    
    res.status(200).json({ message: 'Container started successfully' });
  } catch (error) {
    logger.error(`Error in startContainer controller for container ${req.params.id}`, error);
    res.status(500).json({ error: 'Failed to start container' });
  }
};

/**
 * Stop container
 */
export const stopContainer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // First authenticate with Portainer
    await portainerService.authenticate('admin', process.env.PORTAINER_PASSWORD || 'admin');
    
    // Get endpoints
    const endpoints = await portainerService.getEndpoints();
    
    if (!endpoints || endpoints.length === 0) {
      res.status(404).json({ error: 'No Docker endpoints found' });
      return;
    }
    
    // Use the first endpoint
    const endpointId = endpoints[0].Id;
    
    // Stop container
    await portainerService.stopContainer(endpointId, id);
    
    // Log activity
    logActivity((req as any).user?.id || 'unknown', 'stop_container', { containerId: id });
    logger.info(`Container stopped: ${id}`);
    
    res.status(200).json({ message: 'Container stopped successfully' });
  } catch (error) {
    logger.error(`Error in stopContainer controller for container ${req.params.id}`, error);
    res.status(500).json({ error: 'Failed to stop container' });
  }
};

/**
 * Restart container
 */
export const restartContainer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // First authenticate with Portainer
    await portainerService.authenticate('admin', process.env.PORTAINER_PASSWORD || 'admin');
    
    // Get endpoints
    const endpoints = await portainerService.getEndpoints();
    
    if (!endpoints || endpoints.length === 0) {
      res.status(404).json({ error: 'No Docker endpoints found' });
      return;
    }
    
    // Use the first endpoint
    const endpointId = endpoints[0].Id;
    
    // Restart container
    await portainerService.restartContainer(endpointId, id);
    
    // Log activity
    logActivity((req as any).user?.id || 'unknown', 'restart_container', { containerId: id });
    logger.info(`Container restarted: ${id}`);
    
    res.status(200).json({ message: 'Container restarted successfully' });
  } catch (error) {
    logger.error(`Error in restartContainer controller for container ${req.params.id}`, error);
    res.status(500).json({ error: 'Failed to restart container' });
  }
};

/**
 * Get container logs
 */
export const getContainerLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { tail } = req.query;
    
    // First authenticate with Portainer
    await portainerService.authenticate('admin', process.env.PORTAINER_PASSWORD || 'admin');
    
    // Get endpoints
    const endpoints = await portainerService.getEndpoints();
    
    if (!endpoints || endpoints.length === 0) {
      res.status(404).json({ error: 'No Docker endpoints found' });
      return;
    }
    
    // Use the first endpoint
    const endpointId = endpoints[0].Id;
    
    // Get container logs
    const logs = await portainerService.getContainerLogs(endpointId, id, tail ? parseInt(tail as string, 10) : 100);
    
    // Log activity
    logActivity((req as any).user?.id || 'unknown', 'view_container_logs', { containerId: id });
    
    res.status(200).json({ logs });
  } catch (error) {
    logger.error(`Error in getContainerLogs controller for container ${req.params.id}`, error);
    res.status(500).json({ error: 'Failed to get container logs' });
  }
};

/**
 * Get system activity logs
 */
export const getActivityLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { getActivityLogs: getActivityLogsCollection } = await import('../services/database');
    const logsCollection = getActivityLogsCollection();
    const logs = logsCollection.find();
    
    res.status(200).json(logs);
  } catch (error) {
    logger.error('Error in getActivityLogs controller', error);
    res.status(500).json({ error: 'Failed to get activity logs' });
  }
};