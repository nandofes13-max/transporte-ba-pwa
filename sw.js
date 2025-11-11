// sw.js - Service Worker simplificado y estable
const CACHE_NAME = 'pwa-ba-v1';

self.addEventListener('install', event => {
  console.log('✅ Service Worker: Instalado');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('✅ Service Worker: Activado');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  // Dejar que el navegador maneje las requests normalmente
  // Esto evita los errores de "asynchronous response"
});
