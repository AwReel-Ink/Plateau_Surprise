const CACHE_NAME = 'plateau-surprise-v8.0.4';
const urlsToCache = [
  './',              // ✅ Page d'accueil (relatif)
  './index.html',    // ✅ HTML principal
  './manifest.json'  // ✅ Manifest
];

// Installation : mise en cache initiale
self.addEventListener('install', event => {
  console.log('[SW] Installation...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Mise en cache des fichiers');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // ✅ Active immédiatement
  );
});

// Activation : nettoyage des anciens caches
self.addEventListener('activate', event => {
  console.log('[SW] Activation...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Suppression ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => self.clients.claim()) // ✅ Prend contrôle immédiatement
  );
});

// Interception des requêtes : Cache-First Strategy
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          console.log('[SW] Depuis cache:', event.request.url);
          return response; // ✅ Depuis cache
        }
        
        console.log('[SW] Depuis réseau:', event.request.url);
        return fetch(event.request)
          .then(response => {
            // Clone la réponse (requise pour la mettre en cache)
            const responseClone = response.clone();
            
            // Met en cache les nouvelles ressources
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseClone);
              });
            
            return response;
          })
          .catch(() => {
            // ✅ Fallback si hors ligne ET pas en cache
            console.log('[SW] HORS LIGNE:', event.request.url);
            // Retourne la page d'accueil si navigation HTML
            if (event.request.mode === 'navigate') {
              return caches.match('./index.html');
            }
          });
      })
  );
});
