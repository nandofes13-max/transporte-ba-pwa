// sw.js - Service Worker que NO cachea archivos críticos
const CACHE_NAME = 'transporte-ba-v6';

// Solo cachear íconos y manifest
const urlsToCache = [
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
  '/manifest.json'
];

self.addEventListener('install', event => {
  console.log('✅ Service Worker v6: Instalando (cache mínimo)');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ Cacheando solo íconos');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  console.log('✅ Service Worker v6: Activado');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('🗑️ Eliminando cache viejo:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // 🆕 NO cachear archivos HTML, CSS, JS - siempre ir a red
  if (event.request.url.match(/\.(js|css|html|json)$/) || event.request.url === 'https://transporte-ba-pwa.onrender.com/') {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // Solo cachear íconos
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});
