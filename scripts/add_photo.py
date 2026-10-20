#!/usr/bin/env python
"""Añade la foto de un local: la recorta (16:10), la comprime y la registra en data/photos.js.

Uso:
  python -X utf8 scripts/add_photo.py <id_osm> <imagen> --author "Quién la tomó o permiso del local" [--url https://instagram.com/…]

  <id_osm>  el campo `osm` del local en data/cafes.js (p. ej. n8362532414); no cambia al regenerar los datos
  --author  autor de la foto (se muestra como «Foto: …»). Úsala solo con permiso de quien la hizo.
  --url     enlace al autor o a la cuenta del local (opcional)
  --note    texto junto al crédito (opcional), p. ej. "cortesía del local"

Para varias fotos a la vez: scripts/add_photos_batch.py
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
// (o varias a la vez con scripts/add_photos_batch.py). Tiene prioridad sobre la foto de Google Maps.
'use strict';

var CAFE_PHOTOS = """


def load(path):
    if not os.path.exists(path):
        return {}
    text = open(path, encoding='utf-8').read()
    m = re.search(r'var CAFE_PHOTOS = (\{.*\});', text, re.S)
    return json.loads(m.group(1)) if m else {}


def add_photo(root, osm, image, author, url='', note=''):
    """Recorta/comprime `image` a img/cafes/<osm>.jpg y la registra en data/photos.js. Devuelve (ruta relativa, total de fotos)."""
    if not re.fullmatch(r'[nwr]\d+', osm):
        raise ValueError('El id de OSM debe parecerse a n8362532414 (n/w/r + números).')
    if url and not re.match(r'^https?://', url):
        raise ValueError('--url debe empezar por http:// o https://')
    os.makedirs(os.path.join(root, 'img', 'cafes'), exist_ok=True)
    img = ImageOps.exif_transpose(Image.open(image)).convert('RGB')
    img = ImageOps.fit(img, (1000, 625), centering=(0.5, 0.5))
    rel = f'img/cafes/{osm}.jpg'
    img.save(os.path.join(root, rel), quality=82, optimize=True, progressive=True)
    path = os.path.join(root, 'data', 'photos.js')
    photos = load(path)
    photos[osm] = {'src': rel, 'author': author, **({'authorUrl': url} if url else {}), **({'note': note} if note else {})}
    with open(path, 'w', encoding='utf-8') as f:
        f.write(HEADER + json.dumps(photos, ensure_ascii=False, indent=2, sort_keys=True) + ';\n')
    return rel, len(photos)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('osm')
    ap.add_argument('image')
    ap.add_argument('--author', required=True)
    ap.add_argument('--url', default='')
    ap.add_argument('--note', default='')
    ap.add_argument('--root', default=ROOT, help=argparse.SUPPRESS)
    a = ap.parse_args()
    cafes = open(os.path.join(a.root, 'data', 'cafes.js'), encoding='utf-8').read()
    if f'"osm": "{a.osm}"' not in cafes:
        print(f'Aviso: {a.osm} no está en data/cafes.js (¿es un local que solo llega en vivo? entonces se aplicará cuando aparezca).')
    try:
        rel, n = add_photo(a.root, a.osm, a.image, a.author, a.url, a.note)
    except ValueError as e:
        sys.exit(str(e))
    print(f'Listo: {rel} ({os.path.getsize(os.path.join(a.root, rel)) // 1024} KB). Fotos registradas: {n}')


if __name__ == '__main__':
    main()
