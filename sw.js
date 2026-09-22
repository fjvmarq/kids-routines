/* Kids Routines — service worker.
   Guarda la app en el móvil para que funcione sin internet.

   Dos decisiones aprendidas a base de golpes:
   · Se cachea fichero a fichero, NO con addAll(): si un solo fichero falla,
     addAll tira la instalación entera y el móvil se queda con la versión vieja
     (o con una pantalla en blanco).
   · La red manda para el HTML, el CSS y el JS: así una versión nueva llega
     siempre, y la caché es la red de seguridad cuando no hay cobertura. Al
     revés, una copia mala se queda pegada para siempre. */

const CACHE = 'kids-routines-v8';

const FILES = [
  './',
  'index.html',
  'css/app.css',
  'js/characters.js',
  'js/audio.js',
  'js/store.js',
  'js/data.js',
  'js/scenes.js',
  'js/confetti.js',
  'js/stage.js',
  'js/stage3d.js',
  'js/rooms3d.js',
  'js/app.js',
  'js/parents.js',
  'manifest.webmanifest',
  'vendor/three/three.module.js',
  'vendor/three/three.core.js',
  'vendor/three/addons/loaders/GLTFLoader.js',
  'vendor/three/addons/utils/BufferGeometryUtils.js',
  'vendor/three/addons/utils/SkeletonUtils.js',
  'vendor/three-vrm.module.min.js',
  'vendor/three-vrm-animation.module.min.js',
  'anim/idle_loop.vrma',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/maskable-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // uno a uno: lo que falle se queda sin cachear, pero la instalación sigue
    await Promise.all(FILES.map(async f => {
      try { await cache.add(new Request(f, { cache: 'reload' })); }
      catch (err) { console.warn('[sw] no pude guardar', f, err); }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;      // lo de fuera, ni tocarlo

  /* Estas no son la app: son páginas de trabajo (elegir voz, diagnóstico, ver
     animaciones) y sus muestras. Si se guardan, se quedan congeladas y uno cree
     estar viendo lo nuevo cuando ve lo viejo. Pasó con el comparador de voces. */
  if (/\/(voces|estado|dev-animaciones)/.test(url.pathname)) return;

  const esCodigo = req.mode === 'navigate' ||
    /\.(html|js|css|webmanifest)$/.test(url.pathname) ||
    url.pathname.endsWith('/');

  if (esCodigo) {
    // primero la red (para recibir las mejoras), la caché como respaldo
    e.respondWith((async () => {
      try {
        const res = await fetch(req);
        if (res && res.ok) {
          const copia = res.clone();
          caches.open(CACHE).then(c => c.put(req, copia)).catch(() => {});
        }
        return res;
      } catch (err) {
        const hit = await caches.match(req);
        if (hit) return hit;
        const index = await caches.match('index.html');
        if (index) return index;
        throw err;
      }
    })());
    return;
  }

  // lo demás (iconos, audios): primero la caché, que no cambia
  e.respondWith((async () => {
    const hit = await caches.match(req);
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res && res.ok && res.type === 'basic') {
        const copia = res.clone();
        caches.open(CACHE).then(c => c.put(req, copia)).catch(() => {});
      }
      return res;
    } catch (err) {
      return new Response('', { status: 504, statusText: 'sin conexión' });
    }
  })());
});
