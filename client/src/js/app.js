// Import Framework7
import Framework7 from 'framework7/lite'

// Import Framework7 CSS
import 'framework7/css/bundle'

// Import Framework7-Icons CSS
import 'framework7-icons/css/framework7-icons.css'

// Import Routes
import { routes, isProtectedRoute, isAdminRoute } from './routes.js'

// Import Services
import { authService } from './services/auth.js'
import { apiService } from './services/api.js'
import websocketService from './services/websocket.js'

// Framework7 App Configuration
const app = new Framework7({
  name: 'Pandora Box',
  theme: 'auto',
  id: 'com.pandora.box',
  version: '1.0.0',
  
  // App root element
  root: '#app',
  
  // Routes
  routes: routes,
  
  // Framework7 Parameters
  input: {
    scrollIntoViewOnFocus: true,
    scrollIntoViewCentered: true,
  },
  
  // Navbar configuration
  navbar: {
    iosCenterTitle: true,
    mdCenterTitle: true,
    hideOnPageScroll: false,
  },
  
  // PWA Configuration
  serviceWorker: {
    path: '/sw.js',
    scope: '/'
  },
  
  // Theme configuration
  darkMode: true,
  
  // Touch configuration
  touch: {
    fastClicks: true,
    disableContextMenu: false,
    tapHold: true,
    tapHoldDelay: 750,
  },
  
  // Panel configuration
  panel: {
    swipe: true,
    leftBreakpoint: 768,
    closeByBackdropClick: true,
  },
  
  // Card configuration
  card: {
    hideNavbarOnOpen: false,
    hideToolbarOnOpen: false,
    swipeToClose: true,
  },
  
  // View configuration
  view: {
    stackPages: true,
    preloadPreviousPage: false,
    allowDuplicateUrls: false,
    animate: true,
    pushState: true,
    pushStateRoot: undefined,
    pushStateSeparator: '#!',
    pushStateAnimate: true,
  },
  
  // Calendar configuration
  calendar: {
    dateFormat: 'yyyy-mm-dd',
    monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  },
  
  // Notification configuration
  notification: {
    title: 'Pandora Box',
    closeTimeout: 3000,
    closeOnClick: true,
  },
  
  // Toast configuration
  toast: {
    closeTimeout: 3000,
    destroyOnClose: true,
  },
  
  // Methods
  methods: {
    // Authentication helpers
    async checkAuth() {
      try {
        const isAuthenticated = await authService.verifyToken()
        return isAuthenticated
      } catch (error) {
        console.error('Auth check failed:', error)
        return false
      }
    },
    
    // Show loading indicator
    showLoading(text = 'Loading...') {
      return app.preloader.show(text)
    },
    
    // Hide loading indicator
    hideLoading() {
      app.preloader.hide()
    },
    
    // Show toast notification
    showToast(message, type = 'info', icon = null) {
      const toastClass = `toast-${type}`
      return app.toast.create({
        text: message,
        icon: icon,
        cssClass: toastClass,
        closeTimeout: 3000,
      }).open()
    },
    
    // Show error toast
    showError(message) {
      return this.showToast(message, 'error', '<i class="f7-icons">exclamationmark_triangle</i>')
    },
    
    // Show success toast
    showSuccess(message) {
      return this.showToast(message, 'success', '<i class="f7-icons">checkmark_circle</i>')
    },
    
    // Show warning toast
    showWarning(message) {
      return this.showToast(message, 'warning', '<i class="f7-icons">exclamationmark_circle</i>')
    },
    
    // Format file size
    formatFileSize(bytes) {
      if (!bytes) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },
    
    // Format duration
    formatDuration(seconds) {
      if (!seconds) return '0s'
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      const secs = seconds % 60
      
      if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`
      } else if (minutes > 0) {
        return `${minutes}m ${secs}s`
      } else {
        return `${secs}s`
      }
    },
    
    // Format date
    formatDate(date) {
      if (!date) return ''
      return new Date(date).toLocaleDateString()
    },
    
    // Format relative time
    formatRelativeTime(date) {
      if (!date) return ''
      const now = new Date()
      const diff = now - new Date(date)
      const seconds = Math.floor(diff / 1000)
      const minutes = Math.floor(seconds / 60)
      const hours = Math.floor(minutes / 60)
      const days = Math.floor(hours / 24)
      
      if (days > 0) return `${days}d ago`
      if (hours > 0) return `${hours}h ago`
      if (minutes > 0) return `${minutes}m ago`
      return 'Just now'
    },
    
    // WebSocket connection management
    connectWebSocket: function() {
      websocketService.connect().then(connected => {
        if (connected) {
          console.log('WebSocket connected successfully')
          
          // Subscribe to user-specific channels
          const user = authService.getCurrentUser()
          if (user) {
            websocketService.subscribe(`downloads:${user.id}`)
            websocketService.subscribe(`file-operations:${user.id}`)
            websocketService.subscribe(`notifications:${user.id}`)
          }
          
          // Set up connection status monitoring
          websocketService.onConnectionStatusChange((isConnected) => {
            if (isConnected) {
              this.showSuccess('Real-time connection established')
            } else {
              this.showWarning('Real-time connection lost')
            }
          })
          
        } else {
          console.warn('Failed to connect WebSocket')
        }
      }).catch(error => {
        console.error('WebSocket connection error:', error)
      })
    },
    
    disconnectWebSocket: function() {
      websocketService.disconnect()
    }
  },
  
  // App Events
  on: {
    // App initialization
    init: function () {
      console.log('Pandora Box App initialized')
      
      // Initialize services
      apiService.init()
      
      // Check authentication on app start
      this.checkAuth().then(isAuthenticated => {
        if (!isAuthenticated && isProtectedRoute(this.view.main.router.currentRoute.path)) {
          this.view.main.router.navigate('/login/')
        } else if (isAuthenticated) {
          // Initialize WebSocket connection for authenticated users
          this.connectWebSocket()
        }
      })
    },
    
    // Page before in (route guard)
    pageBeforeIn: function (page) {
      const path = page.route.path
      
      // Check if route requires authentication
      if (isProtectedRoute(path)) {
        this.checkAuth().then(isAuthenticated => {
          if (!isAuthenticated) {
            this.view.main.router.navigate('/login/')
            return false
          }
          
          // Check admin routes
          if (isAdminRoute(path)) {
            const userRole = authService.getCurrentUser()?.role
            if (userRole !== 'admin') {
              this.showError('Access denied. Admin privileges required.')
              this.view.main.router.back()
              return false
            }
          }
        })
      }
    },
    
    // Connection status
    connectionChanged: function (isOnline) {
      if (isOnline) {
        this.showSuccess('Connection restored')
      } else {
        this.showWarning('No internet connection')
      }
    }
  }
})

// Initialize authentication state
authService.init()

// Service Worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered: ', registration)
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError)
      })
  })
}

// PWA install prompt
let deferredPrompt
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  deferredPrompt = e
  
  // Show install button or notification
  app.toast.create({
    text: 'Install Pandora Box for the best experience',
    button: {
      text: 'Install',
      color: 'red',
      close: false
    },
    on: {
      buttonClick: () => {
        if (deferredPrompt) {
          deferredPrompt.prompt()
          deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
              console.log('User accepted the A2HS prompt')
            }
            deferredPrompt = null
          })
        }
      }
    }
  }).open()
})

// Online/Offline handling
window.addEventListener('online', () => {
  app.emit('connectionChanged', true)
})

window.addEventListener('offline', () => {
  app.emit('connectionChanged', false)
})

// Export app instance
export default app