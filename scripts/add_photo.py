#!/usr/bin/env python
"""Añade la foto de un local: la recorta (16:10), la comprime y la registra en data/photos.js.

Uso:
  python -X utf8 scripts/add_photo.py <id_osm> <imagen> --author "Quién la tomó o permiso del local" [--url https://instagram.com/…]

  <id_osm>  el campo `osm` del local en data/cafes.js (p. ej. n8362532414); no cambia al regenerar los datos
  --author  autor de la foto (se muestra como «Foto: …»). Úsala solo con permiso de quien la hizo.
  --url     enlace al autor o a la cuenta del local (opcional)
"""
import argparse
import json
import os
import re
import sys

from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HEADER = """// Fotos propias de locales. La clave es el id de OpenStreetMap del local (campo `osm` de data/cafes.js).
// Se gestiona con: python -X utf8 scripts/add_photo.py <id_osm> <imagen> --author "…"
// Tiene prioridad sobre la foto de Google Maps.
'use strict';

var CAFE_PHOTOS = """


def load(path):
    if not os.path.exists(path):
        return {}
    text = open(path, encoding='utf-8').read()
    m = re.search(r'var CAFE_PHOTOS = (\{.*\});', text, re.S)
    return json.loads(m.group(1)) if m else {}


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('osm'); ap.add_argument('image'); ap.add_argument('--author', required=True); ap.add_argument('--url', default='')
    ap.add_argument('--root', default=ROOT, help=argparse.SUPPRESS)
    a = ap.parse_args()
    if not re.fullmatch(r'[nwr]\d+', a.osm):
        sys.exit('El id de OSM debe parecerse a n8362532414 (n/w/r + números).')
    if a.url and not re.match(r'^https?://', a.url):
        sys.exit('--url debe empezar por http:// o https://')
    cafes = open(os.path.join(a.root, 'data', 'cafes.js'), encoding='utf-8').read()
    if f'"osm": "{a.osm}"' not in cafes:
        print(f'Aviso: {a.osm} no está en data/cafes.js (¿es un local que solo llega en vivo? entonces se aplicará cuando aparezca).')

    out_dir = os.path.join(a.root, 'img', 'cafes'); os.makedirs(out_dir, exist_ok=True)
    img = ImageOps.exif_transpose(Image.open(a.image)).convert('RGB')
    img = ImageOps.fit(img, (1000, 625), centering=(0.5, 0.5))
    rel = f'img/cafes/{a.osm}.jpg'
    img.save(os.path.join(a.root, rel), quality=82, optimize=True, progressive=True)

    path = os.path.join(a.root, 'data', 'photos.js')
    photos = load(path)
    photos[a.osm] = {'src': rel, 'author': a.author, **({'authorUrl': a.url} if a.url else {})}
    open(path, 'w', encoding='utf-8').write(HEADER + json.dumps(photos, ensure_ascii=False, indent=2, sort_keys=True) + ';\n')
    print(f'Listo: {rel} ({os.path.getsize(os.path.join(a.root, rel)) // 1024} KB). Fotos registradas: {len(photos)}')


if __name__ == '__main__':
    main()
