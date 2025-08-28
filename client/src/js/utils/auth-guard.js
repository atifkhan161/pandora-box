/**
 * Authentication Route Guard
 * Protects routes that require authentication
 */

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export function isAuthenticated() {
  return window.authStore && window.authStore.isAuthenticated();
}

/**
 * Check if user is admin
 * @returns {boolean}
 */
export function isAdmin() {
  return window.authStore && window.authStore.isAdmin();
}

/**
 * Route guard that checks authentication
 * @param {string} path - The path being accessed
 * @returns {boolean} - True if access is allowed
 */
export function requireAuth(path = '') {
  if (isAuthenticated()) {
    return true;
  } else {
    // User is not authenticated, redirect to login
    console.log(`Access denied to ${path}. Redirecting to login.`);
    
    if (window.router) {
      window.router.navigate('/login');
    } else {
      window.location.href = '/login';
    }
    
    return false;
  }
}

/**
 * Route guard that redirects authenticated users away from login
 * @returns {boolean} - True if access is allowed
 */
export function redirectIfAuthenticated() {
  if (!isAuthenticated()) {
    return true; // Allow access to login page
  } else {
    // User is already authenticated, redirect to dashboard
    console.log('User already authenticated. Redirecting to dashboard.');
    
    if (window.router) {
      window.router.navigate('/dashboard');
    } else {
      window.location.href = '/dashboard';
    }
    
    return false;
  }
}

/**
 * Route guard that checks for admin role
 * @param {string} path - The path being accessed
 * @returns {boolean} - True if access is allowed
 */
export function requireAdmin(path = '') {
  if (!isAuthenticated()) {
    console.log(`Access denied to ${path}. User not authenticated.`);
    
    if (window.router) {
      window.router.navigate('/login');
    } else {
      window.location.href = '/login';
    }
    
    return false;
  }
  
  if (isAdmin()) {
    return true;
  } else {
    console.log(`Access denied to ${path}. Admin privileges required.`);
    
    // Show error message
    if (window.showToast) {
      window.showToast('Access denied. Admin privileges required.', 'error');
    } else {
      alert('Access denied. Admin privileges required.');
    }
    
    return false;
  }
}

/**
 * Get current user data
 * @returns {object|null}
 */
export function getCurrentUser() {
  return window.authStore ? window.authStore.getUser() : null;
}

/**
 * Get authentication token
 * @returns {string|null}
 */
export function getAuthToken() {
  return window.authStore ? window.authStore.getToken() : null;
}

/**
 * Logout current user
 * @returns {Promise<void>}
 */
export async function logout() {
  if (window.authStore) {
    await window.authStore.logout();
    
    // Redirect to login
    if (window.router) {
      window.router.navigate('/login');
    } else {
      window.location.href = '/login';
    }
  }
}