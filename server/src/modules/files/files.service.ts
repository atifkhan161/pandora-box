import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { FilebrowserService } from './filebrowser.service';
import { SettingsService } from '../settings/settings.service';
import { BrowseFilesResponse, MoveFileResponse } from './dto/files.dto';

@Injectable()
export class FilesService {
  constructor(
    private readonly filebrowserService: FilebrowserService,
    private readonly settingsService: SettingsService,
  ) {}

  /**
   * Get configured folder paths from settings
   */
  private async getFolderPaths(): Promise<{ downloads: string; movies: string; tvShows: string }> {
    const filebrowserConfig = await this.settingsService.getFilebrowserConfig();
    
    return {
      downloads: '/',
      movies: filebrowserConfig.data.moviesPath || '/',
      tvShows: filebrowserConfig.data.showsPath || '/',
    };
  }

  /**
   * Browse files and folders in a directory
   * If no path provided, use the configured downloads folder
   */
  async browseFiles(path?: string): Promise<BrowseFilesResponse> {
    try {
      if (!path) {
        const paths = await this.getFolderPaths();
        path = paths.downloads;
      }

      const result = await this.filebrowserService.listFiles(path);
      
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to browse files',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Move a file from downloads folder to movies folder
   */
  async moveToMovies(filename: string, sourcePath?: string): Promise<MoveFileResponse> {
    try {
      const paths = await this.getFolderPaths();
      
      const source = sourcePath ? `${sourcePath}/${filename}`.replace('//', '/') : `${paths.downloads}/${filename}`;
      const destination = `${paths.movies}/${filename}`.replace('//', '/');

      await this.filebrowserService.moveFile(source, destination);

      return {
        success: true,
        message: `File moved to movies folder successfully`,
        source,
        destination,
      };
    } catch (error) {
      console.error('Move to movies error:', error);
      throw new HttpException(
        'Failed to move file',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Move a file from downloads folder to TV shows folder
   */
  async moveToTvShows(filename: string, sourcePath?: string): Promise<MoveFileResponse> {
    try {
      const paths = await this.getFolderPaths();
      
      const source = sourcePath ? `${sourcePath}/${filename}`.replace('//', '/') : `${paths.downloads}/${filename}`;
      const destination = `${paths.tvShows}/${filename}`.replace('//', '/');

      await this.filebrowserService.moveFile(source, destination);

      return {
        success: true,
        message: `File moved to TV shows folder successfully`,
        source,
        destination,
      };
    } catch (error) {
      console.error('Move to TV shows error:', error);
      throw new HttpException(
        'Failed to move file',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}