// Fotos propias de locales (opcional). La clave es el id de OpenStreetMap del local (campo `osm` de data/cafes.js),
// que no cambia al regenerar los datos. Guarda la imagen en img/cafes/ y registra autor y enlace.
//   'n8362532414': { src: 'img/cafes/n8362532414.jpg', author: 'Tu nombre', authorUrl: 'https://…' },
// Tiene prioridad sobre la foto de Google Maps.
'use strict';

var CAFE_PHOTOS = {};
