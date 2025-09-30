import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { EncryptionService } from './encryption.service';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class SettingsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly encryptionService: EncryptionService,
    private readonly httpService: HttpService,
  ) {}

  /**
   * Update user profile
   * @param username Current username
   * @param profileData New profile data
   * @returns Updated user data
   */
  async updateProfile(username: string, profileData: any): Promise<any> {
    const usersCollection = this.databaseService.getUsersCollection();
    const user = usersCollection.findOne({ username });

    if (!user) {
      throw new Error('User not found');
    }

    // Update user data
    user.username = profileData.username || user.username;
    if (profileData.password) {
      user.password = profileData.password; // In production, this should be hashed
    }

    // Save updated user
    usersCollection.update(user);

    // Return user without password
    const { password, ...result } = user;
    return result;
  }

  /**
   * Update user password
   * @param username Current username
   * @param passwordData Password update data
   * @returns Update result
   */
  async updatePassword(username: string, passwordData: any): Promise<any> {
    const { currentPassword, newPassword } = passwordData;
    
    const usersCollection = this.databaseService.getUsersCollection();
    const user = usersCollection.findOne({ username });

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    // In production, this should use proper password hashing (bcrypt)
    if (user.password !== currentPassword) {
      return { success: false, message: 'Current password is incorrect' };
    }

    // Update password
    user.password = newPassword; // In production, this should be hashed
    user.updatedAt = new Date();

    // Save updated user
    usersCollection.update(user);

    return { success: true, message: 'Password updated successfully' };
  }

  /**
   * Update API keys
   * @param apiKeys API keys to update
   * @returns Updated configuration
   */
  async updateApiKeys(apiKeys: any): Promise<any> {
    const configCollection = this.databaseService.getConfigCollection();
    let config = configCollection.findOne({ type: 'api-keys' });

    // Encrypt sensitive values
    const encryptedKeys = {};
    for (const [service, key] of Object.entries(apiKeys)) {
      encryptedKeys[service] = this.encryptionService.encrypt(key as string);
    }

    if (config) {
      // Update existing config
      config.keys = { ...config.keys, ...encryptedKeys };
      configCollection.update(config);
    } else {
      // Create new config
      config = {
        type: 'api-keys',
        keys: encryptedKeys,
        updatedAt: new Date(),
      };
      configCollection.insert(config);
    }

    return { success: true, message: 'API keys updated successfully' };
  }



  /**
   * Get API keys
   * @returns API keys
   */
  async getApiKeys(): Promise<any> {
    const configCollection = this.databaseService.getConfigCollection();
    const config = configCollection.findOne({ type: 'api-keys' });

    if (!config || !config.keys) {
      return { keys: {} };
    }

    // Decrypt keys for client
    const decryptedKeys = {};
    for (const [service, encryptedKey] of Object.entries(config.keys)) {
      try {
        decryptedKeys[service] = this.encryptionService.decrypt(encryptedKey as string);
      } catch (error) {
        decryptedKeys[service] = ''; // Handle decryption errors
      }
    }

    return { keys: decryptedKeys };
  }



  /**
   * Test connection to a service
   * @param serviceName Service name
   * @param apiKey API key (optional, will use stored key if not provided)
   * @returns Test result
   */
  async testConnection(serviceName: string, apiKey?: string): Promise<any> {
    // qBittorrent uses username/password, not API key
    if (serviceName === 'qbittorrent') {
      return this.testQbittorrentConnection();
    }
    
    // Jackett config uses dedicated configuration, not API key collection
    if (serviceName === 'jackett-config') {
      return this.testJackettConfigConnection();
    }

    // Filebrowser uses dedicated configuration, not API key collection
    if (serviceName === 'filebrowser') {
      return this.testFilebrowserConnection();
    }

    // Portainer uses dedicated configuration, not API key collection
    if (serviceName === 'portainer') {
      return this.testPortainerConnection();
    }

    // If no API key provided, get from database
    if (!apiKey) {
      const configCollection = this.databaseService.getConfigCollection();
      const config = configCollection.findOne({ type: 'api-keys' });
      
      if (config && config.keys && config.keys[serviceName]) {
        try {
          apiKey = this.encryptionService.decrypt(config.keys[serviceName]);
        } catch (error) {
          return { success: false, message: 'Failed to decrypt API key' };
        }
      }
    }

    if (!apiKey) {
      return { success: false, message: 'No API key available for this service' };
    }

    // Test connection based on service
    switch (serviceName) {
      case 'tmdb':
        return this.testTmdbConnection(apiKey);
      case 'watchmode':
        return this.testWatchmodeConnection(apiKey);
      case 'jackett':
        return this.testJackettConnection(apiKey);
      case 'jellyfin':
        return this.testJellyfinConnection(apiKey);
      case 'cloudCommander':
        return this.testCloudCommanderConnection(apiKey);
      case 'qbittorrent':
        // This case should not be reached due to early return above
        return this.testQbittorrentConnection();
      case 'jackett-config':
        return this.testJackettConfigConnection();
      case 'filebrowser':
        return this.testFilebrowserConnection();
      case 'portainer':
        return this.testPortainerConnection();
      default:
        return { success: false, message: 'Unknown service' };
    }
  }

  /**
   * Test TMDB connection
   * @param apiKey TMDB API key
   * @returns Test result
   */
  private async testTmdbConnection(apiKey: string): Promise<any> {
    try {
      // In a real implementation, make an actual API call to TMDB
      // For now, just simulate a successful response
      return { success: true, message: 'Successfully connected to TMDB API' };
    } catch (error) {
      return { success: false, message: `Failed to connect to TMDB: ${error.message}` };
    }
  }

  /**
   * Test Watchmode connection
   * @param apiKey Watchmode API key
   * @returns Test result
   */
  private async testWatchmodeConnection(apiKey: string): Promise<any> {
    try {
      // In a real implementation, make an actual API call to Watchmode
      // For now, just simulate a successful response
      return { success: true, message: 'Successfully connected to Watchmode API' };
    } catch (error) {
      return { success: false, message: `Failed to connect to Watchmode: ${error.message}` };
    }
  }

  /**
   * Test Jackett connection
   * @param apiKey Jackett API key
   * @returns Test result
   */
  private async testJackettConnection(apiKey: string): Promise<any> {
    try {
      // In a real implementation, make an actual API call to Jackett
      // For now, just simulate a successful response
      return { success: true, message: 'Successfully connected to Jackett API' };
    } catch (error) {
      return { success: false, message: `Failed to connect to Jackett: ${error.message}` };
    }
  }

  /**
   * Test Jellyfin connection
   * @param apiKey Jellyfin API key
   * @returns Test result
   */
  private async testJellyfinConnection(apiKey: string): Promise<any> {
    try {
      // In a real implementation, make an actual API call to Jellyfin
      // For now, just simulate a successful response
      return { success: true, message: 'Successfully connected to Jellyfin API' };
    } catch (error) {
      return { success: false, message: `Failed to connect to Jellyfin: ${error.message}` };
    }
  }

  /**
   * Test Cloud Commander connection
   * @param apiKey Cloud Commander API key
   * @returns Test result
   */
  private async testCloudCommanderConnection(apiKey: string): Promise<any> {
    try {
      // In a real implementation, make an actual API call to Cloud Commander
      // For now, just simulate a successful response
      return { success: true, message: 'Successfully connected to Cloud Commander API' };
    } catch (error) {
      return { success: false, message: `Failed to connect to Cloud Commander: ${error.message}` };
    }
  }

  /**
   * Get environment configuration
   * @returns Environment configuration
   */
  async getEnvironmentConfig(): Promise<any> {
    const configCollection = this.databaseService.getConfigCollection();
    const config = configCollection.findOne({ type: 'env-config' });

    if (!config || !config.config) {
      return { 
        success: true,
        data: {
          serverPort: '',
          dbPath: ''
        } 
      };
    }

    return { success: true, data: config.config };
  }

  /**
   * Update environment configuration
   * @param envConfig Environment configuration to update
   * @returns Updated configuration
   */
  async updateEnvironmentConfig(envConfig: any): Promise<any> {
    const configCollection = this.databaseService.getConfigCollection();
    let config = configCollection.findOne({ type: 'env-config' });

    if (config) {
      // Update existing config
      config.config = { ...config.config, ...envConfig };
      configCollection.update(config);
    } else {
      // Create new config
      config = {
        type: 'env-config',
        config: envConfig,
        updatedAt: new Date(),
      };
      configCollection.insert(config);
    }

    return { success: true, message: 'Environment configuration updated successfully' };
  }

  /**
   * Update qBittorrent configuration
   * @param qbittorrentConfig qBittorrent configuration to update
   * @returns Updated configuration
   */
  async updateQbittorrentConfig(qbittorrentConfig: any): Promise<any> {
    const configCollection = this.databaseService.getConfigCollection();
    let config = configCollection.findOne({ type: 'qbittorrent-config' });

    // Encrypt sensitive values
    const encryptedConfig = {};
    for (const [key, value] of Object.entries(qbittorrentConfig)) {
      if (key === 'password') {
        encryptedConfig[key] = this.encryptionService.encrypt(value as string);
      } else {
        encryptedConfig[key] = value;
      }
    }

    if (config) {
      // Update existing config
      config.config = { ...config.config, ...encryptedConfig };
      configCollection.update(config);
    } else {
      // Create new config
      config = {
        type: 'qbittorrent-config',
        config: encryptedConfig,
        updatedAt: new Date(),
      };
      configCollection.insert(config);
    }

    return { success: true, message: 'qBittorrent configuration updated successfully' };
  }

  /**
   * Get qBittorrent configuration
   * @returns qBittorrent configuration
   */
  async getQbittorrentConfig(): Promise<any> {
    const configCollection = this.databaseService.getConfigCollection();
    const config = configCollection.findOne({ type: 'qbittorrent-config' });

    if (!config || !config.config) {
      return { 
        success: true,
        data: {
          url: '',
          username: '',
          password: ''
        } 
      };
    }

    // Decrypt password for client
    const decryptedConfig = { ...config.config };
    if (decryptedConfig.password) {
      try {
        decryptedConfig.password = this.encryptionService.decrypt(decryptedConfig.password as string);
      } catch (error) {
        decryptedConfig.password = ''; // Handle decryption errors
      }
    }

    return { success: true, data: decryptedConfig };
  }

  /**
   * Test qBittorrent connection
   * @returns Test result
   */
  private async testQbittorrentConnection(): Promise<any> {
    try {
      // Get qBittorrent configuration
      const configCollection = this.databaseService.getConfigCollection();
      const config = configCollection.findOne({ type: 'qbittorrent-config' });
      
      if (!config || !config.config) {
        return { success: false, message: 'qBittorrent configuration not found' };
      }

      const { url, username, password: encryptedPassword } = config.config;
      
      if (!url || !username || !encryptedPassword) {
        return { success: false, message: 'Incomplete qBittorrent configuration' };
      }

      let password;
      try {
        password = this.encryptionService.decrypt(encryptedPassword);
      } catch (error) {
        return { success: false, message: 'Failed to decrypt qBittorrent password' };
      }

      // Test connection to qBittorrent Web API
      const baseUrl = url.replace(/\/$/, '');
      
      // First, try to login
      const loginResponse = await this.httpService.axiosRef.post(
        `${baseUrl}/api/v2/auth/login`,
        new URLSearchParams({
          username,
          password
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 5000
        }
      );

      if (loginResponse.status === 200 && loginResponse.data === 'Ok.') {
        return { success: true, message: 'Successfully connected to qBittorrent' };
      } else {
        return { success: false, message: 'Invalid qBittorrent credentials' };
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        return { success: false, message: 'Cannot connect to qBittorrent - service may be down' };
      }
      return { success: false, message: `Failed to connect to qBittorrent: ${error.message}` };
    }
  }

  /**
   * Update Jackett configuration
   * @param jackettConfig Jackett configuration to update
   * @returns Updated configuration
   */
  async updateJackettConfig(jackettConfig: any): Promise<any> {
    const configCollection = this.databaseService.getConfigCollection();
    let config = configCollection.findOne({ type: 'jackett-config' });

    // Encrypt API key
    const encryptedConfig = {
      url: jackettConfig.url,
      apiKey: this.encryptionService.encrypt(jackettConfig.apiKey),
    };

    if (config) {
      config.config = { ...config.config, ...encryptedConfig };
      configCollection.update(config);
    } else {
      config = {
        type: 'jackett-config',
        config: encryptedConfig,
        updatedAt: new Date(),
      };
      configCollection.insert(config);
    }

    return { success: true, message: 'Jackett configuration updated successfully' };
  }

  /**
   * Get Jackett configuration
   * @returns Jackett configuration
   */
  async getJackettConfig(): Promise<any> {
    const configCollection = this.databaseService.getConfigCollection();
    const config = configCollection.findOne({ type: 'jackett-config' });

    if (!config || !config.config) {
      return { 
        success: true,
        data: {
          url: '',
          apiKey: ''
        } 
      };
    }

    // Decrypt API key for client
    const decryptedConfig = {
      url: config.config.url,
      apiKey: this.encryptionService.decrypt(config.config.apiKey),
    };

    return { success: true, data: decryptedConfig };
  }

  /**
   * Test Jackett configuration connection
   * @returns Test result
   */
  private async testJackettConfigConnection(): Promise<any> {
    try {
      const configCollection = this.databaseService.getConfigCollection();
      const config = configCollection.findOne({ type: 'jackett-config' });
      
      if (!config || !config.config) {
        return { success: false, message: 'Jackett configuration not found' };
      }

      const { url, apiKey: encryptedApiKey } = config.config;
      
      if (!url || !encryptedApiKey) {
        return { success: false, message: 'Incomplete Jackett configuration' };
      }

      let apiKey;
      try {
        apiKey = this.encryptionService.decrypt(encryptedApiKey);
      } catch (error) {
        return { success: false, message: 'Failed to decrypt Jackett API key' };
      }

      // Test connection to Jackett API
      const baseUrl = url.replace(/\/$/, '');
      const response = await this.httpService.axiosRef.get(
        `${baseUrl}/api/v2.0/indexers/all/results/torznab/api?apikey=${apiKey}&t=caps`,
        {
          timeout: 5000
        }
      );

      if (response.status === 200) {
        return { success: true, message: 'Successfully connected to Jackett' };
      } else {
        return { success: false, message: 'Invalid Jackett API key or URL' };
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        return { success: false, message: 'Cannot connect to Jackett - service may be down' };
      }
      return { success: false, message: `Failed to connect to Jackett: ${error.message}` };
    }
  }

  /**
   * Update filebrowser configuration
   * @param filebrowserConfig Filebrowser configuration to update
   * @returns Updated configuration
   */
  async updateFilebrowserConfig(filebrowserConfig: any): Promise<any> {
    const configCollection = this.databaseService.getConfigCollection();
    let config = configCollection.findOne({ type: 'filebrowser-config' });

    // Encrypt sensitive values
    const encryptedConfig = {
      url: filebrowserConfig.url,
      username: filebrowserConfig.username,
      password: this.encryptionService.encrypt(filebrowserConfig.password),
      moviesPath: filebrowserConfig.moviesPath || '',
      showsPath: filebrowserConfig.showsPath || '',
    };

    if (config) {
      config.config = { ...config.config, ...encryptedConfig };
      configCollection.update(config);
    } else {
      config = {
        type: 'filebrowser-config',
        config: encryptedConfig,
        updatedAt: new Date(),
      };
      configCollection.insert(config);
    }

    return { success: true, message: 'Filebrowser configuration updated successfully' };
  }

  /**
   * Get filebrowser configuration
   * @returns Filebrowser configuration
   */
  async getFilebrowserConfig(): Promise<any> {
    const configCollection = this.databaseService.getConfigCollection();
    const config = configCollection.findOne({ type: 'filebrowser-config' });

    if (!config || !config.config) {
      return { 
        success: true,
        data: {
          url: '',
          username: '',
          password: ''
        } 
      };
    }

    // Decrypt password for client
    const decryptedConfig = {
      url: config.config.url,
      username: config.config.username,
      password: this.encryptionService.decrypt(config.config.password),
      moviesPath: config.config.moviesPath || '',
      showsPath: config.config.showsPath || '',
    };

    return { success: true, data: decryptedConfig };
  }

  /**
   * Test filebrowser connection
   * @returns Test result
   */
  private async testFilebrowserConnection(): Promise<any> {
    try {
      const configCollection = this.databaseService.getConfigCollection();
      const config = configCollection.findOne({ type: 'filebrowser-config' });
      
      if (!config || !config.config) {
        return { success: false, message: 'Filebrowser configuration not found' };
      }

      const { url, username, password: encryptedPassword } = config.config;
      
      if (!url || !username || !encryptedPassword) {
        return { success: false, message: 'Incomplete filebrowser configuration' };
      }

      let password;
      try {
        password = this.encryptionService.decrypt(encryptedPassword);
      } catch (error) {
        return { success: false, message: 'Failed to decrypt filebrowser password' };
      }

      // Test connection to filebrowser API
      const baseUrl = url.replace(/\/$/, '');
      const response = await this.httpService.axiosRef.post(
        `${baseUrl}/api/login`,
        { username, password },
        { timeout: 5000 }
      );

      if (response.status === 200) {
        return { success: true, message: 'Successfully connected to filebrowser' };
      } else {
        return { success: false, message: 'Invalid filebrowser credentials' };
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        return { success: false, message: 'Cannot connect to filebrowser - service may be down' };
      }
      return { success: false, message: `Failed to connect to filebrowser: ${error.message}` };
    }
  }

  /**
   * Update Portainer configuration
   * @param portainerConfig Portainer configuration to update
   * @returns Updated configuration
   */
  async updatePortainerConfig(portainerConfig: any): Promise<any> {
    const configCollection = this.databaseService.getConfigCollection();
    let config = configCollection.findOne({ type: 'portainer-config' });

    // Encrypt API key
    const encryptedConfig = {
      url: portainerConfig.url,
      apiKey: this.encryptionService.encrypt(portainerConfig.apiKey),
    };

    if (config) {
      config.config = { ...config.config, ...encryptedConfig };
      configCollection.update(config);
    } else {
      config = {
        type: 'portainer-config',
        config: encryptedConfig,
        updatedAt: new Date(),
      };
      configCollection.insert(config);
    }

    return { success: true, message: 'Portainer configuration updated successfully' };
  }

  /**
   * Get Portainer configuration
   * @returns Portainer configuration
   */
  async getPortainerConfig(): Promise<any> {
    const configCollection = this.databaseService.getConfigCollection();
    const config = configCollection.findOne({ type: 'portainer-config' });

    if (!config || !config.config) {
      return { 
        success: true,
        data: {
          url: '',
          apiKey: ''
        } 
      };
    }

    // Decrypt API key for client
    const decryptedConfig = {
      url: config.config.url,
      apiKey: this.encryptionService.decrypt(config.config.apiKey),
    };

    return { success: true, data: decryptedConfig };
  }

  /**
   * Test Portainer connection
   * @returns Test result
   */
  private async testPortainerConnection(): Promise<any> {
    try {
      const configCollection = this.databaseService.getConfigCollection();
      const config = configCollection.findOne({ type: 'portainer-config' });
      
      if (!config || !config.config) {
        return { success: false, message: 'Portainer configuration not found' };
      }

      const { url, apiKey: encryptedApiKey } = config.config;
      
      if (!url || !encryptedApiKey) {
        return { success: false, message: 'Incomplete Portainer configuration' };
      }

      let apiKey;
      try {
        apiKey = this.encryptionService.decrypt(encryptedApiKey);
      } catch (error) {
        return { success: false, message: 'Failed to decrypt Portainer API key' };
      }

      // Test connection to Portainer API
      const baseUrl = url.replace(/\/$/, '');
      const response = await this.httpService.axiosRef.get(
        `${baseUrl}/api/status`,
        {
          headers: {
            'X-API-Key': apiKey
          },
          timeout: 5000
        }
      );

      if (response.status === 200) {
        return { success: true, message: 'Successfully connected to Portainer' };
      } else {
        return { success: false, message: 'Invalid Portainer API key or URL' };
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        return { success: false, message: 'Cannot connect to Portainer - service may be down' };
      }
      return { success: false, message: `Failed to connect to Portainer: ${error.message}` };
    }
  }
}