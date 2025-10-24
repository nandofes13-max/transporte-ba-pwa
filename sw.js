// sw.js - Service Worker simplificado y estable
const CACHE_NAME = 'transporte-ba-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/app.js',
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg'
];

self.addEventListener('install', event => {
  console.log('✅ Service Worker: Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ Service Worker: Cacheando archivos esenciales');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  console.log('✅ Service Worker: Activado y listo');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Devuelve el cache o busca en red
        return response || fetch(event.request);
      })
      .catch(() => {
        // Solo fallback para HTML
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      })
  );
});
