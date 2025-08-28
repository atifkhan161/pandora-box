import Framework7 from 'framework7/lite-bundle'
import Framework7Icons from 'framework7-icons'
import routes from './routes.js'

// Import main app styles
import '../css/app.css'

// Initialize Framework7
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
    pushStateAnimate: true
  },
  
  // Touch settings
  touch: {
    fastClicks: true,
    tapHold: true,
    tapHoldDelay: 750,
    iosTouchRipple: false
  },
  
  // Navbar settings
  navbar: {
    hideOnPageScroll: false,
    showOnPageScrollEnd: true,
    showOnPageScrollTop: true
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
    rightBreakpoint: 960
  },
  
  // Card settings
  card: {
    hideNavbarOnOpen: true,
    hideToolbarOnOpen: true,
    swipeToClose: true,
    backdrop: true,
    closeByBackdropClick: true
  },
  
  // Preloader settings
  preloader: {
    backdrop: true
  },
  
  // Theme settings
  darkMode: 'auto'
})

// Initialize app after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
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
  
  // Initialize main view
  const mainView = app.views.create('.view-main', {
    url: '/'
  })
  
  // Make app globally available
  window.app = app
  window.mainView = mainView
})

export default app