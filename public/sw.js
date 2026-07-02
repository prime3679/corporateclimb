// ─── SERVICE WORKER ──────────────────────────────────────────
// Offline support with a deliberately simple strategy:
//   - install: precache the app shell, code, fonts, sprites and SFX
//     (list injected at build time), so a cold offline launch works
//   - navigations: network-first (deploys reach players immediately),
//     falling back to the cached shell when offline
//   - same-origin assets: cache-first (Vite fingerprints them, so a
//     cached hash is immutable), populated as the app fetches them
//   - music beds (1.3MB) warm in the background on a WARM_MUSIC
//     message after the first user gesture — never blocking install
// VERSION is stamped per build from the precache contents, so every
// deploy invalidates cleanly; the values below are the dev fallback.

const VERSION = 'dev'
const CACHE = `corporate-climb-${VERSION}`
// Replaced by scripts/sw-precache-plugin at build time.
self.__PRECACHE = ['/']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(self.__PRECACHE)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

// Background-fill the music beds once the app asks for it (post-load,
// post-gesture). cache.match dedupes, so repeat messages are free.
self.addEventListener('message', (event) => {
  const data = event.data
  if (!data || data.type !== 'WARM_MUSIC' || !Array.isArray(data.urls)) return
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.all(
        data.urls.map((url) =>
          cache.match(url).then(
            (hit) =>
              hit ||
              fetch(url)
                .then((res) => {
                  if (res.ok) return cache.put(url, res)
                })
                .catch(() => {}),
          ),
        ),
      ),
    ),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put('/', copy))
          return response
        })
        .catch(() => caches.match('/')),
    )
    return
  }

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone()
            caches.open(CACHE).then((cache) => cache.put(request, copy))
          }
          return response
        }),
    ),
  )
})
