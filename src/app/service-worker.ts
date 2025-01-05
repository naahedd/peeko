/// <reference lib="webworker" />

const worker = null;
export default worker;

declare let self: ServiceWorkerGlobalScope;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('arxiv-cache-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/papers',
        '/categories'
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});