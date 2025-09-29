import { Controller, Get, Query, Param, HttpException, HttpStatus } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaSearchDto, MediaDetailsDto, TrendingMediaDto } from './dto/media.dto';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get('trending')
  async getTrending(@Query() query: TrendingMediaDto) {
    try {
      const { type = 'all', page = 1, limit = 20 } = query;
      const data = await this.mediaService.getTrending(type, page, limit);
      
      return {
        success: true,
        data,
        pagination: {
          page: data.page || page,
          totalPages: data.total_pages || 1,
          totalResults: data.total_results || 0
        }
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to fetch trending media',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('latest-movies')
  async getLatestMovies(@Query('page') page = 1) {
    try {
      const data = await this.mediaService.getLatestMovies(page);
      
      return {
        success: true,
        data,
        pagination: {
          page: data.page || page,
          totalPages: data.total_pages || 1,
          totalResults: data.total_results || 0
        }
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to fetch latest movies',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('latest-tvshows')
  async getLatestTvShows(@Query('page') page = 1) {
    try {
      const data = await this.mediaService.getLatestTvShows(page);
      
      return {
        success: true,
        data,
        pagination: {
          page: data.page || page,
          totalPages: data.total_pages || 1,
          totalResults: data.total_results || 0
        }
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to fetch latest TV shows',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('details/:mediaType/:id')
  async getMediaDetails(@Param() params: MediaDetailsDto) {
    try {
      const { mediaType, id } = params;
      
      if (!['movie', 'tv'].includes(mediaType)) {
        throw new HttpException(
          {
            success: false,
            message: 'Invalid media type. Must be "movie" or "tv"'
          },
          HttpStatus.BAD_REQUEST
        );
      }
      
      const data = await this.mediaService.getMediaDetails(mediaType, id);
      
      return {
        success: true,
        data
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to fetch media details',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('movies/:category')
  async getMoviesByCategory(@Param('category') category: string, @Query('page') page = 1) {
    try {
      const validCategories = ['popular', 'top_rated', 'now_playing', 'upcoming'];
      
      if (!validCategories.includes(category)) {
        throw new HttpException(
          {
            success: false,
            message: 'Invalid movie category'
          },
          HttpStatus.BAD_REQUEST
        );
      }
      
      const data = await this.mediaService.getMoviesByCategory(category, page);
      
      return {
        success: true,
        data,
        pagination: {
          page: data.page || page,
          totalPages: data.total_pages || 1,
          totalResults: data.total_results || 0
        }
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to fetch movies',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('tv/:category')
  async getTvShowsByCategory(@Param('category') category: string, @Query('page') page = 1) {
    try {
      const validCategories = ['popular', 'top_rated', 'on_the_air', 'airing_today'];
      
      if (!validCategories.includes(category)) {
        throw new HttpException(
          {
            success: false,
            message: 'Invalid TV show category'
          },
          HttpStatus.BAD_REQUEST
        );
      }
      
      const data = await this.mediaService.getTvShowsByCategory(category, page);
      
      return {
        success: true,
        data,
        pagination: {
          page: data.page || page,
          totalPages: data.total_pages || 1,
          totalResults: data.total_results || 0
        }
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to fetch TV shows',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('search')
  async searchMedia(@Query() query: MediaSearchDto) {
    try {
      const { query: searchQuery, type, page = 1 } = query;
      
      if (!searchQuery || searchQuery.trim().length === 0) {
        throw new HttpException(
          {
            success: false,
            message: 'Search query is required'
          },
          HttpStatus.BAD_REQUEST
        );
      }
      
      if (type && !['movie', 'tv', 'person'].includes(type)) {
        throw new HttpException(
          {
            success: false,
            message: 'Invalid search type. Must be "movie", "tv", or "person"'
          },
          HttpStatus.BAD_REQUEST
        );
      }
      
      const data = await this.mediaService.searchMedia(searchQuery, type, page);
      
      return {
        success: true,
        data,
        pagination: {
          page: data.page || page,
          totalPages: data.total_pages || 1,
          totalResults: data.total_results || 0
        }
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to search media',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}