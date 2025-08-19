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
 * @route   DELETE /api/v1/files/:path
 * @desc    Remove file or directory
 * @access  Private
 */
router.delete('/:path', authenticate, removeFileOrDirectory);

/**
 * @route   PUT /api/v1/files/:oldPath
 * @desc    Rename file or directory
 * @access  Private
 */
router.put('/:oldPath', authenticate, renameFileOrDirectory);

/**
 * @route   POST /api/v1/files/copy
 * @desc    Copy file or directory
 * @access  Private
 */
router.post('/copy', authenticate, copyFileOrDirectory);

/**
 * @route   GET /api/v1/files/content/:path
 * @desc    Get file content
 * @access  Private
 */
router.get('/content/:path', authenticate, getFileContent);

/**
 * @route   PUT /api/v1/files/content/:path
 * @desc    Update file content
 * @access  Private
 */
router.put('/content/:path', authenticate, updateFileContent);

export default router;