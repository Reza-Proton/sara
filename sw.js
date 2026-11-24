// Sara service worker: network-first for app files, cache-first for CDN assets (offline support)
const CACHE = 'sara-v3';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const store = (req, res) => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; };

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const sameOrigin = new URL(req.url).origin === location.origin;
  if (sameOrigin) {
    e.respondWith(
      fetch(req).then(res => store(req, res))
        .catch(() => caches.match(req).then(hit => hit || caches.match('index.html')))
    );
  } else {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => store(req, res))));
  }
});
