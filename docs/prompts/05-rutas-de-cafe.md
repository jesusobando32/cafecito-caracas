# 05 · Rutas de café

**Rama:** `feature/rutas` · Lee primero `CLAUDE.md`. Conviene arrancarlo cuando `01-enlace-propio-compartir` y `02-abierto-ahora` ya estén en `main` (usa el enlace por local y el estado abierto/cerrado).

## Objetivo
Armar un **recorrido a pie por 3-5 cafeterías cercanas** («2 horas en Los Palos Grandes»), mostrarlo en el mapa y poder **abrirlo y compartirlo**. Es una función que casi ningún mapa de cafés tiene.

## Decisiones ya tomadas
- **Sin ubicación del usuario**: la ruta se arma por barrio o alrededor de un café elegido.
- **Sin servidor de rutas ni claves.** Los tiempos a pie son **estimaciones** (distancia en línea recta × ~1,3 ÷ ~80 m/min) y la interfaz lo dice («aprox.; Caracas tiene cuestas»). Para el trayecto real se abre **Google Maps con varias paradas** mediante URL pública (`https://www.google.com/maps/dir/?api=1&origin=…&destination=…&waypoints=…|…&travelmode=walking`, máx. ~9 paradas, sin clave).
- Solo datos que ya existen (coordenadas, tipo, horario si lo hay). No inventar horarios ni distancias reales.

## Qué construir
1. **Generador:** el usuario elige *zona* (barrio de `HOOD_OPTIONS` con ≥ 3 locales, o «alrededor de [café]»), *paradas* (2-5) o *tiempo disponible*, *tipo* (todos / solo especialidad) y *solo abiertos ahora* (usa la lógica del prompt 02 si ya está integrada; si no, `getStatus`). Algoritmo **determinista** y explicable (p. ej. elegir el grupo más compacto y ordenarlo con vecino más cercano), con tests.
2. **Resultado:** lista numerada con distancia/tiempo aprox. entre paradas y total, estado de cada local, y en el mapa **línea punteada y pines numerados** (la línea es recta entre paradas y se rotula como aproximada). Botón **«Abrir en Google Maps»** (varias paradas, a pie) y **Compartir** (enlace `#ruta/<osm>,<osm>,…` que reabre la misma ruta).
3. **Rutas destacadas** pre-armadas (un archivo de datos `data/rutas.js`, p. ej. «Especialidad en Los Palos Grandes», «Las Mercedes en una tarde») que el dueño pueda editar sin tocar código.
4. **Móvil:** el generador y el resultado viven en el panel inferior deslizable; que el mapa muestre la ruta sin quedar tapada.
5. Mensaje cuando no hay suficientes locales o abiertos en la zona, con una alternativa concreta.

## Datos y límites
- Locales curados con coordenadas fiables; los de en vivo pueden entrar si tienen nombre y coordenadas.
- La seguridad y las cuestas no se pueden calcular: dilo en el texto y sugiere revisar el trayecto en Google Maps.

## Antes de implementar
Hazme en **una sola ronda y con tu recomendación** las preguntas de diseño clave (cómo se elige la zona, el algoritmo, dónde vive la función en la interfaz, qué rutas destacadas arrancan). Espera mis respuestas.

## Cómo trabajar
- Lógica pura (distancias, selección, ordenación, URL de Google Maps) en `js/rutas.js` (nuevo, probable en Node); `app.js` conecta. Estilos en `styles/rutas.css`.
- Pruebas: unitarias de distancia/orden/URL (casos conocidos y límites: 1 local, 9 paradas), determinismo, todos los barrios con ≥ 3 locales generan ruta, enlace `#ruta/...` reabre la misma, «solo abiertos» con reloj simulado, móvil y escritorio, axe 0 violaciones. Capturas visuales nuevas. Corre `/qa-cafecito`.

## Criterio de «hecho»
Para cada barrio con ≥ 3 locales se genera una ruta razonable, se ve en el mapa, se abre en Google Maps con las paradas correctas y se comparte por enlace; los tiempos están rotulados como aproximados; commits por tema; sin push.

## Fuera de alcance
Ubicación en tiempo real, navegación paso a paso, rutas en coche, servidor de rutas propio.
