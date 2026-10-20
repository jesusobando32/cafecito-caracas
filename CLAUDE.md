# Cafecito Caracas — contexto para agentes

Mapa y guía de cafeterías de Caracas. Sitio **100 % estático** en GitHub Pages: https://jesusobando32.github.io/cafecito-caracas/ (repo `jesusobando32/cafecito-caracas`, rama `main`).
Idioma de la interfaz y de los commits: **español** (con tildes). Tono cercano, sin tecnicismos.

## Reglas del proyecto (no negociables)
- **Sin build, sin backend, sin cuentas, sin tarjeta.** Vue 3 + Leaflet + MapLibre por CDN; nada de npm en el sitio. Todo lo que se guarde del usuario va en `localStorage`.
- **No se pide la ubicación del usuario** (decisión del dueño, por ahora). No uses `navigator.geolocation`.
- **No se copian fotos ni datos de Instagram/Google Maps** (derechos y términos). Los enlaces a Google Maps se arman con URLs públicas, sin clave.
- Sin secretos en el repo. La clave de Google Places (opcional) vive en `config.js`, hoy vacía.
- **Accesibilidad:** axe-core debe dar 0 violaciones; contraste AA; respeta `prefers-reduced-motion`; navegación con teclado; `aria-pressed`/`aria-live` donde corresponda.
- Funciona de 320 px a 1600 px. En móvil el mapa es pantalla completa con un **panel inferior deslizable** (`sheet-peek|half|full`).
- La identidad estable de un local es su **id de OpenStreetMap** (`osm`, p. ej. `n6184602085`). El `id` numérico de `CAFES_DATA` puede cambiar al regenerar datos.
- **Nunca inventes datos** (horarios, métodos, servicios). Lo desconocido se muestra como «sin confirmar».

## Estructura
```
index.html           Estructura y librerías (los <script> se cargan en orden)
app.js               Aplicación Vue (App.template es un string; setup() devuelve lo que usa la plantilla)
places.js            Parser de horarios OSM, enlaces (Instagram/web) y puente opcional con Google Places
config.js            Configuración opcional (clave de Google)
data/cafes.js        53 locales curados (GENERADO por scripts/build_data.py; no editar a mano)
data/links.js        Instagram/web por local (GENERADO por scripts/build_links.py)
data/photos.js       Fotos propias (scripts/add_photo.py y add_photos_batch.py)
data/wiki.js         Texto de la Guía · data/images.js · data/illustrations.js (SVG propios)
styles/main.css      Estilos (tokens en :root)
scripts/             Generadores de datos desde OpenStreetMap (scripts/cafes_osm.json es la fuente)
tests/               validate.js (datos) · e2e/ (Playwright) · visual/ (capturas de referencia) · perf/
docs/prompts/        Prompts de cada feature (cada uno lo ejecuta un agente distinto)
```

## Cómo funciona `app.js` (lo imprescindible)
- **Datos:** `CAFES_DATA` (curados) + locales en vivo desde Overpass (`liveToCafe`, mezclados sin duplicar por `osm`). Campos de un local: `id, osm, name, type ('cafeteria'|'especialidad'), typeConfirmed, neighborhood, address, lat, lng, schedule, methods[], drinks[], snacks[], description, sources[]` (+ `links` en los de vivo).
- **Horario:** `schedule` = lista de 7 días `{dayId (0=domingo), name, closed, open:'HH:MM', close:'HH:MM', ranges?}`; un cierre pasada la medianoche se guarda como `26:00`. `getStatus(schedule)` → `{state:'open'|'closed'|'unknown', text}`; la hora es siempre **Caracas (UTC-4 fijo, sin horario de verano)** vía `caracasNow()`. Solo 19 de 53 locales tienen horario.
- **Filtros:** `matches()`, `filteredCafes`, `facet` (conteos por opción), `selTypes/selMethods/selSnacks/selHood/query`.
- **Navegación:** `view` (`'map'|'wiki'`), `wikiTab`, rutas por hash (`#guia`, `#guia/historia`; `#aprende/…` sigue aceptándose), `readHash()`/`hashFor()`, menú superior `NAV`. Selección: `select(cafe)`/`closeDetail()`; ficha = `activeCafe` (computed).
- **Mapa:** Leaflet + capa MapLibre cargada en diferido; marcadores con `getMarker`, clusters; mini-mapa fijo en la ficha.
- **Enlaces a Google Maps:** `mapsUrl` (búsqueda con visor centrado), `mapsPinUrl` (punto exacto), `directionsUrl` (ruta).

## Cómo trabajar y probar
1. Servidor local: `python -m http.server 8765` (raíz del proyecto).
2. Pruebas: `node tests/validate.js` y la **skill `/qa-cafecito`** (Playwright CLI en escritorio 1280×800 y móvil 360×732, axe, datos extremos, sin red, XSS, enlaces, comparación visual). Detalles en `tests/e2e/README.md`.
3. Si cambias algo visual a propósito, regenera las capturas: ver `tests/visual/capture.js` y `compare.py`.
4. Trampas conocidas: el navegador cachea JS (cierra y reabre la sesión de Playwright tras editar); las reglas `page.route` persisten en la sesión (quítalas con `unroute`); las capturas van a `tests/e2e/out/` (ignorada), nunca a la raíz.
5. **Escribe pruebas nuevas** para lo que construyas (en `tests/e2e/`) y documéntalas en su README.

## Git
- Trabaja en una **rama propia** (`feature/<nombre>`), preferiblemente en un `git worktree`.
- **Commits pequeños, uno por tema**, con mensaje en español que explique el porqué.
- **No hagas push ni abras PR sin que el dueño lo pida.**

## Para no pisarte con otros agentes (hay varios trabajando en paralelo, cada uno en su rama)
- Pon la **lógica pura en archivos nuevos** (`js/<feature>.js`, `data/<feature>.js`) y toca `app.js` solo para conectarla (plantilla, `setup()` y el `return`).
- Estilos nuevos en un archivo propio (`styles/<feature>.css`) enlazado desde `index.html`; no reordenes ni reformatees código ajeno.
- Si necesitas cambiar algo compartido (`getStatus`, `matches`, `select`, `NAV`), hazlo mínimo y descríbelo en el commit.

## Ya decidido / descartado
- Descartado por ahora: «Cerca de mí» (ubicación), app instalable (PWA), fotos de Instagram/Google, backend propio.
- Hecho: búsqueda en vivo, guía con fotos libres (Wikimedia) y animaciones, fichas con minimapa, enlaces de Google Maps correctos, Instagram/web por local, puente opcional con Google Places (inactivo).
