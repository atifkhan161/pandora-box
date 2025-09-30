import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { DatabaseService } from '../database/database.service';
import { EncryptionService } from '../settings/encryption.service';

@Injectable()
export class JellyfinService {
  constructor(
    private readonly httpService: HttpService,
    private readonly databaseService: DatabaseService,
    private readonly encryptionService: EncryptionService,
  ) {}

  /**
   * Get all libraries from Jellyfin server
   * @returns Libraries list
   */
  async getLibraries(): Promise<any> {
    try {
      const { url, apiKey } = await this.getJellyfinConfig();
      if (!url || !apiKey) {
        return { success: false, message: 'Jellyfin configuration not found' };
      }

      const baseUrl = url.replace(/\/$/, '');
      const response = await this.httpService.axiosRef.get(
        `${baseUrl}/Library/VirtualFolders`,
        {
          headers: { 'X-Emby-Token': apiKey },
          timeout: 10000
        }
      );

      if (response.status === 200) {
        return { success: true, data: response.data };
      } else {
        return { success: false, message: 'Failed to fetch libraries' };
      }
    } catch (error) {
      return { success: false, message: `Failed to fetch libraries: ${error.message}` };
    }
  }

  /**
   * Update specific library by ID
   * @param libraryId Library ID to update
   * @returns Update result
   */
  async updateLibraryById(libraryId: string): Promise<any> {
    try {
      const { url, apiKey } = await this.getJellyfinConfig();
      if (!url || !apiKey) {
        return { success: false, message: 'Jellyfin configuration not found' };
      }

      const baseUrl = url.replace(/\/$/, '');
      const response = await this.httpService.axiosRef.post(
        `${baseUrl}/Items/${libraryId}/Refresh?Recursive=true&ImageRefreshMode=Default&MetadataRefreshMode=Default`,
        {},
        {
          headers: { 'X-Emby-Token': apiKey },
          timeout: 10000
        }
      );

      if (response.status === 204 || response.status === 200) {
        return { success: true, message: 'Library update initiated successfully' };
      } else {
        return { success: false, message: 'Failed to initiate library update' };
      }
    } catch (error) {
      return { success: false, message: `Failed to update library: ${error.message}` };
    }
  }

  /**
   * Trigger a full library scan on Jellyfin server
   * @returns Library scan result
   */
  async updateLibrary(): Promise<any> {
    try {
      // Get Jellyfin configuration
      const configCollection = this.databaseService.getConfigCollection();
      const config = configCollection.findOne({ type: 'jellyfin-config' });
      
      if (!config || !config.config) {
        return { success: false, message: 'Jellyfin configuration not found' };
      }

      const { url, apiKey: encryptedApiKey } = config.config;
      
      if (!url || !encryptedApiKey) {
        return { success: false, message: 'Incomplete Jellyfin configuration' };
      }

      let apiKey;
      try {
        apiKey = this.encryptionService.decrypt(encryptedApiKey);
      } catch (error) {
        return { success: false, message: 'Failed to decrypt Jellyfin API key' };
      }

      // Trigger library scan
      const baseUrl = url.replace(/\/$/, '');
      const response = await this.httpService.axiosRef.post(
        `${baseUrl}/Library/Refresh`,
        {},
        {
          headers: {
            'X-Emby-Token': apiKey
          },
          timeout: 10000
        }
      );

      if (response.status === 204 || response.status === 200) {
        return { success: true, message: 'Library update initiated successfully' };
      } else {
        return { success: false, message: 'Failed to initiate library update' };
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        return { success: false, message: 'Cannot connect to Jellyfin - service may be down' };
      }
      return { success: false, message: `Failed to update library: ${error.message}` };
    }
  }

  /**
   * Get Jellyfin configuration
   * @returns Configuration object
   */
  private async getJellyfinConfig(): Promise<{ url: string; apiKey: string }> {
    const configCollection = this.databaseService.getConfigCollection();
    const config = configCollection.findOne({ type: 'jellyfin-config' });
    
    if (!config || !config.config) {
      return { url: '', apiKey: '' };
    }

    const { url, apiKey: encryptedApiKey } = config.config;
    
    if (!url || !encryptedApiKey) {
      return { url: '', apiKey: '' };
    }

    try {
      const apiKey = this.encryptionService.decrypt(encryptedApiKey);
      return { url, apiKey };
    } catch (error) {
      return { url: '', apiKey: '' };
    }
  }
}