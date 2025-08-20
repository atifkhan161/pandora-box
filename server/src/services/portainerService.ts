import axios from 'axios';
import { getEnv } from '../config/env';
import { logger } from '../utils/logger';

const env = getEnv();

/**
 * Portainer API Service
 * Provides methods to interact with Portainer API for Docker management
 */
export class PortainerService {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = env.PORTAINER_URL;
  }

  /**
   * Authenticate with Portainer API
   */
  async authenticate(username: string, password: string): Promise<boolean> {
    try {
      const response = await axios.post(`${this.baseUrl}/api/auth`, {
        username,
        password
      });

      if (response.data && response.data.jwt) {
        this.token = response.data.jwt;
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Error authenticating with Portainer', error);
      return false;
    }
  }

  /**
   * Get request headers with authentication token
   */
  private getHeaders(): any {
    if (!this.token) {
      throw new Error('Not authenticated with Portainer');
    }

    return {
      Authorization: `Bearer ${this.token}`
    };
  }

  /**
   * Get endpoints
   */
  async getEndpoints(): Promise<any[]> {
    try {
      const headers = this.getHeaders();
      const response = await axios.get(`${this.baseUrl}/api/endpoints`, { headers });

      return response.data;
    } catch (error) {
      logger.error('Error getting endpoints from Portainer', error);
      throw new Error('Failed to get endpoints');
    }
  }

  /**
   * Get containers for an endpoint
   */
  async getContainers(endpointId: number): Promise<any[]> {
    try {
      const headers = this.getHeaders();
      const response = await axios.get(`${this.baseUrl}/api/endpoints/${endpointId}/docker/containers/json`, {
        headers,
        params: {
          all: true
        }
      });

      return response.data;
    } catch (error) {
      logger.error(`Error getting containers for endpoint ${endpointId} from Portainer`, error);
      throw new Error('Failed to get containers');
    }
  }

  /**
   * Get container details
   */
  async getContainerDetails(endpointId: number, containerId: string): Promise<any> {
    try {
      const headers = this.getHeaders();
      const response = await axios.get(`${this.baseUrl}/api/endpoints/${endpointId}/docker/containers/${containerId}/json`, {
        headers
      });

      return response.data;
    } catch (error) {
      logger.error(`Error getting container details for container ${containerId} from Portainer`, error);
      throw new Error('Failed to get container details');
    }
  }

  /**
   * Start container
   */
  async startContainer(endpointId: number, containerId: string): Promise<boolean> {
    try {
      const headers = this.getHeaders();
      await axios.post(`${this.baseUrl}/api/endpoints/${endpointId}/docker/containers/${containerId}/start`, {}, {
        headers
      });

      return true;
    } catch (error) {
      logger.error(`Error starting container ${containerId} in Portainer`, error);
      throw new Error('Failed to start container');
    }
  }

  /**
   * Stop container
   */
  async stopContainer(endpointId: number, containerId: string): Promise<boolean> {
    try {
      const headers = this.getHeaders();
      await axios.post(`${this.baseUrl}/api/endpoints/${endpointId}/docker/containers/${containerId}/stop`, {}, {
        headers
      });

      return true;
    } catch (error) {
      logger.error(`Error stopping container ${containerId} in Portainer`, error);
      throw new Error('Failed to stop container');
    }
  }

  /**
   * Restart container
   */
  async restartContainer(endpointId: number, containerId: string): Promise<boolean> {
    try {
      const headers = this.getHeaders();
      await axios.post(`${this.baseUrl}/api/endpoints/${endpointId}/docker/containers/${containerId}/restart`, {}, {
        headers
      });

      return true;
    } catch (error) {
      logger.error(`Error restarting container ${containerId} in Portainer`, error);
      throw new Error('Failed to restart container');
    }
  }

  /**
   * Get container logs
   */
  async getContainerLogs(endpointId: number, containerId: string, tail: number = 100): Promise<string> {
    try {
      const headers = this.getHeaders();
      const response = await axios.get(`${this.baseUrl}/api/endpoints/${endpointId}/docker/containers/${containerId}/logs`, {
        headers,
        params: {
          stderr: true,
          stdout: true,
          tail
        }
      });

      return response.data;
    } catch (error) {
      logger.error(`Error getting logs for container ${containerId} from Portainer`, error);
      throw new Error('Failed to get container logs');
    }
  }
}

export default new PortainerService();