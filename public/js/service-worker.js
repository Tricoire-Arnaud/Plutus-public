const CACHE_NAME = "plutus-cache-v1";
const STATIC_ASSETS = [
  "/",
  "/css/styles.css",
  "/images/logo-plutus.webp",
  "/images/temple.webp",
  "/js/landing.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
