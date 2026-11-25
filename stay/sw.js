/* My stay sample: offline support.
   The app shell is cached on first visit so it opens with no signal, and refreshed whenever there is signal. Photos, fonts, icons and map tiles are cached as they are used.
   Weather is not cached here: the app keeps its own copy of the last forecast. */
const VERSION = 'mystay-sample-v2';
const SHELL = [
  '/stay/', '/stay/index.html', '/stay/app.js', '/stay/core.js', '/stay/ui.js', '/stay/sheet.js', '/stay/photos.js', '/stay/wild.js', '/stay/extras.js',
  '/stay/data.js', '/stay/i18n.js', '/stay/lang/en.js', '/stay/lang/de.js', '/stay/property/index.js', '/stay/property/sample.js',
  '/stay/sun.js', '/stay/stay.css', '/stay/manifest.webmanifest', '/stay/icon-192.png', '/stay/apple-touch-icon.png',
  '/stay/img/welcome.jpg', '/stay/img/suite-1.jpg', '/stay/img/sp-giraffe.jpg', '/stay/img/sp-zebra.jpg',
];
const RUNTIME = 'mystay-sample-runtime-v1';
const MAX_RUNTIME = 220;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => Promise.all(SHELL.map((u) => fetch(u, { cache: 'reload' }).then((r) => { if (!r.ok) throw new Error(u); return c.put(u, r); })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== RUNTIME).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

async function trim(cache) {
  const keys = await cache.keys();
  if (keys.length > MAX_RUNTIME) await Promise.all(keys.slice(0, keys.length - MAX_RUNTIME).map((k) => cache.delete(k)));
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname === 'api.open-meteo.com') return; // live data, handled by the app

  // Same-origin: use the network when it answers quickly so guests always get the latest version,
  // and fall back to the cached copy when signal is slow or missing.
  if (url.origin === location.origin) {
    e.respondWith((async () => {
      const cache = await caches.open(VERSION);
      try {
        const res = await Promise.race([fetch(req, { cache: 'no-cache' }), new Promise((_, rej) => setTimeout(() => rej(new Error('slow')), 3000))]);
        if (res.ok) cache.put(req, res.clone());
        return res;
      } catch (err) {
        return (await cache.match(req, { ignoreSearch: true })) || (await cache.match('/stay/')) || Response.error();
      }
    })());
    return;
  }

  // Cross-origin (fonts, icons, photos, map tiles): cache as used, fall back to the cache when offline.
  e.respondWith((async () => {
    const cache = await caches.open(RUNTIME);
    const hit = await cache.match(req);
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res.ok || res.type === 'opaque') { cache.put(req, res.clone()).then(() => trim(cache)); }
      return res;
    } catch (err) {
      return Response.error();
    }
  })());
});
