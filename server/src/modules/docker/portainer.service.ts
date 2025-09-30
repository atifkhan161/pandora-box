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

  private async getPortainerConfig(): Promise<{ url: string; apiKey: string; endpointId: string }> {
    const config = await this.settingsService.getPortainerConfig();
    
    if (!config.success || !config.data.url || !config.data.apiKey) {
      throw new HttpException('Portainer configuration not found. Please configure Portainer in settings.', HttpStatus.BAD_REQUEST);
    }

    return {
      url: config.data.url,
      apiKey: config.data.apiKey,
      endpointId: config.data.endpointId || '2',
    };
  }

  async getContainers(): Promise<any> {
    const config = await this.getPortainerConfig();
    const baseUrl = config.url.replace(/\/$/, '');

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${baseUrl}/api/endpoints/${config.endpointId}/docker/containers/json?all=true`, {
          headers: {
            'X-API-Key': config.apiKey,
          },
        })
      );

      return response.data;
    } catch (error) {
      console.error('Portainer API error:', error.response?.data || error.message);
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

      // Enhance stacks with current country info
      const stacks = await Promise.all(response.data.map(async (stack) => {
        try {
          const details = await this.getStackDetails(stack.Id);
          const country = this.extractCountryFromCompose(details.StackFileContent);
          return { ...stack, currentCountry: country };
        } catch {
          return { ...stack, currentCountry: 'Unknown' };
        }
      }));

      return stacks;
    } catch (error) {
      throw new HttpException('Failed to fetch stacks from Portainer', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getStackDetails(stackId: string): Promise<any> {
    const config = await this.getPortainerConfig();
    const baseUrl = config.url.replace(/\/$/, '');

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${baseUrl}/api/stacks/${stackId}`, {
          headers: {
            'X-API-Key': config.apiKey,
          },
        })
      );

      return response.data;
    } catch (error) {
      throw new HttpException('Failed to fetch stack details', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private extractCountryFromCompose(composeContent: string): string {
    const match = composeContent.match(/SERVER_COUNTRIES=([^\n\s]*)/i);
    return match ? match[1] : 'Not Set';
  }

  async getImages(): Promise<any> {
    const config = await this.getPortainerConfig();
    const baseUrl = config.url.replace(/\/$/, '');

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${baseUrl}/api/endpoints/${config.endpointId}/docker/images/json`, {
          headers: {
            'X-API-Key': config.apiKey,
          },
        })
      );

      return response.data;
    } catch (error) {
      console.error('Portainer API error:', error.response?.data || error.message);
      throw new HttpException('Failed to fetch images from Portainer', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async restartContainer(containerId: string): Promise<any> {
    const config = await this.getPortainerConfig();
    const baseUrl = config.url.replace(/\/$/, '');

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${baseUrl}/api/endpoints/${config.endpointId}/docker/containers/${containerId}/restart`, {}, {
          headers: {
            'X-API-Key': config.apiKey,
          },
        })
      );

      return { success: true, message: 'Container restarted successfully' };
    } catch (error) {
      console.error('Portainer API error:', error.response?.data || error.message);
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
        this.httpService.get(`${baseUrl}/api/endpoints/${config.endpointId}/docker/containers/${containerId}/logs?stdout=true&stderr=true&tail=${lines}`, {
          headers: {
            'X-API-Key': config.apiKey,
          },
        })
      );

      return { logs: response.data };
    } catch (error) {
      console.error('Portainer API error:', error.response?.data || error.message);
      throw new HttpException('Failed to fetch container logs', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async changeCountry(stackId: string, country: string): Promise<any> {
    const config = await this.getPortainerConfig();
    const baseUrl = config.url.replace(/\/$/, '');

    try {
      // Get stack details
      const stackResponse = await firstValueFrom(
        this.httpService.get(`${baseUrl}/api/stacks/${stackId}`, {
          headers: {
            'X-API-Key': config.apiKey,
          },
        })
      );

      const stack = stackResponse.data;
      console.log('Stack data:', JSON.stringify(stack, null, 2));
      
      // Use Docker API directly to update environment variable
      const gluetunContainers = await firstValueFrom(
        this.httpService.get(`${baseUrl}/api/endpoints/${config.endpointId}/docker/containers/json?all=true&filters={"label":["com.docker.compose.project=${stack.Name}","com.docker.compose.service=gluetun"]}`, {
          headers: {
            'X-API-Key': config.apiKey,
          },
        })
      );

      if (gluetunContainers.data.length === 0) {
        throw new Error('Gluetun container not found in stack');
      }

      const gluetunContainer = gluetunContainers.data[0];
      
      // Stop container
      await firstValueFrom(
        this.httpService.post(`${baseUrl}/api/endpoints/${config.endpointId}/docker/containers/${gluetunContainer.Id}/stop`, {}, {
          headers: {
            'X-API-Key': config.apiKey,
          },
        })
      );

      // Get container config
      const containerInfo = await firstValueFrom(
        this.httpService.get(`${baseUrl}/api/endpoints/${config.endpointId}/docker/containers/${gluetunContainer.Id}/json`, {
          headers: {
            'X-API-Key': config.apiKey,
          },
        })
      );

      // Update environment variables
      const env = containerInfo.data.Config.Env.map(envVar => {
        if (envVar.startsWith('SERVER_COUNTRIES=')) {
          return `SERVER_COUNTRIES=${country}`;
        }
        return envVar;
      });

      // Create new container with updated env
      const createResponse = await firstValueFrom(
        this.httpService.post(`${baseUrl}/api/endpoints/${config.endpointId}/docker/containers/create?name=${gluetunContainer.Names[0].replace('/', '')}_new`, {
          ...containerInfo.data.Config,
          Env: env,
          HostConfig: containerInfo.data.HostConfig,
          NetworkingConfig: containerInfo.data.NetworkSettings
        }, {
          headers: {
            'X-API-Key': config.apiKey,
          },
        })
      );

      // Remove old container
      await firstValueFrom(
        this.httpService.delete(`${baseUrl}/api/endpoints/${config.endpointId}/docker/containers/${gluetunContainer.Id}?force=true`, {
          headers: {
            'X-API-Key': config.apiKey,
          },
        })
      );

      // Start new container
      await firstValueFrom(
        this.httpService.post(`${baseUrl}/api/endpoints/${config.endpointId}/docker/containers/${createResponse.data.Id}/start`, {}, {
          headers: {
            'X-API-Key': config.apiKey,
          },
        })
      );

      return { success: true, message: `Country changed to ${country} and stack restarted` };
    } catch (error) {
      console.error('Portainer API error:', error.response?.data || error.message);
      throw new HttpException('Failed to change country', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getStackFile(stackId: string): Promise<any> {
    const config = await this.getPortainerConfig();
    const baseUrl = config.url.replace(/\/$/, '');

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${baseUrl}/api/stacks/${stackId}/file`, {
          headers: {
            'X-API-Key': config.apiKey,
          },
          responseType: 'text'
        })
      );

      return { content: response.data };
    } catch (error) {
      throw new HttpException('Failed to get stack file', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateStackFile(stackId: string, content: string): Promise<any> {
    const config = await this.getPortainerConfig();
    const baseUrl = config.url.replace(/\/$/, '');

    try {
      await firstValueFrom(
        this.httpService.put(`${baseUrl}/api/stacks/${stackId}?endpointId=${config.endpointId}`, {
          stackFileContent: content,
          prune: false
        }, {
          headers: {
            'X-API-Key': config.apiKey,
          },
        })
      );

      return { success: true, message: 'Stack file updated successfully' };
    } catch (error) {
      throw new HttpException('Failed to update stack file', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getStackLogs(stackId: string): Promise<any> {
    const config = await this.getPortainerConfig();
    const baseUrl = config.url.replace(/\/$/, '');

    try {
      // Get stack containers
      const stackResponse = await firstValueFrom(
        this.httpService.get(`${baseUrl}/api/stacks/${stackId}`, {
          headers: {
            'X-API-Key': config.apiKey,
          },
        })
      );

      const stack = stackResponse.data;
      const containers = await firstValueFrom(
        this.httpService.get(`${baseUrl}/api/endpoints/${config.endpointId}/docker/containers/json?all=true&filters={"label":["com.docker.compose.project=${stack.Name}"]}`, {
          headers: {
            'X-API-Key': config.apiKey,
          },
        })
      );

      const logs = await Promise.all(
        containers.data.map(async (container) => {
          try {
            const logResponse = await firstValueFrom(
              this.httpService.get(`${baseUrl}/api/endpoints/${config.endpointId}/docker/containers/${container.Id}/logs?stdout=true&stderr=true&tail=50`, {
                headers: {
                  'X-API-Key': config.apiKey,
                },
              })
            );
            return {
              containerName: container.Names[0].replace('/', ''),
              logs: logResponse.data
            };
          } catch {
            return {
              containerName: container.Names[0].replace('/', ''),
              logs: 'Failed to fetch logs'
            };
          }
        })
      );

      return { logs };
    } catch (error) {
      throw new HttpException('Failed to get stack logs', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}