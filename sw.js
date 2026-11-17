/* Service worker cho bản web/PWA (APK không dùng). Tăng CACHE khi cập nhật tệp. */
const CACHE = 'ocean-life-v3';
const SHELL = ['./', 'index.html', 'main.js', 'manifest.json', 'ocean_data.js', 'ocean_art.js', 'ocean.js', 'ocean_ui.js', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url); if(e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => { if(r && r.ok){ const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); } return r; }).catch(() => caches.match(e.request).then(m => m || caches.match('index.html'))));
});
