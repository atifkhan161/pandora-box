import { Request, Response } from 'express'
import Joi from 'joi'
import { ApiProxyService } from '@/services/apiProxy.js'
import { DatabaseService } from '@/services/database.js'
import { WebSocketService } from '@/services/websocket.js'
import { asyncHandler, ValidationError, ExternalServiceError } from '@/middleware/errorHandler.js'
import { logger, logHelpers } from '@/utils/logger.js'

export class PortainerController {
  private apiProxy: ApiProxyService
  private dbService: DatabaseService
  private wsService: WebSocketService
  private endpointId: number = 1 // Default local endpoint

  constructor(apiProxy: ApiProxyService, dbService: DatabaseService, wsService: WebSocketService) {
    this.apiProxy = apiProxy
    this.dbService = dbService
    this.wsService = wsService
  }

  // Validation schemas
  private containerControlSchema = Joi.object({
    action: Joi.string().valid('start', 'stop', 'restart', 'pause', 'unpause', 'kill', 'remove').required(),
    force: Joi.boolean().default(false)
  })

  private stackControlSchema = Joi.object({
    action: Joi.string().valid('start', 'stop', 'restart', 'remove', 'update').required(),
    gluetunCountry: Joi.string().when('action', {
      is: 'update',
      then: Joi.optional(),
      otherwise: Joi.forbidden()
    })
  })

  private logsSchema = Joi.object({
    since: Joi.string().optional(),
    until: Joi.string().optional(),
    tail: Joi.number().integer().min(1).max(1000).default(100),
    timestamps: Joi.boolean().default(true)
  })

  // Get all containers
  getContainers = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id

    try {
      // Check if Portainer service is available
      if (!this.apiProxy.isServiceAvailable('portainer')) {
        throw new ExternalServiceError('Portainer', 'Service not configured')
      }

      const portainerClient = this.apiProxy.getService('portainer')
      
      // Get containers from Portainer
      const containers = await portainerClient.get(`/api/endpoints/${this.endpointId}/docker/containers/json`, {
        all: true
      }, { cache: true, cacheTTL: 30 })

      // Transform container data
      const transformedContainers = containers.map((container: any) => this.transformContainerData(container))

      // Cache container status
      await this.cacheContainerStatuses(transformedContainers, userId)

      res.json({
        success: true,
        data: {
          containers: transformedContainers,
          total: transformedContainers.length
        }
      })

    } catch (error) {
      logger.error('Error fetching containers:', error)
      if (error instanceof ExternalServiceError) {
        throw error
      }
      throw new ExternalServiceError('Portainer', 'Failed to fetch containers')
    }
  })

  // Get Docker stacks
  getStacks = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id

    try {
      if (!this.apiProxy.isServiceAvailable('portainer')) {
        throw new ExternalServiceError('Portainer', 'Service not configured')
      }

      const portainerClient = this.apiProxy.getService('portainer')
      
      // Get stacks from Portainer
      const stacks = await portainerClient.get('/api/stacks', null, { cache: true, cacheTTL: 60 })

      // Transform stack data
      const transformedStacks = stacks.map((stack: any) => this.transformStackData(stack))

      res.json({
        success: true,
        data: {
          stacks: transformedStacks,
          total: transformedStacks.length
        }
      })

    } catch (error) {
      logger.error('Error fetching stacks:', error)
      if (error instanceof ExternalServiceError) {
        throw error
      }
      throw new ExternalServiceError('Portainer', 'Failed to fetch stacks')
    }
  })

  // Control container
  controlContainer = asyncHandler(async (req: Request, res: Response) => {
    const { containerId } = req.params
    const { error, value } = this.containerControlSchema.validate(req.body)

    if (error) {
      throw new ValidationError(error.details[0].message)
    }

    const { action, force } = value
    const userId = req.user!.id

    try {
      if (!this.apiProxy.isServiceAvailable('portainer')) {
        throw new ExternalServiceError('Portainer', 'Service not configured')
      }

      const portainerClient = this.apiProxy.getService('portainer')
      
      // Get container info first
      const containerInfo = await portainerClient.get(
        `/api/endpoints/${this.endpointId}/docker/containers/${containerId}/json`
      )

      // Log the action
      await this.logContainerOperation(userId, containerId, containerInfo.Name || containerId, action, 'pending')

      // Perform the action
      let endpoint = ''
      const params: any = {}

      switch (action) {
        case 'start':
          endpoint = `/api/endpoints/${this.endpointId}/docker/containers/${containerId}/start`
          break
        case 'stop':
          endpoint = `/api/endpoints/${this.endpointId}/docker/containers/${containerId}/stop`
          if (force) params.t = 0
          break
        case 'restart':
          endpoint = `/api/endpoints/${this.endpointId}/docker/containers/${containerId}/restart`
          if (force) params.t = 0
          break
        case 'pause':
          endpoint = `/api/endpoints/${this.endpointId}/docker/containers/${containerId}/pause`
          break
        case 'unpause':
          endpoint = `/api/endpoints/${this.endpointId}/docker/containers/${containerId}/unpause`
          break
        case 'kill':
          endpoint = `/api/endpoints/${this.endpointId}/docker/containers/${containerId}/kill`
          break
        case 'remove':
          endpoint = `/api/endpoints/${this.endpointId}/docker/containers/${containerId}`
          params.force = force
          break
      }

      // Execute the action
      if (action === 'remove') {
        await portainerClient.delete(endpoint, { params })
      } else {
        await portainerClient.post(endpoint, null, { params })
      }

      // Log successful operation
      await this.logContainerOperation(userId, containerId, containerInfo.Name || containerId, action, 'success')

      // Broadcast container update
      this.wsService.broadcastToUser(userId, {
        type: 'container',
        event: 'action_completed',
        data: {
          containerId,
          containerName: containerInfo.Name,
          action,
          status: 'success'
        }
      })

      res.json({
        success: true,
        message: `Container ${action} completed successfully`,
        data: {
          containerId,
          action
        }
      })

    } catch (error) {
      logger.error(`Error ${action} container:`, error)
      
      // Log failed operation
      try {
        await this.logContainerOperation(userId, containerId, containerId, action, 'failed')
      } catch (logError) {
        logger.error('Error logging container operation:', logError)
      }

      if (error instanceof ExternalServiceError || error instanceof ValidationError) {
        throw error
      }
      throw new ExternalServiceError('Portainer', `Failed to ${action} container`)
    }
  })

  // Control stack (including ARR stack with gluetun)
  controlStack = asyncHandler(async (req: Request, res: Response) => {
    const { stackId } = req.params
    const { error, value } = this.stackControlSchema.validate(req.body)

    if (error) {
      throw new ValidationError(error.details[0].message)
    }

    const { action, gluetunCountry } = value
    const userId = req.user!.id

    try {
      if (!this.apiProxy.isServiceAvailable('portainer')) {
        throw new ExternalServiceError('Portainer', 'Service not configured')
      }

      const portainerClient = this.apiProxy.getService('portainer')
      
      // Get stack info
      const stackInfo = await portainerClient.get(`/api/stacks/${stackId}`)
      
      // Special handling for ARR stack with gluetun country change
      if (action === 'update' && gluetunCountry && this.isARRStack(stackInfo.Name)) {
        await this.updateGluetunCountry(stackInfo, gluetunCountry)
      }

      // Perform stack action
      let result
      switch (action) {
        case 'start':
          result = await this.startStack(portainerClient, stackId)
          break
        case 'stop':
          result = await this.stopStack(portainerClient, stackId)
          break
        case 'restart':
          result = await this.restartStack(portainerClient, stackId)
          break
        case 'remove':
          result = await this.removeStack(portainerClient, stackId)
          break
        case 'update':
          result = await this.updateStack(portainerClient, stackId)
          break
      }

      // Log the operation
      await this.logContainerOperation(userId, stackId, stackInfo.Name, `stack_${action}`, 'success')

      // Broadcast stack update
      this.wsService.broadcastToUser(userId, {
        type: 'stack',
        event: 'action_completed',
        data: {
          stackId,
          stackName: stackInfo.Name,
          action,
          gluetunCountry,
          status: 'success'
        }
      })

      res.json({
        success: true,
        message: `Stack ${action} completed successfully`,
        data: result
      })

    } catch (error) {
      logger.error(`Error ${action} stack:`, error)
      
      // Log failed operation
      try {
        const stackInfo = await this.apiProxy.getService('portainer').get(`/api/stacks/${stackId}`)
        await this.logContainerOperation(userId, stackId, stackInfo.Name, `stack_${action}`, 'failed')
      } catch (logError) {
        logger.error('Error logging stack operation:', logError)
      }

      if (error instanceof ExternalServiceError || error instanceof ValidationError) {
        throw error
      }
      throw new ExternalServiceError('Portainer', `Failed to ${action} stack`)
    }
  })

  // Get container logs
  getContainerLogs = asyncHandler(async (req: Request, res: Response) => {
    const { containerId } = req.params
    const { error, value } = this.logsSchema.validate(req.query)

    if (error) {
      throw new ValidationError(error.details[0].message)
    }

    const { since, until, tail, timestamps } = value

    try {
      if (!this.apiProxy.isServiceAvailable('portainer')) {
        throw new ExternalServiceError('Portainer', 'Service not configured')
      }

      const portainerClient = this.apiProxy.getService('portainer')
      
      const params: any = {
        stdout: true,
        stderr: true,
        tail: tail.toString(),
        timestamps: timestamps.toString()
      }

      if (since) params.since = since
      if (until) params.until = until

      const logs = await portainerClient.get(
        `/api/endpoints/${this.endpointId}/docker/containers/${containerId}/logs`,
        params,
        { cache: false }
      )

      // Parse and format logs
      const formattedLogs = this.formatContainerLogs(logs)

      res.json({
        success: true,
        data: {
          containerId,
          logs: formattedLogs,
          tail
        }
      })

    } catch (error) {
      logger.error('Error fetching container logs:', error)
      if (error instanceof ExternalServiceError) {
        throw error
      }
      throw new ExternalServiceError('Portainer', 'Failed to fetch container logs')
    }
  })

  // Get container stats
  getContainerStats = asyncHandler(async (req: Request, res: Response) => {
    const { containerId } = req.params

    try {
      if (!this.apiProxy.isServiceAvailable('portainer')) {
        throw new ExternalServiceError('Portainer', 'Service not configured')
      }

      const portainerClient = this.apiProxy.getService('portainer')
      
      const stats = await portainerClient.get(
        `/api/endpoints/${this.endpointId}/docker/containers/${containerId}/stats`,
        { stream: false },
        { cache: false }
      )

      const formattedStats = this.formatContainerStats(stats)

      res.json({
        success: true,
        data: {
          containerId,
          stats: formattedStats
        }
      })

    } catch (error) {
      logger.error('Error fetching container stats:', error)
      if (error instanceof ExternalServiceError) {
        throw error
      }
      throw new ExternalServiceError('Portainer', 'Failed to fetch container stats')
    }
  })

  // Private helper methods
  private transformContainerData(container: any): any {
    const status = this.getContainerStatus(container.State, container.Status)
    
    return {
      id: container.Id,
      name: container.Names[0]?.replace('/', '') || 'Unknown',
      image: container.Image,
      imageId: container.ImageID,
      status: status.status,
      statusColor: status.color,
      state: container.State,
      created: container.Created,
      ports: this.formatPorts(container.Ports || []),
      labels: container.Labels || {},
      mounts: container.Mounts || [],
      networks: Object.keys(container.NetworkSettings?.Networks || {}),
      isARRStack: this.isARRContainer(container.Names[0] || '', container.Labels || {}),
      uptime: this.calculateUptime(container.Created, container.State)
    }
  }

  private transformStackData(stack: any): any {
    return {
      id: stack.Id,
      name: stack.Name,
      type: stack.Type,
      endpointId: stack.EndpointId,
      status: this.getStackStatus(stack.Status),
      createdAt: stack.CreationDate,
      updatedAt: stack.UpdateDate,
      isARRStack: this.isARRStack(stack.Name),
      env: stack.Env || [],
      resourceControl: stack.ResourceControl
    }
  }

  private getContainerStatus(state: string, status: string): { status: string, color: string } {
    switch (state) {
      case 'running':
        return { status: 'running', color: 'green' }
      case 'exited':
        return { status: 'stopped', color: 'red' }
      case 'paused':
        return { status: 'paused', color: 'amber' }
      case 'restarting':
        return { status: 'restarting', color: 'amber' }
      case 'removing':
        return { status: 'removing', color: 'amber' }
      case 'dead':
        return { status: 'dead', color: 'red' }
      default:
        return { status: status || state, color: 'gray' }
    }
  }

  private getStackStatus(status: number): string {
    switch (status) {
      case 1:
        return 'active'
      case 2:
        return 'inactive'
      default:
        return 'unknown'
    }
  }

  private formatPorts(ports: any[]): string[] {
    return ports.map(port => {
      if (port.PublicPort && port.PrivatePort) {
        return `${port.PublicPort}:${port.PrivatePort}/${port.Type || 'tcp'}`
      }
      return `${port.PrivatePort}/${port.Type || 'tcp'}`
    })
  }

  private calculateUptime(created: number, state: string): string {
    if (state !== 'running') return 'Not running'
    
    const now = Math.floor(Date.now() / 1000)
    const uptime = now - created
    
    const days = Math.floor(uptime / 86400)
    const hours = Math.floor((uptime % 86400) / 3600)
    const minutes = Math.floor((uptime % 3600) / 60)
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m`
    }
  }

  private isARRContainer(name: string, labels: any): boolean {
    const arrServices = ['jackett', 'qbittorrent', 'sonarr', 'radarr', 'bazarr', 'prowlarr', 'gluetun']
    return arrServices.some(service => name.toLowerCase().includes(service))
  }

  private isARRStack(stackName: string): boolean {
    return stackName.toLowerCase().includes('arr') || 
           stackName.toLowerCase().includes('media') ||
           stackName.toLowerCase().includes('download')
  }

  private async updateGluetunCountry(stackInfo: any, country: string): Promise<void> {
    // Update environment variables for gluetun country
    const env = stackInfo.Env || []
    const updatedEnv = env.map((envVar: any) => {
      if (envVar.name === 'VPN_SERVICE_PROVIDER' || envVar.name === 'SERVER_COUNTRIES') {
        return { ...envVar, value: country }
      }
      return envVar
    })

    // Add country env var if not exists
    if (!updatedEnv.find((env: any) => env.name === 'SERVER_COUNTRIES')) {
      updatedEnv.push({ name: 'SERVER_COUNTRIES', value: country })
    }

    stackInfo.Env = updatedEnv
  }

  private async startStack(client: any, stackId: string): Promise<any> {
    return client.post(`/api/stacks/${stackId}/start`)
  }

  private async stopStack(client: any, stackId: string): Promise<any> {
    return client.post(`/api/stacks/${stackId}/stop`)
  }

  private async restartStack(client: any, stackId: string): Promise<any> {
    await this.stopStack(client, stackId)
    // Wait a moment before starting
    await new Promise(resolve => setTimeout(resolve, 2000))
    return this.startStack(client, stackId)
  }

  private async removeStack(client: any, stackId: string): Promise<any> {
    return client.delete(`/api/stacks/${stackId}`)
  }

  private async updateStack(client: any, stackId: string): Promise<any> {
    return client.put(`/api/stacks/${stackId}`)
  }

  private formatContainerLogs(logs: string): string[] {
    if (!logs) return []
    
    return logs.split('\n')
      .filter(line => line.trim())
      .map(line => {
        // Remove Docker log prefixes and format
        return line.replace(/^[\x00-\x08]/, '').trim()
      })
      .slice(-100) // Last 100 lines
  }

  private formatContainerStats(stats: any): any {
    if (!stats) return {}

    const cpuPercent = this.calculateCPUPercent(stats)
    const memoryUsage = this.calculateMemoryUsage(stats)
    const networkIO = this.calculateNetworkIO(stats)
    const blockIO = this.calculateBlockIO(stats)

    return {
      cpu: {
        percent: cpuPercent,
        usage: stats.cpu_stats?.cpu_usage?.total_usage || 0
      },
      memory: {
        usage: memoryUsage.usage,
        limit: memoryUsage.limit,
        percent: memoryUsage.percent,
        formatted: {
          usage: this.formatBytes(memoryUsage.usage),
          limit: this.formatBytes(memoryUsage.limit)
        }
      },
      network: {
        rx: networkIO.rx,
        tx: networkIO.tx,
        formatted: {
          rx: this.formatBytes(networkIO.rx),
          tx: this.formatBytes(networkIO.tx)
        }
      },
      blockIO: {
        read: blockIO.read,
        write: blockIO.write,
        formatted: {
          read: this.formatBytes(blockIO.read),
          write: this.formatBytes(blockIO.write)
        }
      }
    }
  }

  private calculateCPUPercent(stats: any): number {
    const cpuDelta = stats.cpu_stats?.cpu_usage?.total_usage - stats.precpu_stats?.cpu_usage?.total_usage
    const systemDelta = stats.cpu_stats?.system_cpu_usage - stats.precpu_stats?.system_cpu_usage
    const cpuCount = stats.cpu_stats?.online_cpus || 1

    if (systemDelta > 0 && cpuDelta > 0) {
      return Math.round((cpuDelta / systemDelta) * cpuCount * 100 * 100) / 100
    }
    return 0
  }

  private calculateMemoryUsage(stats: any): any {
    const usage = stats.memory_stats?.usage || 0
    const limit = stats.memory_stats?.limit || 0
    const percent = limit > 0 ? Math.round((usage / limit) * 100 * 100) / 100 : 0

    return { usage, limit, percent }
  }

  private calculateNetworkIO(stats: any): any {
    const networks = stats.networks || {}
    let rx = 0, tx = 0

    Object.values(networks).forEach((network: any) => {
      rx += network.rx_bytes || 0
      tx += network.tx_bytes || 0
    })

    return { rx, tx }
  }

  private calculateBlockIO(stats: any): any {
    const blkio = stats.blkio_stats?.io_service_bytes_recursive || []
    let read = 0, write = 0

    blkio.forEach((io: any) => {
      if (io.op === 'Read') read += io.value || 0
      if (io.op === 'Write') write += io.value || 0
    })

    return { read, write }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  private async cacheContainerStatuses(containers: any[], userId: string): Promise<void> {
    for (const container of containers) {
      try {
        await this.dbService.create('container_logs', {
          containerId: container.id,
          containerName: container.name,
          action: 'status_check',
          status: 'success',
          message: `Status: ${container.status}`,
          userId,
          createdAt: new Date().toISOString()
        })
      } catch (error) {
        // Log errors but don't fail the request
        logger.error('Error caching container status:', error)
      }
    }
  }

  private async logContainerOperation(
    userId: string,
    containerId: string,
    containerName: string,
    action: string,
    status: 'pending' | 'success' | 'failed',
    message?: string
  ): Promise<void> {
    try {
      await this.dbService.create('container_logs', {
        containerId,
        containerName,
        action,
        status,
        message,
        userId,
        createdAt: new Date().toISOString()
      })
    } catch (error) {
      logger.error('Error logging container operation:', error)
    }
  }
}

export default PortainerController