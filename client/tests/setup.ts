import { vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'
import { cleanup } from '@testing-library/dom'
import 'vitest-dom/extend-expect'

// Mock environment variables
Object.defineProperty(window, 'ENV', {
  value: {
    NODE_ENV: 'test',
    DEV: true
  },
  writable: true
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock })

// Mock IndexedDB
const indexedDBMock = {
  open: vi.fn(),
  deleteDatabase: vi.fn(),
  cmp: vi.fn()
}
Object.defineProperty(window, 'indexedDB', { value: indexedDBMock })

// Mock fetch API
global.fetch = vi.fn()

// Mock WebSocket
global.WebSocket = vi.fn(() => ({
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readyState: 1, // OPEN
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3
}))

// Mock Notification API
Object.defineProperty(window, 'Notification', {
  value: {
    permission: 'default',
    requestPermission: vi.fn().mockResolvedValue('granted'),
    close: vi.fn()
  },
  writable: true
})

// Mock Navigator API
Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    register: vi.fn().mockResolvedValue({}),
    ready: Promise.resolve({
      update: vi.fn(),
      unregister: vi.fn()
    }),
    controller: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  },
  writable: true
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})

// Mock Framework7 app
const mockF7App = {
  $: vi.fn(selector => ({
    length: selector ? 1 : 0,
    on: vi.fn(),
    off: vi.fn(),
    find: vi.fn(),
    addClass: vi.fn(),
    removeClass: vi.fn(),
    hasClass: vi.fn(),
    text: vi.fn(),
    val: vi.fn(),
    html: vi.fn(),
    hide: vi.fn(),
    show: vi.fn(),
    css: vi.fn(),
    attr: vi.fn(),
    data: vi.fn(),
    prop: vi.fn(),
    is: vi.fn(),
    closest: vi.fn(),
    parent: vi.fn(),
    children: vi.fn(),
    siblings: vi.fn(),
    next: vi.fn(),
    prev: vi.fn(),
    each: vi.fn(),
    get: vi.fn(),
    eq: vi.fn()
  })),
  view: {
    main: {
      router: {
        navigate: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
        refreshPage: vi.fn(),
        clearPreviousHistory: vi.fn()
      }
    }
  },
  dialog: {
    alert: vi.fn(),
    confirm: vi.fn(),
    prompt: vi.fn(),
    preloader: vi.fn(),
    create: vi.fn(() => ({
      open: vi.fn(),
      close: vi.fn()
    }))
  },
  toast: {
    create: vi.fn(() => ({
      open: vi.fn(),
      close: vi.fn()
    }))
  },
  popup: {
    create: vi.fn(() => ({
      open: vi.fn(),
      close: vi.fn()
    }))
  },
  sheet: {
    create: vi.fn(() => ({
      open: vi.fn(),
      close: vi.fn()
    }))
  },
  actions: {
    create: vi.fn(() => ({
      open: vi.fn(),
      close: vi.fn()
    }))
  },
  ptr: {
    create: vi.fn(),
    done: vi.fn()
  },
  infiniteScroll: {
    create: vi.fn()
  },
  searchbar: {
    create: vi.fn()
  },
  // Add utility methods for testing
  showError: vi.fn(),
  showSuccess: vi.fn(),
  showWarning: vi.fn()
}

// Make Framework7 app available globally
global.app = mockF7App
global.window.app = mockF7App

// Global test utilities
global.testUtils = {
  // Create mock API response
  createMockResponse: (data: any, success = true) => ({
    success,
    data,
    message: success ? 'Success' : 'Error'
  }),

  // Create mock fetch response
  createMockFetch: (response: any, ok = true) => {
    return vi.fn().mockResolvedValue({
      ok,
      json: vi.fn().mockResolvedValue(response),
      text: vi.fn().mockResolvedValue(JSON.stringify(response)),
      status: ok ? 200 : 400,
      statusText: ok ? 'OK' : 'Bad Request'
    })
  },

  // Create mock WebSocket
  createMockWebSocket: () => {
    const mockWS = {
      send: vi.fn(),
      close: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      readyState: 1,
      onopen: null,
      onclose: null,
      onmessage: null,
      onerror: null
    }
    return mockWS
  },

  // Create DOM element for testing
  createElement: (tag: string, attributes: Record<string, string> = {}) => {
    const element = document.createElement(tag)
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value)
    })
    return element
  },

  // Wait for async operations
  wait: (ms = 0) => new Promise(resolve => setTimeout(resolve, ms)),

  // Flush all promises
  flushPromises: () => new Promise(resolve => setTimeout(resolve, 0)),

  // Trigger event on element
  triggerEvent: (element: HTMLElement, eventType: string, eventData = {}) => {
    const event = new Event(eventType, { bubbles: true })
    Object.assign(event, eventData)
    element.dispatchEvent(event)
  },

  // Mock page navigation
  mockNavigation: {
    navigate: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn()
  }
}

// Mock CSS imports
vi.mock('../src/css/app.css', () => ({}))

// Mock service worker registration
vi.mock('../src/js/sw.js', () => ({
  default: vi.fn()
}))

// Global setup
beforeAll(() => {
  // Suppress console warnings during tests
  console.warn = vi.fn()
  console.error = vi.fn()
  console.info = vi.fn()
})

// Setup before each test
beforeEach(() => {
  // Clear all mocks
  vi.clearAllMocks()
  
  // Reset localStorage
  localStorageMock.getItem.mockClear()
  localStorageMock.setItem.mockClear()
  localStorageMock.removeItem.mockClear()
  localStorageMock.clear.mockClear()
  
  // Reset fetch mock
  global.fetch.mockClear()
  
  // Create clean DOM
  document.body.innerHTML = ''
  document.head.innerHTML = ''
})

// Cleanup after each test
afterEach(() => {
  // Clean up DOM
  cleanup()
  
  // Clear all timers
  vi.clearAllTimers()
})

// Global cleanup
afterAll(() => {
  // Restore all mocks
  vi.restoreAllMocks()
})