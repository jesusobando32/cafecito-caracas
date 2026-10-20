# 04 · Pasaporte del café

**Rama:** `feature/pasaporte` · Lee primero `CLAUDE.md`. Idealmente se arranca cuando `01-enlace-propio-compartir` ya está en `main`.

## Objetivo
Un juego ligero para **coleccionar sellos de cafeterías visitadas**, ganar medallas y **compartir una tarjeta** (imagen) con tu progreso. Es el gancho para que la gente use la app y la comparta. Todo en el dispositivo, sin cuentas ni servidor.

## Decisiones ya tomadas
- **Sin ubicación**: el sello se marca a mano («Estuve aquí»), por confianza. No se verifica con GPS.
- Todo se guarda en `localStorage` (clave versionada, p. ej. `cafecito-pasaporte-v1`) con **exportar/importar** a un archivo JSON como copia de seguridad (el almacenamiento del navegador puede borrarse).
- Los sellos se **dibujan** (SVG propios generados por código): sin fotos de terceros.
- Sin puntuaciones públicas ni tabla de líderes (no hay servidor).

## Qué construir
1. **Botón «Estuve aquí» / «Quitar sello»** en la ficha (y estado visible en la tarjeta de la lista si no la satura). Guarda por **`osm`**, fecha y un resumen mínimo del local (nombre, barrio, coordenadas, tipo) para poder dibujar el sello aunque ese local solo haya llegado en vivo.
2. **Pantalla «Pasaporte»** (decide con el dueño dónde vive: ítem del menú superior, que ya tiene 5, o entrada desde la Guía/la ficha): cuadrícula de sellos conseguidos y por conseguir, progreso (p. ej. «7 de 53»), **progreso por barrio** y vacío amable cuando no hay sellos.
3. **Sellos dibujados:** SVG circular con borde irregular, iniciales/nombre del local, barrio y fecha, con color por barrio o tipo y un giro leve distinto por sello. Animación breve al estampar (respeta `prefers-reduced-motion`).
4. **Medallas basadas en reglas medibles** (datos, no listas escritas a mano), p. ej.: primer sello; 5, 10, 25 sellos; 3 y 5 barrios distintos; primer café de especialidad; «completaste un barrio». Definidas en un archivo de datos para poder cambiarlas sin tocar la lógica.
5. **Tarjeta para compartir:** imagen generada con `<canvas>` (1080×1350 y, si es sencillo, 1080×1920 para historias) con el nombre, progreso, sellos y la dirección del sitio. Compartir con Web Share (archivos) si existe; si no, **descargar el PNG**.
6. **Copia de seguridad:** botones Exportar / Importar (valida el JSON; no sobrescribe sin confirmar).
7. Textos que expliquen en una línea la privacidad: «Tus sellos se guardan solo en este dispositivo».

## Datos y límites
- La identidad es el `osm`; «Gran Café» no lo tiene (ver prompt 01 para su id alternativo; coordina o usa el mismo criterio).
- Si el dueño borra los datos del navegador se pierden los sellos: de ahí la exportación.

## Antes de implementar
Hazme en **una sola ronda y con tu recomendación** las preguntas de diseño clave (dónde vive el Pasaporte, estilo visual de los sellos, qué medallas, formato de la tarjeta). Espera mis respuestas.

## Cómo trabajar
- Lógica (almacenamiento, medallas, generación de la tarjeta) en `js/pasaporte.js` (nuevo, la parte pura probable en Node); `app.js` solo conecta. Estilos en `styles/pasaporte.css`.
- Pruebas (`tests/e2e/pasaporte.js`): sellar/quitar, persistencia tras recargar, medallas por reglas (con datos sembrados en `localStorage`), exportar→limpiar→importar, JSON inválido, tarjeta generada (tamaño y no vacía), un local solo-en-vivo, móvil y escritorio, teclado y lector de pantalla (axe 0 violaciones), `prefers-reduced-motion`. Capturas visuales nuevas del Pasaporte. Corre `/qa-cafecito`.

## Criterio de «hecho»
Sellar locales, ver el progreso y las medallas, compartir/descargar la tarjeta y restaurar una copia de seguridad funcionan en móvil y escritorio, sin errores, sin pedir ningún permiso; commits por tema; sin push.

## Fuera de alcance
Verificación por ubicación, cuentas, ranking entre usuarios, reseñas.
