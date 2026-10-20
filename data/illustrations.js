// ============================================================
//  Ilustraciones SVG propias (sin derechos de autor)
//  - METHOD_DIAGRAMS: flujo del agua y del café en cada método
//  - drinkSvg: corte de taza con las capas de cada bebida
//  - CAFE_FALLBACK_SVG: cafetería genérica para fichas sin foto
// ============================================================

'use strict';

var ILLUSTRATIONS = (function () {
  var LINE = '#4a2f1f', WATER = '#6fa8c9', COFFEE = '#3a2013', BREW = '#8a5a35', PAPER = '#efe3d0',
      MILK = '#efddbc', FOAM = '#fffaf0', CREMA = '#c68b4a', GLASS = '#fffdf9', METAL = '#d9c9b6', FLAME = '#e08a2c';
  var SW = 2;

  var sh = function (d, fill, extra) {
    return '<path d="' + d + '" fill="' + (fill || 'none') + '" stroke="' + LINE + '" stroke-width="' + SW + '" stroke-linejoin="round" stroke-linecap="round"' + (extra || '') + '/>';
  };
  var rect = function (x, y, w, h, fill, r) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (r || 0) + '" fill="' + fill + '" stroke="' + LINE + '" stroke-width="' + SW + '" stroke-linejoin="round"/>';
  };
  var blob = function (d, fill) { return '<path d="' + d + '" fill="' + fill + '"/>'; };
  var text = function (x, y, s, anchor) {
    return '<text x="' + x + '" y="' + y + '" font-size="9.5" font-weight="600" fill="' + LINE + '" text-anchor="' + (anchor || 'start') + '" font-family="Inter,system-ui,sans-serif">' + s + '</text>';
  };
  // Flecha con punta triangular, de (x1,y1) a (x2,y2)
  var arrow = function (x1, y1, x2, y2, color) {
    var c = color || WATER, dx = x2 - x1, dy = y2 - y1, len = Math.sqrt(dx * dx + dy * dy), ux = dx / len, uy = dy / len;
    var bx = x2 - ux * 7, by = y2 - uy * 7, px = -uy * 4, py = ux * 4;
    return '<path d="M' + x1 + ' ' + y1 + ' L' + bx + ' ' + by + '" stroke="' + c + '" stroke-width="2.4" stroke-linecap="round" fill="none"/>' +
      '<path d="M' + x2 + ' ' + y2 + ' L' + (bx + px) + ' ' + (by + py) + ' L' + (bx - px) + ' ' + (by - py) + ' Z" fill="' + c + '"/>';
  };
  var drip = function (x, y1, y2) { return '<path d="M' + x + ' ' + y1 + ' L' + x + ' ' + y2 + '" stroke="' + BREW + '" stroke-width="3" stroke-linecap="round"/>'; };
  var grounds = function (pts) {
    return pts.map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="1.8" fill="' + COFFEE + '"/>'; }).join('');
  };
  var cup = function (x, y, w, h, liquid) {
    var body = sh('M' + x + ' ' + y + ' h' + w + ' l-5 ' + (h - 6) + ' q-1 6 -7 6 h' + (-(w - 24)) + ' q-6 0 -7 -6 z', GLASS);
    var fill = liquid ? '<path d="M' + (x + 2) + ' ' + (y + 5) + ' h' + (w - 4) + ' l-3.6 ' + (h - 12) + ' q-1 5 -6 5 h' + (-(w - 25)) + ' q-5 0 -6 -5 z" fill="' + liquid + '"/>' : '';
    return fill + body;
  };
  var svg = function (label, inner) {
    return '<svg viewBox="0 0 240 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + label + '">' + inner + '</svg>';
  };

  var diagrams = {
    'Espresso': svg('Diagrama del espresso: agua a presión atraviesa el café molido y cae en la taza',
      rect(80, 8, 80, 16, METAL, 3) +
      arrow(120, 26, 120, 46) + text(164, 36, 'Agua a 9 bares') +
      sh('M92 48 h56 l-6 28 h-44 z', METAL) + rect(96, 52, 48, 16, COFFEE, 2) + text(8, 64, 'Café molido fino') +
      drip(120, 78, 104) +
      cup(98, 100, 44, 34, BREW) + rect(102, 106, 36, 4, CREMA, 1) + sh('M88 140 h64') + text(8, 124, 'Espresso con crema')),

    'Guayoyo': svg('Diagrama del guayoyo: agua caliente pasa por un colador de tela y cae en la taza',
      arrow(98, 8, 106, 32) + arrow(120, 6, 120, 30) + arrow(142, 8, 134, 32) + text(166, 20, 'Agua caliente') +
      '<ellipse cx="120" cy="40" rx="34" ry="5" fill="' + METAL + '" stroke="' + LINE + '" stroke-width="' + SW + '"/>' +
      sh('M86 40 L113 100 Q120 108 127 100 L154 40', PAPER) + blob('M94 50 L146 50 L127 94 Q120 100 113 94 Z', COFFEE) +
      text(158, 74, 'Colador de tela') +
      drip(120, 104, 120) +
      cup(98, 118, 44, 30, BREW) + text(150, 136, 'Café ligero')),

    'V60': svg('Diagrama del V60: agua vertida en círculos atraviesa el café y el filtro de papel',
      arrow(104, 6, 108, 26) + arrow(122, 4, 122, 24) + arrow(138, 6, 134, 26) + text(146, 14, 'Agua en círculos') +
      sh('M80 38 H160 L128 94 H112 Z', PAPER) + blob('M90 44 H150 L127 86 H113 Z', COFFEE) +
      text(166, 62, 'Filtro de papel') +
      drip(120, 96, 112) +
      sh('M96 100 h48 v34 q0 8 -8 8 h-32 q-8 0 -8 -8 z', GLASS) + blob('M98 124 h44 v10 q0 6 -6 6 h-32 q-6 0 -6 -6 z', BREW) +
      text(166, 130, 'Taza limpia')),

    'Chemex': svg('Diagrama de la Chemex: agua atraviesa el café y un filtro grueso hacia el matraz',
      arrow(120, 4, 120, 24) + text(166, 14, 'Agua') +
      sh('M84 30 H156 L128 82 L156 128 Q156 138 146 138 H94 Q84 138 84 128 L112 82 Z', GLASS) +
      blob('M89 32 H151 L124 78 H116 Z', PAPER) + blob('M96 36 H144 L124 70 H116 Z', COFFEE) +
      blob('M86 122 H154 L156 128 Q156 136 146 136 H94 Q84 136 84 128 Z', BREW) +
      rect(108, 80, 24, 10, '#c8965a', 2) +
      text(166, 52, 'Filtro grueso') + text(166, 128, 'Café limpio')),

    'AeroPress': svg('Diagrama de la AeroPress: el émbolo empuja el agua y el café a través del filtro hacia la taza',
      arrow(70, 14, 70, 56) + text(8, 12, 'Presión suave') +
      rect(96, 14, 48, 8, METAL, 2) + rect(106, 22, 28, 38, METAL, 2) +
      rect(100, 44, 40, 56, GLASS, 3) + blob('M102 62 H138 V98 H102 Z', BREW) + grounds([[110, 80], [120, 90], [130, 72], [124, 66], [114, 94], [132, 88]]) +
      rect(98, 100, 44, 7, PAPER, 1) + drip(120, 108, 124) +
      cup(96, 124, 48, 28, BREW) +
      text(150, 24, 'Émbolo') + text(150, 78, 'Café + agua') + text(150, 106, 'Filtro de papel')),

    'Prensa francesa': svg('Diagrama de la prensa francesa: el café reposa en el agua y el émbolo con malla lo separa',
      '<path d="M88 52 q-22 0 -22 24 q0 24 22 24" fill="none" stroke="' + LINE + '" stroke-width="' + SW + '"/>' +
      rect(88, 36, 64, 98, GLASS, 4) + blob('M90 58 H150 V130 H90 Z', BREW) +
      grounds([[100, 112], [112, 120], [126, 108], [138, 118], [104, 98], [132, 100], [118, 124], [142, 126], [98, 124]]) +
      '<path d="M120 8 V72" stroke="' + LINE + '" stroke-width="' + SW + '" stroke-linecap="round"/><circle cx="120" cy="8" r="5" fill="' + METAL + '" stroke="' + LINE + '" stroke-width="' + SW + '"/>' +
      rect(90, 70, 60, 5, METAL, 2) +
      arrow(168, 34, 168, 66, LINE) + text(158, 26, 'Presionar') + text(158, 100, 'En inmersión')),

    'Moka': svg('Diagrama de la greca: el vapor empuja el agua hacia arriba, a través del café, hasta la cámara superior',
      sh('M90 46 H150 L144 94 H96 Z', GLASS) + sh('M92 46 L120 36 L148 46') +
      sh('M150 52 q20 0 20 20 q0 18 -8 22', 'none') +
      blob('M100 84 H140 L139 92 H101 Z', BREW) +
      rect(100, 96, 40, 14, COFFEE, 2) +
      sh('M96 112 H144 L140 140 H100 Z', GLASS) + blob('M101.5 126 H138.5 L140 140 H100 Z', WATER) +
      arrow(120, 94, 120, 62, BREW) +
      '<path d="M112 152 q8 -14 8 -4 q4 -8 8 4 z" fill="' + FLAME + '"/>' +
      text(4, 64, 'Café sube') + text(4, 104, 'Café molido') + text(4, 132, 'Agua + calor')),

    'Cold Brew': svg('Diagrama del cold brew: café grueso en agua fría durante 12 a 24 horas',
      rect(80, 28, 80, 10, METAL, 3) + rect(84, 38, 72, 96, GLASS, 8) + blob('M86 54 H154 V126 Q154 132 148 132 H92 Q86 132 86 126 Z', BREW) +
      rect(104, 60, 32, 42, COFFEE, 8) + '<path d="M120 60 V46" stroke="' + LINE + '" stroke-width="' + SW + '"/>' +
      grounds([[96, 112], [112, 118], [128, 114], [144, 120], [100, 124], [136, 106]]) +
      '<circle cx="196" cy="66" r="18" fill="' + GLASS + '" stroke="' + LINE + '" stroke-width="' + SW + '"/><path d="M196 66 V54 M196 66 L204 70" stroke="' + LINE + '" stroke-width="' + SW + '" stroke-linecap="round" fill="none"/>' +
      text(196, 98, '12–24 h', 'middle') + text(8, 82, 'Café grueso') + text(8, 120, 'Agua fría') + text(196, 118, 'Sin calor', 'middle')),

    'Sifón': svg('Diagrama del sifón: el vapor sube el agua a la cámara superior, mezcla con el café y al enfriar baja filtrada',
      rect(96, 18, 48, 52, GLASS, 8) + blob('M98 38 H142 V68 H98 Z', BREW) + grounds([[108, 50], [120, 58], [132, 46], [126, 62], [110, 62]]) +
      rect(116, 70, 8, 34, GLASS, 1) + arrow(120, 98, 120, 76, WATER) +
      sh('M92 120 A28 28 0 0 0 148 120 A28 28 0 0 0 92 120 Z', GLASS) + blob('M92 120 A28 28 0 0 0 148 120 Z', WATER) +
      '<path d="M112 156 q8 -16 8 -4 q4 -8 8 4 z" fill="' + FLAME + '"/>' +
      text(152, 44, 'Café + agua') + text(152, 90, 'Vapor sube') + text(152, 126, 'Agua + calor'))
  };

  // ── Bebidas: cortes de taza por capas (de arriba abajo) ──────
  var LAYER = {
    espresso: { color: COFFEE, label: 'Espresso' }, crema: { color: CREMA, label: 'Crema' }, milk: { color: MILK, label: 'Leche' },
    foam: { color: FOAM, label: 'Espuma' }, water: { color: '#8a6a4a', label: 'Agua caliente' },
    mix: { color: '#a97b52', label: 'Café con leche' }, mixlight: { color: '#c9a37a', label: 'Café con leche' }, black: { color: '#4b2c1a', label: 'Café colado' },
  };
  var DRINKS = {
    'Café con leche': { shape: 'mug', layers: [['foam', 8], ['mixlight', 92]] },
    'Marrón':         { shape: 'cup', layers: [['mix', 100]] },
    'Negrito':        { shape: 'small', layers: [['crema', 10], ['espresso', 90]] },
    'Guayoyo':        { shape: 'mug', layers: [['black', 100]] },
    'Cappuccino':     { shape: 'cup', layers: [['foam', 34], ['milk', 33], ['espresso', 33]] },
    'Latte':          { shape: 'glass', layers: [['foam', 12], ['milk', 66], ['espresso', 22]] },
    'Flat white':     { shape: 'cup', layers: [['foam', 8], ['milk', 62], ['espresso', 30]] },
    'Americano':      { shape: 'mug', layers: [['crema', 6], ['water', 64], ['espresso', 30]] },
  };
  var SHAPES = {
    // x, y (borde superior), ancho arriba, ancho abajo, alto interior
    cup:   { x: 50, y: 46, w: 100, b: 64, h: 62, handle: true },
    mug:   { x: 52, y: 40, w: 96, b: 78, h: 74, handle: true },
    small: { x: 66, y: 66, w: 68, b: 46, h: 42, handle: true },
    glass: { x: 62, y: 34, w: 76, b: 60, h: 82, handle: false },
  };

  function drinkSvg(name) {
    var d = DRINKS[name];
    if (!d) return '';
    var s = SHAPES[d.shape], x2 = s.x + s.w, inset = (s.w - s.b) / 2, bottom = s.y + s.h;
    var outline = 'M' + s.x + ' ' + s.y + ' H' + x2 + ' L' + (x2 - inset) + ' ' + (bottom - 8) + ' Q' + (x2 - inset - 2) + ' ' + bottom + ' ' + (x2 - inset - 10) + ' ' + bottom +
      ' H' + (s.x + inset + 10) + ' Q' + (s.x + inset + 2) + ' ' + bottom + ' ' + (s.x + inset) + ' ' + (bottom - 8) + ' Z';
    var clipId = 'clip-' + name.replace(/[^a-z]/gi, '');
    var yy = s.y, layers = '';
    d.layers.forEach(function (l) {
      var h = s.h * l[1] / 100;
      layers += '<rect x="' + (s.x - 2) + '" y="' + yy + '" width="' + (s.w + 4) + '" height="' + (h + 0.5) + '" fill="' + LAYER[l[0]].color + '"/>';
      yy += h;
    });
    var handle = s.handle ? '<path d="M' + x2 + ' ' + (s.y + 12) + ' q26 0 26 22 q0 22 -22 24" fill="none" stroke="' + LINE + '" stroke-width="' + (SW + 1) + '" stroke-linecap="round"/>' : '';
    var saucer = '<ellipse cx="100" cy="' + (bottom + 8) + '" rx="' + (s.w / 2 + 18) + '" ry="5" fill="' + METAL + '" stroke="' + LINE + '" stroke-width="' + SW + '"/>';
    return '<svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Corte de taza de ' + name + ': ' +
      d.layers.map(function (l) { return LAYER[l[0]].label.toLowerCase(); }).join(', ') + '">' +
      '<defs><clipPath id="' + clipId + '"><path d="' + outline + '"/></clipPath></defs>' +
      saucer + handle + '<g clip-path="url(#' + clipId + ')">' + layers + '</g>' +
      '<path d="' + outline + '" fill="none" stroke="' + LINE + '" stroke-width="' + (SW + 1) + '" stroke-linejoin="round"/></svg>';
  }
  function drinkLegend(name) {
    var d = DRINKS[name];
    return d ? d.layers.map(function (l) { return { label: LAYER[l[0]].label, color: LAYER[l[0]].color }; }) : [];
  }

  // ── Cafetería genérica para fichas sin foto (colores por CSS: --fb-accent, --fb-wall) ──
  var stripes = '';
  for (var i = 0; i < 8; i++) {
    stripes += '<path d="M' + (50 + i * 37.5) + ' 78 h37.5 l-3 30 q-15.75 10 -31.5 0 z" fill="' + (i % 2 ? '#fffdf9' : 'var(--fb-accent,#c47a3d)') + '"/>';
  }
  var storefront =
    '<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Ilustración de una cafetería">' +
    '<rect width="400" height="250" fill="var(--fb-sky,#f1e4d3)"/>' +
    '<rect x="0" y="206" width="400" height="44" fill="#d9c9b6"/>' +
    '<rect x="46" y="64" width="308" height="146" fill="var(--fb-wall,#fffdf9)" stroke="' + LINE + '" stroke-width="3"/>' +
    stripes +
    '<path d="M50 78 H350" stroke="' + LINE + '" stroke-width="3"/>' +
    '<rect x="150" y="38" width="100" height="28" rx="6" fill="' + LINE + '"/>' +
    '<text x="200" y="58" text-anchor="middle" font-size="17" font-weight="700" letter-spacing="3" fill="#fffdf9" font-family="Fraunces,Georgia,serif">CAFÉ</text>' +
    '<rect x="64" y="124" width="84" height="64" rx="4" fill="#cfe3ea" stroke="' + LINE + '" stroke-width="3"/>' +
    '<rect x="252" y="124" width="84" height="64" rx="4" fill="#cfe3ea" stroke="' + LINE + '" stroke-width="3"/>' +
    '<path d="M106 156 h22 v10 a10 10 0 0 1 -10 10 h-2 a10 10 0 0 1 -10 -10 z M128 160 h4 a4 4 0 0 1 0 9 h-4" fill="none" stroke="' + LINE + '" stroke-width="2.5" stroke-linejoin="round"/>' +
    '<path d="M274 156 h22 v10 a10 10 0 0 1 -10 10 h-2 a10 10 0 0 1 -10 -10 z M296 160 h4 a4 4 0 0 1 0 9 h-4" fill="none" stroke="' + LINE + '" stroke-width="2.5" stroke-linejoin="round"/>' +
    '<rect x="172" y="120" width="56" height="90" rx="4" fill="var(--fb-accent,#c47a3d)" stroke="' + LINE + '" stroke-width="3"/>' +
    '<rect x="180" y="130" width="40" height="38" rx="3" fill="#cfe3ea" stroke="' + LINE + '" stroke-width="2"/>' +
    '<circle cx="219" cy="186" r="3" fill="#fffdf9"/>' +
    '<circle cx="24" cy="204" r="14" fill="#7fa37a"/><rect x="21" y="204" width="6" height="12" fill="' + LINE + '"/>' +
    '<circle cx="378" cy="204" r="12" fill="#7fa37a"/><rect x="375" y="204" width="6" height="10" fill="' + LINE + '"/>' +
    '</svg>';

  return { METHOD_DIAGRAMS: diagrams, drinkSvg: drinkSvg, drinkLegend: drinkLegend, CAFE_FALLBACK_SVG: storefront, DRINK_NAMES: Object.keys(DRINKS) };
})();
