import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { JackettService } from './jackett.service';
import { QbittorrentService } from './qbittorrent.service';

@Injectable()
export class DownloadsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jackettService: JackettService,
    private readonly qbittorrentService: QbittorrentService,
  ) {}

  async searchTorrents(query: string): Promise<any> {
    const results = await this.jackettService.searchTorrents(query);
    
    // Log search in database
    const downloadsCollection = this.databaseService.getDownloadsCollection();
    downloadsCollection.insert({
      type: 'search',
      query,
      results: results.length,
      timestamp: new Date(),
    });

    return results;
  }

  async addTorrent(magnetLink: string, title: string): Promise<any> {
    const result = await this.qbittorrentService.addTorrent(magnetLink);
    
    // Persist download record
    const downloadsCollection = this.databaseService.getDownloadsCollection();
    downloadsCollection.insert({
      type: 'download',
      title,
      magnetLink,
      status: 'queued',
      addedAt: new Date(),
    });

    return result;
  }

  async getDownloads(): Promise<any> {
    return await this.qbittorrentService.getTorrents();
  }

  async pauseDownload(hash: string): Promise<any> {
    return await this.qbittorrentService.pauseTorrent(hash);
  }

  async resumeDownload(hash: string): Promise<any> {
    return await this.qbittorrentService.resumeTorrent(hash);
  }

  async removeDownload(hash: string): Promise<any> {
    return await this.qbittorrentService.removeTorrent(hash);
  }
}