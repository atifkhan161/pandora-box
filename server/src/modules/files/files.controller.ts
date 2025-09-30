import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { FilesService } from './files.service';
import { MoveFileDto, BrowseFilesResponse, MoveFileResponse } from './dto/files.dto';

@Controller('api/v1/files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  /**
   * Browse files and folders in a specified directory
   * Initial path should be the configurable downloads folder
   */
  @Get('browse')
  async browseFiles(@Query('path') path?: string): Promise<BrowseFilesResponse> {
    return this.filesService.browseFiles(path);
  }

  /**
   * Move a file from downloads folder to movies folder
   */
  @Post('move-to-movies')
  async moveToMovies(@Body() body: MoveFileDto): Promise<MoveFileResponse> {
    return this.filesService.moveToMovies(body.filename);
  }

  /**
   * Move a file from downloads folder to TV shows folder
   */
  @Post('move-to-tvshows')
  async moveToTvShows(@Body() body: MoveFileDto): Promise<MoveFileResponse> {
    return this.filesService.moveToTvShows(body.filename);
  }
}