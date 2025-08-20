// Jest setup file
import dotenv from 'dotenv';

// Load environment variables from .env.test file if it exists, otherwise from .env
dotenv.config({ path: '.env.test' });

// Mock logger to prevent console output during tests
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  }
}));

// Global beforeAll hook
beforeAll(() => {
  // Setup any global test configuration here
});

// Global afterAll hook
afterAll(() => {
  // Clean up any global test configuration here
});