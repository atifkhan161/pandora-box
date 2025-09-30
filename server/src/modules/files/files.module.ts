import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { FilebrowserService } from './filebrowser.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [HttpModule, SettingsModule],
  controllers: [FilesController],
  providers: [FilesService, FilebrowserService],
  exports: [FilesService],
})
export class FilesModule {}