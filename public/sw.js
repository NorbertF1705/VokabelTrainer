// VokabelTrainer Service Worker v2.0
// Cache-first Strategie für vollständigen Offline-Betrieb

const CACHE_NAME = 'vokabeltrainer-v2.0';
const ASSETS = [
  './',
  './vokabeltrainer.html'
];

// ── INSTALL: Dateien cachen ──────────────────────────
self.addEventListener('install', function(e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    }).catch(function(err) {
      console.warn('[SW] Cache install error:', err);
    })
  );
});

// ── ACTIVATE: Alte Caches löschen ───────────────────
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) {
              console.log('[SW] Deleting old cache:', k);
              return caches.delete(k);
            })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// ── FETCH: Cache-first, Netz als Fallback ───────────
self.addEventListener('fetch', function(e) {
  // Nur GET-Requests cachen
  if (e.request.method !== 'GET') return;

  // API-Calls (Mnemonic-KI) nie cachen
  if (e.request.url.indexOf('api.anthropic.com') !== -1) return;

  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) {
        // Cache-Hit: direkt zurückgeben + im Hintergrund aktualisieren
        var fetchPromise = fetch(e.request).then(function(resp) {
          if (resp && resp.ok) {
            var clone = resp.clone();
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(e.request, clone);
            });
          }
          return resp;
        }).catch(function() {});
        return cached;
      }

      // Cache-Miss: Netz versuchen
      return fetch(e.request).then(function(resp) {
        if (!resp || !resp.ok) return resp;
        var clone = resp.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, clone);
        });
        return resp;
      }).catch(function() {
        // Offline + nicht gecacht: Haupt-HTML zurückgeben
        return caches.match('./vokabeltrainer.html');
      });
    })
  );
});
