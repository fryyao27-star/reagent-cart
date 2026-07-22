// ════════════════════════════════════════════════════════════════
//  Service Worker · 离线缓存
//  策略：cache-first（壳+库），网络优先（CDN 资源）
// ════════════════════════════════════════════════════════════════
const CACHE_NAME = 'reagent-v2-20260722';
const SHELL = [
    './',
    './采购单.html',
    './manifest.webmanifest',
    './icons/icon-192.png',
    './icons/icon-512.png'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((c) => c.addAll(SHELL))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);

    // 1) 应用壳 + 同源资源：cache-first
    if (url.origin === location.origin) {
        e.respondWith(
            caches.match(e.request).then((cached) => cached || fetch(e.request))
        );
        return;
    }

    // 2) CDN（Tailwind / FontAwesome / xlsx）：网络优先，失败回退到缓存
    e.respondWith(
        fetch(e.request)
            .then((resp) => {
                const copy = resp.clone();
                caches.open(CACHE_NAME).then((c) => c.put(e.request, copy));
                return resp;
            })
            .catch(() => caches.match(e.request))
    );
});
