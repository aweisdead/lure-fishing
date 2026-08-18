const CACHE_NAME = "lure-assistant-v2-measurements-1";
const APP_SHELL = [
  "/",
  "/index.html",
  "/styles.css",
  "/app.js",
  "/manifest.webmanifest",
  "/assets/app-icon-192.png",
  "/assets/app-icon-512.png",
  "/assets/apple-touch-icon.png",
  "/assets/brand-lockup-transparent.png",
  "/assets/gear-fishing-rod-ai.png",
  "/assets/gear-spinning-reel-ai.png",
  "/assets/lure-minnow.png",
  "/assets/catch-perch.png",
  "/assets/catch-snakehead.png",
  "/assets/catch-zui.png",
  "/assets/fish-ganchina-user.png",
  "/assets/fish-duckbill-zui-user.jpg",
  "/assets/fish-snakehead-user.png",
  "/assets/fish-bass-user.png",
  "/assets/fish-mandarin-user.png",
  "/assets/fish-makou-user.png",
  "/assets/fish-junyu-user.png",
  "/assets/fish-catfish-user.png",
  "/assets/fish-carp-user.png",
  "/assets/fish-redtail-user.jpg",
  "/assets/fish-duckbill-zui-user-fixed.jpg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (url.origin !== location.origin || request.method !== "GET") return;
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("/", copy));
          return response;
        })
        .catch(() => caches.match("/") || caches.match("/index.html"))
    );
    return;
  }

  if (["/app.js", "/styles.css", "/manifest.webmanifest", "/service-worker.js"].includes(url.pathname)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const fresh = fetch(request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      });
      return cached || fresh;
    })
  );
});
