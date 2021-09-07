const FILES_TO_CACHE = [
    "/",
    "index.html",
    "styles.css",
    "index.js",
    "db.js",
    "manifest.json",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png",
];

const CACHE_NAME = "pre-cache-v1";
const INPUT_CACHE_NAME = "input-cache-v1";

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then(cache => cache.addAll(FILES_TO_CACHE))
            .then(() => self.skipWaiting())
    );
});

// Activate handler cleans up old caches.
self.addEventListener('activate', event => {
    const currentCaches = [CACHE_NAME, INPUT_CACHE_NAME];
    event.waitUntil(
        caches
            .keys()
            .then((cacheNames) => {

                return cacheNames.filter(
                    (cacheName) => !currentCaches.includes(cacheName)
                );
            })
            .then((cachesToDelete) => {
                return Promise.all(
                    cachesToDelete.map((cacheToDelete) => {
                        return caches.delete(cacheToDelete);
                    })
                );
            })
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    if (
        event.request.method !== "GET" ||
        !event.request.url.startsWith(self.location.origin)
    ) {event.respondWith(fetch(event.request));
        return;
    }

    if (event.request.url.includes('/api/')) {

        event.respondWith(
            caches.open(INPUT_CACHE_NAME).then((cache) => {
                return fetch(event.request)
                    .then((response) => {
                        cache.put(event.request, response.clone());
                        return response;
                    })
                    .cache(() => caches.match(event.request));
            })
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return caches.open(INPUT_CACHE_NAME).then((cache) => {
                return fetch(event.request).then((response) => {
                    return cache.put(event.request, response.clone()).then(() => {
                        return response;
                    });
                });
            });
        })
    );
});