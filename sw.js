// ===== Al Hadi Real Estate — Service Worker =====
// IMPORTANT: bump CACHE_VERSION every time you deploy a meaningful change.
// This forces every visitor's phone to drop the old cached copy of the site
// and fetch the fresh one, instead of silently showing stale content forever.
const CACHE_VERSION = 'v3';
const CACHE_NAME = 'al-hadi-realestate-' + CACHE_VERSION;

// Only a few static assets are cached for offline/app-shell use.
// The HTML page itself is NOT cache-first — see fetch handler below —
// so new deployments always show up immediately instead of being stuck.
const PRECACHE_URLS = [
  '/manifest.json',
  '/icon-192.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).catch(() => {})
  );
  // Don't wait for old tabs to close — activate the new worker right away
  // (the page also listens for this and will refresh itself once).
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name.startsWith('al-hadi-realestate-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// Let the page tell us to activate immediately when a new version is found.
self.addEventListener('message', (event) => {
  if(event.data === 'SKIP_WAITING'){
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if(req.method !== 'GET') return;

  // NETWORK-FIRST for page navigations (the HTML itself).
  // This is the key fix: it guarantees people always get the latest
  // deployed index.html instead of a version cached weeks ago.
  if(req.mode === 'navigate'){
    event.respondWith(
      fetch(req)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match('/')))
    );
    return;
  }

  // CACHE-FIRST for static assets (icons, manifest) — fine to reuse,
  // they rarely change and this keeps the app fast/offline-friendly.
  event.respondWith(
    caches.match(req).then((cached) => {
      return cached || fetch(req).then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        return res;
      }).catch(() => cached);
    })
  );
});
