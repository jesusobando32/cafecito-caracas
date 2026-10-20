# 07 · Preparador de café (calculadora + temporizador) — sistema aparte

**Rama:** `feature/preparador` · Lee primero `CLAUDE.md`. Es una herramienta **independiente** del mapa: se construye de forma que pueda vivir sola (otra URL, otro repo más adelante) y que la web principal solo la enlace.

## Objetivo
Una herramienta para **preparar café en casa**: calculadora de proporción café/agua y **temporizador guiado paso a paso** por método. Es algo que se usa a diario y que la gente vuelve a abrir.

## Decisiones ya tomadas
- **Aparte del mapa:** carpeta `preparador/` (su propio `index.html`, JS y CSS), sin depender de `app.js`. Puede reutilizar los tokens de color/tipografía (copiados, no importados) y los textos de métodos de `data/wiki.js` **leyéndolos tal cual** o copiando lo necesario.
- Sitio estático, sin servidor ni cuentas; recetas guardadas en `localStorage`.
- Funciona sin conexión una vez cargada y en móvil (se usa con las manos ocupadas): botones grandes.

## Qué construir
1. **Calculadora:** método (V60, Chemex, AeroPress, prensa francesa, moka, cold brew; espresso solo como referencia), **proporción** con valores por defecto por método (los de la Guía) editables, y cálculo en ambos sentidos: «tengo X g de café → cuánta agua» y «quiero Y ml → cuánto café». Unidades g/ml/tazas; redondeo razonable; validación de entradas.
2. **Temporizador guiado:** línea de tiempo por método (p. ej. V60: pre-infusión 0:00-0:45, vertidos, fin ~2:30-3:00) en un archivo de datos `preparador/recetas.js` con `pasos: [{t, texto, aguaAcumulada}]`; cuenta atrás grande, paso actual y siguiente, **pausa/reinicio**, aviso con **sonido y vibración** (Web Audio / `navigator.vibrate`, ambos opcionales) y **mantener la pantalla encendida** (`navigator.wakeLock`) con degradación silenciosa si no existe.
3. **Recetas propias:** guardar, nombrar y borrar; **compartir una receta por enlace** (parámetros en el hash/query, sin servidor).
4. Diseño propio, claro y bonito (no una copia del mapa), con ilustración de cada método (reutiliza los SVG de `data/illustrations.js` si encajan), modo oscuro opcional, y accesible (teclado, lector de pantalla, `aria-live` para los avisos del temporizador, contraste AA, `prefers-reduced-motion`).
5. **Enlace desde la Guía** («Preparar este método →») en la fila de cada método: cambio mínimo en `app.js`, pídeme confirmación antes de tocarlo.

## Datos y límites
- Las proporciones y tiempos de la Guía están en `data/wiki.js` (`WIKI_DATA.methods`: `ratio`, `time`, `grind`). Si una receta del temporizador difiere de lo escrito allí, **dilo y justifica la fuente** (no inventes recetas «de barista» sin respaldo).
- El temporizador debe seguir exacto con la pestaña en segundo plano (usa marcas de tiempo `performance.now()`/`Date.now()`, no contar ticks).

## Antes de implementar
Hazme en **una sola ronda y con tu recomendación** las preguntas de diseño clave (qué métodos entran, de dónde salen los pasos de cada receta, diseño visual, si va en el mismo dominio dentro de `preparador/` o conviene otro repo). Espera mis respuestas.

## Cómo trabajar
- Lógica pura (cálculos, línea de tiempo) en `preparador/calculos.js`, probable en Node; UI en archivos propios. Pruebas en `tests/e2e/preparador-*.js` (reloj simulado de Playwright para el temporizador, incluso con la pestaña oculta), unitarias de cálculo con casos conocidos y de redondeo, guardado y compartir por enlace, móvil y escritorio, axe 0 violaciones. Corre `/qa-cafecito` ampliada con esas pruebas.

## Criterio de «hecho»
Los cálculos son correctos y reversibles, el temporizador es exacto y se puede usar con una mano en el móvil, las recetas se guardan y se comparten por enlace, funciona sin el resto del sitio, commits por tema, sin push.

## Fuera de alcance
Balanzas Bluetooth, cuentas, recetas de la comunidad, tienda.
