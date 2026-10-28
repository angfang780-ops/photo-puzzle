// 오프라인에서도 열리도록 앱 파일을 저장해 두고, 인터넷이 되면 새 버전으로 갱신한다.
const CACHE = 'photo-puzzle-v6';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const hit = await cache.match(req, { ignoreSearch: req.mode === 'navigate' });
    // 브라우저 자체 캐시 대신 매번 서버에 물어서, 고친 버전이 다음번 열 때 바로 보이게 한다.
    const same = new URL(req.url).origin === location.origin;
    const net = fetch(same ? new Request(req.url, { cache: 'no-cache' }) : req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
      return res;
    }).catch(() => hit || (req.mode === 'navigate' ? cache.match('./index.html') : undefined));
    return hit || net;
  }));
});
