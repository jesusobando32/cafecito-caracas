# 02 · «Abierto ahora»

**Rama:** `feature/abierto-ahora` · Lee primero `CLAUDE.md`.

## Objetivo
Que el usuario pueda ver y filtrar **qué cafeterías están abiertas en este momento**, con estados claros («Abierto», «Cierra pronto», «Abre pronto», «Cerrado», «Horario sin confirmar»), sin pedir ubicación.

## Decisiones ya tomadas
- La hora es siempre **Caracas, UTC-4 fijo** (Venezuela no tiene horario de verano): ya existe `caracasNow()`.
- **No se inventan horarios.** Solo 19 de 53 curados tienen horario (más los de OpenStreetMap que llegan en vivo). Lo desconocido es «sin confirmar», nunca «cerrado».
- Sin servidor ni ubicación.

## Qué construir
1. **Estados** (amplía `getStatus` sin romper sus usos actuales): `open`, `closing-soon` (cierra en ≤ 60 min), `opening-soon` (abre en ≤ 60 min), `closed`, `unknown`. Cuida los casos: cierre pasada la medianoche (`26:00`), turnos partidos (`ranges`), día cerrado, «24 h».
2. **Chip «Abierto ahora»** *visible junto al buscador* (no escondido tras «Filtros»), con aria-pressed y conteo. Política de los sin horario: por defecto se **excluyen** y se muestra una nota «N locales sin horario confirmado» con un interruptor «incluirlos».
3. **Estado visible** en la tarjeta de la lista y en la ficha (hoy hay un punto de color: añade texto accesible, no solo color) y, opcionalmente, atenuar en el mapa los pines cerrados *solo cuando el filtro está activo* (los pines de taza no se rediseñan).
4. **Se actualiza solo**: recalcula cada minuto mientras la pestaña está visible (`visibilitychange`), sin recargar la lista entera ni mover el mapa.
5. **Cobertura de datos:** en la ficha sin horario, mantén el enlace «Ver horario en Google Maps» y añade «Avisar del horario» (issue de GitHub prellenado, como `issueUrl`). Un pequeño aviso «los horarios pueden variar en feriados».
6. (Pregúntame) Reflejar el filtro en la URL (`?abierto=1`) para compartirlo.

## Datos y límites
- `schedule` y `getStatus` están descritos en `CLAUDE.md`. El parser de OSM está en `places.js` (`parseOsmHours`).
- No toques los datos curados ni `build_data.py` salvo que descubras un error; si encuentras horarios mal convertidos, repórtalos.

## Antes de implementar
Hazme en **una sola ronda y con tu recomendación** las preguntas de diseño clave (dónde va el chip, qué pasa con los sin horario, atenuar pines o no, URL). Espera mis respuestas.

## Cómo trabajar
- Lógica pura de horarios en `js/abierto-ahora.js` (nuevo, sin dependencias del DOM, para poder probarla en Node); `app.js` solo la conecta. Estilos en `styles/abierto-ahora.css`.
- **Pruebas deterministas con reloj simulado** de Playwright (`page.clock`): lunes 10:00 abierto; domingo cerrado; 01:00 con cierre a las 26:00 del día anterior; 19:30 con cierre a las 20:00 → «cierra pronto»; local sin horario → «sin confirmar»; paso de día; filtro con y sin «incluir sin horario»; contadores coherentes. Añade también pruebas unitarias de la lógica pura con `node`.
- Regenera a propósito las capturas visuales que cambien y corre `/qa-cafecito` completa.

## Criterio de «hecho»
El chip filtra bien en cualquier hora simulada, los estados son correctos incluyendo medianoche y turnos partidos, nada se mueve solo (mapa/lista) cada minuto, axe 0 violaciones, commits por tema, sin push.

## Fuera de alcance
Ubicación del usuario, «confirmar horario» con servidor, rutas.
