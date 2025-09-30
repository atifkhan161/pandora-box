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

  async getStackDetails(stackId: string): Promise<any> {
    return this.portainerService.getStackDetails(stackId);
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

  async changeCountry(stackId: string, country: string): Promise<any> {
    return this.portainerService.changeCountry(stackId, country);
  }

  async getStackFile(stackId: string): Promise<any> {
    return this.portainerService.getStackFile(stackId);
  }

  async updateStackFile(stackId: string, content: string): Promise<any> {
    return this.portainerService.updateStackFile(stackId, content);
  }

  async getStackLogs(stackId: string): Promise<any> {
    return this.portainerService.getStackLogs(stackId);
  }
}