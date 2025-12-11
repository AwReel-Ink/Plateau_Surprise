const CACHE_NAME = 'plateau-surprise-v8.0.5'; // ✅ Incrémente la version
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

// ============================================
// INSTALLATION
// ============================================
self.addEventListener('install', event => {
  console.log('[SW] Installation v8.0.4');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Mise en cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[SW] Installation réussie');
        return self.skipWaiting(); // ✅ Force activation immédiate
      })
  );
});

// ============================================
// ACTIVATION
// ============================================
self.addEventListener('activate', event => {
  console.log('[SW] Activation');
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Suppression ancien cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Activation réussie');
        return self.clients.claim(); // ✅ Prend contrôle immédiatement
      })
  );
});

// ============================================
// INTERCEPTION DES REQUÊTES (LA CLÉ !)
// ============================================
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // ✅ Gère TOUTES les requêtes vers ton domaine
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(request)
        .then(cachedResponse => {
          if (cachedResponse) {
            console.log('[SW] 📦 Depuis cache:', request.url);
            return cachedResponse;
          }

          console.log('[SW] 🌐 Depuis réseau:', request.url);
          return fetch(request)
            .then(response => {
              // ✅ Ne met en cache QUE les réponses OK
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }

              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(request, responseToCache);
                });

              return response;
            })
            .catch(error => {
              console.error('[SW] ❌ Erreur réseau:', error);
              
              // ✅ IMPORTANT : Fallback pour les navigations
              if (request.mode === 'navigate') {
                return caches.match('./index.html');
              }
              
              // Pour les autres ressources, retourne une erreur
              return new Response('Hors ligne', {
                status: 503,
                statusText: 'Service Unavailable'
              });
            });
        })
    );
  }
});
