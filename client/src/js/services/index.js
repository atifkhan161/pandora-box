/**
 * Services Index for Pandora PWA
 * Exports all API services for easy importing
 */

// Base API client
export { ApiClient, ApiError, NetworkError, apiClient } from './api.js'

// Authentication service
export { AuthService, authService } from './auth.js'

// Media discovery service
export { MediaService, mediaService } from './media.js'

// Torrents/downloads service
export { TorrentsService, torrentsService } from './torrents.js'

// File management service
export { FilesService, filesService } from './files.js'

// Container management service
export { ContainersService, containersService } from './containers.js'

// Jellyfin media server service
export { JellyfinService, jellyfinService } from './jellyfin.js'

// Settings and configuration service
export { SettingsService, settingsService } from './settings.js'

// WebSocket client
export { WebSocketClient, WebSocketError, wsClient } from '../utils/websocket.js'

/**
 * Initialize all services
 * Call this function to set up all services with proper configuration
 */
export async function initializeServices() {
  try {
    // Initialize WebSocket connection
    await wsClient.connect()
    
    console.log('All services initialized successfully')
    return true
  } catch (error) {
    console.error('Failed to initialize services:', error)
    return false
  }
}

/**
 * Cleanup all services
 * Call this function when the application is shutting down
 */
export function cleanupServices() {
  try {
    // Disconnect WebSocket
    wsClient.disconnect()
    
    console.log('All services cleaned up successfully')
  } catch (error) {
    console.error('Error during service cleanup:', error)
  }
}

/**
 * Get service health status
 * Returns the health status of all services
 */
export async function getServicesHealth() {
  const health = {
    api: false,
    websocket: false,
    timestamp: new Date().toISOString()
  }
  
  try {
    // Check API health
    await apiClient.healthCheck()
    health.api = true
  } catch (error) {
    console.warn('API health check failed:', error)
  }
  
  try {
    // Check WebSocket health
    health.websocket = wsClient.isConnected
  } catch (error) {
    console.warn('WebSocket health check failed:', error)
  }
  
  return health
}

/**
 * Service configuration
 */
export const serviceConfig = {
  api: {
    baseURL: '/api/v1',
    timeout: 30000,
    retryAttempts: 3
  },
  websocket: {
    reconnectInterval: 1000,
    maxReconnectAttempts: 10,
    heartbeatInterval: 30000
  }
}

// Default export with all services
export default {
  // Services
  apiClient,
  authService,
  mediaService,
  torrentsService,
  filesService,
  containersService,
  jellyfinService,
  settingsService,
  wsClient,
  
  // Utilities
  initializeServices,
  cleanupServices,
  getServicesHealth,
  serviceConfig
}