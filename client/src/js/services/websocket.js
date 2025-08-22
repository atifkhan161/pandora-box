/**
 * WebSocket Service for Real-time Updates
 * Handles connection to backend WebSocket server for live notifications
 */

import authService from './auth.js'

class WebSocketService {
  constructor() {
    this.socket = null
    this.isConnected = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectInterval = 5000
    this.heartbeatInterval = 30000
    this.heartbeatTimer = null
    this.reconnectTimer = null
    this.subscriptions = new Set()
    this.messageHandlers = new Map()
    this.connectionStatusCallback = null
  }

  // Initialize WebSocket connection
  async connect() {
    try {
      const token = authService.getToken()
      if (!token) {
        console.warn('WebSocket: No authentication token available')
        return false
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const host = window.location.hostname
      const port = window.location.port || (window.location.protocol === 'https:' ? 443 : 80)
      
      // Use port 3001 for WebSocket in development, same port as backend in production
      const wsPort = window.location.hostname === 'localhost' ? 3001 : port
      const wsUrl = `${protocol}//${host}:${wsPort}?token=${encodeURIComponent(token)}`

      console.log('WebSocket: Connecting to', wsUrl)
      
      this.socket = new WebSocket(wsUrl)
      this.setupEventHandlers()
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('WebSocket connection timeout'))
        }, 10000)

        this.socket.onopen = () => {
          clearTimeout(timeout)
          resolve(true)
        }

        this.socket.onerror = (error) => {
          clearTimeout(timeout)
          reject(error)
        }
      })

    } catch (error) {
      console.error('WebSocket connection error:', error)
      this.handleConnectionError()
      return false
    }
  }

  // Setup WebSocket event handlers
  setupEventHandlers() {
    if (!this.socket) return

    this.socket.onopen = () => {
      console.log('WebSocket: Connected successfully')
      this.isConnected = true
      this.reconnectAttempts = 0
      
      // Authenticate with the server
      this.authenticate()
      
      // Start heartbeat
      this.startHeartbeat()
      
      // Resubscribe to channels
      this.resubscribeChannels()
      
      // Notify connection status
      this.notifyConnectionStatus(true)
    }

    this.socket.onclose = (event) => {
      console.log('WebSocket: Connection closed', event.code, event.reason)
      this.isConnected = false
      this.stopHeartbeat()
      
      // Notify connection status
      this.notifyConnectionStatus(false)
      
      // Attempt reconnection if not intentional close
      if (event.code !== 1000) {
        this.scheduleReconnect()
      }
    }

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error)
      this.handleConnectionError()
    }

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        this.handleMessage(message)
      } catch (error) {
        console.error('WebSocket: Error parsing message:', error)
      }
    }
  }

  // Authenticate with WebSocket server
  authenticate() {
    const user = authService.getCurrentUser()
    if (user) {
      this.send({
        type: 'auth',
        data: {
          userId: user.id,
          username: user.username
        }
      })
    }
  }

  // Handle incoming messages
  handleMessage(message) {
    console.log('WebSocket: Received message:', message)

    switch (message.type) {
      case 'system':
        this.handleSystemMessage(message)
        break
      case 'download':
        this.handleDownloadMessage(message)
        break
      case 'file':
        this.handleFileMessage(message)
        break
      case 'container':
        this.handleContainerMessage(message)
        break
      case 'stack':
        this.handleStackMessage(message)
        break
      case 'jellyfin':
        this.handleJellyfinMessage(message)
        break
      case 'notification':
        this.handleNotificationMessage(message)
        break
      default:
        console.log('WebSocket: Unknown message type:', message.type)
    }

    // Call registered handlers
    const handlers = this.messageHandlers.get(message.type)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message)
        } catch (error) {
          console.error('WebSocket message handler error:', error)
        }
      })
    }
  }

  // Handle system messages
  handleSystemMessage(message) {
    switch (message.event) {
      case 'connected':
        console.log('WebSocket: Server confirmed connection')
        break
      case 'pong':
        console.log('WebSocket: Heartbeat pong received')
        break
      case 'authenticated':
        console.log('WebSocket: Authentication successful')
        break
    }
  }

  // Handle download messages
  handleDownloadMessage(message) {
    switch (message.event) {
      case 'status_update':
        this.showToast(`Download update: ${message.data.status}`, 'info')
        break
      case 'download_added':
        this.showToast('Download added successfully', 'success')
        break
      case 'download_completed':
        this.showToast(`Download completed: ${message.data.name}`, 'success')
        this.showNotification('Download Complete', `${message.data.name} has finished downloading`)
        break
      case 'download_failed':
        this.showToast(`Download failed: ${message.data.name}`, 'error')
        break
    }
  }

  // Handle file operation messages
  handleFileMessage(message) {
    switch (message.event) {
      case 'operation_update':
        this.showToast(`File operation: ${message.data.operation}`, 'info')
        break
      case 'file_operation_completed':
        this.showToast('File operation completed', 'success')
        break
    }
  }

  // Handle container messages
  handleContainerMessage(message) {
    switch (message.event) {
      case 'action_completed':
        this.showToast(`Container ${message.data.action} completed`, 'success')
        break
    }
  }

  // Handle stack messages
  handleStackMessage(message) {
    switch (message.event) {
      case 'action_completed':
        this.showToast(`Stack ${message.data.action} completed`, 'success')
        break
    }
  }

  // Handle Jellyfin messages
  handleJellyfinMessage(message) {
    switch (message.event) {
      case 'scan_started':
        this.showToast('Library scan started', 'info')
        break
      case 'scan_completed':
        this.showToast('Library scan completed', 'success')
        break
      case 'cleanup_completed':
        this.showToast('Library cleanup completed', 'success')
        break
    }
  }

  // Handle notification messages
  handleNotificationMessage(message) {
    switch (message.event) {
      case 'new_notification':
        const notification = message.data
        this.showNotification(notification.title, notification.message, notification.type)
        break
    }
  }

  // Subscribe to channels
  subscribe(channel) {
    if (this.subscriptions.has(channel)) return

    this.subscriptions.add(channel)
    
    if (this.isConnected) {
      this.send({
        type: 'subscribe',
        data: { channel }
      })
    }
  }

  // Unsubscribe from channels
  unsubscribe(channel) {
    if (!this.subscriptions.has(channel)) return

    this.subscriptions.delete(channel)
    
    if (this.isConnected) {
      this.send({
        type: 'unsubscribe',
        data: { channel }
      })
    }
  }

  // Resubscribe to all channels after reconnection
  resubscribeChannels() {
    this.subscriptions.forEach(channel => {
      this.send({
        type: 'subscribe',
        data: { channel }
      })
    })
  }

  // Register message handler
  onMessage(type, handler) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set())
    }
    this.messageHandlers.get(type).add(handler)
  }

  // Remove message handler
  offMessage(type, handler) {
    const handlers = this.messageHandlers.get(type)
    if (handlers) {
      handlers.delete(handler)
    }
  }

  // Set connection status callback
  onConnectionStatusChange(callback) {
    this.connectionStatusCallback = callback
  }

  // Send message to server
  send(message) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket: Cannot send message, not connected')
    }
  }

  // Start heartbeat mechanism
  startHeartbeat() {
    this.stopHeartbeat()
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.send({ type: 'ping' })
      }
    }, this.heartbeatInterval)
  }

  // Stop heartbeat mechanism
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  // Handle connection error
  handleConnectionError() {
    this.isConnected = false
    this.stopHeartbeat()
    this.notifyConnectionStatus(false)
  }

  // Schedule reconnection attempt
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('WebSocket: Max reconnection attempts reached')
      this.showToast('Connection lost. Please refresh the page.', 'error')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1)
    
    console.log(`WebSocket: Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`)
    
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(error => {
        console.error('WebSocket reconnection failed:', error)
        this.scheduleReconnect()
      })
    }, delay)
  }

  // Notify connection status change
  notifyConnectionStatus(isConnected) {
    if (this.connectionStatusCallback) {
      this.connectionStatusCallback(isConnected)
    }
  }

  // Show toast notification
  showToast(message, type = 'info') {
    if (window.app && window.app.toast) {
      const icon = {
        success: 'checkmark_circle',
        error: 'close_circle',
        warning: 'warning',
        info: 'info_circle'
      }[type] || 'info_circle'

      window.app.toast.create({
        text: message,
        icon: icon,
        position: 'bottom',
        closeTimeout: 3000
      }).open()
    }
  }

  // Show browser notification
  showNotification(title, body, type = 'info') {
    // Request permission if needed
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          this.createNotification(title, body, type)
        }
      })
    } else if (Notification.permission === 'granted') {
      this.createNotification(title, body, type)
    }
  }

  // Create browser notification
  createNotification(title, body, type) {
    const options = {
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'pandora-notification',
      requireInteraction: false,
      silent: false
    }

    const notification = new Notification(title, options)
    
    // Auto close after 5 seconds
    setTimeout(() => {
      notification.close()
    }, 5000)

    // Handle click
    notification.onclick = () => {
      window.focus()
      notification.close()
    }
  }

  // Disconnect WebSocket
  disconnect() {
    this.isConnected = false
    this.stopHeartbeat()
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.socket) {
      this.socket.close(1000, 'Client disconnect')
      this.socket = null
    }

    this.subscriptions.clear()
    this.messageHandlers.clear()
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      subscriptions: Array.from(this.subscriptions)
    }
  }
}

// Create and export singleton instance
const websocketService = new WebSocketService()
export default websocketService