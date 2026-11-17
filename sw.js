/* WorkOut offline cache.
   - App files (html / js / json): network first, so new versions arrive right away;
     if the network is slow (> 2.5 s) or offline, the last cached copy is used.
   - Images, icons, fonts, Firebase SDK: cache first (they never change for a given URL).
   - Everything else (Firestore, Google sign-in, /__/ auth pages) is not touched. */
const APP = 'workout-app-v1', STATIC = 'workout-static-v1';

self.addEventListener('install', e => {
  e.waitUntil(caches.open(APP).then(c => c.addAll(['./', 'index.html', 'config.js', 'exdata.js', 'manifest.webmanifest'])).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== APP && k !== STATIC).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

const isStatic = u =>
  (u.origin === self.location.origin && /\/(img|app-icon)\//.test(u.pathname)) ||
  u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com' ||
  (u.hostname === 'www.gstatic.com' && u.pathname.startsWith('/firebasejs/'));
const isApp = u => u.origin === self.location.origin && !u.pathname.startsWith('/__/') &&
  (/\.(html|js|json|webmanifest)$/.test(u.pathname) || u.pathname.endsWith('/'));

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (u.pathname.endsWith('/sw.js') || u.pathname.endsWith('/version.json')) return;
  if (isStatic(u)) {
    e.respondWith(caches.open(STATIC).then(async c => {
      const hit = await c.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok || res.type === 'opaque') c.put(req, res.clone());
      return res;
    }));
    return;
  }
  if (req.mode === 'navigate' || isApp(u)) {
    const key = req.mode === 'navigate' ? 'index.html' : new Request(u.origin + u.pathname);
    e.respondWith(caches.open(APP).then(async c => {
      const net = fetch(req, { cache: 'no-store' }).then(res => { if (res.ok) c.put(key, res.clone()); return res; });
      const cached = await c.match(key);
      if (!cached) return net;
      // network first, but don't make the user wait on bad gym signal
      const timeout = new Promise(r => setTimeout(() => r(cached), 2500));
      return Promise.race([net.catch(() => cached), timeout]);
    }));
  }
});
