const CACHE_NAME = 'pandora-box-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/styles/theme.css',
  '/styles/main.css',
  '/main.js',
  '/dashboard.js',
  '/services/auth.js',
  '/services/api.js',
  '/pages/login.js',
  '/manifest.json',
  '/assets/favicon.ico',
  '/assets/icon-192x192.png',
  '/assets/icon-512x512.png'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME];
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return cacheNames.filter((cacheName) => !currentCaches.includes(cacheName));
      })
      .then((cachesToDelete) => {
        return Promise.all(cachesToDelete.map((cacheToDelete) => {
          return caches.delete(cacheToDelete);
        }));
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(event.request)
            .then((response) => {
              // Don't cache responses that aren't successful or are API calls
              if (!response || response.status !== 200 || response.type !== 'basic' || event.request.url.includes('/api/')) {
                return response;
              }
              
              // Clone the response since it can only be consumed once
              const responseToCache = response.clone();
              
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
                
              return response;
            });
        })
        .catch(() => {
          // Fallback for offline pages
          if (event.request.url.indexOf('.html') > -1) {
            return caches.match('/index.html');
          }
        })
    );
  }
});