self.addEventListener('install', event => self.skipWaiting());
self.addEventListener('activate', event => self.clients.claim());

// Simple fetch passthrough; optional caching can be added later
self.addEventListener('fetch', event => {
  event.respondWith(fetch(event.request));
});