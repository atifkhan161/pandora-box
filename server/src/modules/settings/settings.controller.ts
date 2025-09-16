import { Controller, Get, Put, Body, Param } from '@nestjs/common';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Put('profile')
  async updateProfile(@Body() profileData: any) {
    // In a real app, get username from JWT token
    const username = 'admin'; // Hardcoded for now
    return this.settingsService.updateProfile(username, profileData);
  }

  @Put('api-keys')
  async updateApiKeys(@Body() apiKeys: any) {
    return this.settingsService.updateApiKeys(apiKeys);
  }

  @Put('file-paths')
  async updateFilePaths(@Body() paths: any) {
    return this.settingsService.updateFilePaths(paths);
  }

  @Get('api-keys')
  async getApiKeys() {
    return this.settingsService.getApiKeys();
  }

  @Get('file-paths')
  async getFilePaths() {
    return this.settingsService.getFilePaths();
  }

  @Get('test-connection/:serviceName')
  async testConnection(@Param('serviceName') serviceName: string) {
    return this.settingsService.testConnection(serviceName);
  }
}