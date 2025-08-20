// Pandora Box Service Worker

const CACHE_NAME = 'pandora-box-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/style.css',
  '/css/components.css',
  '/css/themes.css',
  '/js/app.js',
  '/js/auth.js',
  '/js/utils/api.js',
  '/js/utils/helpers.js',
  '/js/utils/router.js',
  '/js/utils/storage.js',
  '/js/components/toast.js',
  '/js/components/modal.js',
  '/js/components/mediaCard.js',
  '/js/components/downloadItem.js',
  '/js/components/fileItem.js',
  '/js/components/containerItem.js',
  '/assets/icons/favicon.svg'
];

// Install event - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching app assets');
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName !== CACHE_NAME;
        }).map(cacheName => {
          console.log('Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip API requests
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then(response => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response as it can only be consumed once
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // If both cache and network fail, serve offline page
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            return new Response('Network error happened', {
              status: 408,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'sync-downloads') {
    event.waitUntil(syncDownloads());
  } else if (event.tag === 'sync-settings') {
    event.waitUntil(syncSettings());
  }
});

// Handle push notifications
self.addEventListener('push', event => {
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/badge-72x72.png',
    data: {
      url: data.url
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

// Helper function for background sync of downloads
async function syncDownloads() {
  try {
    const db = await openIndexedDB();
    const pendingDownloads = await getPendingDownloads(db);
    
    for (const download of pendingDownloads) {
      try {
        await sendDownloadToServer(download);
        await markDownloadSynced(db, download.id);
      } catch (error) {
        console.error('Failed to sync download:', error);
      }
    }
  } catch (error) {
    console.error('Error in syncDownloads:', error);
  }
}

// Helper function for background sync of settings
async function syncSettings() {
  try {
    const db = await openIndexedDB();
    const pendingSettings = await getPendingSettings(db);
    
    if (pendingSettings) {
      try {
        await sendSettingsToServer(pendingSettings);
        await markSettingsSynced(db);
      } catch (error) {
        console.error('Failed to sync settings:', error);
      }
    }
  } catch (error) {
    console.error('Error in syncSettings:', error);
  }
}

// IndexedDB helper functions (placeholders)
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('pandora-box-db', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function getPendingDownloads(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['downloads'], 'readonly');
    const store = transaction.objectStore('downloads');
    const index = store.index('synced');
    const request = index.getAll(0); // 0 = not synced
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function getPendingSettings(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['settings'], 'readonly');
    const store = transaction.objectStore('settings');
    const index = store.index('synced');
    const request = index.get(0); // 0 = not synced
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function markDownloadSynced(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['downloads'], 'readwrite');
    const store = transaction.objectStore('downloads');
    const request = store.get(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const data = request.result;
      data.synced = 1;
      const updateRequest = store.put(data);
      updateRequest.onerror = () => reject(updateRequest.error);
      updateRequest.onsuccess = () => resolve();
    };
  });
}

function markSettingsSynced(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['settings'], 'readwrite');
    const store = transaction.objectStore('settings');
    const request = store.openCursor();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        const data = cursor.value;
        data.synced = 1;
        const updateRequest = cursor.update(data);
        updateRequest.onerror = () => reject(updateRequest.error);
        updateRequest.onsuccess = () => resolve();
      } else {
        resolve();
      }
    };
  });
}

// API helper functions (placeholders)
function sendDownloadToServer(download) {
  return fetch('/api/downloads/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`
    },
    body: JSON.stringify(download)
  }).then(response => {
    if (!response.ok) throw new Error('Network response was not ok');
    return response.json();
  });
}

function sendSettingsToServer(settings) {
  return fetch('/api/system/settings', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`
    },
    body: JSON.stringify(settings)
  }).then(response => {
    if (!response.ok) throw new Error('Network response was not ok');
    return response.json();
  });
}

function getAuthToken() {
  // This is a placeholder. In a real implementation, you would need to
  // securely retrieve the auth token from somewhere accessible to the service worker
  return ''; 
}