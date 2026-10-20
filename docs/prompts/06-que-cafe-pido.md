# 06 · «¿Qué café pido?» (cuestionario de recomendación)

**Rama:** `feature/que-cafe-pido` · Lee primero `CLAUDE.md`.

## Objetivo
Un cuestionario corto y agradable que, según tus gustos, **recomienda una bebida y un método de preparación** de la Guía, explica por qué, y te lleva a **dónde probarlo** en el mapa. Conecta la Guía con el mapa y se puede compartir.

## Decisiones ya tomadas
- **Reglas propias, sin IA ni APIs externas** (nada de claves ni tarjeta). Todo se calcula en el navegador.
- El contenido sale de `data/wiki.js` (métodos y bebidas ya descritos). **No inventes afirmaciones de sabor**: cualquier perfil (acidez, dulzor, cuerpo, intensidad, con leche) debe ser coherente con lo escrito en la Guía y con conocimiento general verificable; márcalo como «guía general».
- Sin cuentas ni ubicación.

## El problema de datos (léelo antes de diseñar)
De los 53 locales curados, solo **1 tiene métodos** y **2 tienen bebidas** cargadas. Por eso «dónde probarlo» **no puede prometer** que un local sirva X. Diseña una degradación honesta:
- recomendación → lleva al **mapa con el filtro ya aplicado** cuando existan datos (filtro de método/snack existente);
- si no, sugiere el **tipo de local** adecuado (p. ej. «busca una cafetería de especialidad» para un V60; «cualquier cafetería» para un café con leche), con el filtro de tipo aplicado, y deja claro que es orientativo;
- propone (sin implementarlo todavía) un archivo `data/menus.js` vacío y documentado donde el dueño pueda ir cargando qué sirve cada local a medida que los confirme.

## Qué construir
1. **Cuestionario de 4-5 preguntas** (p. ej. ¿con leche o solo?, ¿prefieres algo ácido/frutal o dulce/achocolatado?, ¿qué tan fuerte?, ¿cuánto tiempo tienes?, ¿caliente o frío?), con barra de progreso, botón «atrás», teclado y lector de pantalla.
2. **Motor de puntuación** transparente y sin azar: cada respuesta suma a un perfil; cada bebida/método tiene un perfil en `data/perfiles-cafe.js` (datos editables, no lógica enterrada). Resultado: **1 principal + 2 alternativas**, con una frase de «por qué» construida desde tus respuestas.
3. **Pantalla de resultado:** qué es (texto de la Guía), cómo pedirlo en una cafetería venezolana, enlace a la lectura de la Guía, **«Probarlo en el mapa»** (con la degradación de arriba) y **Compartir** el resultado (texto + enlace; opcional tarjeta con `<canvas>`).
4. **Dónde vive:** acceso desde la portada de la Guía y un llamado discreto en el mapa (estado vacío de resultados o junto al buscador). (Pregúntame antes de añadirlo al menú superior, que ya tiene 5 ítems.)
5. Recordar el último resultado en `localStorage` (opcional y con botón «repetir»).

## Antes de implementar
Hazme en **una sola ronda y con tu recomendación** las preguntas de diseño clave (preguntas del cuestionario, perfiles de cada bebida/método y de dónde sale cada afirmación, dónde se muestra el acceso). Espera mis respuestas antes de escribir los perfiles.

## Cómo trabajar
- Lógica y datos en `js/que-cafe-pido.js` + `data/perfiles-cafe.js` (nuevos); `app.js` conecta; estilos en `styles/que-cafe-pido.css`.
- Pruebas: el motor es **determinista** (unitarias en Node: respuestas fijas → resultado fijo, empates resueltos por regla explícita, todas las bebidas y métodos son alcanzables), flujo completo con teclado, resultado compartido, degradación de «dónde probarlo» con y sin datos, móvil y escritorio, axe 0 violaciones. Corre `/qa-cafecito`.

## Criterio de «hecho»
Cualquier combinación de respuestas produce un resultado coherente y explicado; ninguna afirmación contradice la Guía; «dónde probarlo» nunca promete lo que no sabemos; commits por tema; sin push.

## Fuera de alcance
IA/chat, cuentas, historial en servidor, cargar datos de menús de los locales (solo dejar la estructura propuesta).
