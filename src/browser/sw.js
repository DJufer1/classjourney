const CACHE = 'classjourney-web-__REVISION__';
const SHELL = new URL('index.html', self.registration.scope).href;
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.add(new Request(SHELL, {cache:'reload'})))));
self.addEventListener('activate', event => event.waitUntil((async () => {
  for (const key of await caches.keys()) if (key.startsWith('classjourney-') && key !== CACHE) await caches.delete(key);
  await self.clients.claim();
})()));
self.addEventListener('message', event => { if (event.data === 'ACTIVATE_UPDATE') self.skipWaiting(); });
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || event.request.mode !== 'navigate') return;
  const url = new URL(event.request.url), scope = new URL(self.registration.scope);
  if (url.origin !== scope.origin || ![scope.pathname, scope.pathname + 'index.html'].includes(url.pathname)) return;
  event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(SHELL)) || fetch(event.request)));
});
