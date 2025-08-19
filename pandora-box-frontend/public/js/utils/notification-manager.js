/**
 * Notification Manager for Pandora Box PWA
 * Handles in-app notifications, browser notifications, and push notifications
 */

class NotificationManager {
  constructor() {
    this.hasPermission = false;
    this.pushSubscription = null;
    this.settings = null;
    this.db = window.DB; // Reference to the DB utility
    this.api = window.ApiClient; // Reference to the API client
    
    // Bind methods
    this.initialize = this.initialize.bind(this);
    this.requestPermission = this.requestPermission.bind(this);
    this.showNotification = this.showNotification.bind(this);
    this.showToast = this.showToast.bind(this);
    this.subscribeToPush = this.subscribeToPush.bind(this);
    this.unsubscribeFromPush = this.unsubscribeFromPush.bind(this);
  }
  
  /**
   * Initialize the notification manager
   * @returns {Promise<boolean>} - Whether initialization was successful
   */
  async initialize() {
    try {
      // Get notification settings
      this.settings = window.SettingsManager.get('notifications', {
        enabled: true,
        sound: true,
        newContent: true,
        systemUpdates: true,
        downloadComplete: true,
      });
      
      // Check if notifications are supported
      if (!('Notification' in window)) {
        console.warn('This browser does not support notifications');
        return false;
      }
      
      // Check permission status
      this.hasPermission = Notification.permission === 'granted';
      
      // Get push subscription from IndexedDB
      try {
        const savedSubscription = await this.db.get('settings', 'pushSubscription');
        if (savedSubscription) {
          this.pushSubscription = savedSubscription.subscription;
        }
      } catch (error) {
        console.warn('Error loading push subscription:', error);
      }
      
      // Listen for settings changes
      document.addEventListener('settings-change', (event) => {
        if (event.detail.path.startsWith('notifications.')) {
          this.settings = window.SettingsManager.get('notifications');
        }
      });
      
      return true;
    } catch (error) {
      console.error('Notification initialization error:', error);
      return false;
    }
  }
  
  /**
   * Request notification permission
   * @returns {Promise<boolean>} - Whether permission was granted
   */
  async requestPermission() {
    try {
      if (!('Notification' in window)) {
        return false;
      }
      
      // If already granted, return true
      if (Notification.permission === 'granted') {
        this.hasPermission = true;
        return true;
      }
      
      // If denied, return false
      if (Notification.permission === 'denied') {
        this.hasPermission = false;
        return false;
      }
      
      // Request permission
      const permission = await Notification.requestPermission();
      this.hasPermission = permission === 'granted';
      
      return this.hasPermission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }
  
  /**
   * Show a browser notification
   * @param {Object} options - Notification options
   * @param {string} options.title - The notification title
   * @param {string} options.body - The notification body
   * @param {string} [options.icon] - The notification icon URL
   * @param {string} [options.tag] - The notification tag
   * @param {string} [options.type] - The notification type (e.g., 'download', 'update')
   * @param {Object} [options.data] - Additional data to include with the notification
   * @returns {Promise<boolean>} - Whether the notification was shown
   */
  async showNotification({ title, body, icon, tag, type, data = {} }) {
    try {
      // Check if notifications are enabled in settings
      if (!this.settings.enabled) {
        return false;
      }
      
      // Check if specific notification type is enabled
      if (type) {
        const typeKey = this._getTypeKey(type);
        if (typeKey && this.settings[typeKey] === false) {
          return false;
        }
      }
      
      // Check permission
      if (!this.hasPermission) {
        const granted = await this.requestPermission();
        if (!granted) {
          return false;
        }
      }
      
      // Set default icon if not provided
      const notificationIcon = icon || '/assets/icons/icon-192x192.png';
      
      // Show notification
      const notification = new Notification(title, {
        body,
        icon: notificationIcon,
        tag: tag || 'pandora-box',
        data: {
          timestamp: new Date().getTime(),
          type,
          ...data
        }
      });
      
      // Play sound if enabled
      if (this.settings.sound) {
        this._playNotificationSound();
      }
      
      // Add click handler
      notification.onclick = (event) => {
        event.preventDefault();
        
        // Focus window
        if (window.parent) {
          window.parent.focus();
        }
        window.focus();
        
        // Close notification
        notification.close();
        
        // Handle click based on type
        this._handleNotificationClick(notification.data);
      };
      
      return true;
    } catch (error) {
      console.error('Error showing notification:', error);
      return false;
    }
  }
  
  /**
   * Show an in-app toast notification
   * @param {string} message - The toast message
   * @param {string} [type='info'] - The toast type ('info', 'success', 'warning', 'error')
   * @param {number} [duration=3000] - The toast duration in milliseconds
   * @returns {Object} - The toast element and methods to control it
   */
  showToast(message, type = 'info', duration = 3000) {
    // Use UIComponents to create toast
    if (window.UIComponents && window.UIComponents.createToast) {
      return window.UIComponents.createToast(message, type, duration);
    }
    
    // Fallback implementation if UIComponents is not available
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);
    
    // Hide toast after duration
    const timeoutId = setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300); // Wait for transition to complete
    }, duration);
    
    // Return toast control methods
    return {
      element: toast,
      hide: () => {
        clearTimeout(timeoutId);
        toast.classList.remove('show');
        setTimeout(() => {
          if (document.body.contains(toast)) {
            document.body.removeChild(toast);
          }
        }, 300);
      }
    };
  }
  
  /**
   * Subscribe to push notifications
   * @returns {Promise<boolean>} - Whether subscription was successful
   */
  async subscribeToPush() {
    try {
      // Check if service worker is registered
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push notifications not supported');
        return false;
      }
      
      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      
      // Get push subscription
      let subscription = await registration.pushManager.getSubscription();
      
      // If already subscribed, return true
      if (subscription) {
        this.pushSubscription = subscription.toJSON();
        await this._savePushSubscription();
        return true;
      }
      
      // Get server public key
      const response = await this.api.get('/notifications/vapid-public-key');
      if (!response || !response.publicKey) {
        throw new Error('Failed to get VAPID public key');
      }
      
      // Convert public key to Uint8Array
      const publicKey = this._urlBase64ToUint8Array(response.publicKey);
      
      // Subscribe
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicKey
      });
      
      // Save subscription
      this.pushSubscription = subscription.toJSON();
      await this._savePushSubscription();
      
      // Send subscription to server
      await this.api.post('/notifications/subscribe', {
        subscription: this.pushSubscription
      });
      
      return true;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return false;
    }
  }
  
  /**
   * Unsubscribe from push notifications
   * @returns {Promise<boolean>} - Whether unsubscription was successful
   */
  async unsubscribeFromPush() {
    try {
      // Check if service worker is registered
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        return false;
      }
      
      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      
      // Get push subscription
      const subscription = await registration.pushManager.getSubscription();
      
      // If not subscribed, return true
      if (!subscription) {
        this.pushSubscription = null;
        await this._savePushSubscription();
        return true;
      }
      
      // Unsubscribe
      await subscription.unsubscribe();
      
      // Clear subscription
      this.pushSubscription = null;
      await this._savePushSubscription();
      
      // Send unsubscription to server
      await this.api.post('/notifications/unsubscribe', {
        subscription: subscription.toJSON()
      });
      
      return true;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    }
  }
  
  /**
   * Save push subscription to IndexedDB
   * @private
   * @returns {Promise<void>}
   */
  async _savePushSubscription() {
    if (!this.db) return;
    
    try {
      await this.db.put('settings', {
        id: 'pushSubscription',
        subscription: this.pushSubscription,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error saving push subscription:', error);
    }
  }
  
  /**
   * Play notification sound
   * @private
   */
  _playNotificationSound() {
    try {
      const audio = new Audio('/assets/sounds/notification.mp3');
      audio.volume = 0.5;
      audio.play();
    } catch (error) {
      console.warn('Error playing notification sound:', error);
    }
  }
  
  /**
   * Handle notification click
   * @private
   * @param {Object} data - The notification data
   */
  _handleNotificationClick(data) {
    if (!data || !data.type) return;
    
    switch (data.type) {
      case 'download':
        // Navigate to downloads page
        window.location.hash = '#/downloads';
        break;
      
      case 'update':
        // Navigate to settings page
        window.location.hash = '#/settings/system';
        break;
      
      case 'media':
        // Navigate to media details
        if (data.mediaId) {
          window.location.hash = `#/media/${data.mediaId}`;
        } else {
          window.location.hash = '#/media';
        }
        break;
      
      default:
        // Navigate to dashboard
        window.location.hash = '#/dashboard';
    }
  }
  
  /**
   * Get settings key for notification type
   * @private
   * @param {string} type - The notification type
   * @returns {string|null} - The settings key
   */
  _getTypeKey(type) {
    switch (type) {
      case 'download':
        return 'downloadComplete';
      case 'update':
        return 'systemUpdates';
      case 'media':
        return 'newContent';
      default:
        return null;
    }
  }
  
  /**
   * Convert URL-safe base64 to Uint8Array
   * @private
   * @param {string} base64String - The base64 string
   * @returns {Uint8Array} - The Uint8Array
   */
  _urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  }
}

// Create and export the notification manager instance
window.NotificationManager = new NotificationManager();