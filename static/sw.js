// Signal — service worker
// Caches the static app shell so the app opens instantly and can install as a PWA.
// Does NOT cache /api/* calls — analysis always hits the live server.

const CACHE_NAME = "signal-shell-v1";
const APP_SHELL = [
  "/",
  "/static/css/style.css",
  "/static/js/script.js",
  "/static/manifest.json",
  "/static/icons/icon-192.png",
  "/static/icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Never cache API calls — analysis results must always be fresh.
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // App shell: cache-first, falling back to network.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).then((response) => {
          if (response.ok && event.request.method === "GET") {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
      );
    })
  );
});
