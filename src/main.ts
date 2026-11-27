import "./style.css";

// Punto de entrada del proyecto. Hoy solo confirma que el andamiaje
// de Vite + TypeScript arrancó correctamente y que Three.js quedó
// instalado como dependencia — todavía no se usa.
//
// A partir de la próxima sesión del Sub-bloque B, este archivo se
// va reemplazando pieza por pieza: primero el Service Worker, y más
// adelante la conexión con el catálogo 3D (dominio, datos, vista,
// controlador) que arma el Atlas 3D.

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div class="arranque">
    <h1>Atlas 3D de Arquitectura de Software</h1>
    <p>Proyecto arrancado con Vite + TypeScript. Three.js instalado, listo para usarse.</p>
  </div>
`;

// Registro del Service Worker — Sesión 28.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/sw.js")
    .then((reg) => console.log("SW registrado:", reg.scope))
    .catch((err) => console.error("Error al registrar SW:", err));
}
