import { Controller, Post, Get, Param } from '@nestjs/common';
import { JellyfinService } from './jellyfin.service';

@Controller('jellyfin')
export class JellyfinController {
  constructor(private readonly jellyfinService: JellyfinService) {}

  @Get('libraries')
  async getLibraries() {
    return this.jellyfinService.getLibraries();
  }

  @Post('update-library')
  async updateLibrary() {
    return this.jellyfinService.updateLibrary();
  }

  @Post('update-library/:id')
  async updateLibraryById(@Param('id') libraryId: string) {
    return this.jellyfinService.updateLibraryById(libraryId);
  }
}