import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { DockerService } from './docker.service';

@Controller('api/v1/docker')
export class DockerController {
  constructor(private readonly dockerService: DockerService) {}

  @Get('containers')
  async getContainers() {
    return this.dockerService.getContainers();
  }

  @Get('stacks')
  async getStacks() {
    return this.dockerService.getStacks();
  }

  @Get('images')
  async getImages() {
    return this.dockerService.getImages();
  }

  @Post('restart-container/:id')
  async restartContainer(@Param('id') containerId: string) {
    return this.dockerService.restartContainer(containerId);
  }

  @Post('restart-stack/:id')
  async restartStack(@Param('id') stackId: string) {
    return this.dockerService.restartStack(stackId);
  }

  @Get('container-logs/:id')
  async getContainerLogs(
    @Param('id') containerId: string,
    @Query('lines') lines?: string
  ) {
    const logLines = lines ? parseInt(lines, 10) : 100;
    return this.dockerService.getContainerLogs(containerId, logLines);
  }
}