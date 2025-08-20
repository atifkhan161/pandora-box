import { Router } from 'express';
import { getDirectoryContents, createDirectory, removeFileOrDirectory, renameFileOrDirectory, copyFileOrDirectory, getFileContent, updateFileContent } from '../controllers/filesController';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @route   GET /api/v1/files
 * @desc    Get directory contents
 * @access  Private
 */
router.get('/', authenticate, getDirectoryContents);

/**
 * @route   POST /api/v1/files/directory
 * @desc    Create directory
 * @access  Private
 */
router.post('/directory', authenticate, createDirectory);

/**
 * @route   DELETE /api/v1/files/remove
 * @desc    Remove file or directory
 * @access  Private
 */
router.delete('/remove', authenticate, removeFileOrDirectory);

/**
 * @route   PUT /api/v1/files/rename
 * @desc    Rename file or directory
 * @access  Private
 */
router.put('/rename', authenticate, renameFileOrDirectory);

/**
 * @route   POST /api/v1/files/copy
 * @desc    Copy file or directory
 * @access  Private
 */
router.post('/copy', authenticate, copyFileOrDirectory);

/**
 * @route   GET /api/v1/files/content
 * @desc    Get file content
 * @access  Private
 */
router.get('/content', authenticate, getFileContent);

/**
 * @route   PUT /api/v1/files/content
 * @desc    Update file content
 * @access  Private
 */
router.put('/content', authenticate, updateFileContent);

export default router;