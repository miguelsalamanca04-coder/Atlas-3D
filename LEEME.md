# Sesión 45 · Comparación y cierre del Sub-bloque B

Esta sesión no agrega código nuevo al Atlas: compara las tres versiones con la misma lista de pruebas.

| Versión | Carpeta |
|---|---|
| Sin framework (TypeScript + Three.js) | `../sesion-42-lighthouse-cierre-sin-framework` |
| React | `../sesion-43-version-react` |
| Angular | `../sesion-44-version-angular` |

## Lista de verificación (`checklist-atlas/`)
Revisa 13 puntos sobre la versión **compilada** de cada proyecto (lee su `LEEME.txt`):

```bash
# 1. compilar el proyecto a revisar
cd ../sesion-42-lighthouse-cierre-sin-framework && npm install && npm run build

# 2. correr la lista
cd ../sesion-45-comparacion-y-cierre/checklist-atlas
npm install
npx playwright install chromium
ATLASDIR=../../sesion-42-lighthouse-cierre-sin-framework node checklist-atlas.js
```
Repite el paso 2 con `sesion-43-version-react` y `sesion-44-version-angular`. El punto 13 falla a propósito en la versión de la Sesión 42.
