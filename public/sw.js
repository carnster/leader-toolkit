// Minimal service worker: enables PWA installability. Network passthrough,
// no caching, so deploys are always immediately live.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
