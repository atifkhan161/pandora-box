import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { TmdbService } from './tmdb.service';
import { WatchmodeService } from './watchmode.service';
import { DatabaseModule } from '../database/database.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    HttpModule,
    DatabaseModule,
    SettingsModule
  ],
  controllers: [MediaController],
  providers: [
    MediaService,
    TmdbService,
    WatchmodeService
  ],
  exports: [MediaService]
})
export class MediaModule {}