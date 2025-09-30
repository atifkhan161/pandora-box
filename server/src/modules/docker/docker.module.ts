import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DockerController } from './docker.controller';
import { DockerService } from './docker.service';
import { PortainerService } from './portainer.service';
import { DatabaseModule } from '../database/database.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [HttpModule, DatabaseModule, SettingsModule],
  controllers: [DockerController],
  providers: [DockerService, PortainerService],
  exports: [DockerService, PortainerService]
})
export class DockerModule {}