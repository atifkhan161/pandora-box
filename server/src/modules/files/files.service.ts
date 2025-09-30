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
    const pathsConfig = await this.settingsService.getFilePaths();
    
    if (!pathsConfig.paths.downloads || !pathsConfig.paths.movies || !pathsConfig.paths.tvShows) {
      throw new HttpException('File paths not configured', HttpStatus.BAD_REQUEST);
    }

    return {
      downloads: pathsConfig.paths.downloads,
      movies: pathsConfig.paths.movies,
      tvShows: pathsConfig.paths.tvShows,
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
  async moveToMovies(filename: string): Promise<MoveFileResponse> {
    try {
      const paths = await this.getFolderPaths();
      
      const sourcePath = `${paths.downloads}/${filename}`;
      const destinationPath = `${paths.movies}/${filename}`;

      await this.filebrowserService.moveFile(sourcePath, destinationPath);

      return {
        success: true,
        message: `File moved to movies folder successfully`,
        source: sourcePath,
        destination: destinationPath,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to move file to movies folder',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Move a file from downloads folder to TV shows folder
   */
  async moveToTvShows(filename: string): Promise<MoveFileResponse> {
    try {
      const paths = await this.getFolderPaths();
      
      const sourcePath = `${paths.downloads}/${filename}`;
      const destinationPath = `${paths.tvShows}/${filename}`;

      await this.filebrowserService.moveFile(sourcePath, destinationPath);

      return {
        success: true,
        message: `File moved to TV shows folder successfully`,
        source: sourcePath,
        destination: destinationPath,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to move file to TV shows folder',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}