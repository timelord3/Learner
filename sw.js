const VERSION = "v1";
const CACHE_NAME = `learner-hours-${VERSION}`;

const APP_STATIC_RESOURCES = [
  "/",
  "/index.html",
  "/style.css",
  "/app.js",
  "/LearnerHours.json",
  "/icons/wheel.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      // Open the specified cache.
      const cache = await caches.open(CACHE_NAME);  
      // Add all static files to the cache.
      cache.addAll(APP_STATIC_RESOURCES);   
    })(), // Immediately invoke the async function.
  );
});

// delete old caches on activate
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Get a list of all the caches
      const names = await caches.keys();
      // Go through the list
      await Promise.all(
        names.map((name) => {
          // Check if it is not the current cache
          if (name !== CACHE_NAME) {
	    // delete it
            return caches.delete(name);
          }
        }),
      );
      // Set the current service worker as the controller
      await clients.claim();
    })(),
  );
});

// On fetch, intercept server requests
// and respond with cached responses instead of going to network
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // If we have a cached response, return it
      if (response) {
        return response;
      }

      // Otherwise, fetch the resource from the network
      return fetch(event.request).then(networkResponse => {
        // Check if the response is valid
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        // Clone the response
        const responseToCache = networkResponse.clone();

        // Open the cache and put the cloned response in it
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Handle fetch errors
        return new Response('Network error occurred', {
          status: 408,
          statusText: 'Network error'
        });
      });
    }).catch(() => {
      // Handle 404 errors
      return new Response('Resource not found', {
        status: 404,
        statusText: 'Not Found'
      });
    })
  );
});


