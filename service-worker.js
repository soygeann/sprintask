const CACHE_NAME = 'task-manager-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/tasks.html',
  '/css/style.css',
  '/js/app.js',
  '/img/Logo.png',
  // Agrega aquí todas las rutas y archivos de tu app
  // Ejemplos: '/img/nav/icono-home.png', etc.
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});