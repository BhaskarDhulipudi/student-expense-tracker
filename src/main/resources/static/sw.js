const CACHE_NAME = "student-expense-tracker-v3";

const APP_SHELL = [
  "/",
  "/index.html",
  "/app.js",
  "/app.css",
  "/manifest.webmanifest"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});


self.addEventListener("fetch", event => {

  const request = event.request;

  // Only handle normal HTTP/HTTPS requests.
  // Ignore chrome-extension:// and other unsupported schemes.
  if (
    request.method !== "GET" ||
    (request.url.startsWith("http://") === false &&
     request.url.startsWith("https://") === false)
  ) {
    return;
  }

  const url = new URL(request.url);

  // Don't cache API requests.
  // API requests must always go to Spring Boot/PostgreSQL.
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then(response => {

        if (response && response.ok) {

          const copy = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(request, copy).catch(() => {});
            });

        }

        return response;

      })
      .catch(() =>
        caches.match(request)
      )
  );

});