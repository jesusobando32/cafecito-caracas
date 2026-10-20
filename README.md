# ☕ Cafecito Caracas

Buscador de cafeterías de Caracas — de Caricuao a Petare, con La Trinidad y El Hatillo — en un mapa limpio, con filtros por **tipo de local** (cafetería / café de especialidad), **método de preparación** y **snacks**, más una **Guía** del café (historia, métodos, bebidas y más).

**Sitio:** https://jesusobando32.github.io/cafecito-caracas/

## Cómo está hecho
Sitio 100 % estático (sin build): Vue 3 + Leaflet + leaflet.markercluster por CDN. Mapa base claro de OpenFreeMap («Positron», sin clave; MapLibre GL) con respaldo a OpenStreetMap si falla WebGL o la red. En móvil el mapa ocupa toda la pantalla y la lista va en un panel inferior deslizable.

```
index.html        Estructura y librerías
app.js            Aplicación Vue (filtros, mapa, detalle, la Guía con rutas #guia/tema)
places.js         Horarios OSM y Google Places opcional
config.js         Clave opcional de Google Places
data/photos.js    Fotos propias de locales (opcional, por id de OSM; se gestiona con scripts/add_photo.py)
data/links.js     Instagram y web de cada local (GENERADO por scripts/build_links.py)
data/images.js    Fotos de la Guía (Wikimedia Commons) con autor y licencia
data/illustrations.js  Dibujos SVG: diagramas de métodos, cortes de bebidas, cafetería genérica
img/aprende/      Fotos recortadas (2 tamaños)
data/cafes.js     Cafeterías (GENERADO por scripts/build_data.py)
data/wiki.js      Contenido de la Guía
styles/main.css   Estilos
scripts/          Generador de datos desde OpenStreetMap
tests/validate.js Validación de datos:  node tests/validate.js
```

Para verlo en local: `python -m http.server 8000` y abre http://localhost:8000.

## Búsqueda en vivo
Al abrir el mapa y al moverlo, la app consulta la **Overpass API** de OpenStreetMap (sin clave) y añade las cafeterías (`amenity=cafe`) de la zona visible. Los locales de `data/cafes.js` son los curados (con tipo, métodos, snacks y fuentes) y tienen prioridad; los que llegan en vivo aparecen como *por confirmar*. Si Overpass no responde, se muestran solo los guardados.

Los horarios simples (`opening_hours`) de los locales en vivo se convierten en el momento. La última búsqueda se guarda en el navegador para que la lista aparezca al instante.

### Fotos sin tarjeta
- **No se copian fotos de Instagram ni de Google Maps:** son de sus autores (el local o sus clientes), sus términos prohíben la descarga automática y publicarlas sin permiso infringe los derechos de autor.
- **Botón «Instagram del local» y «Sitio web»** en la ficha, con los enlaces oficiales que los colaboradores de OpenStreetMap ya registraron (`data/links.js`, generado con `python -X utf8 scripts/build_links.py`; hoy 38 locales con Instagram). Así se ven sus fotos en su propia cuenta.
- **Lote de fotos de fachada autorizadas:** guarda cada foto en `fotos-pendientes/` con el nombre del local (ver `fotos-pendientes/LEEME.md`), mira cuáles faltan con `python -X utf8 scripts/add_photos_batch.py --list` y procésalas con `python -X utf8 scripts/add_photos_batch.py`. El crédito sale solo («Foto: @cuenta · cortesía del local», con enlace a su Instagram). Las originales no se suben a GitHub.
- **Una foto suelta:** pídelas al local (suelen decir que sí) o toma las tuyas y regístralas con
  `python -X utf8 scripts/add_photo.py <id_osm> foto.jpg --author "Nombre o @cuenta del local" --url https://instagram.com/cuenta`
  (recorta y comprime la imagen y la añade a `data/photos.js`; tiene prioridad sobre cualquier otra fuente).
- Mensaje para pedirla: *«¡Hola! Tengo un mapa gratuito de cafeterías de Caracas (jesusobando32.github.io/cafecito-caracas) y me encantaría mostrar una foto de su local con el crédito y un enlace a su Instagram. ¿Nos autorizan a usar una foto de su cuenta o nos pueden enviar una?»*

### Fotos, horario y valoración desde Google Maps (opcional)
Google no permite copiar fotos de sus páginas (tienen autor y derechos), pero su API oficial **Places (New)** sí las entrega con permiso y atribución. La app ya está conectada: solo falta la clave.

**Cómo activarla**
1. En [Google Cloud Console](https://console.cloud.google.com/) crea un proyecto (p. ej. «cafecito-caracas») y vincula una cuenta de facturación (pide tarjeta; Google da un uso gratuito mensual por plan, revisa las cifras vigentes en su página de precios).
2. *APIs y servicios → Biblioteca* → activa **Places API (New)**.
3. *APIs y servicios → Credenciales → Crear credenciales → Clave de API*, y **restríngela**:
   - *Restricciones de aplicación → Sitios web*: `https://jesusobando32.github.io/*` y `http://localhost:8765/*`
   - *Restricciones de API*: solo **Places API (New)**
4. *Cuotas*: pon un límite diario bajo a Places API (New) (p. ej. 300 solicitudes/día) y crea una alerta de presupuesto, para que un abuso no genere cargos.
5. Pega la clave en `config.js` (`googlePlacesKey: 'AIza…'`), haz commit y push. La clave queda visible en el navegador (es normal en un sitio estático; por eso se restringe por dominio). GitHub puede avisarte por correo de una «clave expuesta»: con las restricciones puestas es esperado.

**Qué hace**
- Al abrir una ficha busca el local en Google (nombre + «Caracas», sesgo de 200 m) y solo lo acepta si está a menos de 150 m **y su nombre se parece** (si no, se queda el dibujo: una foto equivocada es peor que ninguna).
- Muestra la foto con la atribución de su autor (obligatoria), y con `googlePlacesDetails: true` también horario, valoración, web y teléfono. Con `false` pide solo foto y enlace (plan Pro, más barato).
- Una foto propia en `data/photos.js` tiene prioridad. Si la imagen o la clave fallan, vuelve al dibujo; ante un 400/403 deja un aviso en la consola y no sigue llamando.
- Los nombres de foto no se guardan (Google lo prohíbe): solo se reutilizan 30 min dentro de la sesión.
- Probado con respuestas simuladas (`tests/e2e/google-places-simulado.js`); falta probarlo con una clave real.

**Fotos propias:** guarda la imagen en `img/cafes/` y regístrala en `data/photos.js` con el id de OSM del local; tiene prioridad sobre la de Google. En Wikimedia Commons no hay fotos libres de estos locales.

## Imágenes de la Guía
Las fotos son de Wikimedia Commons con licencia libre (CC0, CC BY o CC BY-SA); se recortaron y redimensionaron. Cada foto muestra su autor y licencia, y la portada de la Guía lista todos los créditos (salen de `data/images.js`). Los dibujos SVG son propios. Sin foto libre: guayoyo (método) y marrón (bebida), que solo tienen dibujo.

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

## Navegación
Menú superior: **Mapa · Historia · Métodos · Bebidas · Guía** (la portada con las 7 lecturas). En pantallas estrechas se pliega en un desplegable. Los enlaces antiguos `#aprende/...` siguen funcionando.
La Guía usa fotos de fondo, texturas y animaciones de aparición al hacer scroll (se desactivan con «reducir movimiento» del sistema).

## Enlaces a Google Maps
El minimapa y «Ver horario» abren `maps/search/<nombre>/@lat,lng,18z` (búsqueda del nombre con el visor centrado en el local: abre su ficha si Google la tiene, y si no muestra esa zona); «Ver el punto exacto» pone un marcador en las coordenadas y «Cómo llegar» traza la ruta a ellas. Antes se mandaba un texto libre «nombre lat,lng», que Google interpretaba sin zona y podía caer en otro país. `tests/e2e/enlaces-maps.js` lo verifica para los 53 locales.
