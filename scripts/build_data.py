#!/usr/bin/env python
"""Genera data/cafes.js a partir de OpenStreetMap (scripts/cafes_osm.json).

Uso:  python -X utf8 scripts/build_data.py

- Coordenadas y nombres vienen de OpenStreetMap (© colaboradores de OpenStreetMap, ODbL).
- El barrio se obtiene con Nominatim (reverse) y se guarda en scripts/geocode_cache.json.
- Horarios: se convierten solo los patrones simples de `opening_hours`; lo demás queda sin horario.
- Tipo, métodos y snacks NO se inventan: solo hay datos donde existe una fuente (ver OVERRIDES).
  Todo lo demás queda como `typeConfirmed: false` y listas vacías.
"""
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OSM = os.path.join(ROOT, 'scripts', 'cafes_osm.json')
CACHE = os.path.join(ROOT, 'scripts', 'geocode_cache.json')
OUT = os.path.join(ROOT, 'data', 'cafes.js')
UA = 'cafecito-caracas-build/1.0 (https://github.com/jesusobando32/cafecito-caracas)'

# Zona cubierta: de Caricuao (oeste) a Petare (este), con La Trinidad y El Hatillo.
BBOX = (10.38, -67.00, 10.53, -66.77)

# OSM id -> (tipo por defecto = cafeteria). Incluidos tras revisión manual.
INCLUDE = [
    'n8362532414', 'n12463595316', 'n4075471426', 'n11339206872', 'n9584080791',
    'n12663370924', 'n3041677759', 'n12663370927', 'n6184602085', 'n2471461502',
    'n2578640697', 'n10960302473', 'n13502628501', 'n13734941001', 'n2505232823',
    'n2505232826', 'n2500906714', 'n2506508142', 'n2513147731', 'n2576334414',
    'n2801541994', 'n2806453442', 'n3241252664', 'n3533773108', 'n4327572292',
    'n4410920290', 'n4410937892', 'n7211907967', 'n7399991929', 'n7409136897',
    'n9391168182', 'n9752238430', 'n9784163461', 'n11956563220', 'n12661242434',
    'n12663370922', 'n12663370923', 'n13062206782', 'n13743160309', 'n14067049801',
    'n13915453521', 'n2498628572', 'n2498743616', 'n2438119863', 'n2454834013',
    'w1040968703', 'w739899241', 'n2454600330', 'n2454600555',
    # Cadena con presencia en los extremos de la zona (oeste, este, sur)
    'n11841838790', 'n11873114066', 'n11873114068',
]

# Casos fuera de OSM-cafe o con datos de fuentes externas.
EXTRA_NODES = {
    'nominatim:gran-cafe': {
        'name': 'Gran Café', 'lat': 10.4957290, 'lng': -66.8801918,
        'address': 'Bulevar de Sabana Grande',
    },
}
INCLUDE.append('nominatim:gran-cafe')

SRC_ELDIARIO = 'https://eldiario.com/2025/10/01/del-grano-a-la-taza-cafeterias-especialidad-en-caracas/'
SRC_MEER = 'https://www.meer.com/en/60265-where-to-drink-a-good-coffee-in-caracas'
SRC_PARAMO = 'https://travelfeed.com/@neruel/paramo-coffee-sambil-chacao-caracas-en-es'

# Datos con fuente. Lo que no aparece aquí queda vacío (no se inventa).
OVERRIDES = {
    'n8362532414': {
        'name': 'Quiero 1 Café', 'type': 'especialidad', 'typeConfirmed': True,
        'drinks': ['Café con leche'], 'snacks': ['Tortas'],
        'description': 'Cafetería de especialidad abierta en 2019 por René Orellana. Trabaja granos de Miranda, Trujillo, Mérida, Portuguesa y Monagas; el café con leche es lo más pedido.',
        'sources': [SRC_ELDIARIO],
    },
    'n12463595316': {
        'name': 'Caracas Coffee Roasters', 'type': 'especialidad', 'typeConfirmed': True,
        'methods': ['Espresso', 'Guayoyo'], 'drinks': ['Café con leche'], 'snacks': ['Postres'],
        'description': 'Tostadora propia dentro del local y marca de granos Don Melitón (Queniquea, Táchira, y Rubio). Abrió en 2019.',
        'sources': [SRC_ELDIARIO],
    },
    'n4075471426': {
        'name': 'Café Noisette', 'snacks': ['Crepes', 'Ensaladas', 'Pastelería'],
        'description': 'Café de estilo francés en Campo Claro, con música de jazz varias noches a la semana. Pastelería de la vecina Pastelería Galia.',
        'sources': [SRC_MEER],
    },
    'n11339206872': {
        'name': 'Caffé Più', 'snacks': ['Postres', 'Tortas'],
        'description': 'Café de estilo italiano en Bello Monte con cerca de 20 sabores de café. Tiramisú, torta de chocolate oscuro y tres leches.',
        'sources': [SRC_MEER],
    },
    'nominatim:gran-cafe': {
        'name': 'Gran Café',
        'description': 'Histórico café del Bulevar de Sabana Grande, fundado a finales de los años 40.',
        'sources': [SRC_MEER],
    },
    'n9584080791': {
        'name': 'Páramo Café', 'snacks': ['Postres', 'Golfeados', 'Sándwiches'],
        'description': 'Franquicia de café 100 % venezolano. El café es el producto estrella; también hay bebidas frías, postres y sándwiches.',
        'sources': [SRC_PARAMO],
    },
    'n12663370924': {
        'name': 'Páramo Café · Tolón', 'snacks': ['Postres', 'Golfeados', 'Sándwiches'],
        'description': 'Franquicia de café 100 % venezolano. El café es el producto estrella; también hay bebidas frías, postres y sándwiches.',
        'sources': [SRC_PARAMO],
    },
}

# Correcciones de barrio donde Nominatim devuelve algo impreciso.
HOOD_FIX = {
    'n4075471426': 'La Carlota',
    'nominatim:gran-cafe': 'Sabana Grande',
    'n13502628501': 'La Trinidad',
    'n11873114068': 'El Hatillo',
    'n11841838790': 'Av. Teherán (oeste)',
    'w1040968703': 'Av. Baralt (centro)',
}

CUISINE_TO_SNACK = {
    'cake': 'Tortas', 'pastry': 'Pastelería', 'sandwich': 'Sándwiches', 'dessert': 'Postres',
    'crepe': 'Crepes', 'waffle': 'Crepes', 'breakfast': 'Desayunos', 'brunch': 'Desayunos',
    'golfeados': 'Golfeados', 'ice_cream': 'Helados', 'salad': 'Ensaladas',
    'pan_de_masa_madre': 'Pastelería', 'bread': 'Pastelería', 'donut': 'Pastelería',
}

DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
DAY_NAMES = {1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 0: 'Domingo'}
# Mo..Su -> Date.getDay() (Domingo = 0)
DAY_ID = {'Mo': 1, 'Tu': 2, 'We': 3, 'Th': 4, 'Fr': 5, 'Sa': 6, 'Su': 0}


def expand_days(spec):
    out = []
    for part in spec.split(','):
        part = part.strip()
        if part == 'PH':
            continue
        if '-' in part:
            a, b = part.split('-')
            if a not in DAYS or b not in DAYS:
                return None
            i, j = DAYS.index(a), DAYS.index(b)
            idx = range(i, j + 1) if i <= j else list(range(i, 7)) + list(range(0, j + 1))
            out += [DAYS[k] for k in idx]
        elif part in DAYS:
            out.append(part)
        else:
            return None
    return out


def parse_hours(oh):
    """opening_hours simple -> lista de 7 días {dayId,name,closed,open,close} o None."""
    if not oh:
        return None
    by_day = {}
    for rule in [r.strip() for r in oh.split(';') if r.strip()]:
        # Festivos y excepciones por fecha: se ignoran
        if re.search(r'\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b', rule) or rule.endswith('off'):
            continue
        m = re.match(r'^(?:(?P<days>[A-Za-z, \-]+?)\s+)?(?P<o>\d\d:\d\d)-(?P<c>\d\d:\d\d)$', rule)
        if not m:
            return None
        days = expand_days(m.group('days')) if m.group('days') else list(DAYS)
        if days is None:
            return None
        o, c = m.group('o'), m.group('c')
        if c <= o and c != '24:00':
            return None  # cruza medianoche o ambiguo: sin horario
        for d in days:
            by_day[d] = (o, c)
    if not by_day:
        return None
    sched = []
    for d in ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']:
        did = DAY_ID[d]
        if d in by_day:
            sched.append({'dayId': did, 'name': DAY_NAMES[did], 'closed': False,
                          'open': by_day[d][0], 'close': by_day[d][1]})
        else:
            sched.append({'dayId': did, 'name': DAY_NAMES[did], 'closed': True, 'open': None, 'close': None})
    return sched


def load_cache():
    if os.path.exists(CACHE):
        with open(CACHE, encoding='utf-8') as f:
            return json.load(f)
    return {}


def reverse_geocode(lat, lng, cache):
    key = f'{lat:.5f},{lng:.5f}'
    if key in cache:
        return cache[key]
    url = ('https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=16&addressdetails=1&accept-language=es'
           f'&lat={lat}&lon={lng}')
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            data = json.load(r)
    except Exception as e:  # noqa: BLE001
        print('  reverse falló:', key, e, file=sys.stderr)
        data = {}
    addr = data.get('address', {})
    res = {k: addr.get(k) for k in ('neighbourhood', 'suburb', 'quarter', 'city_district', 'municipality', 'county', 'city')}
    cache[key] = res
    with open(CACHE, 'w', encoding='utf-8') as f:
        json.dump(cache, f, ensure_ascii=False, indent=1)
    time.sleep(1.2)
    return res


def main():
    with open(OSM, encoding='utf-8') as f:
        elements = json.load(f)['elements']
    by_id = {e['type'][0] + str(e['id']): e for e in elements}
    cache = load_cache()
    cafes = []
    for n, key in enumerate(INCLUDE, start=1):
        ov = OVERRIDES.get(key, {})
        if key in EXTRA_NODES:
            base = EXTRA_NODES[key]
            lat, lng, name = base['lat'], base['lng'], base['name']
            tags, street = {}, base.get('address', '')
        else:
            e = by_id.get(key)
            if not e:
                print('  no está en OSM:', key, file=sys.stderr)
                continue
            tags = e.get('tags', {})
            lat = e.get('lat') or e['center']['lat']
            lng = e.get('lon') or e['center']['lon']
            name = tags.get('name')
            street = tags.get('addr:street', '')
        if not (BBOX[0] <= lat <= BBOX[2] and BBOX[1] <= lng <= BBOX[3]):
            print('  fuera de zona:', key, name, file=sys.stderr)
            continue
        geo = reverse_geocode(lat, lng, cache)
        hood = geo.get('neighbourhood') or geo.get('suburb') or geo.get('quarter') or geo.get('city_district') or 'Caracas'
        hood = HOOD_FIX.get(key, hood)
        cuisine = [c.strip() for c in tags.get('cuisine', '').split(';') if c.strip()]
        snacks = sorted({CUISINE_TO_SNACK[c] for c in cuisine if c in CUISINE_TO_SNACK})
        snacks = ov.get('snacks', snacks)
        street = re.sub(r'^\d+[ªº°]\s*', lambda m: m.group(0), street)
        cafe = {
            'id': n,
            'osm': key if key.startswith(('n', 'w')) and not key.startswith('nominatim') else None,
            'name': ov.get('name', name),
            'type': ov.get('type', 'cafeteria'),
            'typeConfirmed': ov.get('typeConfirmed', False),
            'neighborhood': hood,
            'address': (street + (', ' if street else '') + hood).strip(', '),
            'lat': round(lat, 6), 'lng': round(lng, 6),
            'schedule': parse_hours(tags.get('opening_hours')),
            'methods': ov.get('methods', []),
            'drinks': ov.get('drinks', []),
            'snacks': snacks,
            'description': ov.get('description', ''),
            'sources': ov.get('sources', []),
        }
        cafes.append(cafe)
        print(f"{n:>2} {cafe['name']:<34} {hood}")
    header = (
        '// GENERADO por scripts/build_data.py — no editar a mano (edita OVERRIDES en el script).\n'
        '// Posiciones y nombres: © colaboradores de OpenStreetMap (ODbL).\n'
        '// Tipo, métodos y snacks solo existen donde hay fuente; el resto queda vacío / sin confirmar.\n'
    )
    body = json.dumps(cafes, ensure_ascii=False, indent=2)
    with open(OUT, 'w', encoding='utf-8', newline='\n') as f:
        f.write(header + "'use strict';\n\nvar CAFES_DATA = " + body + ';\n')
    print(f'\n{len(cafes)} cafeterías -> {OUT}')


if __name__ == '__main__':
    main()
