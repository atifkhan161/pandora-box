// Service Worker Registration

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker is installed but waiting to activate
              showUpdateNotification();
            }
          });
        });
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
      
    // Handle controller change (when a new service worker has taken control)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('New Service Worker activated');
    });
  });
}

// Function to show update notification
function showUpdateNotification() {
  const toast = new Toast({
    message: 'New version available! Refresh to update.',
    type: 'info',
    duration: 0, // Don't auto-dismiss
    action: {
      text: 'Refresh',
      callback: () => {
        window.location.reload();
      }
    }
  });
  toast.show();
}

// Request notification permission
function requestNotificationPermission() {
  if ('Notification' in window) {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        console.log('Notification permission granted');
        subscribeToPushNotifications();
      }
    });
  }
}

// Subscribe to push notifications (placeholder function)
function subscribeToPushNotifications() {
  // This would be implemented with a real push service
  console.log('Push notification subscription would happen here');
  // Example implementation with a real push service:
  /*
  navigator.serviceWorker.ready.then(registration => {
    return registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array('YOUR_PUBLIC_VAPID_KEY')
    });
  }).then(subscription => {
    // Send subscription to server
    return fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify(subscription)
    });
  }).catch(error => {
    console.error('Error subscribing to push notifications:', error);
  });
  */
}

// Helper function to convert base64 string to Uint8Array for VAPID key
function urlBase64ToUint8Array(base64String) {
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