/**
 * WebSocket Client for Pandora PWA
 * Handles real-time communication with the backend WebSocket server
 * Includes automatic reconnection, subscription management, and error handling
 */

import { JWTManager } from './jwt-manager.js'

export class WebSocketError extends Error {
  constructor(message, code = null, originalError = null) {
    super(message)
    this.name = 'WebSocketError'
    this.code = code
    this.originalError = originalError
  }
}

export class WebSocketClient {
  constructor(url = null, options = {}) {
    // Determine WebSocket URL
    if (!url) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const host = window.location.host
      this.url = `${protocol}//${host}/ws`
    } else {
      this.url = url
    }

    this.jwtManager = new JWTManager()
    
    // Configuration options
    this.options = {
      reconnectInterval: 1000, // 1 second
      maxReconnectAttempts: 10,
      reconnectBackoff: 1.5, // Exponential backoff multiplier
      heartbeatInterval: 30000, // 30 seconds
      connectionTimeout: 10000, // 10 seconds
      ...options
    }

    // Connection state
    this.ws = null
    this.isConnected = false
    this.isConnecting = false
    this.isAuthenticated = false
    this.reconnectAttempts = 0
    this.shouldReconnect = true
    this.userId = null

    // Event management
    this.subscriptions = new Map() // channel -> Set of callbacks
    this.eventListeners = new Map() // event type -> Set of callbacks
    this.messageQueue = [] // Messages to send when connected

    // Timers
    this.reconnectTimer = null
    this.heartbeatTimer = null
    this.connectionTimer = null

    // Bind methods
    this.handleOpen = this.handleOpen.bind(this)
    this.handleMessage = this.handleMessage.bind(this)
    this.handleClose = this.handleClose.bind(this)
    this.handleError = this.handleError.bind(this)
  }

  /**
   * Connect to WebSocket server
   * @returns {Promise<void>} Connection promise
   */
  async connect() {
    if (this.isConnected || this.isConnecting) {
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      this.isConnecting = true
      
      try {
        this.ws = new WebSocket(this.url)
        
        // Setup event listeners
        this.ws.addEventListener('open', this.handleOpen)
        this.ws.addEventListener('message', this.handleMessage)
        this.ws.addEventListener('close', this.handleClose)
        this.ws.addEventListener('error', this.handleError)

        // Connection timeout
        this.connectionTimer = setTimeout(() => {
          if (!this.isConnected) {
            this.ws.close()
            reject(new WebSocketError('Connection timeout', 'CONNECTION_TIMEOUT'))
          }
        }, this.options.connectionTimeout)

        // Store resolve/reject for event handlers
        this._connectionResolve = resolve
        this._connectionReject = reject
        
      } catch (error) {
        this.isConnecting = false
        reject(new WebSocketError('Failed to create WebSocket connection', 'CONNECTION_FAILED', error))
      }
    })
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    this.shouldReconnect = false
    this.clearTimers()
    
    if (this.ws) {
      this.ws.removeEventListener('open', this.handleOpen)
      this.ws.removeEventListener('message', this.handleMessage)
      this.ws.removeEventListener('close', this.handleClose)
      this.ws.removeEventListener('error', this.handleError)
      
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close(1000, 'Client disconnect')
      }
      
      this.ws = null
    }
    
    this.isConnected = false
    this.isConnecting = false
    this.isAuthenticated = false
    this.userId = null
    
    this.emit('disconnected', { reason: 'manual' })
  }

  /**
   * Handle WebSocket open event
   */
  async handleOpen() {
    this.clearTimers()
    this.isConnected = true
    this.isConnecting = false
    this.reconnectAttempts = 0
    
    console.log('WebSocket connected')
    this.emit('connected')
    
    // Authenticate if we have a token
    await this.authenticate()
    
    // Send queued messages
    this.flushMessageQueue()
    
    // Start heartbeat
    this.startHeartbeat()
    
    if (this._connectionResolve) {
      this._connectionResolve()
      this._connectionResolve = null
      this._connectionReject = null
    }
  }

  /**
   * Handle WebSocket message event
   */
  handleMessage(event) {
    try {
      const message = JSON.parse(event.data)
      this.processMessage(message)
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error)
      this.emit('error', new WebSocketError('Invalid message format', 'PARSE_ERROR', error))
    }
  }

  /**
   * Handle WebSocket close event
   */
  handleClose(event) {
    this.clearTimers()
    this.isConnected = false
    this.isConnecting = false
    this.isAuthenticated = false
    
    console.log(`WebSocket closed: ${event.code} - ${event.reason}`)
    this.emit('disconnected', { 
      code: event.code, 
      reason: event.reason,
      wasClean: event.wasClean
    })
    
    if (this._connectionReject && !event.wasClean) {
      this._connectionReject(new WebSocketError(`Connection closed: ${event.reason}`, 'CONNECTION_CLOSED'))
      this._connectionResolve = null
      this._connectionReject = null
    }
    
    // Attempt reconnection if needed
    if (this.shouldReconnect && event.code !== 1000) {
      this.scheduleReconnect()
    }
  }

  /**
   * Handle WebSocket error event
   */
  handleError(error) {
    console.error('WebSocket error:', error)
    const wsError = new WebSocketError('WebSocket connection error', 'CONNECTION_ERROR', error)
    this.emit('error', wsError)
    
    if (this._connectionReject) {
      this._connectionReject(wsError)
      this._connectionResolve = null
      this._connectionReject = null
    }
  }

  /**
   * Process incoming message
   */
  processMessage(message) {
    const { type, event, data, timestamp } = message
    
    // Handle system messages
    if (type === 'system') {
      this.handleSystemMessage(event, data)
      return
    }
    
    // Handle authentication messages
    if (type === 'auth') {
      this.handleAuthMessage(event, data)
      return
    }
    
    // Handle subscription messages
    if (type === 'subscription') {
      this.handleSubscriptionMessage(event, data)
      return
    }
    
    // Handle error messages
    if (type === 'error') {
      this.handleErrorMessage(event, data)
      return
    }
    
    // Emit general message event
    this.emit('message', message)
    
    // Emit specific event type
    this.emit(type, { event, data, timestamp })
    
    // Handle channel-specific messages
    if (message.channel) {
      this.emitToSubscribers(message.channel, data)
    }
  }

  /**
   * Handle system messages
   */
  handleSystemMessage(event, data) {
    switch (event) {
      case 'connected':
        console.log('WebSocket connection established, client ID:', data.clientId)
        break
        
      case 'pong':
        // Heartbeat response
        break
        
      default:
        this.emit('system', { event, data })
    }
  }

  /**
   * Handle authentication messages
   */
  handleAuthMessage(event, data) {
    switch (event) {
      case 'authenticated':
        this.isAuthenticated = true
        this.userId = data.userId
        console.log('WebSocket authenticated for user:', data.userId)
        this.emit('authenticated', data)
        break
        
      case 'authentication_failed':
        this.isAuthenticated = false
        this.userId = null
        console.error('WebSocket authentication failed')
        this.emit('authenticationFailed', data)
        break
        
      default:
        this.emit('auth', { event, data })
    }
  }

  /**
   * Handle subscription messages
   */
  handleSubscriptionMessage(event, data) {
    switch (event) {
      case 'subscribed':
        console.log('Subscribed to channel:', data.channel)
        this.emit('subscribed', data)
        break
        
      case 'unsubscribed':
        console.log('Unsubscribed from channel:', data.channel)
        this.emit('unsubscribed', data)
        break
        
      default:
        this.emit('subscription', { event, data })
    }
  }

  /**
   * Handle error messages
   */
  handleErrorMessage(event, data) {
    const error = new WebSocketError(data.message || 'Server error', data.code || 'SERVER_ERROR')
    console.error('WebSocket server error:', error)
    this.emit('error', error)
  }

  /**
   * Authenticate with the server
   */
  async authenticate() {
    try {
      const token = await this.jwtManager.getValidToken()
      if (token) {
        // Extract user ID from token (you might want to decode JWT here)
        const payload = this.jwtManager.decodeToken(token)
        if (payload && payload.userId) {
          this.send({
            type: 'auth',
            data: { userId: payload.userId, token }
          })
        }
      }
    } catch (error) {
      console.error('Failed to authenticate WebSocket:', error)
    }
  }

  /**
   * Send message to server
   */
  send(message) {
    if (!this.isConnected || !this.ws) {
      // Queue message for later
      this.messageQueue.push(message)
      return false
    }
    
    try {
      this.ws.send(JSON.stringify(message))
      return true
    } catch (error) {
      console.error('Failed to send WebSocket message:', error)
      this.emit('error', new WebSocketError('Failed to send message', 'SEND_ERROR', error))
      return false
    }
  }

  /**
   * Subscribe to a channel
   */
  subscribe(channel, callback = null, filters = null) {
    // Add callback to subscriptions
    if (callback) {
      if (!this.subscriptions.has(channel)) {
        this.subscriptions.set(channel, new Set())
      }
      this.subscriptions.get(channel).add(callback)
    }
    
    // Send subscription message to server
    this.send({
      type: 'subscribe',
      data: { channel, userId: this.userId, filters }
    })
    
    return () => this.unsubscribe(channel, callback)
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(channel, callback = null) {
    if (callback && this.subscriptions.has(channel)) {
      this.subscriptions.get(channel).delete(callback)
      
      // If no more callbacks, remove channel
      if (this.subscriptions.get(channel).size === 0) {
        this.subscriptions.delete(channel)
      }
    } else {
      // Remove all callbacks for channel
      this.subscriptions.delete(channel)
    }
    
    // Send unsubscription message to server
    this.send({
      type: 'unsubscribe',
      data: { channel }
    })
  }

  /**
   * Emit event to subscribers
   */
  emitToSubscribers(channel, data) {
    const callbacks = this.subscriptions.get(channel)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in subscription callback for channel ${channel}:`, error)
        }
      })
    }
  }

  /**
   * Add event listener
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }
    this.eventListeners.get(event).add(callback)
    
    return () => this.off(event, callback)
  }

  /**
   * Remove event listener
   */
  off(event, callback = null) {
    if (callback && this.eventListeners.has(event)) {
      this.eventListeners.get(event).delete(callback)
      
      if (this.eventListeners.get(event).size === 0) {
        this.eventListeners.delete(event)
      }
    } else {
      this.eventListeners.delete(event)
    }
  }

  /**
   * Emit event to listeners
   */
  emit(event, data = null) {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data)
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error)
        }
      })
    }
  }

  /**
   * Send ping to server
   */
  ping() {
    this.send({ type: 'ping' })
  }

  /**
   * Start heartbeat mechanism
   */
  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.ping()
      }
    }, this.options.heartbeatInterval)
  }

  /**
   * Schedule reconnection attempt
   */
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      this.emit('maxReconnectAttemptsReached')
      return
    }
    
    const delay = this.options.reconnectInterval * Math.pow(this.options.reconnectBackoff, this.reconnectAttempts)
    this.reconnectAttempts++
    
    console.log(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`)
    
    this.reconnectTimer = setTimeout(() => {
      if (this.shouldReconnect) {
        console.log(`Attempting reconnection (${this.reconnectAttempts}/${this.options.maxReconnectAttempts})`)
        this.connect().catch(error => {
          console.error('Reconnection failed:', error)
          this.scheduleReconnect()
        })
      }
    }, delay)
  }

  /**
   * Flush queued messages
   */
  flushMessageQueue() {
    while (this.messageQueue.length > 0 && this.isConnected) {
      const message = this.messageQueue.shift()
      this.send(message)
    }
  }

  /**
   * Clear all timers
   */
  clearTimers() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
    
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer)
      this.connectionTimer = null
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      isAuthenticated: this.isAuthenticated,
      userId: this.userId,
      reconnectAttempts: this.reconnectAttempts,
      subscriptions: Array.from(this.subscriptions.keys()),
      queuedMessages: this.messageQueue.length,
      readyState: this.ws ? this.ws.readyState : null
    }
  }

  /**
   * Get WebSocket ready state as string
   */
  getReadyStateString() {
    if (!this.ws) return 'CLOSED'
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'CONNECTING'
      case WebSocket.OPEN: return 'OPEN'
      case WebSocket.CLOSING: return 'CLOSING'
      case WebSocket.CLOSED: return 'CLOSED'
      default: return 'UNKNOWN'
    }
  }

  /**
   * Subscribe to download updates for current user
   */
  subscribeToDownloads(callback) {
    if (!this.userId) {
      console.warn('Cannot subscribe to downloads: not authenticated')
      return null
    }
    return this.subscribe(`downloads:${this.userId}`, callback)
  }

  /**
   * Subscribe to file operation updates for current user
   */
  subscribeToFileOperations(callback) {
    if (!this.userId) {
      console.warn('Cannot subscribe to file operations: not authenticated')
      return null
    }
    return this.subscribe(`file-operations:${this.userId}`, callback)
  }

  /**
   * Subscribe to notifications for current user
   */
  subscribeToNotifications(callback) {
    if (!this.userId) {
      console.warn('Cannot subscribe to notifications: not authenticated')
      return null
    }
    return this.subscribe(`notifications:${this.userId}`, callback)
  }

  /**
   * Subscribe to system events
   */
  subscribeToSystem(callback) {
    return this.subscribe('system', callback)
  }
}

// Create default WebSocket client instance
export const wsClient = new WebSocketClient()

export default WebSocketClient