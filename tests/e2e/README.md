# Pruebas end-to-end (Playwright CLI)

Scripts para `playwright-cli run-code`. Cada uno devuelve un JSON con `errors`, desbordes, etc.; lo esperado es que
`errors`, `broken`, `overflow` y las listas de violaciones vengan vacías.

| Script | Qué comprueba |
|---|---|
| `audit-escritorio.js` | Mapa, ficha (minimapa y enlace a Google Maps) y las 8 páginas de Guía: errores de consola, imágenes rotas, desbordes |
| `audit-movil.js` | Panel inferior (peek/half/full), ficha abierta arriba, arrastre, Guía y botón atrás |
| `accesibilidad-axe.js` | axe-core (WCAG 2 A/AA + buenas prácticas) en mapa, ficha y Guía |
| `datos-extremos.js` | Nombres larguísimos, unicode/emoji, horarios partidos y cruce de medianoche, lista vacía |
| `sin-red.js` | Overpass y mapa base bloqueados: la app debe seguir usable con los datos guardados |
| `enlaces-maps.js` | Para los 53 locales: enlaces a Google Maps con SUS coordenadas y todas dentro de Caracas |
| `google-maps-real.js` | MANUAL: abre Google Maps real y comprueba que el mapa queda a pocos metros del local |
| `busqueda-en-vivo.js` | Simula Overpass: locales nuevos sin duplicar, gana el primer servidor que responde, arranca sola en móvil |
| `google-places-simulado.js` | Simula Google Places: petición correcta, foto con atribución, horario, nombre distinto rechazado, foto rota y clave rechazada |
| `enlaces-sociales.js` | Botones de Instagram y web: curados y en vivo, descarta `javascript:` y rutas que no son cuentas |
| `xss-nombres.js` | Un nombre malicioso de OSM NO debe ejecutar código (`pwned` debe ser `false`) |

## Cómo correrlos
```bash
python -m http.server 8765                              # en la raíz del proyecto
playwright-cli -s=web open http://localhost:8765/ && playwright-cli -s=web resize 1280 800
playwright-cli -s=web run-code --filename=tests/e2e/audit-escritorio.js
playwright-cli -s=mov open http://localhost:8765/ --mobile
playwright-cli -s=mov run-code --filename=tests/e2e/audit-movil.js
```
Ojo: tras cambiar `app.js` cierra y vuelve a abrir la sesión (`playwright-cli -s=web close`), porque el navegador cachea los scripts.
Los datos de prueba se guardan en `localStorage` del propio navegador de Playwright; no tocan tu navegador.

Otros navegadores: `playwright-cli -s=<nombre> open <url> --browser=msedge|webkit` o `--device="iPhone 15"`. Probado en Chrome, Edge, Safari (WebKit) e iPhone 15 emulado; Firefox no arrancó en el equipo de desarrollo.
Visual: `tests/visual/`. Rendimiento: `tests/perf/`.

Nota: axe puede dar una falsa alarma de contraste en `.cluster` si el grupo de pines está a mitad de animación; repite la prueba.

Importante: `sin-red.js` y `busqueda-en-vivo.js` registran reglas de red que persisten en la sesión de Playwright; ambos las quitan al terminar. Si una prueba se corta a medias, cierra la sesión (`playwright-cli -s=<nombre> close`).
