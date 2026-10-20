#!/usr/bin/env python
"""Procesa de una vez las fotos de fachada que te enviaron los locales.

Flujo:
  1. Guarda cada foto en la carpeta  fotos-pendientes/  con el nombre del local (p. ej. «Moka Caracas.jpg»).
     Si hay dos locales con el mismo nombre (Granier, Café Venezuela), antepón el id: «n123456789 Granier.jpg».
  2. python -X utf8 scripts/add_photos_batch.py --list      -> qué locales con Instagram aún no tienen foto
  3. python -X utf8 scripts/add_photos_batch.py             -> recorta, comprime y registra cada foto
     El crédito sale solo: «@cuenta» (la del Instagram del local, de data/links.js) + «cortesía del local».
  Las originales procesadas se mueven a fotos-pendientes/procesadas/ (no se suben a GitHub).

Úsalo solo con fotos que el local autorizó (el crédito y el enlace a su Instagram ya van incluidos).
"""
import argparse
import json
import os
import re
import shutil
import sys
import unicodedata

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from add_photo import ROOT, add_photo, load  # noqa: E402

EXT = ('.jpg', '.jpeg', '.png', '.webp')


def norm(s):
    s = unicodedata.normalize('NFD', s).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '', s)


def read_js_object(path, var):
    text = open(path, encoding='utf-8').read()
    m = re.search(r'var ' + var + r' = (.*);\s*$', text, re.S)
    return json.loads(m.group(1))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--list', action='store_true', help='lista los locales con Instagram que aún no tienen foto propia')
    ap.add_argument('--note', default='cortesía del local')
    ap.add_argument('--root', default=ROOT, help=argparse.SUPPRESS)
    a = ap.parse_args()

    cafes = read_js_object(os.path.join(a.root, 'data', 'cafes.js'), 'CAFES_DATA')
    links = read_js_object(os.path.join(a.root, 'data', 'links.js'), 'CAFE_LINKS')
    photos = load(os.path.join(a.root, 'data', 'photos.js'))
    inbox = os.path.join(a.root, 'fotos-pendientes')
    by_name = {}
    for c in cafes:
        by_name.setdefault(norm(c['name']), []).append(c)

    if a.list:
        pend = [c for c in cafes if links.get(c.get('osm'), {}).get('instagram') and c.get('osm') not in photos]
        print(f'{len(pend)} locales con Instagram sin foto propia (de {len(cafes)}):\n')
        for c in pend:
            dup = len(by_name[norm(c['name'])]) > 1
            fname = (c['osm'] + ' ' if dup else '') + c['name'] + '.jpg'
            print(f"  - {c['name']} ({c['neighborhood']}) · {links[c['osm']]['instagram']}\n      archivo: {fname}")
        return

    if not os.path.isdir(inbox):
        sys.exit('No existe la carpeta fotos-pendientes/. Créala y guarda ahí las fotos.')
    files = sorted(f for f in os.listdir(inbox) if f.lower().endswith(EXT))
    if not files:
        sys.exit('fotos-pendientes/ no tiene imágenes (.jpg, .png, .webp).')
    done = os.path.join(inbox, 'procesadas'); os.makedirs(done, exist_ok=True)
    ok = fail = 0
    for f in files:
        stem = os.path.splitext(f)[0]
        m = re.match(r'^([nwr]\d+)[\s_-]+(.*)$', stem)
        osm, name = (m.group(1), m.group(2)) if m else (None, stem)
        if osm:
            cafe = next((c for c in cafes if c.get('osm') == osm), None)
        else:
            cands = by_name.get(norm(name), [])
            cafe = cands[0] if len(cands) == 1 else None
            if len(cands) > 1:
                print(f'  ✗ {f}: hay {len(cands)} locales llamados «{name}»; renombra el archivo como «{cands[0]["osm"]} {name}.jpg» (ids: ' + ', '.join(c['osm'] for c in cands) + ')')
                fail += 1; continue
        if not cafe:
            print(f'  ✗ {f}: no encuentro un local con ese nombre en data/cafes.js'); fail += 1; continue
        ig = links.get(cafe['osm'], {}).get('instagram')
        if not ig:
            print(f"  ✗ {f}: «{cafe['name']}» no tiene Instagram registrado; usa add_photo.py con --author"); fail += 1; continue
        handle = '@' + ig.rstrip('/').split('/')[-1]
        rel, n = add_photo(a.root, cafe['osm'], os.path.join(inbox, f), handle, ig, a.note)
        shutil.move(os.path.join(inbox, f), os.path.join(done, f))
        print(f"  ✓ {cafe['name']}: {rel} · crédito {handle}"); ok += 1
    print(f'\n{ok} fotos añadidas, {fail} con problemas. Revisa el sitio en local antes de subir.')


if __name__ == '__main__':
    main()
