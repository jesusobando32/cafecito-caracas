# 03 · Filtros prácticos (Wi-Fi, terraza, para llevar…)

**Rama:** `feature/filtros-practicos` · Lee primero `CLAUDE.md`.

## Objetivo
Que se pueda buscar por **cosas útiles del local** («con Wi-Fi y terraza», «para llevar», «accesible») usando los datos de OpenStreetMap, y que cada ficha muestre esos servicios.

## Decisiones ya tomadas
- Datos **solo de OpenStreetMap** (ya tenemos `scripts/cafes_osm.json`, 128 locales). Sin inventar nada; sin Google.
- **«Sin dato» no es «no»**: un local sin etiqueta no se descarta por error ni se presenta como que no tiene el servicio.

## Cobertura real (medida sobre los 128 de OSM; entre paréntesis, los 53 curados)
| Servicio | Etiqueta OSM | Con dato positivo | Observación |
|---|---|---|---|
| Wi-Fi | `internet_access` | 40 (`wlan` 36, `yes` 4); 14 dicen `no` | (18 curados con dato) |
| Terraza | `outdoor_seating` | 34 (`yes` 32, `only` 1, `veranda` 1); 9 dicen `no` | (15 con etiqueta) |
| Para llevar | `takeaway=yes` | 31 | (7) |
| Accesible | `wheelchair` | 30 `yes`, 5 `limited` | (9) |
| Aire acondicionado | `air_conditioning` | 30 con etiqueta (revisar cuántos son `yes`) | (6) |
| Reparto | `delivery` | 29 con etiqueta (revisar valores) | (5) |
| Se puede fumar | `smoking` | 47 con dato (mezcla de valores) | revisar valores antes de usarlo |
| Baño, tarjeta | `toilets`, `payment:*` | 1–2 | **no ofrecer** (muy pocos datos) |
| Mascotas, enchufes, vegano | `dog`, `power_supply`, `diet:vegan` | 0 | **no ofrecer** |
Antes de decidir qué filtros ofrecer, **re-mide** y confírmalo con una tabla.

## Qué construir
1. **Datos:** `scripts/build_attributes.py` → `data/attributes.js` (`var CAFE_ATTRIBUTES = { "<osm>": { wifi: true, terrace: true, takeaway: true, accessible: 'yes'|'limited', air: true, … } }`), con la misma disciplina que `scripts/build_links.py`: valores normalizados, ausente = desconocido. Para los locales en vivo, el mismo mapeo desde las etiquetas en `liveToCafe` (reutiliza una única función de normalización en JS y Python; que las dos coincidan se comprueba con una prueba).
2. **Filtros:** nuevo grupo **«Servicios»** dentro de «Filtros», con chips y **conteos por opción** igual que los existentes (`facet`), semántica «tiene» (todos los marcados deben cumplirse) e interacción con tipo/método/snack/barrio/«Abierto ahora» si ya está integrado. `aria-pressed` y foco visible.
3. **Ficha:** sección «Servicios» con iconos propios (SVG, en `data/illustrations.js` o archivo nuevo) y texto: *Sí / No / Sin dato*, con la nota «Según OpenStreetMap».
4. **Tarjetas de la lista:** como mucho 1-2 insignias relevantes; no sobrecargar (el mapa y la lista deben seguir limpios).
5. (Pregúntame) Atajos compuestos como «Para trabajar» solo si se derivan de datos reales (p. ej. Wi-Fi + horario largo); si no, no se ofrecen.

## Antes de implementar
Hazme, en **una sola ronda y con tu recomendación**, las preguntas de diseño clave (qué filtros entran, cómo se muestran en la lista, qué hacemos con «Se puede fumar», si los filtros viajan en la URL). Espera mis respuestas.

## Cómo trabajar
- Lógica en `js/atributos.js` (nuevo) y datos generados; `app.js` solo conecta. Estilos en `styles/filtros.css` si hace falta.
- Pruebas: normalización (unitarias en Node con casos como `internet_access=wlan|yes|no`, `outdoor_seating=only`), conteos de chips = datos reales, combinaciones de filtros, un local en vivo con etiquetas, «sin dato» no excluido por error, móvil (panel inferior) y escritorio. Regenera capturas visuales afectadas y corre `/qa-cafecito`.

## Criterio de «hecho»
Los chips de Servicios filtran con conteos correctos, la ficha muestra Sí/No/Sin dato, no se ofrece ningún filtro sin datos suficientes, axe 0 violaciones, commits por tema, sin push.

## Fuera de alcance
Reseñas, «abierto ahora» (otro agente), datos de Google.
