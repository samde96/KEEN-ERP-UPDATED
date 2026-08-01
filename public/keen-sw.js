const CACHE_NAME = 'keen-shell-v4';
const SHELL_URLS = ['/', '/index.html', '/manifest.webmanifest', '/Keen_Logo.png'];

async function shellFallback() {
  return (await caches.match('/')) || (await caches.match('/index.html')) || Response.error();
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);
  if (shouldBypassCache(url)) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('/', copy));
          return response;
        })
        .catch(() => shellFallback())
    );
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return response;
          })
          .catch(() => cached || Response.error());

        return cached || network;
      })
    );
  }
});

function shouldBypassCache(url) {
  return [
    '/api/',
    '/uploads/',
    '/@vite/',
    '/@react-refresh',
    '/src/',
    '/node_modules/'
  ].some((path) => url.pathname === path || url.pathname.startsWith(path));
}
