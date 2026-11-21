/* Increment on public-shell changes. Never cache authenticated pages/API/RSC/Power BI. */
const CACHE = 'ih-public-v2';
const PUBLIC = [
  '/offline.html',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
  '/logo-pft.jpg',
];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PUBLIC)));
});
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys())
        if (key.startsWith('ih-public-') && key !== CACHE) await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});
self.addEventListener('fetch', (event) => {
  const request = event.request,
    url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(
        async () =>
          (await caches.match('/offline.html')) ||
          new Response('Koneksi terputus.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' },
          }),
      ),
    );
  } else if (!url.search && PUBLIC.includes(url.pathname)) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
  }
});
