/**
 * JWT Token Management Utility
 * Handles JWT token parsing, validation, refresh scheduling, and storage
 */

export class JWTManager {
  constructor() {
    this.refreshTimer = null;
    this.refreshThreshold = 5 * 60 * 1000; // Refresh 5 minutes before expiry
    this.storageKeys = {
      accessToken: 'pb_access_token',
      refreshToken: 'pb_refresh_token'
    };
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
   * Decode JWT token (alias for parseToken for compatibility)
   * @param {string} token 
   * @returns {object|null}
   */
  decodeToken(token) {
    return this.parseToken(token);
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

  /**
   * Store tokens in localStorage (persistent storage)
   * @param {string} accessToken 
   * @param {string} refreshToken 
   */
  async setTokens(accessToken, refreshToken) {
    try {
      if (accessToken) {
        localStorage.setItem(this.storageKeys.accessToken, accessToken);
      }
      if (refreshToken) {
        localStorage.setItem(this.storageKeys.refreshToken, refreshToken);
      }
    } catch (error) {
      console.error('Error storing tokens:', error);
      throw error;
    }
  }

  /**
   * Store tokens in sessionStorage (session-only storage)
   * @param {string} accessToken 
   * @param {string} refreshToken 
   */
  async setSessionTokens(accessToken, refreshToken) {
    try {
      if (accessToken) {
        sessionStorage.setItem(this.storageKeys.accessToken, accessToken);
      }
      if (refreshToken) {
        sessionStorage.setItem(this.storageKeys.refreshToken, refreshToken);
      }
    } catch (error) {
      console.error('Error storing session tokens:', error);
      throw error;
    }
  }

  /**
   * Get access token from storage
   * @returns {string|null}
   */
  async getAccessToken() {
    try {
      // Check localStorage first (persistent storage)
      let token = localStorage.getItem(this.storageKeys.accessToken);
      if (token) return token;
      
      // Check sessionStorage (session-only storage)
      token = sessionStorage.getItem(this.storageKeys.accessToken);
      return token;
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  /**
   * Get refresh token from storage
   * @returns {string|null}
   */
  async getRefreshToken() {
    try {
      // Check localStorage first (persistent storage)
      let token = localStorage.getItem(this.storageKeys.refreshToken);
      if (token) return token;
      
      // Check sessionStorage (session-only storage)
      token = sessionStorage.getItem(this.storageKeys.refreshToken);
      return token;
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  }

  /**
   * Get valid access token (refresh if needed)
   * @returns {string|null}
   */
  async getValidToken() {
    try {
      const accessToken = await this.getAccessToken();
      
      if (!accessToken) {
        return null;
      }

      // Check if token is expired
      if (this.isTokenExpired(accessToken)) {
        // Try to refresh token
        const refreshed = await this.refreshToken();
        if (refreshed) {
          return await this.getAccessToken();
        }
        return null;
      }

      return accessToken;
    } catch (error) {
      console.error('Error getting valid token:', error);
      return null;
    }
  }

  /**
   * Refresh access token using refresh token
   * @returns {boolean} Success status
   */
  async refreshToken() {
    try {
      const refreshToken = await this.getRefreshToken();
      
      if (!refreshToken) {
        return false;
      }

      // Check if refresh token is expired
      if (this.isTokenExpired(refreshToken)) {
        this.clearTokens();
        return false;
      }

      // Make refresh request
      const response = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });

      if (!response.ok) {
        this.clearTokens();
        return false;
      }

      const data = await response.json();
      
      // Handle server response format
      const accessToken = data.data?.token || data.accessToken;
      const newRefreshToken = data.data?.refreshToken || data.refreshToken;
      
      if (accessToken) {
        await this.setTokens(accessToken, newRefreshToken || refreshToken);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error refreshing token:', error);
      this.clearTokens();
      return false;
    }
  }

  /**
   * Clear all stored tokens
   */
  clearTokens() {
    try {
      // Clear from localStorage
      localStorage.removeItem(this.storageKeys.accessToken);
      localStorage.removeItem(this.storageKeys.refreshToken);
      
      // Clear from sessionStorage
      sessionStorage.removeItem(this.storageKeys.accessToken);
      sessionStorage.removeItem(this.storageKeys.refreshToken);
      
      this.clearRefreshTimer();
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  async isAuthenticated() {
    try {
      const token = await this.getValidToken();
      return !!token;
    } catch (error) {
      return false;
    }
  }
}

// Create singleton instance
export const jwtManager = new JWTManager();

export default JWTManager;