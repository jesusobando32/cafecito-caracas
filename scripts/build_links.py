#!/usr/bin/env python
"""Genera data/links.js (Instagram y web de cada local) a partir de OpenStreetMap (scripts/cafes_osm.json).

Uso:  python -X utf8 scripts/build_links.py

Son datos que los propios colaboradores de OSM añadieron (ODbL). Solo se guardan enlaces a la cuenta oficial del local;
las fotos no se copian: la ficha muestra un botón que lleva a su Instagram.
"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OSM = os.path.join(ROOT, 'scripts', 'cafes_osm.json')
OUT = os.path.join(ROOT, 'data', 'links.js')


def instagram_url(value):
    """@usuario, usuario o URL de instagram.com -> https://www.instagram.com/usuario/ (sin parámetros); None si no es válido."""
    if not value:
        return None
    v = value.strip()
    m = re.match(r'^https?://(?:www\.)?instagram\.com/([A-Za-z0-9._]{1,30})/?(?:[?#].*)?$', v, re.I)
    if m:
        user = m.group(1)
    else:
        user = v.lstrip('@')
    if user.lower() in ('p', 'reel', 'explore', 'accounts') or not re.fullmatch(r'[A-Za-z0-9._]{1,30}', user):
        return None
    return f'https://www.instagram.com/{user}/'


def web_url(value):
    if not value:
        return None
    v = value.strip()
    if not re.match(r'^https?://', v, re.I):
        v = 'https://' + v
    return None if 'instagram.com' in v.lower() or not re.match(r'^https?://[^\s]+\.[^\s]+$', v) else v


def main():
    with open(OSM, encoding='utf-8') as f:
        data = json.load(f)
    elements = data['elements'] if isinstance(data, dict) else data
    links = {}
    for e in elements:
        t = e.get('tags') or {}
        osm = e['type'][0] + str(e['id'])
        ig = instagram_url(t.get('contact:instagram') or t.get('instagram')) or instagram_url(t.get('website') if 'instagram.com' in (t.get('website') or '') else None)
        web = web_url(t.get('website') or t.get('contact:website'))
        entry = {k: v for k, v in (('instagram', ig), ('website', web)) if v}
        if entry:
            links[osm] = entry
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write('// GENERADO por scripts/build_links.py — no editar a mano.\n')
        f.write('// Instagram y web oficiales de cada local, de OpenStreetMap (© colaboradores, ODbL). Solo enlaces: no se copian fotos.\n')
        f.write("'use strict';\n\nvar CAFE_LINKS = " + json.dumps(links, ensure_ascii=False, indent=2, sort_keys=True) + ';\n')
    print(f'{len(links)} locales con enlaces ({sum(1 for v in links.values() if "instagram" in v)} con Instagram, {sum(1 for v in links.values() if "website" in v)} con web)')


if __name__ == '__main__':
    main()
