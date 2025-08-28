/**
 * Authentication Route Guard
 * Protects routes that require authentication
 */

import authStore from '../store/auth.js'

/**
 * Route guard that checks authentication
 * @param {object} to - Target route
 * @param {object} from - Source route  
 * @param {function} resolve - Resolve function
 * @param {function} reject - Reject function
 */
export function requireAuth(to, from, resolve, reject) {
  const isAuthenticated = authStore.getters.isAuthenticated.value
  
  if (isAuthenticated) {
    // User is authenticated, allow access
    resolve()
  } else {
    // User is not authenticated, redirect to login
    reject()
    
    // Get the app instance from the router
    const app = to.router.app
    app.views.main.router.navigate('/login/', {
      clearPreviousHistory: true
    })
  }
}

/**
 * Route guard that redirects authenticated users away from login
 * @param {object} to - Target route
 * @param {object} from - Source route  
 * @param {function} resolve - Resolve function
 * @param {function} reject - Reject function
 */
export function redirectIfAuthenticated(to, from, resolve, reject) {
  const isAuthenticated = authStore.getters.isAuthenticated.value
  
  if (!isAuthenticated) {
    // User is not authenticated, allow access to login
    resolve()
  } else {
    // User is already authenticated, redirect to dashboard
    reject()
    
    // Get the app instance from the router
    const app = to.router.app
    app.views.main.router.navigate('/', {
      clearPreviousHistory: true
    })
  }
}

/**
 * Route guard that checks for admin role
 * @param {object} to - Target route
 * @param {object} from - Source route  
 * @param {function} resolve - Resolve function
 * @param {function} reject - Reject function
 */
export function requireAdmin(to, from, resolve, reject) {
  const isAuthenticated = authStore.getters.isAuthenticated.value
  const isAdmin = authStore.getters.isAdmin.value
  
  if (isAuthenticated && isAdmin) {
    // User is authenticated and is admin, allow access
    resolve()
  } else if (isAuthenticated) {
    // User is authenticated but not admin, show error and stay on current page
    reject()
    
    const app = to.router.app
    app.toast.create({
      text: 'Access denied. Admin privileges required.',
      position: 'center',
      closeTimeout: 4000
    }).open()
  } else {
    // User is not authenticated, redirect to login
    reject()
    
    const app = to.router.app
    app.views.main.router.navigate('/login/', {
      clearPreviousHistory: true
    })
  }
}