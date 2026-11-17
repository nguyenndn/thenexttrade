// TheNextTrade Service Worker — Safe offline fallback without caching dynamic App Router HTML
const CACHE_NAME = 'tnt-v3';
const OFFLINE_URL = '/offline';

// Static shell assets to pre-cache on install (never pre-cache dynamic HTML routes like '/')
const PRECACHE_ASSETS = [
  OFFLINE_URL,
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Install: pre-cache offline fallback & icons safely
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(
        PRECACHE_ASSETS.map((url) =>
          fetch(url, { cache: 'reload' }).then((res) => {
            if (res.ok) return cache.put(url, res);
          })
        )
      )
    )
  );
  self.skipWaiting();
});

// Activate: purge all older caches (including tnt-v2 stale HTML)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: never cache dynamic HTML or JS/CSS chunks so deployments never serve mismatched chunk hashes
self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // Only handle same-origin requests; never intercept API, Next.js chunks/RSC, or auth routes
  if (url.origin !== self.location.origin) return;
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/auth/') ||
    request.headers.get('RSC') === '1'
  ) {
    return;
  }

  // Navigation requests — always live network, fallback to /offline only when truly offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_URL).then(
          (offlineRes) =>
            offlineRes ||
            new Response('Offline — please check your internet connection and reload.', {
              status: 503,
              headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            })
        )
      )
    );
    return;
  }

  // Same-origin static icons & fonts only — cache 200 OK responses
  if (
    (url.pathname.startsWith('/icons/') || url.pathname.startsWith('/fonts/')) &&
    (request.destination === 'image' || request.destination === 'font')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
  }
});
