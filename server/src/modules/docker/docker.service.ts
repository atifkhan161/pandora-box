import { Injectable } from '@nestjs/common';
import { PortainerService } from './portainer.service';

@Injectable()
export class DockerService {
  constructor(private readonly portainerService: PortainerService) {}

  async getContainers(): Promise<any> {
    return this.portainerService.getContainers();
  }

  async getStacks(): Promise<any> {
    return this.portainerService.getStacks();
  }

  async getImages(): Promise<any> {
    return this.portainerService.getImages();
  }

  async restartContainer(containerId: string): Promise<any> {
    return this.portainerService.restartContainer(containerId);
  }

  async restartStack(stackId: string): Promise<any> {
    return this.portainerService.restartStack(stackId);
  }

  async getContainerLogs(containerId: string, lines?: number): Promise<any> {
    return this.portainerService.getContainerLogs(containerId, lines);
  }
}