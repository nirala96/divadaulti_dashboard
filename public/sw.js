// Minimal service worker: exists only so the app satisfies PWA install
// criteria on Android/Chrome. It intentionally does not cache anything -
// this is a live dashboard, so every request should always hit the network.
self.addEventListener("install", () => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener("fetch", () => {
  // No-op: let the browser handle every request normally.
})
