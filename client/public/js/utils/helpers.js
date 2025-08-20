/**
 * Helper Utilities for Pandora Box PWA
 * Common utility functions used throughout the application
 */

class Helpers {
  /**
   * Debounce a function to limit how often it can be called
   * @param {Function} func - The function to debounce
   * @param {number} wait - The time to wait in milliseconds
   * @param {boolean} immediate - Whether to call the function immediately
   * @returns {Function} - The debounced function
   */
  static debounce(func, wait = 300, immediate = false) {
    let timeout;
    
    return function(...args) {
      const context = this;
      
      const later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      
      if (callNow) func.apply(context, args);
    };
  }
  
  /**
   * Throttle a function to limit how often it can be called
   * @param {Function} func - The function to throttle
   * @param {number} limit - The time limit in milliseconds
   * @returns {Function} - The throttled function
   */
  static throttle(func, limit = 300) {
    let inThrottle;
    let lastFunc;
    let lastRan;
    
    return function(...args) {
      const context = this;
      
      if (!inThrottle) {
        func.apply(context, args);
        lastRan = Date.now();
        inThrottle = true;
      } else {
        clearTimeout(lastFunc);
        
        lastFunc = setTimeout(function() {
          if (Date.now() - lastRan >= limit) {
            func.apply(context, args);
            lastRan = Date.now();
          }
        }, limit - (Date.now() - lastRan));
      }
    };
  }
  
  /**
   * Format a date string
   * @param {string|Date} date - The date to format
   * @param {string} format - The format to use (default: 'short')
   * @returns {string} - The formatted date string
   */
  static formatDate(date, format = 'short') {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Return empty string for invalid dates
    if (isNaN(dateObj.getTime())) return '';
    
    switch (format) {
      case 'full':
        return dateObj.toLocaleDateString(undefined, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      case 'date':
        return dateObj.toLocaleDateString();
      case 'time':
        return dateObj.toLocaleTimeString();
      case 'relative':
        return Helpers.getRelativeTimeString(dateObj);
      case 'short':
      default:
        return dateObj.toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
    }
  }
  
  /**
   * Get a relative time string (e.g., "2 hours ago")
   * @param {Date} date - The date to compare
   * @returns {string} - The relative time string
   */
  static getRelativeTimeString(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);
    
    if (diffSecs < 60) {
      return 'just now';
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 30) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else if (diffMonths < 12) {
      return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`;
    } else {
      return `${diffYears} year${diffYears !== 1 ? 's' : ''} ago`;
    }
  }
  
  /**
   * Format a file size
   * @param {number} bytes - The size in bytes
   * @param {number} decimals - The number of decimal places
   * @returns {string} - The formatted file size
   */
  static formatFileSize(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
  
  /**
   * Format a duration in seconds to HH:MM:SS
   * @param {number} seconds - The duration in seconds
   * @returns {string} - The formatted duration
   */
  static formatDuration(seconds) {
    if (!seconds) return '00:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    const parts = [];
    
    if (hours > 0) {
      parts.push(hours.toString().padStart(2, '0'));
    }
    
    parts.push(minutes.toString().padStart(2, '0'));
    parts.push(secs.toString().padStart(2, '0'));
    
    return parts.join(':');
  }
  
  /**
   * Truncate a string to a maximum length
   * @param {string} str - The string to truncate
   * @param {number} maxLength - The maximum length
   * @returns {string} - The truncated string
   */
  static truncateString(str, maxLength = 100) {
    if (!str || str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '...';
  }
  
  /**
   * Generate a random ID
   * @param {number} length - The length of the ID
   * @returns {string} - The random ID
   */
  static generateId(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  
  /**
   * Deep clone an object
   * @param {Object} obj - The object to clone
   * @returns {Object} - The cloned object
   */
  static deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    return JSON.parse(JSON.stringify(obj));
  }
  
  /**
   * Check if a value is empty (null, undefined, empty string, empty array, empty object)
   * @param {*} value - The value to check
   * @returns {boolean} - Whether the value is empty
   */
  static isEmpty(value) {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    if (Array.isArray(value) && value.length === 0) return true;
    if (typeof value === 'object' && Object.keys(value).length === 0) return true;
    return false;
  }
  
  /**
   * Get a value from an object by path
   * @param {Object} obj - The object to get the value from
   * @param {string} path - The path to the value (e.g., 'user.profile.name')
   * @param {*} defaultValue - The default value if the path doesn't exist
   * @returns {*} - The value at the path or the default value
   */
  static getValueByPath(obj, path, defaultValue = undefined) {
    if (!obj || !path) return defaultValue;
    
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result === null || result === undefined || typeof result !== 'object') {
        return defaultValue;
      }
      result = result[key];
    }
    
    return result === undefined ? defaultValue : result;
  }
  
  /**
   * Sanitize HTML to prevent XSS attacks
   * @param {string} html - The HTML to sanitize
   * @returns {string} - The sanitized HTML
   */
  static sanitizeHTML(html) {
    if (!html) return '';
    
    const element = document.createElement('div');
    element.textContent = html;
    return element.innerHTML;
  }
  
  /**
   * Get URL parameters as an object
   * @param {string} url - The URL to parse (defaults to current URL)
   * @returns {Object} - The URL parameters
   */
  static getUrlParams(url = window.location.href) {
    const params = {};
    const parser = document.createElement('a');
    parser.href = url;
    
    const query = parser.search.substring(1);
    const vars = query.split('&');
    
    for (let i = 0; i < vars.length; i++) {
      if (vars[i] === '') continue;
      
      const pair = vars[i].split('=');
      params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
    }
    
    return params;
  }
  
  /**
   * Detect if the device is a mobile device
   * @returns {boolean} - Whether the device is mobile
   */
  static isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
  
  /**
   * Check if the app is running in standalone mode (installed PWA)
   * @returns {boolean} - Whether the app is in standalone mode
   */
  static isStandaloneMode() {
    return window.matchMedia('(display-mode: standalone)').matches || 
           window.navigator.standalone || 
           document.referrer.includes('android-app://');
  }
  
  /**
   * Get the file extension from a filename
   * @param {string} filename - The filename
   * @returns {string} - The file extension
   */
  static getFileExtension(filename) {
    if (!filename) return '';
    return filename.split('.').pop().toLowerCase();
  }
  
  /**
   * Check if a file is an image based on its extension
   * @param {string} filename - The filename
   * @returns {boolean} - Whether the file is an image
   */
  static isImageFile(filename) {
    const ext = Helpers.getFileExtension(filename);
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext);
  }
  
  /**
   * Check if a file is a video based on its extension
   * @param {string} filename - The filename
   * @returns {boolean} - Whether the file is a video
   */
  static isVideoFile(filename) {
    const ext = Helpers.getFileExtension(filename);
    return ['mp4', 'webm', 'ogg', 'mov', 'avi', 'wmv', 'flv', 'mkv', 'm4v'].includes(ext);
  }
  
  /**
   * Check if a file is an audio based on its extension
   * @param {string} filename - The filename
   * @returns {boolean} - Whether the file is an audio
   */
  static isAudioFile(filename) {
    const ext = Helpers.getFileExtension(filename);
    return ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'].includes(ext);
  }
  
  /**
   * Get a file icon based on its extension
   * @param {string} filename - The filename
   * @returns {string} - The SVG icon string
   */
  static getFileIcon(filename) {
    if (!filename) {
      return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13z"/></svg>';
    }
    
    if (Helpers.isImageFile(filename)) {
      return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>';
    }
    
    if (Helpers.isVideoFile(filename)) {
      return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M18 3v2h-2V3H8v2H6V3H4v18h2v-2h2v2h8v-2h2v2h2V3h-2zM8 17H6v-2h2v2zm0-4H6v-2h2v2zm0-4H6V7h2v2zm10 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"/></svg>';
    }
    
    if (Helpers.isAudioFile(filename)) {
      return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z"/></svg>';
    }
    
    const ext = Helpers.getFileExtension(filename);
    
    switch (ext) {
      case 'pdf':
        return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"/></svg>';
      case 'doc':
      case 'docx':
      case 'txt':
      case 'rtf':
        return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>';
      case 'xls':
      case 'xlsx':
      case 'csv':
        return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1.99 6H17L14.5 14h2.51l-1.07 3H7.07l2.99-8h3.98l1.51 4H17l-1.51-4z"/></svg>';
      case 'zip':
      case 'rar':
      case '7z':
      case 'tar':
      case 'gz':
        return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-2 6h-2v2h2v2h-2v2h-2v-2h2v-2h-2v-2h2v-2h-2V8h2v2h2v2z"/></svg>';
      default:
        return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13z"/></svg>';
    }
  }
}

// Export the helpers
window.Helpers = Helpers;