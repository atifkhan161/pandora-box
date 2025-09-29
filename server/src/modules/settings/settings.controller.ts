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

  @Put('password')
  async updatePassword(@Body() passwordData: any) {
    // In a real app, get username from JWT token
    const username = 'admin'; // Hardcoded for now
    return this.settingsService.updatePassword(username, passwordData);
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

  @Get('env-config')
  async getEnvironmentConfig() {
    return this.settingsService.getEnvironmentConfig();
  }

  @Put('env-config')
  async updateEnvironmentConfig(@Body() envConfig: any) {
    return this.settingsService.updateEnvironmentConfig(envConfig);
  }

  @Get('test-connection/:serviceName')
  async testConnection(@Param('serviceName') serviceName: string) {
    return this.settingsService.testConnection(serviceName);
  }

  @Put('qbittorrent')
  async updateQbittorrentConfig(@Body() qbittorrentConfig: any) {
    return this.settingsService.updateQbittorrentConfig(qbittorrentConfig);
  }

  @Get('qbittorrent')
  async getQbittorrentConfig() {
    return this.settingsService.getQbittorrentConfig();
  }
}