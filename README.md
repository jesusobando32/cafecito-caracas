# ☕ Cafecito Caracas

Buscador de cafeterías de Caracas — de Caricuao a Petare, con La Trinidad y El Hatillo — en un mapa limpio, con filtros por **tipo de local** (cafetería / café de especialidad), **método de preparación** y **snacks**, más una sección *Aprende* con guía de café.

**Sitio:** https://jesusobando32.github.io/cafecito-caracas/

## Cómo está hecho
Sitio 100 % estático (sin build): Vue 3 + Leaflet + leaflet.markercluster por CDN. Mapa base claro de OpenFreeMap («Positron», sin clave; MapLibre GL) con respaldo a OpenStreetMap si falla WebGL o la red. En móvil el mapa ocupa toda la pantalla y la lista va en un panel inferior deslizable.

```
index.html        Estructura y librerías
app.js            Aplicación Vue (filtros, mapa, detalle, Aprende con rutas #aprende/tema)
places.js         Horarios OSM y Google Places opcional
config.js         Clave opcional de Google Places
data/photos.js    Fotos propias de locales (opcional, por id de OSM)
data/images.js    Fotos de Aprende (Wikimedia Commons) con autor y licencia
data/illustrations.js  Dibujos SVG: diagramas de métodos, cortes de bebidas, cafetería genérica
img/aprende/      Fotos recortadas (2 tamaños)
data/cafes.js     Cafeterías (GENERADO por scripts/build_data.py)
data/wiki.js      Contenido de la pestaña Aprende
styles/main.css   Estilos
scripts/          Generador de datos desde OpenStreetMap
tests/validate.js Validación de datos:  node tests/validate.js
```

Para verlo en local: `python -m http.server 8000` y abre http://localhost:8000.

## Búsqueda en vivo
Al abrir el mapa y al moverlo, la app consulta la **Overpass API** de OpenStreetMap (sin clave) y añade las cafeterías (`amenity=cafe`) de la zona visible. Los locales de `data/cafes.js` son los curados (con tipo, métodos, snacks y fuentes) y tienen prioridad; los que llegan en vivo aparecen como *por confirmar*. Si Overpass no responde, se muestran solo los guardados.

Los horarios simples (`opening_hours`) de los locales en vivo se convierten en el momento. La última búsqueda se guarda en el navegador para que la lista aparezca al instante.

### Google Maps (opcional)
Google no permite leer Maps directamente; hay que usar su API oficial (Places API New), que requiere clave y facturación (hay crédito mensual gratuito). Pon la clave en `config.js` (`googlePlacesKey`) y, al abrir la ficha de un local, la app buscará ese lugar en Google (a menos de 150 m) y mostrará **foto, horario, valoración y sitio web** (la foto lleva la atribución que exige Google; esta parte no está probada con una clave real). Sin clave, la ficha muestra una cafetería ilustrada en vez de foto y un botón «Ver horario en Google Maps».

**Fotos propias:** guarda la imagen en `img/cafes/` y regístrala en `data/photos.js` con el id de OSM del local; tiene prioridad sobre la de Google. En Wikimedia Commons no hay fotos libres de estos locales. La clave queda visible en el navegador: restríngela por referrer HTTP (tu dominio de GitHub Pages y `localhost`) y solo a *Places API (New)*.

## Imágenes de Aprende
Las fotos son de Wikimedia Commons con licencia libre (CC0, CC BY o CC BY-SA); se recortaron y redimensionaron. Cada foto muestra su autor y licencia, y la portada de Aprende lista todos los créditos (salen de `data/images.js`). Los dibujos SVG son propios. Sin foto libre: guayoyo (método) y marrón (bebida), que solo tienen dibujo.

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
