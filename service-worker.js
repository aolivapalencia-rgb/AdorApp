const CACHE_NAME = "adorapp-v220";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./css/styles.css?v=180",
  "./data/songs.js",
  "./js/app.js?v=180",
  "./js/planner.js?v=180",
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
