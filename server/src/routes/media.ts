import { Router } from 'express';
import { searchMovies, searchTVShows, getMovieDetails, getTVShowDetails, getTVSeasonDetails, getPopularMovies, getPopularTVShows } from '../controllers/mediaController';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @route   GET /api/v1/media/movies/search
 * @desc    Search for movies
 * @access  Private
 */
router.get('/movies/search', authenticate, searchMovies);

/**
 * @route   GET /api/v1/media/tv/search
 * @desc    Search for TV shows
 * @access  Private
 */
router.get('/tv/search', authenticate, searchTVShows);

/**
 * @route   GET /api/v1/media/movies/:id
 * @desc    Get movie details
 * @access  Private
 */
router.get('/movies/:id', authenticate, getMovieDetails);

/**
 * @route   GET /api/v1/media/tv/:id
 * @desc    Get TV show details
 * @access  Private
 */
router.get('/tv/:id', authenticate, getTVShowDetails);

/**
 * @route   GET /api/v1/media/tv/:id/season/:seasonNumber
 * @desc    Get TV season details
 * @access  Private
 */
router.get('/tv/:id/season/:seasonNumber', authenticate, getTVSeasonDetails);

/**
 * @route   GET /api/v1/media/movies/popular
 * @desc    Get popular movies
 * @access  Private
 */
router.get('/movies/popular', authenticate, getPopularMovies);

/**
 * @route   GET /api/v1/media/tv/popular
 * @desc    Get popular TV shows
 * @access  Private
 */
router.get('/tv/popular', authenticate, getPopularTVShows);

export default router;