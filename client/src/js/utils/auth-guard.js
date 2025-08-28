/**
 * Authentication Route Guard
 * Protects routes that require authentication
 */

import authStore from '../store/auth.js'

/**
 * Route guard that checks authentication
 * Framework7 beforeEnter signature: (routeTo, routeFrom, resolve, reject)
 */
export function requireAuth(routeTo, routeFrom, resolve, reject) {
  const isAuthenticated = authStore.getters.isAuthenticated.value
  
  if (isAuthenticated) {
    // User is authenticated, allow access
    resolve()
  } else {
    // User is not authenticated, redirect to login
    // Get the app instance from window since it's globally available
    if (window.app) {
      window.app.views.main.router.navigate('/login/', {
        clearPreviousHistory: true
      })
    }
    reject()
  }
}

/**
 * Route guard that redirects authenticated users away from login
 */
export function redirectIfAuthenticated(routeTo, routeFrom, resolve, reject) {
  const isAuthenticated = authStore.getters.isAuthenticated.value
  
  if (!isAuthenticated) {
    // User is not authenticated, allow access to login
    resolve()
  } else {
    // User is already authenticated, redirect to dashboard
    if (window.app) {
      window.app.views.main.router.navigate('/', {
        clearPreviousHistory: true
      })
    }
    reject()
  }
}

/**
 * Route guard that checks for admin role
 */
export function requireAdmin(routeTo, routeFrom, resolve, reject) {
  const isAuthenticated = authStore.getters.isAuthenticated.value
  const isAdmin = authStore.getters.isAdmin.value
  
  if (isAuthenticated && isAdmin) {
    // User is authenticated and is admin, allow access
    resolve()
  } else if (isAuthenticated) {
    // User is authenticated but not admin, show error and stay on current page
    if (window.app) {
      window.app.toast.create({
        text: 'Access denied. Admin privileges required.',
        position: 'center',
        closeTimeout: 4000
      }).open()
    }
    reject()
  } else {
    // User is not authenticated, redirect to login
    if (window.app) {
      window.app.views.main.router.navigate('/login/', {
        clearPreviousHistory: true
      })
    }
    reject()
  }
}