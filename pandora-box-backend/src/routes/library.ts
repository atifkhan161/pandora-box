import { Router } from 'express';
import { getUsers, getLibraries, getLibraryItems, getItemDetails, searchItems, getStreamUrl, refreshLibrary, getRecentlyAdded } from '../controllers/libraryController';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @route   GET /api/v1/library/users
 * @desc    Get Jellyfin users
 * @access  Private
 */
router.get('/users', authenticate, getUsers);

/**
 * @route   GET /api/v1/library/libraries
 * @desc    Get media libraries
 * @access  Private
 */
router.get('/libraries', authenticate, getLibraries);

/**
 * @route   GET /api/v1/library/libraries/:libraryId/items
 * @desc    Get library items
 * @access  Private
 */
router.get('/libraries/:libraryId/items', authenticate, getLibraryItems);

/**
 * @route   GET /api/v1/library/items/:itemId
 * @desc    Get item details
 * @access  Private
 */
router.get('/items/:itemId', authenticate, getItemDetails);

/**
 * @route   GET /api/v1/library/search
 * @desc    Search items
 * @access  Private
 */
router.get('/search', authenticate, searchItems);

/**
 * @route   GET /api/v1/library/stream/:itemId
 * @desc    Get stream URL
 * @access  Private
 */
router.get('/stream/:itemId', authenticate, getStreamUrl);

/**
 * @route   POST /api/v1/library/libraries/:libraryId/refresh
 * @desc    Refresh library
 * @access  Private
 */
router.post('/libraries/:libraryId/refresh', authenticate, refreshLibrary);

/**
 * @route   GET /api/v1/library/recent
 * @desc    Get recently added items
 * @access  Private
 */
router.get('/recent', authenticate, getRecentlyAdded);

export default router;