// Météo Pure Service Worker - Offline cache + Web Push
const CACHE_NAME = 'meteo-pure-v6';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => key !== CACHE_NAME ? caches.delete(key) : null))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Never intercept /api/* calls — they must always hit the server
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/')) return;

  const isStaticAsset = url.origin === self.location.origin;

  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          fetch(event.request).then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
            }
          }).catch(() => {});
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          return networkResponse;
        });
      })
    );
  } else {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
  }
});

// BACKGROUND WEB PUSH NOTIFICATION RECEIVER
self.addEventListener('push', (event) => {
  let data = { title: 'Météo Pure', message: 'Mise à jour météo disponible.', intensity: 'moderate', city: '' };
  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data = { ...data, message: event.data.text() };
    }
  }

  const tagMap = {
    morning_brief: 'meteo-pure-brief',
    alert_red: 'meteo-pure-vigilance',
    alert_orange: 'meteo-pure-vigilance',
    alert_yellow: 'meteo-pure-vigilance',
    thunderstorm: 'meteo-pure-storm',
    end_storm: 'meteo-pure-storm',
    heatwave: 'meteo-pure-heat',
    light: 'meteo-pure-rain',
    moderate: 'meteo-pure-rain',
    heavy: 'meteo-pure-rain',
    end_rain: 'meteo-pure-rain'
  };
  const tag = tagMap[data.intensity] || 'meteo-pure';

  const isHighPriority = ['alert_red', 'alert_orange', 'thunderstorm', 'heatwave'].includes(data.intensity);

  const options = {
    body: data.message,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: isHighPriority ? [200, 100, 200, 100, 200] : [100, 50, 100],
    tag,
    renotify: true,
    requireInteraction: isHighPriority,
    silent: false,
    data: {
      url: self.location.origin,
      intensity: data.intensity,
      city: data.city
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// NOTIFICATION CLICK HANDLER
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || self.location.origin;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus an existing tab if any window of this app is already open
      for (const client of clientList) {
        try {
          const clientOrigin = new URL(client.url).origin;
          if (clientOrigin === self.location.origin && 'focus' in client) {
            return client.focus();
          }
        } catch {}
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
