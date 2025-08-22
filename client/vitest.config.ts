/// <reference types="vitest" />
import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  // Test configuration
  test: {
    // Test environment
    environment: 'jsdom',
    
    // Setup files
    setupFiles: ['./tests/setup.ts'],
    
    // Global test settings
    globals: true,
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    },
    
    // Test file patterns
    include: [
      'src/**/__tests__/**/*.{test,spec}.{js,ts}',
      'src/**/*.{test,spec}.{js,ts}',
      'tests/**/*.{test,spec}.{js,ts}'
    ],
    
    // Exclude patterns
    exclude: [
      'node_modules/',
      'dist/',
      'coverage/'
    ],
    
    // Test timeout
    testTimeout: 10000,
    
    // Run tests in parallel
    threads: true,
    
    // Reporter
    reporter: ['verbose', 'html'],
    
    // Mock CSS imports
    css: false,
    
    // Dependencies to inline during testing
    deps: {
      inline: [
        'framework7',
        'framework7/lite',
        'framework7/lite-bundle'
      ]
    }
  },
  
  // Resolve configuration for tests
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  
  // Define global variables for tests
  define: {
    __DEV__: true,
    __TEST__: true
  },
  
  // Plugins for testing
  plugins: []
})