import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { SettingsService } from '../settings/settings.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class FilebrowserService {
  constructor(
    private readonly httpService: HttpService,
    private readonly settingsService: SettingsService,
  ) {}

  /**
   * Get filebrowser configuration from encrypted settings
   */
  private async getFilebrowserConfig(): Promise<{ url: string; username: string; password: string }> {
    const config = await this.settingsService.getFilebrowserConfig();
    
    if (!config.success || !config.data.url || !config.data.username || !config.data.password) {
      throw new HttpException('Filebrowser configuration not found. Please configure filebrowser in settings.', HttpStatus.BAD_REQUEST);
    }

    return {
      url: config.data.url,
      username: config.data.username,
      password: config.data.password,
    };
  }

  /**
   * Authenticate with filebrowser and get JWT token
   */
  private async authenticate(): Promise<string> {
    const config = await this.getFilebrowserConfig();
    const baseUrl = config.url.replace(/\/$/, '');

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${baseUrl}/api/login`, {
          username: config.username,
          password: config.password,
        })
      );

      return response.data;
    } catch (error) {
      throw new HttpException('Failed to authenticate with filebrowser', HttpStatus.UNAUTHORIZED);
    }
  }

  /**
   * List files and directories in a path
   */
  async listFiles(path: string): Promise<any> {
    const config = await this.getFilebrowserConfig();
    const token = await this.authenticate();
    const baseUrl = config.url.replace(/\/$/, '');

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${baseUrl}/api/resources${path}`, {
          headers: {
            'X-Auth': token,
          },
        })
      );

      return {
        path,
        items: response.data.items || [],
      };
    } catch (error) {
      throw new HttpException('Failed to list files', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Move a file from source to destination
   */
  async moveFile(sourcePath: string, destinationPath: string): Promise<any> {
    const config = await this.getFilebrowserConfig();
    const token = await this.authenticate();
    const baseUrl = config.url.replace(/\/$/, '');

    try {
      const response = await firstValueFrom(
        this.httpService.patch(`${baseUrl}/api/resources${sourcePath}`, {
          action: 'rename',
          destination: destinationPath,
        }, {
          headers: {
            'X-Auth': token,
          },
        })
      );

      return { success: true, message: 'File moved successfully' };
    } catch (error) {
      throw new HttpException('Failed to move file', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}