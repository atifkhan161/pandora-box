/**
 * Development Configuration
 * This file documents the development setup for Pandora Box
 */

export const devConfig = {
  // Server configuration
  server: {
    port: 3001,
    host: 'localhost',
    protocol: 'http',
    apiPath: '/api/v1',
    wsPath: '/ws'
  },
  
  // Client configuration  
  client: {
    port: 3000,
    host: 'localhost',
    protocol: 'http'
  },
  
  // Proxy configuration (handled by Vite)
  proxy: {
    // All /api requests will be proxied to server
    '/api': 'http://localhost:3001',
    // WebSocket connections will be proxied to server
    '/ws': 'ws://localhost:3001'
  },
  
  // Development URLs
  urls: {
    client: 'http://localhost:3000',
    server: 'http://localhost:3001',
    api: 'http://localhost:3001/api/v1',
    websocket: 'ws://localhost:3001/ws'
  }
}

export default devConfig