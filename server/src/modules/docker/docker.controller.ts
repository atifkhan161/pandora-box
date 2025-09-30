import { Controller, Get, Post, Put, Param, Query, Body } from '@nestjs/common';
import { DockerService } from './docker.service';

@Controller('docker')
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

  @Get('stack/:id')
  async getStackDetails(@Param('id') stackId: string) {
    return this.dockerService.getStackDetails(stackId);
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

  @Post('change-country/:id')
  async changeCountry(@Param('id') stackId: string, @Body() body: { country: string }) {
    return this.dockerService.changeCountry(stackId, body.country);
  }

  @Get('stacks/:id/file')
  async getStackFile(@Param('id') stackId: string) {
    return this.dockerService.getStackFile(stackId);
  }

  @Put('stacks/:id/file')
  async updateStackFile(@Param('id') stackId: string, @Body() body: { content: string }) {
    return this.dockerService.updateStackFile(stackId, body.content);
  }

  @Get('stacks/:id/logs')
  async getStackLogs(@Param('id') stackId: string) {
    return this.dockerService.getStackLogs(stackId);
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