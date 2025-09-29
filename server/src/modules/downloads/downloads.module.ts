import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DownloadsController } from './downloads.controller';
import { DownloadsService } from './downloads.service';
import { JackettService } from './jackett.service';
import { QbittorrentService } from './qbittorrent.service';
import { DownloadsGateway } from './downloads.gateway';
import { DatabaseModule } from '../database/database.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [DatabaseModule, SettingsModule, HttpModule],
  controllers: [DownloadsController],
  providers: [DownloadsService, JackettService, QbittorrentService, DownloadsGateway],
  exports: [DownloadsService],
})
export class DownloadsModule {}