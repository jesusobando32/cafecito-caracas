# 01 · Enlace propio por café y botón de compartir

**Rama:** `feature/enlace-compartir` · Lee primero `CLAUDE.md`.

## Objetivo
Que cada cafetería tenga **su propia dirección** que se pueda mandar por WhatsApp o redes (abre el mapa con esa ficha abierta), y un **botón «Compartir»** en la ficha. Hoy la ficha no tiene URL: si alguien refresca o comparte, se pierde.

## Decisiones ya tomadas
- Sitio estático: sin servidor. Las direcciones usan el **hash** (`#cafe/...`), igual que la Guía (`#guia/...`).
- **Lo principal que se comparte es el enlace de la app** (trae gente al sitio; la ficha ya tiene el botón de Google Maps). Compartir la ubicación de Google Maps queda como opción secundaria.
- Sin cuentas, sin servidor, sin ubicación del usuario.

## Qué construir
1. **Ruta `#cafe/<slug>-<osm>`** (recomendado, p. ej. `#cafe/moka-caracas-n6184602085`). El `osm` manda; el slug es decorativo y se ignora si no coincide. Extiende `readHash()`/`hashFor()`:
   - al **abrir una ficha** se actualiza la URL (`pushState`); el botón «atrás» del navegador cierra la ficha;
   - al **cargar con `#cafe/...`** se abre la ficha, el mapa vuela al local y en móvil el panel queda en `half`;
   - cerrar la ficha limpia la URL; `document.title` ya cambia por local (mantenerlo).
2. **Locales que solo llegan en vivo** (no están en `CAFES_DATA`): si el `osm` no está cargado, buscarlo por id en Overpass (`node(<id>)`/`way(<id>)` con los mismos espejos que ya usa `fetchOverpassCafes`) y, si falla, mostrar un mensaje amable («No pudimos cargar este local ahora») con botón al mapa. Nunca una pantalla rota.
3. **Botón «Compartir»** en `.detail-actions`:
   - `navigator.share({title, text, url})` cuando exista (móvil), con `text` = «Nombre · Barrio, Caracas» y `url` = el enlace propio;
   - si no existe (escritorio), **copiar al portapapeles** y avisar con un aviso accesible (`aria-live="polite"`, desaparece solo);
   - menú pequeño con 3 acciones: *Compartir enlace* (principal), *Copiar enlace*, *Compartir ubicación en Google Maps* (usa `mapsPinUrl`).
4. **Fase 2 (pregúntame antes de hacerla):** páginas estáticas por local para que Google y las redes muestren vista previa (los rastreadores no ejecutan JS): `scripts/build_cafe_pages.py` genera `cafe/<slug>/index.html` con `<title>`, descripción, `canonical`, Open Graph/Twitter, JSON-LD `CafeOrCoffeeShop` (geo y horario si hay) y una redirección a `./#cafe/<slug>-<osm>`; más `sitemap.xml` y `robots.txt`; imagen social 1200×630 dibujada por el script (ilustración propia, sin fotos ajenas).

## Datos y límites
- Los 53 curados tienen `osm` salvo «Gran Café» (`osm: null`, viene de Nominatim): define un identificador alternativo estable para él (p. ej. `x-gran-cafe`) y documéntalo.
- Los slugs deben ser únicos y sin tildes; hay nombres repetidos (Granier ×3, Café Venezuela ×2) y por eso el `osm` va en la URL.

## Antes de implementar
Hazme, en **una sola ronda y con tu recomendación**, las preguntas de diseño que realmente cambien el resultado (formato de la URL, qué muestra el menú de compartir, si hacemos la fase 2 ahora). Espera mis respuestas.

## Cómo trabajar
- Lógica de rutas/slugs en `js/enlaces.js` (nuevo); toca `app.js` solo para conectarla. Pruebas en `tests/e2e/` (p. ej. `enlace-por-cafe.js`) y documentadas en su README.
- Pruebas mínimas: para **los 53** locales, cargar `#cafe/...` en frío abre la ficha correcta; atrás/adelante; slug equivocado con `osm` correcto; `osm` inexistente (mensaje, sin errores); compartir con `navigator.share` simulado y con portapapeles (`context.grantPermissions`); móvil y escritorio.
- Regenera a propósito las capturas visuales de la ficha (cambia por el botón nuevo). Corre `/qa-cafecito` completa.

## Criterio de «hecho»
Compartir un enlace y abrirlo en otra pestaña/dispositivo lleva a la misma ficha; el botón atrás se comporta; axe 0 violaciones; commits por tema; sin push.

## Fuera de alcance
App instalable, ubicación del usuario, estadísticas.
