import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { FilebrowserService } from './filebrowser.service';
import { JellyfinService } from './jellyfin.service';
import { JellyfinController } from './jellyfin.controller';
import { SettingsModule } from '../settings/settings.module';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [HttpModule, SettingsModule, DatabaseModule],
  controllers: [FilesController, JellyfinController],
  providers: [FilesService, FilebrowserService, JellyfinService],
  exports: [FilesService, JellyfinService],
})
export class FilesModule {}