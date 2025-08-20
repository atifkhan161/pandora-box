import { Router } from 'express';
import { searchTorrents, getIndexers, testIndexer, addTorrent, getTorrents, getTorrentDetails, pauseTorrent, resumeTorrent, deleteTorrent, getTransferInfo, getDownloadHistory } from '../controllers/downloadsController';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @route   GET /api/v1/downloads/search
 * @desc    Search for torrents
 * @access  Private
 */
router.get('/search', authenticate, searchTorrents);

/**
 * @route   GET /api/v1/downloads/indexers
 * @desc    Get all indexers
 * @access  Private
 */
router.get('/indexers', authenticate, getIndexers);

/**
 * @route   GET /api/v1/downloads/indexers/:id/test
 * @desc    Test indexer
 * @access  Private
 */
router.get('/indexers/:id/test', authenticate, testIndexer);

/**
 * @route   POST /api/v1/downloads/add
 * @desc    Add torrent from URL
 * @access  Private
 */
router.post('/add', authenticate, addTorrent);

/**
 * @route   GET /api/v1/downloads/torrents
 * @desc    Get all torrents
 * @access  Private
 */
router.get('/torrents', authenticate, getTorrents);

/**
 * @route   GET /api/v1/downloads/torrents/:hash
 * @desc    Get torrent details
 * @access  Private
 */
router.get('/torrents/:hash', authenticate, getTorrentDetails);

/**
 * @route   POST /api/v1/downloads/torrents/:hash/pause
 * @desc    Pause torrent
 * @access  Private
 */
router.post('/torrents/:hash/pause', authenticate, pauseTorrent);

/**
 * @route   POST /api/v1/downloads/torrents/:hash/resume
 * @desc    Resume torrent
 * @access  Private
 */
router.post('/torrents/:hash/resume', authenticate, resumeTorrent);

/**
 * @route   DELETE /api/v1/downloads/torrents/:hash
 * @desc    Delete torrent
 * @access  Private
 */
router.delete('/torrents/:hash', authenticate, deleteTorrent);

/**
 * @route   GET /api/v1/downloads/transfer-info
 * @desc    Get transfer info
 * @access  Private
 */
router.get('/transfer-info', authenticate, getTransferInfo);

/**
 * @route   GET /api/v1/downloads/history
 * @desc    Get download history
 * @access  Private
 */
router.get('/history', authenticate, getDownloadHistory);

export default router;