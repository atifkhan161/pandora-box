import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { DownloadsService } from './downloads.service';

@Controller('downloads')
export class DownloadsController {
  constructor(private readonly downloadsService: DownloadsService) {}

  @Get('search-torrents/:query')
  async searchTorrents(@Param('query') query: string) {
    return await this.downloadsService.searchTorrents(query);
  }

  @Post('add-torrent')
  async addTorrent(@Body() body: { magnetLink: string; title: string }) {
    return await this.downloadsService.addTorrent(body.magnetLink, body.title);
  }

  @Get()
  async getDownloads() {
    return await this.downloadsService.getDownloads();
  }

  @Put(':hash/pause')
  async pauseDownload(@Param('hash') hash: string) {
    return await this.downloadsService.pauseDownload(hash);
  }

  @Put(':hash/resume')
  async resumeDownload(@Param('hash') hash: string) {
    return await this.downloadsService.resumeDownload(hash);
  }

  @Delete(':hash')
  async removeDownload(@Param('hash') hash: string) {
    return await this.downloadsService.removeDownload(hash);
  }
}