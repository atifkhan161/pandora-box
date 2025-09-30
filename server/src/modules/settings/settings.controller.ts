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

  @Get('api-keys')
  async getApiKeys() {
    return this.settingsService.getApiKeys();
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

  @Put('jackett')
  async updateJackettConfig(@Body() jackettConfig: any) {
    return this.settingsService.updateJackettConfig(jackettConfig);
  }

  @Get('jackett')
  async getJackettConfig() {
    return this.settingsService.getJackettConfig();
  }

  @Put('filebrowser')
  async updateFilebrowserConfig(@Body() filebrowserConfig: any) {
    return this.settingsService.updateFilebrowserConfig(filebrowserConfig);
  }

  @Get('filebrowser')
  async getFilebrowserConfig() {
    return this.settingsService.getFilebrowserConfig();
  }

  @Put('portainer')
  async updatePortainerConfig(@Body() portainerConfig: any) {
    return this.settingsService.updatePortainerConfig(portainerConfig);
  }

  @Get('portainer')
  async getPortainerConfig() {
    return this.settingsService.getPortainerConfig();
  }

  @Put('jellyfin')
  async updateJellyfinConfig(@Body() jellyfinConfig: any) {
    return this.settingsService.updateJellyfinConfig(jellyfinConfig);
  }

  @Get('jellyfin')
  async getJellyfinConfig() {
    return this.settingsService.getJellyfinConfig();
  }
}