// checklist-atlas.js — Sesión 45: la lista de verificación final del Atlas 3D, la misma para cualquier versión
// (sin framework, React o Angular), comprobada con Chromium real. Uso:  ATLASDIR=ruta/al/proyecto node checklist-atlas.js
// (el proyecto debe estar compilado: existe ruta/al/proyecto/dist). Sale con código 0 solo si todo está en orden.
// Comprueba SOLO lo que se ve desde fuera (ids, clases, Chrome, red): por eso sirve para las tres versiones.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const DIST = path.resolve(process.env.ATLASDIR || '.') + '/dist';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' };
const PORT = 4350, BASE = 'http://localhost:' + PORT;
let caido = false;
const srv = http.createServer((q, r) => { if (caido) { q.socket.destroy(); return; } let p = q.url.split('?')[0]; if (p === '/') p = '/index.html'; const f = path.join(DIST, p);
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); } }); });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
let fallos = 0, sinRed = false; // los errores de red de la prueba «sin conexión» son esperados
const ok = (cond, msg) => { if (!cond) { fallos++; console.log('   ✗ FALLÓ: ' + msg); } };

// Cuenta las llamadas de dibujo de WebGL (cada fotograma dibuja con drawElements/drawArrays).
const CONTAR = `
  window.__dibujos = 0;
  for (const C of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) {
    for (const m of ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced']) {
      const o = C.prototype[m]; if (!o) continue;
      C.prototype[m] = function (...a) { window.__dibujos++; return o.apply(this, a); };
    }
  }
  window.__cls = 0;
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true });`;

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = [];
  const ctx = await b.newContext({ viewport: { width: 412, height: 900 }, deviceScaleFactor: 1 });
  const pg = await ctx.newPage();
  pg.on('pageerror', e => errs.push(String(e))); pg.on('console', m => { if (m.type() === 'error' && !sinRed) errs.push('console: ' + m.text()); });
  await pg.addInitScript(CONTAR);
  await pg.goto(BASE + '/'); await pg.waitForSelector('#visor canvas'); await sleep(1500);

  // 1) Documento
  const doc = await pg.evaluate(() => ({
    lang: document.documentElement.lang, viewport: document.querySelector('meta[name=viewport]')?.content, descr: document.querySelector('meta[name=description]')?.content?.length || 0,
    tema: document.querySelector('meta[name=theme-color]')?.content, main: document.querySelectorAll('main').length, h1: document.querySelectorAll('h1').length,
    contextoSeguro: window.isSecureContext, titulo: document.title }));
  console.log('1) documento → ' + JSON.stringify(doc));
  ok(doc.lang === 'es', 'html lang'); ok(/width=device-width/.test(doc.viewport || ''), 'viewport'); ok(doc.descr > 50, 'meta description'); ok(doc.main === 1, 'un <main>'); ok(doc.contextoSeguro, 'contexto seguro');

  // 2) Manifest y capacidad de instalarse, preguntando a Chrome
  const cdp = await ctx.newCDPSession(pg); await cdp.send('Page.enable');
  const man = await cdp.send('Page.getAppManifest');
  const datos = JSON.parse(man.data);
  const iconos = (datos.icons || []).map(i => i.sizes + (i.purpose ? '/' + i.purpose : ''));
  console.log('2) manifest → errores de Chrome: ' + JSON.stringify(man.errors) + ' | name: ' + datos.name + ' | display: ' + datos.display + ' | start_url: ' + datos.start_url + ' | iconos: ' + JSON.stringify(iconos));
  ok(man.errors.length === 0, 'el manifest no debe tener errores'); ok(iconos.includes('192x192') && iconos.includes('512x512') && iconos.includes('512x512/maskable'), 'iconos 192, 512 y maskable');
  const inst = await cdp.send('Page.getInstallabilityErrors');
  console.log('3) Chrome dice: errores de instalabilidad → ' + JSON.stringify(inst.installabilityErrors));
  ok(inst.installabilityErrors.length === 0, 'Chrome no debe reportar errores de instalabilidad');

  // 3) Service Worker y uso sin conexión
  await pg.reload(); await pg.waitForSelector('#visor canvas'); await sleep(1500);
  const sw = await pg.evaluate(async () => { const r = await navigator.serviceWorker.ready; const ks = await caches.keys(); const pre = ks.find(k => k.startsWith('workbox-precache')); const n = pre ? (await (await caches.open(pre)).keys()).length : 0; return { activo: !!r.active, controla: !!navigator.serviceWorker.controller, precache: n }; });
  console.log('4) service worker → ' + JSON.stringify(sw));
  ok(sw.activo && sw.controla, 'SW activo y controlando'); ok(sw.precache >= 8, 'precaché completo');
  caido = true; sinRed = true; await pg.reload(); await sleep(1500);
  const off = await pg.evaluate(() => ({ canvas: document.querySelectorAll('#visor canvas').length, pestanas: document.querySelectorAll('#tabs-modelo button').length }));
  caido = false; sinRed = false;
  console.log('5) servidor caído y recarga → ' + JSON.stringify(off));
  ok(off.canvas === 1 && off.pestanas === 3, 'la app debe abrir sin conexión');

  // 4) Estabilidad visual: lo que de verdad ve quien abre la página (sin caché previa en una pestaña nueva)
  const p2 = await ctx.newPage(); await p2.addInitScript(CONTAR); await p2.goto(BASE + '/'); await p2.waitForSelector('#visor canvas'); await sleep(2500);
  const cls = await p2.evaluate(() => window.__cls);
  console.log('6) desplazamiento de diseño acumulado (CLS) al cargar → ' + cls.toFixed(3));
  ok(cls < 0.1, 'CLS debe ser menor que 0,1');
  await p2.close();

  // 5) Dibujo bajo demanda: una escena quieta no debe dibujar
  await pg.reload(); await pg.waitForSelector('#visor canvas'); await sleep(2000);
  const d0 = await pg.evaluate(() => window.__dibujos); await sleep(1500); const d1 = await pg.evaluate(() => window.__dibujos);
  console.log('7) escena quieta durante 1,5 s → llamadas de dibujo: ' + (d1 - d0));
  ok(d1 - d0 === 0, 'una escena quieta no debe dibujar');
  const caja = await pg.locator('#visor canvas').boundingBox(); const cx = caja.x + caja.width / 2, cy = caja.y + caja.height / 2;
  await pg.mouse.move(cx, cy); await pg.mouse.down(); await pg.mouse.move(cx + 60, cy + 10, { steps: 6 }); await pg.mouse.up(); await sleep(400);
  const d2 = await pg.evaluate(() => window.__dibujos);
  console.log('8) arrastrar para girar → llamadas de dibujo nuevas: ' + (d2 - d1 > 0 ? 'sí (' + (d2 - d1) + ')' : 'no'));
  ok(d2 - d1 > 0, 'girar debe dibujar');
  // La inercia (damping) sigue dibujando unos instantes: se espera, hasta 15 s, a que pase.
  let d3 = d2, quieta = false;
  for (let i = 0; i < 30 && !quieta; i++) { await sleep(500); const x = await pg.evaluate(() => window.__dibujos); quieta = x === d3; d3 = x; }
  await sleep(1000); const d4 = await pg.evaluate(() => window.__dibujos);
  console.log('9) tras soltar y pasar la inercia → vuelve a quedarse quieta: ' + (quieta && d4 === d3 ? 'sí' : 'no'));
  ok(quieta && d4 === d3, 'tras la inercia debe volver a no dibujar');
  await pg.click('#chips-piezas button >> nth=1'); await sleep(300); const d5 = await pg.evaluate(() => window.__dibujos);
  console.log('10) elegir una pieza → llamadas de dibujo nuevas: ' + (d5 - d4 > 0 ? 'sí' : 'no'));
  ok(d5 - d4 > 0, 'elegir una pieza debe redibujar');
  await pg.click('#tabs-modelo [data-id="capas"]'); await sleep(300); const d6 = await pg.evaluate(() => window.__dibujos);
  console.log('11) cambiar de modelo → llamadas de dibujo nuevas: ' + (d6 - d5 > 0 ? 'sí' : 'no'));
  ok(d6 - d5 > 0, 'cambiar de modelo debe redibujar');
  await pg.setViewportSize({ width: 360, height: 800 }); await sleep(500); const d7 = await pg.evaluate(() => window.__dibujos);
  console.log('12) cambiar el tamaño de la ventana → llamadas de dibujo nuevas: ' + (d7 - d6 > 0 ? 'sí' : 'no'));
  ok(d7 - d6 > 0, 'redimensionar debe redibujar');

  // 13) Una nota escrita no se pierde al marcar un favorito en otra tarjeta (defecto de la Sesión 42)
  await pg.reload(); await pg.waitForSelector('.modelo-card'); await sleep(800);
  await pg.fill('.modelo-card[data-id="mvc"] .nota-input', 'repasar el controlador');
  await pg.click('.modelo-card[data-id="capas"] .btn-favorito'); await sleep(500);
  const nota = await pg.inputValue('.modelo-card[data-id="mvc"] .nota-input');
  console.log('13) escribir una nota y marcar favorito en otra tarjeta → nota conservada: ' + JSON.stringify(nota));
  ok(nota === 'repasar el controlador', 'la nota escrita no debe borrarse al marcar un favorito');

  console.log('pageerrors: ' + JSON.stringify(errs));
  console.log(fallos === 0 && errs.length === 0 ? 'RESULTADO: todo en orden' : 'RESULTADO: hay ' + fallos + ' fallos');
  await b.close(); srv.close();
  process.exit(fallos === 0 && errs.length === 0 ? 0 : 1);
})();
