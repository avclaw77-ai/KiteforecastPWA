const CACHE_NAME = 'mywind-v3'
const API_CACHE  = 'mywind-api-v1'

// API domains to cache for offline use (network-first, stale-fallback)
const CACHEABLE_API_ORIGINS = [
  'https://api.open-meteo.com',
  'https://api.stormglass.io',
]

// Max age for cached API responses (4 hours) — only used as offline fallback
const API_CACHE_MAX_AGE = 4 * 60 * 60 * 1000

// Install: activate immediately
self.addEventListener('install', () => self.skipWaiting())

// Activate: purge old caches (keep current versions only), claim clients
self.addEventListener('activate', (event) => {
  const keep = new Set([CACHE_NAME, API_CACHE])
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => !keep.has(k)).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

// Fetch handler
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)

  // ── API requests: network-first with stale offline fallback ──────────────
  if (CACHEABLE_API_ORIGINS.some(origin => url.origin === origin)) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone()
            // Store with timestamp header so we can show "last updated" in the UI
            const headers = new Headers(clone.headers)
            headers.set('x-sw-cached-at', new Date().toISOString())
            const cachedResponse = new Response(clone.body, {
              status: clone.status,
              statusText: clone.statusText,
              headers,
            })
            caches.open(API_CACHE).then(c => c.put(event.request, cachedResponse))
          }
          return response
        })
        .catch(async () => {
          // Offline — serve stale cached response if available
          const cached = await caches.match(event.request, { cacheName: API_CACHE })
          if (cached) {
            // Check if the cached response is too old to be useful
            const cachedAt = cached.headers.get('x-sw-cached-at')
            if (cachedAt) {
              const age = Date.now() - new Date(cachedAt).getTime()
              if (age > API_CACHE_MAX_AGE) {
                // Expired — still return it but the UI will show a warning
                // Better stale data than no data at all when kitesurfing
              }
            }
            // Add a header so the app knows this came from SW cache
            const headers = new Headers(cached.headers)
            headers.set('x-sw-offline', 'true')
            return new Response(cached.body, {
              status: cached.status,
              statusText: cached.statusText,
              headers,
            })
          }
          // No cache at all — return a network error response
          return new Response(JSON.stringify({ error: 'offline' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          })
        })
    )
    return
  }

  // ── Static assets: network-first, cache fallback for same-origin ────────
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone))
          }
          return response
        })
        .catch(() => caches.match(event.request))
    )
  }
})
