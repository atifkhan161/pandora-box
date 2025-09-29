import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { DatabaseModule } from '../database/database.module';
import { EncryptionService } from './encryption.service';

@Module({
  imports: [DatabaseModule, HttpModule],
  controllers: [SettingsController],
  providers: [SettingsService, EncryptionService],
  exports: [SettingsService, EncryptionService],
})
export class SettingsModule {}