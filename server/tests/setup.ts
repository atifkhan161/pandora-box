import { jest } from '@jest/globals'

// Mock environment variables for testing
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.LOG_LEVEL = 'error'
process.env.DB_PATH = ':memory:'

// Global test timeout
jest.setTimeout(10000)

// Mock external service calls by default
jest.mock('axios', () => ({
  default: {
    create: jest.fn(() => ({
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      defaults: {
        headers: {}
      }
    }))
  }
}))

// Mock WebSocket server
jest.mock('ws', () => ({
  WebSocketServer: jest.fn(() => ({
    on: jest.fn(),
    close: jest.fn(),
    clients: new Set()
  }))
}))

// Mock file system operations
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  promises: {
    ...jest.requireActual('fs').promises,
    readFile: jest.fn(),
    writeFile: jest.fn(),
    mkdir: jest.fn(),
    access: jest.fn()
  }
}))

// Global test utilities
global.testUtils = {
  // Create test user data
  createTestUser: () => ({
    id: 'test-user-id',
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedpassword',
    role: 'user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }),

  // Create test JWT token
  createTestToken: () => 'test-jwt-token',

  // Create test API response
  createApiResponse: (data: any, success = true) => ({
    success,
    data,
    message: success ? 'Success' : 'Error'
  }),

  // Wait for async operations
  wait: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms)),

  // Create mock request object
  createMockRequest: (overrides = {}) => ({
    method: 'GET',
    url: '/test',
    headers: {},
    body: {},
    params: {},
    query: {},
    user: null,
    ...overrides
  }),

  // Create mock response object
  createMockResponse: () => {
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
      redirect: jest.fn().mockReturnThis(),
      locals: {}
    }
    return res
  },

  // Create mock next function
  createMockNext: () => jest.fn()
}

// Global afterEach cleanup
afterEach(() => {
  // Clear all timers
  jest.clearAllTimers()
  
  // Clear all mocks
  jest.clearAllMocks()
})

// Global beforeAll setup
beforeAll(() => {
  // Suppress console logs during tests
  console.log = jest.fn()
  console.error = jest.fn()
  console.warn = jest.fn()
  console.info = jest.fn()
})

// Global afterAll cleanup
afterAll(() => {
  // Restore console
  jest.restoreAllMocks()
})