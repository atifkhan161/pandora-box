import { Request, Response } from 'express';
import tmdbService from '../services/tmdbService';
import { getMediaCache, logActivity } from '../services/database';
import { logger } from '../utils/logger';

/**
 * Search for movies
 */
export const searchMovies = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, page } = req.query;
    
    if (!query) {
      res.status(400).json({ error: 'Search query is required' });
      return;
    }

    const pageNumber = page ? parseInt(page as string, 10) : 1;
    const results = await tmdbService.searchMovies(query as string, pageNumber);
    
    // Log search activity
    if (req.user) {
      logActivity(req.user.id, 'search_movies', { query, page: pageNumber });
    }

    res.status(200).json(results);
  } catch (error) {
    logger.error('Error in searchMovies controller', error);
    res.status(500).json({ error: 'Failed to search movies' });
  }
};

/**
 * Search for TV shows
 */
export const searchTVShows = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, page } = req.query;
    
    if (!query) {
      res.status(400).json({ error: 'Search query is required' });
      return;
    }

    const pageNumber = page ? parseInt(page as string, 10) : 1;
    const results = await tmdbService.searchTVShows(query as string, pageNumber);
    
    // Log search activity
    if (req.user) {
      logActivity(req.user.id, 'search_tv_shows', { query, page: pageNumber });
    }

    res.status(200).json(results);
  } catch (error) {
    logger.error('Error in searchTVShows controller', error);
    res.status(500).json({ error: 'Failed to search TV shows' });
  }
};

/**
 * Get movie details
 */
export const getMovieDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const movieId = parseInt(id, 10);
    
    if (isNaN(movieId)) {
      res.status(400).json({ error: 'Invalid movie ID' });
      return;
    }

    // Check cache first
    const mediaCache = getMediaCache();
    const cachedMovie = mediaCache.findOne({ tmdbId: movieId, mediaType: 'movie' });
    
    let movieDetails;
    if (cachedMovie && cachedMovie.data) {
      movieDetails = cachedMovie.data;
      logger.info(`Serving cached movie details for ID ${movieId}`);
    } else {
      movieDetails = await tmdbService.getMovieDetails(movieId);
      
      // Cache the results
      if (movieDetails) {
        mediaCache.insert({
          tmdbId: movieId,
          mediaType: 'movie',
          data: movieDetails,
          cachedAt: new Date()
        });
      }
    }
    
    // Log activity
    if (req.user) {
      logActivity(req.user.id, 'view_movie_details', { movieId });
    }

    res.status(200).json(movieDetails);
  } catch (error) {
    logger.error('Error in getMovieDetails controller', error);
    res.status(500).json({ error: 'Failed to get movie details' });
  }
};

/**
 * Get TV show details
 */
export const getTVShowDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tvId = parseInt(id, 10);
    
    if (isNaN(tvId)) {
      res.status(400).json({ error: 'Invalid TV show ID' });
      return;
    }

    // Check cache first
    const mediaCache = getMediaCache();
    const cachedTVShow = mediaCache.findOne({ tmdbId: tvId, mediaType: 'tv' });
    
    let tvDetails;
    if (cachedTVShow && cachedTVShow.data) {
      tvDetails = cachedTVShow.data;
      logger.info(`Serving cached TV show details for ID ${tvId}`);
    } else {
      tvDetails = await tmdbService.getTVShowDetails(tvId);
      
      // Cache the results
      if (tvDetails) {
        mediaCache.insert({
          tmdbId: tvId,
          mediaType: 'tv',
          data: tvDetails,
          cachedAt: new Date()
        });
      }
    }
    
    // Log activity
    if (req.user) {
      logActivity(req.user.id, 'view_tv_show_details', { tvId });
    }

    res.status(200).json(tvDetails);
  } catch (error) {
    logger.error('Error in getTVShowDetails controller', error);
    res.status(500).json({ error: 'Failed to get TV show details' });
  }
};

/**
 * Get TV season details
 */
export const getTVSeasonDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, seasonNumber } = req.params;
    const tvId = parseInt(id, 10);
    const season = parseInt(seasonNumber, 10);
    
    if (isNaN(tvId) || isNaN(season)) {
      res.status(400).json({ error: 'Invalid TV show ID or season number' });
      return;
    }

    // Check cache first
    const mediaCache = getMediaCache();
    const cachedSeason = mediaCache.findOne({ 
      tmdbId: tvId, 
      mediaType: 'tv_season',
      seasonNumber: season 
    });
    
    let seasonDetails;
    if (cachedSeason && cachedSeason.data) {
      seasonDetails = cachedSeason.data;
      logger.info(`Serving cached TV season details for TV ID ${tvId}, season ${season}`);
    } else {
      seasonDetails = await tmdbService.getTVSeasonDetails(tvId, season);
      
      // Cache the results
      if (seasonDetails) {
        mediaCache.insert({
          tmdbId: tvId,
          mediaType: 'tv_season',
          seasonNumber: season,
          data: seasonDetails,
          cachedAt: new Date()
        });
      }
    }
    
    // Log activity
    if (req.user) {
      logActivity(req.user.id, 'view_tv_season_details', { tvId, seasonNumber: season });
    }

    res.status(200).json(seasonDetails);
  } catch (error) {
    logger.error('Error in getTVSeasonDetails controller', error);
    res.status(500).json({ error: 'Failed to get TV season details' });
  }
};

/**
 * Get popular movies
 */
export const getPopularMovies = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page } = req.query;
    const pageNumber = page ? parseInt(page as string, 10) : 1;
    
    const results = await tmdbService.getPopularMovies(pageNumber);
    
    res.status(200).json(results);
  } catch (error) {
    logger.error('Error in getPopularMovies controller', error);
    res.status(500).json({ error: 'Failed to get popular movies' });
  }
};

/**
 * Get popular TV shows
 */
export const getPopularTVShows = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page } = req.query;
    const pageNumber = page ? parseInt(page as string, 10) : 1;
    
    const results = await tmdbService.getPopularTVShows(pageNumber);
    
    res.status(200).json(results);
  } catch (error) {
    logger.error('Error in getPopularTVShows controller', error);
    res.status(500).json({ error: 'Failed to get popular TV shows' });
  }
};