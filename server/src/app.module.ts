import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { DatabaseModule } from './modules/database/database.module';
import { SettingsModule } from './modules/settings/settings.module';

@Module({
  imports: [
    AuthModule,
    DatabaseModule,
    SettingsModule,
  ],
})
export class AppModule {}