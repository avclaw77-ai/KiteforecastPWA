const CACHE_NAME = 'mywind-v2'

// Install: activate immediately
self.addEventListener('install', () => self.skipWaiting())

// Activate: purge ALL old caches, claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

// Fetch: ALWAYS network-first, cache is only for offline fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)

  // Don't cache external API calls at all
  if (url.origin !== self.location.origin) return

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache a copy for offline use
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone))
        }
        return response
      })
      .catch(() => caches.match(event.request))
  )
})
