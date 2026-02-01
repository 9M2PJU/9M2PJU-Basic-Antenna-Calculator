const CACHE_NAME = 'antenna-calc-v2';
const ASSETS = [
    './',
    './index.html',
    './styles.css',
    './script.js',
    './logo.png',
    './manifest.json'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});
