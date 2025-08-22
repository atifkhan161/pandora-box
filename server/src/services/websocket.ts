import { WebSocketServer, WebSocket } from 'ws'
import { createServer } from 'http'
import { config } from '@/config/config.js'
import { logger, logHelpers } from '@/utils/logger.js'
import { randomUUID } from 'crypto'

export interface WebSocketClient {
  id: string
  userId?: string
  socket: WebSocket
  isAlive: boolean
  lastPing: Date
  subscriptions: Set<string>
}

export interface WebSocketMessage {
  type: string
  event: string
  data?: any
  timestamp: string
}

export interface SubscriptionData {
  channel: string
  userId?: string
  filters?: any
}

export class WebSocketService {
  private wss: WebSocketServer | null = null
  private server: any = null
  private clients: Map<string, WebSocketClient> = new Map()
  private channels: Map<string, Set<string>> = new Map()
  private heartbeatInterval: NodeJS.Timeout | null = null
  private isInitialized = false

  constructor() {}

  // Initialize WebSocket server
  async init(): Promise<void> {
    try {
      // Create HTTP server for WebSocket
      this.server = createServer()
      
      // Create WebSocket server
      this.wss = new WebSocketServer({
        server: this.server,
        path: '/ws',
        perMessageDeflate: false
      })

      // Setup WebSocket event handlers
      this.setupEventHandlers()

      // Start heartbeat mechanism
      this.startHeartbeat()

      // Start server
      await new Promise<void>((resolve, reject) => {
        this.server.listen(config.websocket.port, (error: any) => {
          if (error) {
            reject(error)
          } else {
            this.isInitialized = true
            logger.info(`WebSocket server listening on port ${config.websocket.port}`)
            resolve()
          }
        })
      })

    } catch (error) {
      logger.error('WebSocket server initialization failed:', error)
      throw error
    }
  }

  // Setup WebSocket event handlers
  private setupEventHandlers(): void {
    if (!this.wss) return

    this.wss.on('connection', (socket: WebSocket, request) => {
      const clientId = randomUUID()
      const client: WebSocketClient = {
        id: clientId,
        socket,
        isAlive: true,
        lastPing: new Date(),
        subscriptions: new Set()
      }

      this.clients.set(clientId, client)
      logHelpers.logWebSocket('client_connected', clientId, {
        ip: request.socket.remoteAddress,
        userAgent: request.headers['user-agent']
      })

      // Send welcome message
      this.sendToClient(clientId, {
        type: 'system',
        event: 'connected',
        data: { clientId },
        timestamp: new Date().toISOString()
      })

      // Handle incoming messages
      socket.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString())
          this.handleClientMessage(clientId, message)
        } catch (error) {
          logger.error(`Error parsing WebSocket message from ${clientId}:`, error)
          this.sendError(clientId, 'Invalid message format')
        }
      })

      // Handle pong responses
      socket.on('pong', () => {
        client.isAlive = true
        client.lastPing = new Date()
      })

      // Handle client disconnect
      socket.on('close', (code: number, reason: Buffer) => {
        this.handleClientDisconnect(clientId, code, reason.toString())
      })

      // Handle errors
      socket.on('error', (error: Error) => {
        logger.error(`WebSocket error for client ${clientId}:`, error)
        this.handleClientDisconnect(clientId)
      })
    })

    this.wss.on('error', (error: Error) => {
      logger.error('WebSocket server error:', error)
    })
  }

  // Handle incoming client messages
  private handleClientMessage(clientId: string, message: any): void {
    const client = this.clients.get(clientId)
    if (!client) return

    logHelpers.logWebSocket('message_received', clientId, { type: message.type, event: message.event })

    switch (message.type) {
      case 'auth':
        this.handleAuthentication(clientId, message.data)
        break

      case 'subscribe':
        this.handleSubscription(clientId, message.data)
        break

      case 'unsubscribe':
        this.handleUnsubscription(clientId, message.data)
        break

      case 'ping':
        this.sendToClient(clientId, {
          type: 'system',
          event: 'pong',
          timestamp: new Date().toISOString()
        })
        break

      default:
        this.sendError(clientId, `Unknown message type: ${message.type}`)
    }
  }

  // Handle client authentication
  private handleAuthentication(clientId: string, authData: any): void {
    const client = this.clients.get(clientId)
    if (!client) return

    try {
      // TODO: Validate JWT token and get user info
      // For now, just accept the userId from the message
      if (authData.userId) {
        client.userId = authData.userId
        
        this.sendToClient(clientId, {
          type: 'auth',
          event: 'authenticated',
          data: { userId: authData.userId },
          timestamp: new Date().toISOString()
        })

        logHelpers.logWebSocket('client_authenticated', clientId, { userId: authData.userId })
      } else {
        this.sendError(clientId, 'Authentication failed')
      }
    } catch (error) {
      logger.error(`Authentication error for client ${clientId}:`, error)
      this.sendError(clientId, 'Authentication failed')
    }
  }

  // Handle channel subscription
  private handleSubscription(clientId: string, subscriptionData: SubscriptionData): void {
    const client = this.clients.get(clientId)
    if (!client) return

    const { channel, userId, filters } = subscriptionData

    // Validate subscription
    if (!this.isValidSubscription(client, channel, userId)) {
      this.sendError(clientId, 'Invalid subscription')
      return
    }

    // Add client to channel
    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set())
    }
    this.channels.get(channel)!.add(clientId)
    client.subscriptions.add(channel)

    this.sendToClient(clientId, {
      type: 'subscription',
      event: 'subscribed',
      data: { channel },
      timestamp: new Date().toISOString()
    })

    logHelpers.logWebSocket('client_subscribed', clientId, { channel, userId, filters })
  }

  // Handle channel unsubscription
  private handleUnsubscription(clientId: string, data: { channel: string }): void {
    const client = this.clients.get(clientId)
    if (!client) return

    const { channel } = data

    // Remove client from channel
    if (this.channels.has(channel)) {
      this.channels.get(channel)!.delete(clientId)
      if (this.channels.get(channel)!.size === 0) {
        this.channels.delete(channel)
      }
    }
    client.subscriptions.delete(channel)

    this.sendToClient(clientId, {
      type: 'subscription',
      event: 'unsubscribed',
      data: { channel },
      timestamp: new Date().toISOString()
    })

    logHelpers.logWebSocket('client_unsubscribed', clientId, { channel })
  }

  // Validate subscription permissions
  private isValidSubscription(client: WebSocketClient, channel: string, userId?: string): boolean {
    // If channel requires authentication, client must be authenticated
    const protectedChannels = ['downloads', 'notifications', 'file-operations']
    if (protectedChannels.some(p => channel.startsWith(p)) && !client.userId) {
      return false
    }

    // If channel is user-specific, client must own it or be admin
    if (userId && client.userId !== userId) {
      // TODO: Check if client is admin
      return false
    }

    return true
  }

  // Handle client disconnect
  private handleClientDisconnect(clientId: string, code?: number, reason?: string): void {
    const client = this.clients.get(clientId)
    if (!client) return

    // Remove client from all channels
    client.subscriptions.forEach(channel => {
      if (this.channels.has(channel)) {
        this.channels.get(channel)!.delete(clientId)
        if (this.channels.get(channel)!.size === 0) {
          this.channels.delete(channel)
        }
      }
    })

    // Remove client
    this.clients.delete(clientId)

    logHelpers.logWebSocket('client_disconnected', clientId, {
      userId: client.userId,
      code,
      reason,
      subscriptions: Array.from(client.subscriptions)
    })
  }

  // Send message to specific client
  private sendToClient(clientId: string, message: WebSocketMessage): void {
    const client = this.clients.get(clientId)
    if (!client || client.socket.readyState !== WebSocket.OPEN) {
      return
    }

    try {
      client.socket.send(JSON.stringify(message))
    } catch (error) {
      logger.error(`Error sending message to client ${clientId}:`, error)
      this.handleClientDisconnect(clientId)
    }
  }

  // Send error message to client
  private sendError(clientId: string, message: string): void {
    this.sendToClient(clientId, {
      type: 'error',
      event: 'error',
      data: { message },
      timestamp: new Date().toISOString()
    })
  }

  // Broadcast to channel
  public broadcast(channel: string, message: Omit<WebSocketMessage, 'timestamp'>): void {
    const channelClients = this.channels.get(channel)
    if (!channelClients) return

    const fullMessage: WebSocketMessage = {
      ...message,
      timestamp: new Date().toISOString()
    }

    let sentCount = 0
    channelClients.forEach(clientId => {
      this.sendToClient(clientId, fullMessage)
      sentCount++
    })

    logHelpers.logWebSocket('broadcast_sent', 'system', {
      channel,
      clientCount: sentCount,
      event: message.event
    })
  }

  // Broadcast to user's channels
  public broadcastToUser(userId: string, message: Omit<WebSocketMessage, 'timestamp'>): void {
    let sentCount = 0
    this.clients.forEach(client => {
      if (client.userId === userId && client.socket.readyState === WebSocket.OPEN) {
        this.sendToClient(client.id, {
          ...message,
          timestamp: new Date().toISOString()
        })
        sentCount++
      }
    })

    logHelpers.logWebSocket('broadcast_to_user', userId, {
      clientCount: sentCount,
      event: message.event
    })
  }

  // Broadcast download updates
  public broadcastDownloadUpdate(userId: string, downloadData: any): void {
    this.broadcast(`downloads:${userId}`, {
      type: 'download',
      event: 'status_update',
      data: downloadData
    })
  }

  // Broadcast file operation updates
  public broadcastFileOperation(userId: string, operationData: any): void {
    this.broadcast(`file-operations:${userId}`, {
      type: 'file',
      event: 'operation_update',
      data: operationData
    })
  }

  // Broadcast notifications
  public broadcastNotification(userId: string, notification: any): void {
    this.broadcastToUser(userId, {
      type: 'notification',
      event: 'new_notification',
      data: notification
    })
  }

  // Broadcast system events
  public broadcastSystem(event: string, data: any): void {
    this.broadcast('system', {
      type: 'system',
      event,
      data
    })
  }

  // Start heartbeat mechanism
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach((client, clientId) => {
        if (!client.isAlive) {
          this.handleClientDisconnect(clientId)
          return
        }

        client.isAlive = false
        if (client.socket.readyState === WebSocket.OPEN) {
          client.socket.ping()
        }
      })
    }, config.websocket.heartbeatInterval)

    logger.info(`WebSocket heartbeat started (${config.websocket.heartbeatInterval}ms interval)`)
  }

  // Stop heartbeat mechanism
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  // Get connected clients count
  public getConnectedClientsCount(): number {
    return this.clients.size
  }

  // Get clients by user
  public getClientsByUser(userId: string): WebSocketClient[] {
    return Array.from(this.clients.values()).filter(client => client.userId === userId)
  }

  // Get channel subscribers count
  public getChannelSubscribersCount(channel: string): number {
    return this.channels.get(channel)?.size || 0
  }

  // Get server statistics
  public getStats() {
    const channelStats: any = {}
    this.channels.forEach((clients, channel) => {
      channelStats[channel] = clients.size
    })

    return {
      connectedClients: this.clients.size,
      totalChannels: this.channels.size,
      channelSubscribers: channelStats,
      isHealthy: this.isHealthy()
    }
  }

  // Health check
  public isHealthy(): boolean {
    return this.isInitialized && this.wss !== null && this.server !== null
  }

  // Close WebSocket server
  async close(): Promise<void> {
    try {
      this.stopHeartbeat()

      // Close all client connections
      this.clients.forEach((client, clientId) => {
        client.socket.close(1000, 'Server shutdown')
        this.clients.delete(clientId)
      })

      // Close WebSocket server
      if (this.wss) {
        await new Promise<void>((resolve) => {
          this.wss!.close(() => {
            this.wss = null
            resolve()
          })
        })
      }

      // Close HTTP server
      if (this.server) {
        await new Promise<void>((resolve) => {
          this.server.close(() => {
            this.server = null
            resolve()
          })
        })
      }

      this.isInitialized = false
      logger.info('WebSocket server closed')
    } catch (error) {
      logger.error('Error closing WebSocket server:', error)
      throw error
    }
  }
}

export default WebSocketService