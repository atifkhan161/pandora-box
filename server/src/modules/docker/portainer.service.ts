import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { SettingsService } from '../settings/settings.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PortainerService {
  constructor(
    private readonly httpService: HttpService,
    private readonly settingsService: SettingsService,
  ) {}

  private async getPortainerConfig(): Promise<{ url: string; apiKey: string }> {
    const config = await this.settingsService.getPortainerConfig();
    
    if (!config.success || !config.data.url || !config.data.apiKey) {
      throw new HttpException('Portainer configuration not found. Please configure Portainer in settings.', HttpStatus.BAD_REQUEST);
    }

    return {
      url: config.data.url,
      apiKey: config.data.apiKey,
    };
  }

  async getContainers(): Promise<any> {
    const config = await this.getPortainerConfig();
    const baseUrl = config.url.replace(/\/$/, '');

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${baseUrl}/api/endpoints/1/docker/containers/json?all=true`, {
          headers: {
            'X-API-Key': config.apiKey,
          },
        })
      );

      return response.data;
    } catch (error) {
      throw new HttpException('Failed to fetch containers from Portainer', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getStacks(): Promise<any> {
    const config = await this.getPortainerConfig();
    const baseUrl = config.url.replace(/\/$/, '');

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${baseUrl}/api/stacks`, {
          headers: {
            'X-API-Key': config.apiKey,
          },
        })
      );

      return response.data;
    } catch (error) {
      throw new HttpException('Failed to fetch stacks from Portainer', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getImages(): Promise<any> {
    const config = await this.getPortainerConfig();
    const baseUrl = config.url.replace(/\/$/, '');

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${baseUrl}/api/endpoints/1/docker/images/json`, {
          headers: {
            'X-API-Key': config.apiKey,
          },
        })
      );

      return response.data;
    } catch (error) {
      throw new HttpException('Failed to fetch images from Portainer', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async restartContainer(containerId: string): Promise<any> {
    const config = await this.getPortainerConfig();
    const baseUrl = config.url.replace(/\/$/, '');

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${baseUrl}/api/endpoints/1/docker/containers/${containerId}/restart`, {}, {
          headers: {
            'X-API-Key': config.apiKey,
          },
        })
      );

      return { success: true, message: 'Container restarted successfully' };
    } catch (error) {
      throw new HttpException('Failed to restart container', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async restartStack(stackId: string): Promise<any> {
    const config = await this.getPortainerConfig();
    const baseUrl = config.url.replace(/\/$/, '');

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${baseUrl}/api/stacks/${stackId}/stop`, {}, {
          headers: {
            'X-API-Key': config.apiKey,
          },
        })
      );

      await firstValueFrom(
        this.httpService.post(`${baseUrl}/api/stacks/${stackId}/start`, {}, {
          headers: {
            'X-API-Key': config.apiKey,
          },
        })
      );

      return { success: true, message: 'Stack restarted successfully' };
    } catch (error) {
      throw new HttpException('Failed to restart stack', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getContainerLogs(containerId: string, lines: number = 100): Promise<any> {
    const config = await this.getPortainerConfig();
    const baseUrl = config.url.replace(/\/$/, '');

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${baseUrl}/api/endpoints/1/docker/containers/${containerId}/logs?stdout=true&stderr=true&tail=${lines}`, {
          headers: {
            'X-API-Key': config.apiKey,
          },
        })
      );

      return { logs: response.data };
    } catch (error) {
      throw new HttpException('Failed to fetch container logs', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}