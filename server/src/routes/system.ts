import { Router } from 'express';
import { getSystemSettings, updateSystemSettings, getContainers, getContainerDetails, startContainer, stopContainer, restartContainer, getContainerLogs, getActivityLogs } from '../controllers/systemController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

/**
 * @route   GET /api/v1/system/settings
 * @desc    Get system settings
 * @access  Private
 */
router.get('/settings', authenticate, getSystemSettings);

/**
 * @route   PUT /api/v1/system/settings
 * @desc    Update system settings
 * @access  Private (Admin only)
 */
router.put('/settings', authenticate, authorize(['admin']), updateSystemSettings);

/**
 * @route   GET /api/v1/system/containers
 * @desc    Get Docker containers
 * @access  Private (Admin only)
 */
router.get('/containers', authenticate, authorize(['admin']), getContainers);

/**
 * @route   GET /api/v1/system/containers/:id
 * @desc    Get container details
 * @access  Private (Admin only)
 */
router.get('/containers/:id', authenticate, authorize(['admin']), getContainerDetails);

/**
 * @route   POST /api/v1/system/containers/:id/start
 * @desc    Start container
 * @access  Private (Admin only)
 */
router.post('/containers/:id/start', authenticate, authorize(['admin']), startContainer);

/**
 * @route   POST /api/v1/system/containers/:id/stop
 * @desc    Stop container
 * @access  Private (Admin only)
 */
router.post('/containers/:id/stop', authenticate, authorize(['admin']), stopContainer);

/**
 * @route   POST /api/v1/system/containers/:id/restart
 * @desc    Restart container
 * @access  Private (Admin only)
 */
router.post('/containers/:id/restart', authenticate, authorize(['admin']), restartContainer);

/**
 * @route   GET /api/v1/system/containers/:id/logs
 * @desc    Get container logs
 * @access  Private (Admin only)
 */
router.get('/containers/:id/logs', authenticate, authorize(['admin']), getContainerLogs);

/**
 * @route   GET /api/v1/system/logs
 * @desc    Get system activity logs
 * @access  Private (Admin only)
 */
router.get('/logs', authenticate, authorize(['admin']), getActivityLogs);

/**
 * @route   GET /api/v1/system/stats
 * @desc    Get system statistics
 * @access  Private
 */
router.get('/stats', authenticate, (req, res) => {
  res.json({ cpu: 0, memory: 0, disk: 0 });
});

export default router;