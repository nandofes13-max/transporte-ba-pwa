// sw.js - Service Worker con cache para API calls
const CACHE_NAME = 'pwa-ba-v2';
const API_CACHE_NAME = 'pwa-ba-api-v1';

// URLs que deben ser cacheadas (estáticos)
const STATIC_URLS = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/app.js',
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg'
];

// Endpoints de API que queremos cachear (solo respuestas exitosas)
const API_ENDPOINTS = [
  '/api/colectivos/posiciones',
  '/api/colectivos/paradas',
  '/api/colectivos/lineas',
  '/api/subtes/estaciones',
  '/api/subtes/estado',
  '/api/trenes/estaciones',
  '/api/trenes/estado',
  '/api/ecobici/estaciones',
  '/health'
];

self.addEventListener('install', event => {
  console.log('✅ Service Worker: Instalado');
  self.skipWaiting();
  
  // Precache de archivos estáticos
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Precachando archivos estáticos');
        return cache.addAll(STATIC_URLS);
      })
      .then(() => {
        console.log('✅ Precachado completado');
      })
      .catch(error => {
        console.error('❌ Error en precachado:', error);
      })
  );
});

self.addEventListener('activate', event => {
  console.log('✅ Service Worker: Activado');
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Limpiar caches antiguos
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
              console.log('🗑️ Eliminando cache antiguo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Es una request de API?
  const isApiRequest = API_ENDPOINTS.some(endpoint => 
    url.pathname.includes(endpoint)
  );
  
  // Es un archivo estático?
  const isStaticRequest = STATIC_URLS.some(staticUrl => 
    url.pathname.endsWith(staticUrl) || 
    url.pathname === '/' || 
    url.pathname.includes('.css') || 
    url.pathname.includes('.js') ||
    url.pathname.includes('.json') ||
    url.pathname.includes('.svg')
  );

  if (isApiRequest) {
    console.log('🌐 [SW] API Request:', url.pathname);
    event.respondWith(handleApiRequest(event.request));
  } else if (isStaticRequest) {
    console.log('📄 [SW] Static Request:', url.pathname);
    event.respondWith(handleStaticRequest(event.request));
  } else {
    // Para otras requests, dejar que el navegador las maneje normalmente
    console.log('🔗 [SW] Other Request - Passthrough:', url.pathname);
    return;
  }
});

async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE_NAME);
  
  try {
    // Intentar obtener datos frescos de la red primero
    console.log('🔄 [SW] Intentando fetch de API:', request.url);
    const networkResponse = await fetch(request);
    
    // Solo cachear respuestas exitosas
    if (networkResponse && networkResponse.status === 200) {
      console.log('✅ [SW] API response success, almacenando en cache');
      
      // Clonar la respuesta para almacenarla en cache
      const responseClone = networkResponse.clone();
      cache.put(request, responseClone);
      
      return networkResponse;
    } else {
      // Si la respuesta no es exitosa, buscar en cache
      throw new Error('API response not successful');
    }
    
  } catch (error) {
    console.log('❌ [SW] API fetch failed, buscando en cache:', error.message);
    
    // Buscar en cache
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('💾 [SW] Sirviendo desde cache API');
      return cachedResponse;
    } else {
      console.log('🚫 [SW] No hay datos en cache para esta API');
      
      // Devolver una respuesta de error genérica
      return new Response(
        JSON.stringify({
          success: false,
          error: 'API falló - Sin conexión y sin datos en cache'
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
}

async function handleStaticRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    // Estrategia: Network First para archivos estáticos
    console.log('🔄 [SW] Intentando fetch estático:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      // Actualizar cache con la nueva versión
      const responseClone = networkResponse.clone();
      cache.put(request, responseClone);
      console.log('✅ [SW] Static response success');
      return networkResponse;
    } else {
      throw new Error('Static response not successful');
    }
    
  } catch (error) {
    console.log('❌ [SW] Static fetch failed, buscando en cache:', error.message);
    
    // Buscar en cache
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('💾 [SW] Sirviendo desde cache estático');
      return cachedResponse;
    } else {
      console.log('🚫 [SW] No hay versión en cache');
      // Devolver error 404
      return new Response('Resource not found', { status: 404 });
    }
  }
}

// Manejar mensajes desde la app
self.addEventListener('message', event => {
  console.log('📨 [SW] Mensaje recibido:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
