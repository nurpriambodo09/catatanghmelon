const CACHE_NAME = 'catatan-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// 1. Simpan aset saat Service Worker diinstal
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Menyimpan aset ke cache');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. Ambil aset dari cache jika offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Kembalikan dari cache jika ada, jika tidak lakukan fetch normal ke internet
      return cachedResponse || fetch(event.request);
    })
  );
});
