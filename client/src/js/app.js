import Framework7 from 'framework7/bundle'
import routes from './routes.js'
import authStore from './store/auth.js'
import wsClient from './services/websocket.js'

// Import main app styles
import '../css/app.css'

// Initialize Framework7 with full configuration
const app = new Framework7({
  name: 'Pandora Box',
  theme: 'auto',
  el: '#app',

  // App routes
  routes: routes,

  // PWA settings
  serviceWorker: {
    path: '/sw.js',
    scope: '/'
  },

  // Navigation settings
  view: {
    pushState: true,
    pushStateRoot: undefined,
    pushStateSeparator: '#!',
    pushStateAnimate: true,
    preloadPreviousPage: false,
    allowDuplicateUrls: false,
    reloadPages: false,
    removeElements: true,
    removeElementsWithTimeout: false,
    restoreScrollTopOnBack: true
  },

  // Touch settings
  touch: {
    fastClicks: true,
    fastClicksDistanceThreshold: 10,
    fastClicksDelayBetweenClicks: 50,
    tapHold: true,
    tapHoldDelay: 750,
    tapHoldPreventClicks: true,
    activeState: true,
    activeStateElements: 'a, button, label, span, .actions-button, .stepper-button, .stepper-button-plus, .stepper-button-minus, .card-expandable, .menu-item, .link, .item-link',
    materialRipple: true,
    materialRippleElements: '.ripple, .link, .item-link, .list-button, .links-list a, .button, button, .card-expandable, .menu-item',
    iosTouchRipple: false
  },

  // Clicks module
  clicks: {
    externalLinks: '.external'
  },

  // Navbar settings
  navbar: {
    hideOnPageScroll: false,
    showOnPageScrollEnd: true,
    showOnPageScrollTop: true,
    collapseLargeTitleOnScroll: true,
    snapPageScrollToLargeTitle: true,
    snapPageScrollToTransparentNavbar: true
  },

  // Toolbar settings
  toolbar: {
    hideOnPageScroll: false,
    showOnPageScrollEnd: true,
    showOnPageScrollTop: true
  },

  // Panel settings
  panel: {
    swipe: 'left',
    leftBreakpoint: 960,
    rightBreakpoint: 960,
    closeByBackdropClick: true,
    backdrop: true,
    backdropEl: undefined,
    // Force panel to start closed
    opened: false
  },

  // Card settings
  card: {
    hideNavbarOnOpen: true,
    hideToolbarOnOpen: true,
    hideStatusbarOnOpen: true,
    scrollableEl: '.page-content',
    swipeToClose: true,
    backdrop: true,
    backdropEl: undefined,
    closeByBackdropClick: true
  },

  // Popup settings
  popup: {
    backdrop: true,
    backdropEl: undefined,
    closeByBackdropClick: true,
    closeOnEscape: true,
    animate: true,
    swipeToClose: false,
    swipeHandler: null,
    push: false
  },

  // Sheet settings
  sheet: {
    backdrop: true,
    backdropEl: undefined,
    closeByBackdropClick: true,
    closeByOutsideClick: false,
    closeOnEscape: true,
    animate: true,
    swipeToClose: false,
    swipeToStep: false,
    swipeHandler: null,
    push: false
  },

  // Popover settings
  popover: {
    backdrop: true,
    backdropEl: undefined,
    closeByBackdropClick: true,
    closeByOutsideClick: true,
    closeOnEscape: true,
    animate: true
  },

  // Actions settings
  actions: {
    backdrop: true,
    backdropEl: undefined,
    closeByBackdropClick: true,
    closeOnEscape: true,
    animate: true,
    grid: false,
    convertToPopover: true,
    forceToPopover: false,
    popover: {
      backdrop: true,
      closeByBackdropClick: true,
      closeByOutsideClick: true,
      closeOnEscape: true
    }
  },

  // Preloader settings
  preloader: {
    backdrop: true,
    backdropEl: undefined
  },

  // Dialog settings
  dialog: {
    backdrop: true,
    backdropEl: undefined,
    closeByBackdropClick: false,
    animate: true,
    title: 'Framework7',
    buttonOk: 'OK',
    buttonCancel: 'Cancel',
    usernamePlaceholder: 'Username',
    passwordPlaceholder: 'Password',
    preloaderTitle: 'Loading... ',
    progressTitle: 'Loading... ',
    closeOnEscape: true,
    destroyPredefinedDialogs: true,
    keyboardActions: true
  },

  // Toast settings
  toast: {
    icon: null,
    text: null,
    position: 'bottom',
    closeButton: false,
    closeButtonColor: null,
    closeButtonText: 'Ok',
    closeTimeout: null,
    cssClass: null,
    destroyOnClose: false,
    horizontalPosition: 'left'
  },

  // Notification settings
  notification: {
    icon: null,
    title: null,
    titleRightText: null,
    subtitle: null,
    text: null,
    closeButton: true,
    closeTimeout: null,
    closeOnClick: false,
    swipeToClose: true,
    cssClass: null,
    destroyOnClose: false
  },

  // Swiper settings
  swiper: {
    init: true,
    params: {
      speed: 300,
      spaceBetween: 0,
      slidesPerView: 1,
      slidesPerColumn: 1,
      slidesPerColumnFill: 'column',
      slidesPerGroup: 1,
      centeredSlides: false,
      slidesOffsetBefore: 0,
      slidesOffsetAfter: 0,
      normalizeSlideIndex: true
    }
  },

  // Photo Browser settings
  photoBrowser: {
    photos: [],
    exposition: true,
    expositionHideCaptions: false,
    type: 'standalone',
    navbar: true,
    toolbar: true,
    theme: 'light',
    captionsTheme: undefined,
    iconsColor: undefined,
    swipeToClose: true,
    pageBackLinkText: 'Back',
    popupCloseLinkText: 'Close',
    navbarOfText: 'of',
    navbarShowCount: undefined,
    swiper: {
      initialSlide: 0,
      spaceBetween: 20,
      speed: 300,
      loop: false,
      preloadImages: true,
      navigation: {
        nextEl: '.photo-browser-next',
        prevEl: '.photo-browser-prev'
      },
      zoom: {
        enabled: true,
        maxRatio: 3,
        minRatio: 1
      },
      lazy: {
        enabled: true
      }
    }
  },

  // Lazy loading settings
  lazy: {
    placeholder: 'data:image/svg+xml;charset=utf-8,%3Csvg%20viewBox%3D\'0%200%20400%20300\'%20xmlns%3D\'http%3A//www.w3.org/2000/svg\'%3E%3Crect%20width%3D\'100%25\'%20height%3D\'100%25\'%20style%3D\'fill%3A%23f6f6f6%3Bfill-opacity%3A0.1%3B\'/%3E%3C/svg%3E',
    threshold: 0,
    sequential: true
  },

  // Theme settings
  darkMode: 'auto',

  // Store settings (using our custom auth store)
  store: authStore,

  // Init settings
  init: true,
  initOnDeviceReady: true
})

// Make app available globally immediately
window.app = app
window.Framework7 = Framework7
window.$$ = Framework7.$

// Import page controllers after app is available
import('./pages/dashboard.js')
import('./pages/login.js')
import('./pages/downloads.js')
import('./pages/files.js')
import('./pages/containers.js')
import('./pages/jellyfin.js')
import('./pages/settings.js')

// Initialize app after DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM loaded, initializing app...')

  // Initialize authentication store
  await authStore.dispatch('initAuth')
  console.log('Auth store initialized')

  // Check authentication and redirect if needed
  const isAuthenticated = authStore.getters.isAuthenticated.value
  console.log('Is authenticated:', isAuthenticated)

  // DEBUG: Force authentication to true for testing
  // Remove this line once authentication is working
  // const isAuthenticated = true

  // Initialize WebSocket connection if authenticated
  if (isAuthenticated) {
    wsClient.connect()
  }

  // Hide initial loading screen
  const preloader = document.querySelector('.preloader-backdrop')
  if (preloader) {
    setTimeout(() => {
      preloader.style.opacity = '0'
      setTimeout(() => {
        preloader.remove()
      }, 300)
    }, 1000)
  }

  // Aggressive approach to ensure main view is visible
  function forceMainViewVisible() {
    // Close any open panels
    if (app.panel && app.panel.left && app.panel.left.opened) {
      app.panel.close('left')
    }
    
    // Force close panel at DOM level
    const panel = document.querySelector('.panel-left')
    if (panel) {
      panel.classList.remove('panel-in')
      panel.style.transform = 'translate3d(-100%, 0, 0)'
    }
    
    // Ensure main view is visible
    const mainView = document.querySelector('.view-main')
    if (mainView) {
      mainView.style.display = 'block'
      mainView.style.visibility = 'visible'
      mainView.style.opacity = '1'
      mainView.style.position = 'fixed'
      mainView.style.top = '0'
      mainView.style.left = '0'
      mainView.style.width = '100%'
      mainView.style.height = '100%'
      mainView.style.zIndex = '10'
      mainView.style.transform = 'none'
    }
    
    console.log('Forced main view visible from app.js')
  }
  
  // Run multiple times to ensure it works
  setTimeout(forceMainViewVisible, 500)
  setTimeout(forceMainViewVisible, 1000)
  setTimeout(forceMainViewVisible, 1500)
  setTimeout(forceMainViewVisible, 2000)

  // Add panel event listeners to ensure proper behavior
  app.on('panelOpen', (panel) => {
    console.log('Panel opened:', panel.side)
    
    // Manage focus for accessibility
    if (panel.side === 'left') {
      const firstLink = panel.el.querySelector('.list a')
      if (firstLink) {
        setTimeout(() => firstLink.focus(), 100)
      }
    }
  })

  app.on('panelClose', (panel) => {
    console.log('Panel closed:', panel.side)
    
    // Ensure main view remains visible after panel closes
    const mainView = document.querySelector('.view-main')
    if (mainView) {
      mainView.style.display = 'block'
      mainView.style.visibility = 'visible'
    }
    
    // Return focus to main content for accessibility
    if (panel.side === 'left') {
      const menuButton = document.querySelector('.navbar .panel-open')
      if (menuButton) {
        setTimeout(() => menuButton.focus(), 100)
      }
    }
  })

  // Wait for Framework7 to initialize views, then handle routing
  app.on('viewInit', (view) => {
    console.log('View initialized:', view)
    if (view.el.classList.contains('view-main')) {
      console.log('Main view initialized, handling authentication routing...')

      // Update global mainView reference
      window.mainView = view

      const currentPath = window.location.hash.replace('#!', '') || '/'
      console.log('Current path:', currentPath)

      // DEBUG: Temporarily bypass authentication for testing
      // Comment out these lines once authentication is working properly
      if (currentPath === '/login/') {
        console.log('DEBUG: Redirecting to dashboard (bypassing auth)...')
        view.router.navigate('/', { clearPreviousHistory: true })
        return
      }

      // Original authentication logic (commented out for debugging)
      /*
      if (!isAuthenticated && currentPath !== '/login/') {
        // Redirect to login if not authenticated
        console.log('Redirecting to login...')
        view.router.navigate('/login/', { clearPreviousHistory: true })
      } else if (isAuthenticated && currentPath === '/login/') {
        // Redirect to dashboard if already authenticated
        console.log('Redirecting to dashboard...')
        view.router.navigate('/', { clearPreviousHistory: true })
      }
      */
    }
  })

  // Add navigation click handlers
  document.addEventListener('click', (e) => {
    // Handle panel navigation links
    if (e.target.closest('.panel .list a[href]')) {
      const link = e.target.closest('a[href]')
      const href = link.getAttribute('href')

      // Remove focus from the link to prevent accessibility warnings
      link.blur()

      // Close panel and navigate
      if (app.panel.left.opened) {
        app.panel.close('left')
      }

      // Navigate after a short delay to allow panel to close
      setTimeout(() => {
        if (app.views.main) {
          app.views.main.router.navigate(href)
        }
      }, 300)

      e.preventDefault()
      return false
    }
  })

  // Handle keyboard navigation for accessibility
  document.addEventListener('keydown', (e) => {
    // Close panel with Escape key
    if (e.key === 'Escape' && app.panel.left.opened) {
      app.panel.close('left')
      e.preventDefault()
    }
  })

  // Make app, services, and Framework7 utilities globally available
  window.app = app
  window.mainView = app.views.main
  window.authStore = authStore
  window.wsClient = wsClient
  window.Framework7 = Framework7
  window.$$ = Framework7.$
  window.Dom7 = Framework7.$
  // Framework7 utilities are available as static properties
  window.Device = Framework7.device
  window.Request = Framework7.request
  window.Utils = Framework7.utils
  window.Support = Framework7.support
})

export default app