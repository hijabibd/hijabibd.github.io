// Hijabi DMS service worker: opens the app without internet and keeps product photos on the phone.
const SHELL = 'hdms-shell-v1', PHOTOS = 'hdms-photos-v1';
self.addEventListener('install', e => { e.waitUntil(caches.open(SHELL).then(c => c.addAll(['/', '/manifest.json', '/icon-192.png'])).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== SHELL && k !== PHOTOS).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET') return;
  // product photos: show the saved copy at once, refresh in the background
  if (u.hostname.endsWith('supabase.co') && u.pathname.indexOf('/product-images/') >= 0) {
    e.respondWith(caches.open(PHOTOS).then(c => c.match(r).then(hit => {
      const net = fetch(r).then(res => { if (res && (res.ok || res.type === 'opaque')) c.put(r, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    })));
    return;
  }
  // the app page: network first, saved copy when offline
  if (r.mode === 'navigate' && u.origin === location.origin) {
    e.respondWith(fetch(r).then(res => { const cp = res.clone(); caches.open(SHELL).then(c => c.put('/', cp)); return res; }).catch(() => caches.match('/')));
    return;
  }
  if (u.origin === location.origin) e.respondWith(caches.match(r).then(hit => hit || fetch(r)));
});
