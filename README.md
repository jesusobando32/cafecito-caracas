# ☕ Cafecito Caracas

Buscador de cafeterías de Caracas — de Caricuao a Petare, con La Trinidad y El Hatillo — en un mapa limpio, con filtros por **tipo de local** (cafetería / café de especialidad), **método de preparación** y **snacks**, más una sección *Aprende* con guía de café.

**Sitio:** https://jesusobando32.github.io/cafecito-caracas/

## Cómo está hecho
Sitio 100 % estático (sin build): Vue 3 + Leaflet + leaflet.markercluster por CDN. Mapa base de OpenStreetMap, suavizado con CSS.

```
index.html        Estructura y librerías
app.js            Aplicación Vue (filtros, mapa, detalle, wiki)
data/cafes.js     Cafeterías (GENERADO por scripts/build_data.py)
data/wiki.js      Contenido de la pestaña Aprende
styles/main.css   Estilos
scripts/          Generador de datos desde OpenStreetMap
tests/validate.js Validación de datos:  node tests/validate.js
```

Para verlo en local: `python -m http.server 8000` y abre http://localhost:8000.

## Búsqueda en vivo
Al abrir el mapa y al moverlo, la app consulta la **Overpass API** de OpenStreetMap (sin clave) y añade las cafeterías (`amenity=cafe`) de la zona visible. Los locales de `data/cafes.js` son los curados (con tipo, métodos, snacks y fuentes) y tienen prioridad; los que llegan en vivo aparecen como *por confirmar*. Si Overpass no responde, se muestran solo los guardados.

## De dónde salen los datos
- **Posiciones y nombres:** OpenStreetMap (ODbL). Las coordenadas son las del mapa, no aproximaciones.
- **Barrio:** Nominatim (geocodificación inversa), con correcciones manuales.
- **Horarios:** solo los `opening_hours` simples de OSM; si no hay, se muestra “sin confirmar”.
- **Tipo, métodos y snacks:** no se inventan. Solo existen donde hay una fuente enlazada en la ficha. Todo lo demás aparece como *por confirmar*.

## Cómo ayudar
Cada ficha tiene el botón **“¿Falta algo? Aporta datos”**, que abre un issue con una plantilla. También puedes editar `OVERRIDES` en `scripts/build_data.py` y regenerar con `python -X utf8 scripts/build_data.py`.

Pendientes conocidos: geolocalizar La Taza (Los Palos Grandes), Quadro Café y Café Artesano (centro), que figuran en la prensa pero aún no están ubicados en OSM.

## Créditos
© colaboradores de [OpenStreetMap](https://www.openstreetmap.org/copyright). Nombre inspirado en el café, no afiliado a ninguna cafetería.
