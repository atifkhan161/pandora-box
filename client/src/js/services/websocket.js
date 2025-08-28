/**
 * WebSocket Client Service
 * Vanilla JavaScript implementation for real-time communication
 */

class WebSocketClient {
  constructor() {
    this.ws = null
    this.url = this.getWebSocketURL()
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 1000 // Start with 1 second
    this.maxReconnectDelay = 30000 // Max 30 seconds
    this.heartbeatInterval = null
    this.heartbeatTimeout = null
    this.isConnecting = false
    this.isConnected = false
    this.subscribers = new Map()
    this.messageQueue = []
    
    // Bind methods to preserve context
    this.onOpen = this.onOpen.bind(this)
    this.onMessage = this.onMessage.bind(this)
    this.onClose = this.onClose.bind(this)
    this.onError = this.onError.bind(this)
  }

  /**
   * Get WebSocket URL based on current location
   * @returns {string}
   */
  getWebSocketURL() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    return `${protocol}//${host}/ws`
  }

  /**
   * Connect to WebSocket server
   * @returns {Promise<void>}
   */
  async connect() {
    if (this.isConnecting || this.isConnected) {
      return
    }

    // Check if user is authenticated
    const token = localStorage.getItem('pb-auth-token');
    if (!token) {
      console.warn('Cannot connect to WebSocket: User not authenticated')
      return
    }

    this.isConnecting = true

    try {
      console.log('Connecting to WebSocket:', this.url)
      
      // Create WebSocket connection with auth token
      const wsUrl = `${this.url}?token=${encodeURIComponent(token)}`
      
      this.ws = new WebSocket(wsUrl)
      
      // Set up event listeners
      this.ws.addEventListener('open', this.onOpen)
      this.ws.addEventListener('message', this.onMessage)
      this.ws.addEventListener('close', this.onClose)
      this.ws.addEventListener('error', this.onError)
      
    } catch (error) {
      console.error('WebSocket connection error:', error)
      this.isConnecting = false
      this.scheduleReconnect()
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    console.log('Disconnecting from WebSocket')
    
    this.isConnected = false
    this.isConnecting = false
    this.reconnectAttempts = 0
    
    // Clear heartbeat
    this.clearHeartbeat()
    
    // Close WebSocket connection
    if (this.ws) {
      this.ws.removeEventListener('open', this.onOpen)
      this.ws.removeEventListener('message', this.onMessage)
      this.ws.removeEventListener('close', this.onClose)
      this.ws.removeEventListener('error', this.onError)
      
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close(1000, 'Client disconnect')
      }
      
      this.ws = null
    }
    
    // Clear message queue
    this.messageQueue = []
  }

  /**
   * Handle WebSocket open event
   */
  onOpen() {
    console.log('WebSocket connected')
    
    this.isConnecting = false
    this.isConnected = true
    this.reconnectAttempts = 0
    this.reconnectDelay = 1000
    
    // Start heartbeat
    this.startHeartbeat()
    
    // Send queued messages
    this.flushMessageQueue()
    
    // Notify subscribers
    this.notifySubscribers('connection', { type: 'connected' })
  }

  /**
   * Handle WebSocket message event
   * @param {MessageEvent} event 
   */
  onMessage(event) {
    try {
      const message = JSON.parse(event.data)
      console.log('WebSocket message received:', message)
      
      // Handle heartbeat pong
      if (message.type === 'pong') {
        this.handlePong()
        return
      }
      
      // Notify subscribers based on message type/channel
      const channel = message.channel || message.type
      if (channel) {
        this.notifySubscribers(channel, message)
      }
      
      // Notify all subscribers
      this.notifySubscribers('*', message)
      
    } catch (error) {
      console.error('Error parsing WebSocket message:', error)
    }
  }

  /**
   * Handle WebSocket close event
   * @param {CloseEvent} event 
   */
  onClose(event) {
    console.log('WebSocket disconnected:', event.code, event.reason)
    
    this.isConnected = false
    this.isConnecting = false
    
    // Clear heartbeat
    this.clearHeartbeat()
    
    // Notify subscribers
    this.notifySubscribers('connection', { 
      type: 'disconnected', 
      code: event.code, 
      reason: event.reason 
    })
    
    // Schedule reconnect if not a clean close
    if (event.code !== 1000 && localStorage.getItem('pb-auth-token')) {
      this.scheduleReconnect()
    }
  }

  /**
   * Handle WebSocket error event
   * @param {Event} event 
   */
  onError(event) {
    console.error('WebSocket error:', event)
    
    // Notify subscribers
    this.notifySubscribers('connection', { 
      type: 'error', 
      error: event 
    })
  }

  /**
   * Schedule reconnection attempt
   */
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }

    this.reconnectAttempts++
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), this.maxReconnectDelay)
    
    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`)
    
    setTimeout(() => {
      if (localStorage.getItem('pb-auth-token') && !this.isConnected) {
        this.connect()
      }
    }, delay)
  }

  /**
   * Start heartbeat mechanism
   */
  startHeartbeat() {
    this.clearHeartbeat()
    
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.send({ type: 'ping' })
        
        // Set timeout for pong response
        this.heartbeatTimeout = setTimeout(() => {
          console.warn('Heartbeat timeout - closing connection')
          this.ws.close()
        }, 5000)
      }
    }, 30000) // Send ping every 30 seconds
  }

  /**
   * Clear heartbeat timers
   */
  clearHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
    
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout)
      this.heartbeatTimeout = null
    }
  }

  /**
   * Handle pong response
   */
  handlePong() {
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout)
      this.heartbeatTimeout = null
    }
  }

  /**
   * Send message to server
   * @param {object} message 
   */
  send(message) {
    if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message))
      } catch (error) {
        console.error('Error sending WebSocket message:', error)
      }
    } else {
      // Queue message for later
      this.messageQueue.push(message)
    }
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
   * Subscribe to messages on a specific channel
   * @param {string} channel 
   * @param {function} callback 
   * @returns {function} Unsubscribe function
   */
  subscribe(channel, callback) {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Set())
    }
    
    this.subscribers.get(channel).add(callback)
    
    // Return unsubscribe function
    return () => {
      const channelSubscribers = this.subscribers.get(channel)
      if (channelSubscribers) {
        channelSubscribers.delete(callback)
        if (channelSubscribers.size === 0) {
          this.subscribers.delete(channel)
        }
      }
    }
  }

  /**
   * Unsubscribe from a specific channel
   * @param {string} channel 
   * @param {function} callback 
   */
  unsubscribe(channel, callback) {
    const channelSubscribers = this.subscribers.get(channel)
    if (channelSubscribers) {
      channelSubscribers.delete(callback)
      if (channelSubscribers.size === 0) {
        this.subscribers.delete(channel)
      }
    }
  }

  /**
   * Notify subscribers of a message
   * @param {string} channel 
   * @param {object} message 
   */
  notifySubscribers(channel, message) {
    const channelSubscribers = this.subscribers.get(channel)
    if (channelSubscribers) {
      channelSubscribers.forEach(callback => {
        try {
          callback(message)
        } catch (error) {
          console.error('Error in WebSocket subscriber callback:', error)
        }
      })
    }
  }

  /**
   * Get connection status
   * @returns {object}
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts,
      subscriberCount: Array.from(this.subscribers.values()).reduce((total, set) => total + set.size, 0)
    }
  }

  /**
   * Subscribe to download progress updates
   * @param {function} callback 
   * @returns {function} Unsubscribe function
   */
  subscribeToDownloads(callback) {
    return this.subscribe('downloads', callback)
  }

  /**
   * Subscribe to container status updates
   * @param {function} callback 
   * @returns {function} Unsubscribe function
   */
  subscribeToContainers(callback) {
    return this.subscribe('containers', callback)
  }

  /**
   * Subscribe to file operation updates
   * @param {function} callback 
   * @returns {function} Unsubscribe function
   */
  subscribeToFileOperations(callback) {
    return this.subscribe('files', callback)
  }

  /**
   * Subscribe to Jellyfin updates
   * @param {function} callback 
   * @returns {function} Unsubscribe function
   */
  subscribeToJellyfin(callback) {
    return this.subscribe('jellyfin', callback)
  }
}

export default WebSocketClient;