import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { DatabaseModule } from './modules/database/database.module';
import { SettingsModule } from './modules/settings/settings.module';
import { MediaModule } from './modules/media/media.module';
import { DownloadsModule } from './modules/downloads/downloads.module';

@Module({
  imports: [
    AuthModule,
    DatabaseModule,
    SettingsModule,
    MediaModule,
    DownloadsModule,
  ],
})
export class AppModule {}