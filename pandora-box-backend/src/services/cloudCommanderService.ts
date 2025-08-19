import axios from 'axios';
import { getEnv } from '../config/env';
import { logger } from '../utils/logger';

const env = getEnv();

/**
 * Cloud Commander API Service
 * Provides methods to interact with Cloud Commander API for file management
 */
export class CloudCommanderService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = env.CLOUD_COMMANDER_URL;
  }

  /**
   * Get directory contents
   */
  async getDirectoryContents(path: string = '/'): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/v1/fs${path}`, {
        params: {
          sort: 'name',
          order: 'asc',
          type: 'directory'
        }
      });
      return response.data;
    } catch (error) {
      logger.error(`Error getting directory contents for path ${path} from Cloud Commander`, error);
      throw new Error('Failed to get directory contents');
    }
  }

  /**
   * Create directory
   */
  async createDirectory(path: string): Promise<any> {
    try {
      const response = await axios.put(`${this.baseUrl}/api/v1/fs${path}?type=directory`);
      return response.data;
    } catch (error) {
      logger.error(`Error creating directory at path ${path} in Cloud Commander`, error);
      throw new Error('Failed to create directory');
    }
  }

  /**
   * Remove file or directory
   */
  async remove(path: string, recursive: boolean = false): Promise<any> {
    try {
      const response = await axios.delete(`${this.baseUrl}/api/v1/fs${path}`, {
        params: {
          recursive
        }
      });
      return response.data;
    } catch (error) {
      logger.error(`Error removing path ${path} from Cloud Commander`, error);
      throw new Error('Failed to remove file or directory');
    }
  }

  /**
   * Rename file or directory
   */
  async rename(oldPath: string, newPath: string): Promise<any> {
    try {
      const response = await axios.patch(`${this.baseUrl}/api/v1/fs${oldPath}`, {
        to: newPath
      });
      return response.data;
    } catch (error) {
      logger.error(`Error renaming path ${oldPath} to ${newPath} in Cloud Commander`, error);
      throw new Error('Failed to rename file or directory');
    }
  }

  /**
   * Copy file or directory
   */
  async copy(fromPath: string, toPath: string): Promise<any> {
    try {
      const response = await axios.put(`${this.baseUrl}/api/v1/fs${toPath}`, {
        from: fromPath
      });
      return response.data;
    } catch (error) {
      logger.error(`Error copying from ${fromPath} to ${toPath} in Cloud Commander`, error);
      throw new Error('Failed to copy file or directory');
    }
  }

  /**
   * Get file content
   */
  async getFileContent(path: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/v1/fs${path}`, {
        params: {
          type: 'file'
        }
      });
      return response.data;
    } catch (error) {
      logger.error(`Error getting file content for path ${path} from Cloud Commander`, error);
      throw new Error('Failed to get file content');
    }
  }

  /**
   * Update file content
   */
  async updateFileContent(path: string, content: string): Promise<any> {
    try {
      const response = await axios.put(`${this.baseUrl}/api/v1/fs${path}?type=file`, content);
      return response.data;
    } catch (error) {
      logger.error(`Error updating file content for path ${path} in Cloud Commander`, error);
      throw new Error('Failed to update file content');
    }
  }
}

export default new CloudCommanderService();