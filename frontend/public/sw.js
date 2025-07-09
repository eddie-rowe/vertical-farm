const CACHE_NAME = 'vertical-farm-v1';
const OFFLINE_URL = '/offline';

// Files to cache for offline functionality
const STATIC_CACHE_URLS = [
  '/',
  '/offline',
  '/manifest.json',
  '/favicon-32x32.png',
  '/apple-touch-icon.png',
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching essential files');
      return cache.addAll(STATIC_CACHE_URLS);
    })
  );
  
  // Skip waiting to activate new service worker immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http(s) requests
  if (!request.url.startsWith('http')) return;

  // Different strategies for different types of requests
  if (url.pathname.startsWith('/api/')) {
    // API requests - Network First with cache fallback
    event.respondWith(networkFirstWithFallback(request));
  } else if (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|webp|ico)$/)) {
    // Static assets - Cache First
    event.respondWith(cacheFirstWithNetworkFallback(request));
  } else if (url.pathname === '/') {
    // Homepage - Stale While Revalidate
    event.respondWith(staleWhileRevalidate(request));
  } else {
    // Other pages - Network First with offline fallback
    event.respondWith(networkFirstWithOfflineFallback(request));
  }
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Vertical Farm Alert', body: event.data.text() };
    }
  }

  const options = {
    title: data.title || 'Vertical Farm Alert',
    body: data.body || 'New notification from your farm',
    icon: '/android-chrome-192x192.png',
    badge: '/favicon-32x32.png',
    tag: data.tag || 'farm-alert',
    data: data.data || {},
    actions: [
      {
        action: 'view',
        title: 'View Details',
        icon: '/favicon-16x16.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ],
    vibrate: [200, 100, 200],
    requireInteraction: data.urgent || false,
  };

  event.waitUntil(
    self.registration.showNotification(options.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click:', event);
  
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Open or focus the app
  event.waitUntil(
    clients.matchAll().then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open new window if app isn't open
      if (clients.openWindow) {
        const targetUrl = event.notification.data?.url || '/';
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sensor-data-sync') {
    event.waitUntil(syncSensorData());
  } else if (event.tag === 'alert-sync') {
    event.waitUntil(syncAlerts());
  }
});

// CACHING STRATEGIES

// Network First - try network, fallback to cache
async function networkFirstWithFallback(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses for API calls
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, checking cache:', request.url);
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

// Cache First - serve from cache, update in background
async function cacheFirstWithNetworkFallback(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Serve from cache and update in background
    fetch(request).then((networkResponse) => {
      if (networkResponse.ok) {
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, networkResponse);
        });
      }
    }).catch(() => {
      // Network failed, but we have cache
    });
    
    return cachedResponse;
  }
  
  // Not in cache, fetch from network
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Both cache and network failed for:', request.url);
    return new Response('Offline', { status: 503 });
  }
}

// Stale While Revalidate - serve from cache, update in background
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);
  
  const networkPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      caches.open(CACHE_NAME).then((cache) => {
        cache.put(request, networkResponse.clone());
      });
    }
    return networkResponse;
  }).catch(() => cachedResponse);
  
  return cachedResponse || networkPromise;
}

// Network First with offline page fallback
async function networkFirstWithOfflineFallback(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, checking cache:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.destination === 'document') {
      return caches.match(OFFLINE_URL);
    }
    
    return new Response('Offline', { status: 503 });
  }
}

// BACKGROUND SYNC FUNCTIONS

async function syncSensorData() {
  try {
    // Get pending sensor data from IndexedDB
    const pendingData = await getPendingSensorData();
    
    if (pendingData.length > 0) {
      for (const data of pendingData) {
        await fetch('/api/sensors/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      }
      
      // Clear pending data after successful sync
      await clearPendingSensorData();
      console.log('[SW] Sensor data synced successfully');
    }
  } catch (error) {
    console.error('[SW] Failed to sync sensor data:', error);
  }
}

async function syncAlerts() {
  try {
    // Get pending alerts from IndexedDB
    const pendingAlerts = await getPendingAlerts();
    
    if (pendingAlerts.length > 0) {
      for (const alert of pendingAlerts) {
        await fetch('/api/alerts/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(alert)
        });
      }
      
      // Clear pending alerts after successful sync
      await clearPendingAlerts();
      console.log('[SW] Alerts synced successfully');
    }
  } catch (error) {
    console.error('[SW] Failed to sync alerts:', error);
  }
}

// INDEXEDDB HELPERS (simplified - would need full implementation)
async function getPendingSensorData() {
  // Implementation would interact with IndexedDB
  return [];
}

async function clearPendingSensorData() {
  // Implementation would clear IndexedDB
}

async function getPendingAlerts() {
  // Implementation would interact with IndexedDB
  return [];
}

async function clearPendingAlerts() {
  // Implementation would clear IndexedDB
}

console.log('[SW] Service Worker loaded and ready'); 