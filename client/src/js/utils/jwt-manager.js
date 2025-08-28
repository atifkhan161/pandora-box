/**
 * JWT Token Management Utility
 * Handles JWT token parsing, validation, and refresh scheduling
 */

class JWTManager {
  constructor() {
    this.refreshTimer = null;
    this.refreshThreshold = 5 * 60 * 1000; // Refresh 5 minutes before expiry
  }

  /**
   * Parse JWT token payload
   * @param {string} token 
   * @returns {object|null}
   */
  parseToken(token) {
    if (!token) return null;

    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = JSON.parse(atob(parts[1]));
      return payload;
    } catch (error) {
      console.error('Error parsing JWT token:', error);
      return null;
    }
  }

  /**
   * Check if token is expired
   * @param {string} token 
   * @returns {boolean}
   */
  isTokenExpired(token) {
    const payload = this.parseToken(token);
    if (!payload || !payload.exp) return true;

    const now = Math.floor(Date.now() / 1000);
    return payload.exp <= now;
  }

  /**
   * Check if token needs refresh
   * @param {string} token 
   * @returns {boolean}
   */
  shouldRefreshToken(token) {
    const payload = this.parseToken(token);
    if (!payload || !payload.exp) return true;

    const now = Math.floor(Date.now() / 1000);
    const expiryTime = payload.exp * 1000;
    const timeUntilExpiry = expiryTime - Date.now();

    return timeUntilExpiry <= this.refreshThreshold;
  }

  /**
   * Get time until token expires
   * @param {string} token 
   * @returns {number} Milliseconds until expiry
   */
  getTimeUntilExpiry(token) {
    const payload = this.parseToken(token);
    if (!payload || !payload.exp) return 0;

    const expiryTime = payload.exp * 1000;
    return Math.max(0, expiryTime - Date.now());
  }

  /**
   * Schedule automatic token refresh
   * @param {string} token 
   * @param {function} refreshCallback 
   */
  scheduleRefresh(token, refreshCallback) {
    // Clear existing timer
    this.clearRefreshTimer();

    if (!token || !refreshCallback) return;

    const timeUntilExpiry = this.getTimeUntilExpiry(token);
    const refreshTime = Math.max(0, timeUntilExpiry - this.refreshThreshold);

    if (refreshTime > 0) {
      console.log(`Scheduling token refresh in ${Math.round(refreshTime / 1000)} seconds`);
      
      this.refreshTimer = setTimeout(async () => {
        try {
          console.log('Attempting automatic token refresh...');
          const success = await refreshCallback();
          
          if (success) {
            console.log('Token refreshed successfully');
            // Schedule next refresh with the new token
            const newToken = window.authStore?.getToken();
            if (newToken) {
              this.scheduleRefresh(newToken, refreshCallback);
            }
          } else {
            console.warn('Token refresh failed');
          }
        } catch (error) {
          console.error('Error during automatic token refresh:', error);
        }
      }, refreshTime);
    } else {
      // Token is already expired or about to expire, refresh immediately
      console.log('Token expired or about to expire, refreshing immediately...');
      refreshCallback();
    }
  }

  /**
   * Clear refresh timer
   */
  clearRefreshTimer() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Get token claims
   * @param {string} token 
   * @returns {object|null}
   */
  getTokenClaims(token) {
    const payload = this.parseToken(token);
    if (!payload) return null;

    return {
      userId: payload.sub || payload.userId,
      username: payload.username,
      role: payload.role,
      issuedAt: payload.iat ? new Date(payload.iat * 1000) : null,
      expiresAt: payload.exp ? new Date(payload.exp * 1000) : null,
      issuer: payload.iss,
      audience: payload.aud
    };
  }

  /**
   * Validate token structure
   * @param {string} token 
   * @returns {boolean}
   */
  isValidTokenStructure(token) {
    if (!token || typeof token !== 'string') return false;

    const parts = token.split('.');
    if (parts.length !== 3) return false;

    try {
      // Try to decode each part
      atob(parts[0]); // header
      atob(parts[1]); // payload
      // signature is not base64 decoded as it's binary
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get human-readable expiry time
   * @param {string} token 
   * @returns {string}
   */
  getExpiryTimeString(token) {
    const payload = this.parseToken(token);
    if (!payload || !payload.exp) return 'Unknown';

    const expiryDate = new Date(payload.exp * 1000);
    return expiryDate.toLocaleString();
  }

  /**
   * Get time remaining until expiry in human-readable format
   * @param {string} token 
   * @returns {string}
   */
  getTimeRemainingString(token) {
    const timeRemaining = this.getTimeUntilExpiry(token);
    
    if (timeRemaining <= 0) return 'Expired';

    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }
}

// Create singleton instance
const jwtManager = new JWTManager();

export default jwtManager;