# Prompts por feature

Cada archivo de esta carpeta es el encargo completo para **un agente distinto** (una conversación nueva de Claude Code). Todos parten de `CLAUDE.md` (contexto y reglas compartidas), así que los prompts son cortos y no repiten lo que el proyecto ya explica.

## Cómo lanzar uno
```bash
# desde la carpeta del proyecto, una rama y carpeta de trabajo por feature
git worktree add ../cafecito-abierto-ahora -b feature/abierto-ahora
cd ../cafecito-abierto-ahora
claude
```
y en la conversación nueva escribe solo:

> Lee `CLAUDE.md` y `docs/prompts/02-abierto-ahora.md` y ejecútalo.

(Cada prompt le pide al agente que **antes de implementar te haga las preguntas de diseño en una sola ronda, con su recomendación**; respóndele y sigue.)

## Orden y dependencias

| # | Prompt | Rama | Depende de | Esfuerzo |
|---|--------|------|-----------|----------|
| 1 | `01-enlace-propio-compartir.md` | `feature/enlace-compartir` | — (base para 4 y 5) | medio |
| 2 | `02-abierto-ahora.md` | `feature/abierto-ahora` | — (base para 5) | bajo-medio |
| 3 | `03-filtros-practicos.md` | `feature/filtros-practicos` | — | medio |
| 4 | `04-pasaporte-del-cafe.md` | `feature/pasaporte` | idealmente 1 (para enlazar y compartir) | alto |
| 5 | `05-rutas-de-cafe.md` | `feature/rutas` | 1 y 2 | alto |
| 6 | `06-que-cafe-pido.md` | `feature/que-cafe-pido` | — (datos escasos: ver el prompt) | medio |
| 7 | `07-preparador-de-cafe.md` | `feature/preparador` | — (sistema aparte) | medio |

**1, 2, 3, 6 y 7 pueden correr en paralelo.** El 4 y el 5 conviene arrancarlos cuando el 1 (y el 2 para el 5) ya estén integrados en `main`, o aceptar que el agente trabaje contra esa parte de forma provisional.

## Cómo integrar (de uno en uno)
1. El agente termina, corre la batería `/qa-cafecito` y deja la rama limpia con commits por tema.
2. Tú revisas el resultado en local (`python -m http.server 8765`).
3. Se integra en `main` **una rama a la vez** (merge o rebase) y se vuelve a correr la batería; recién entonces se integra la siguiente. Los conflictos previsibles están en `app.js` (plantilla, `setup()` y su `return`) y en `index.html` (la lista de `<script>`): se resuelven conservando ambos cambios.
4. Subir a GitHub solo cuando tú lo pidas.

## Aparcados (por ahora no)
- **Cerca de mí:** necesita la ubicación. Si se retoma: permiso solo al tocar un botón, sin guardar ni enviar la posición, y la app debe funcionar igual sin ella.
- **App instalable (PWA)**, **estadísticas de uso**, **versión en inglés**, **datos colaborativos con servidor** («¿está abierto ahora?»).

## Formato común de cada prompt
Objetivo · Decisiones ya tomadas · Qué construir · Datos y límites · Antes de implementar (preguntas) · Cómo trabajar · Criterio de «hecho» · Fuera de alcance.
