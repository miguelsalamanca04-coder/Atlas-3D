const CACHE_NAME = 'atlas3d-v2';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];
const ICON_ASSETS = [
  '/iconos/icon-192.png',
  '/iconos/icon-512.png',
  '/iconos/icon-512-maskable.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      await cache.addAll(CORE_ASSETS);
      for (const url of ICON_ASSETS) {
        const respuesta = await fetch(url);
        await cache.put(url, respuesta);
      }
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(nombres =>
      Promise.all(
        nombres.filter(nombre => nombre !== CACHE_NAME).map(nombre => caches.delete(nombre))
      )
    ).then(() => self.clients.claim())
  );
});

// Cache First (Sesión 31, espejo de la Sesión 20): se ensaya sobre los
// íconos y el manifest, que son los únicos assets "pesados y poco
// cambiantes" que el proyecto tiene hoy — el mismo rol que tendrán los
// modelos .glb/.gltf cuando existan. Enrutar varias estrategias por
// tipo de recurso es el trabajo de la Sesión 32.
function cacheFirst(peticion) {
  return caches.match(peticion).then(enCache => {
    if (enCache) return enCache;
    return fetch(peticion).then(respuesta => {
      const clon = respuesta.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(peticion, clon));
      return respuesta;
    });
  });
}

self.addEventListener('fetch', event => {
  event.respondWith(cacheFirst(event.request));
});
