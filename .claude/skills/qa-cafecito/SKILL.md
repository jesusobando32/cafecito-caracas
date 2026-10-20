---
name: qa-cafecito
description: Corre la batería de QA de Cafecito Caracas (datos, escritorio y móvil con Playwright, accesibilidad con axe, datos extremos, sin red y XSS). Úsala antes de un commit grande o cuando se pida "probar", "QA" o "revisar que no se rompió nada".
---

# QA de Cafecito Caracas

1. **Datos:** `node tests/validate.js` debe terminar en `OK`; `node --check app.js places.js`.
2. **Servidor:** `python -m http.server 8765` en segundo plano (la raíz es la carpeta del proyecto).
3. **Sesiones limpias** (el navegador cachea JS): `playwright-cli close-all`, luego abre `web` (1280x800) y `mov` (`--mobile`).
4. **Ejecuta** desde `tests/e2e/` con `playwright-cli -s=<sesión> run-code --filename=...`:
   - escritorio: `audit-escritorio.js`, `accesibilidad-axe.js`, `datos-extremos.js`, `sin-red.js`, `xss-nombres.js`
   - móvil: `audit-movil.js`, `accesibilidad-axe.js`, `datos-extremos.js`
5. **Criterio:** `errors`, `broken`, `overflow` vacíos; axe sin violaciones; `xss-nombres` con `pwned:false`.
   Ignora los avisos "Expected value to be of type number" de MapLibre y los errores de red de Overpass si está caído.
6. **Visual:** `playwright-cli -s=web run-code --filename=tests/visual/capture.js` (y lo mismo en `mov`), luego `python tests/visual/compare.py`; si el cambio es intencional, copia `actual/` a `baseline/`.
   **Rendimiento (si se tocó carga o mapa):** `tests/perf/README.md`. **Otros navegadores:** sesiones `--browser=msedge` y `--browser=webkit`, y `--device="iPhone 15"` para móvil.
7. Informa qué pasó y qué falló; si algo falla, mira la captura (`playwright-cli screenshot`) antes de tocar código.
8. Cierra: `playwright-cli close-all` y detén el servidor.

Limitaciones: Firefox no arrancó en el equipo de desarrollo (`spawn UNKNOWN`); no cubre un teléfono real ni arrastre táctil (se simula con ratón), ni la clave de Google Places.
