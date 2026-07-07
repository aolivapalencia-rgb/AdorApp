const CACHE_NAME = "adorapp-v3";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./css/styles.css?v=100",
  "./data/songs.js",
  "./js/app.js?v=100",
  "./manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
