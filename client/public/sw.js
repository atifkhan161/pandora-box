// Pandora Box PWA Service Worker
const CACHE_NAME = 'pandora-box-v1.0.0'
const STATIC_CACHE = 'pandora-static-v1'
const DYNAMIC_CACHE = 'pandora-dynamic-v1'
const API_CACHE = 'pandora-api-v1'

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/index.html',
  '/css/app.css',
  '/js/app.js',
  '/js/routes.js',
  '/js/services/auth.js',
  '/js/services/api.js',
  '/manifest.json',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg',
  '/icons/favicon.svg'
]

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/v1/auth/verify',
  '/api/v1/media/trending',
  '/api/v1/media/popular'
]

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static files')
        return cache.addAll(STATIC_FILES)
      })
      .then(() => {
        console.log('Service Worker: Static files cached')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('Service Worker: Cache installation failed', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker: Activated')
        return self.clients.claim()
      })
  )
})

// Fetch event - handle requests with caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-HTTP requests
  if (!request.url.startsWith('http')) {
    return
  }

  // API requests - Network First strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request))
    return
  }

  // Static files - Cache First strategy
  if (isStaticFile(url.pathname)) {
    event.respondWith(handleStaticRequest(request))
    return
  }

  // Navigation requests - Network First with fallback to cached index.html
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request))
    return
  }

  // Other requests - Stale While Revalidate
  event.respondWith(handleOtherRequest(request))
})

// Handle API requests with Network First strategy
async function handleApiRequest(request) {
  const url = new URL(request.url)
  
  try {
    // Try network first
    const networkResponse = await fetch(request)
    
    // If successful, cache the response for offline use
    if (networkResponse.ok) {
      const cache = await caches.open(API_CACHE)
      
      // Only cache GET requests
      if (request.method === 'GET') {
        // Clone response before caching
        const responseClone = networkResponse.clone()
        await cache.put(request, responseClone)
      }
    }
    
    return networkResponse
  } catch (error) {
    console.log('Service Worker: Network failed for API request, trying cache')
    
    // Try to get from cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      console.log('Service Worker: Serving API request from cache')
      return cachedResponse
    }
    
    // If it's an authentication request that fails, return a specific response
    if (url.pathname.includes('/auth/')) {
      return new Response(JSON.stringify({
        success: false,
        error: { code: 'OFFLINE', message: 'No internet connection' }
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Return offline response for other API requests
    return new Response(JSON.stringify({
      success: false,
      error: { code: 'OFFLINE', message: 'No internet connection' }
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Handle static files with Cache First strategy
async function handleStaticRequest(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      console.log('Service Worker: Serving static file from cache', request.url)
      return cachedResponse
    }
    
    // If not in cache, fetch from network
    const networkResponse = await fetch(request)
    
    // Cache the response
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE)
      await cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.error('Service Worker: Failed to serve static file', error)
    throw error
  }
}

// Handle navigation requests
async function handleNavigationRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request)
    return networkResponse
  } catch (error) {
    console.log('Service Worker: Network failed for navigation, serving offline page')
    
    // Try to get cached index.html for SPA routing
    const cachedResponse = await caches.match('/index.html')
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Fallback offline page
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Pandora Box - Offline</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #141414; color: white; }
            .offline-message { max-width: 600px; margin: 0 auto; }
            .retry-btn { background: #e50914; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="offline-message">
            <h1>🔌 You're Offline</h1>
            <p>Pandora Box is currently unavailable. Please check your internet connection and try again.</p>
            <button class="retry-btn" onclick="window.location.reload()">Retry</button>
          </div>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    })
  }
}

// Handle other requests with Stale While Revalidate
async function handleOtherRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE)
  const cachedResponse = await cache.match(request)
  
  // Fetch from network in background
  const networkPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  }).catch(() => null)
  
  // Return cached version immediately if available
  if (cachedResponse) {
    // Update cache in background
    networkPromise
    return cachedResponse
  }
  
  // Wait for network if no cached version
  return networkPromise || new Response('Offline', { status: 503 })
}

// Helper function to check if file is static
function isStaticFile(pathname) {
  const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2']
  return staticExtensions.some(ext => pathname.endsWith(ext)) || 
         pathname === '/' || 
         pathname === '/index.html' ||
         pathname === '/manifest.json'
}

// Background sync for when connection is restored
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag)
  
  if (event.tag === 'pandora-sync') {
    event.waitUntil(syncPendingRequests())
  }
})

// Sync pending requests when back online
async function syncPendingRequests() {
  try {
    // Get pending requests from IndexedDB
    const pendingRequests = await getPendingRequests()
    
    for (const request of pendingRequests) {
      try {
        await fetch(request.url, request.options)
        await removePendingRequest(request.id)
        console.log('Service Worker: Synced pending request', request.url)
      } catch (error) {
        console.error('Service Worker: Failed to sync request', error)
      }
    }
  } catch (error) {
    console.error('Service Worker: Background sync failed', error)
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received')
  
  let data = {}
  if (event.data) {
    try {
      data = event.data.json()
    } catch (error) {
      data = { title: 'Pandora Box', body: event.data.text() }
    }
  }
  
  const options = {
    title: data.title || 'Pandora Box',
    body: data.body || 'New notification',
    icon: '/icons/icon-192x192.svg',
    badge: '/icons/favicon.svg',
    data: data.data || {},
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false,
    tag: data.tag || 'pandora-notification',
    timestamp: Date.now()
  }
  
  event.waitUntil(
    self.registration.showNotification(options.title, options)
  )
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked')
  
  event.notification.close()
  
  const data = event.notification.data
  let url = '/'
  
  // Handle different notification types
  if (data.type === 'download_complete') {
    url = '/downloads/'
  } else if (data.type === 'file_operation') {
    url = '/files/'
  } else if (data.url) {
    url = data.url
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Try to focus existing window
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus()
        }
      }
      
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})

// Helper functions for IndexedDB operations (simplified)
async function getPendingRequests() {
  // This would integrate with IndexedDB to get pending requests
  return []
}

async function removePendingRequest(id) {
  // This would remove the request from IndexedDB
  return true
}

// Message handling from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data)
  
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting()
        break
      case 'CLIENTS_CLAIM':
        self.clients.claim()
        break
      case 'CACHE_URLS':
        event.waitUntil(cacheUrls(event.data.urls))
        break
      default:
        console.log('Service Worker: Unknown message type', event.data.type)
    }
  }
})

// Cache specific URLs
async function cacheUrls(urls) {
  const cache = await caches.open(DYNAMIC_CACHE)
  return cache.addAll(urls)
}

console.log('Service Worker: Script loaded')