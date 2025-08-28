import Framework7 from 'framework7/bundle'
import routes from './routes.js'
import authStore from './store/auth.js'
import wsClient from './services/websocket.js'

// Import page controllers to register their event handlers
import './pages/dashboard.js'
import './pages/login.js'
import './pages/downloads.js'
import './pages/files.js'
import './pages/containers.js'
import './pages/jellyfin.js'
import './pages/settings.js'

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
    backdropEl: undefined
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

// Initialize app after DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize authentication store
  await authStore.dispatch('initAuth')
  
  // Check authentication and redirect if needed
  const isAuthenticated = authStore.getters.isAuthenticated.value
  const currentPath = window.location.hash.replace('#!', '') || '/'
  
  if (!isAuthenticated && currentPath !== '/login/') {
    // Redirect to login if not authenticated
    app.views.main.router.navigate('/login/', { clearPreviousHistory: true })
  } else if (isAuthenticated && currentPath === '/login/') {
    // Redirect to dashboard if already authenticated
    app.views.main.router.navigate('/', { clearPreviousHistory: true })
  }
  
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
  
  // Main view is already initialized via view-init class in HTML
  const mainView = app.views.main
  
  // Make app, services, and Framework7 utilities globally available
  window.app = app
  window.mainView = mainView
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