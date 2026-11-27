Atlas 3D de Arquitectura de Software — checkpoint al cierre de la Sesión 28
Electiva - PWA · UPTC (Sub-bloque B)

Qué es esto
-----------
El proyecto Atlas 3D con su Service Worker ya registrado (Sesión 28,
espejo de la Sesión 17): public/sw.js con los tres manejadores — install
(cachea "/", "/index.html" y "/manifest.json"), activate (clients.claim())
y fetch (por ahora deja pasar cada petición directo a la red, sin
interceptarla de verdad). Interceptar de verdad y cachear las primeras
rutas del visor es justo el trabajo de la Sesión 29. Es el punto de
partida de hoy: no lo reemplaces, cotéjalo contra tu propio proyecto si
te quedaste atrás.

Cómo abrirlo
------------
  npm install
  npm run dev

Abre la URL que Vite imprime en la terminal (normalmente
http://localhost:5173). Verifica en DevTools → Application → Service
Workers que aparece "activated and is running" antes de empezar la
Sesión 29.

Estructura
----------
  index.html               documento HTML raíz
  public/manifest.json      el manifest de la Sesión 27
  public/sw.js              Service Worker de la Sesión 28
  public/iconos/            icon-192.png, icon-512.png, icon-512-maskable.png
  src/main.ts               punto de entrada + registro del Service Worker
  src/style.css             estilos base del andamiaje

UPTC · Facultad de Ingeniería · Electiva - PWA
