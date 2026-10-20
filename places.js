// ============================================================
//  Horarios y datos extra para las fichas
//  - parseOsmHours: convierte `opening_hours` simples de OpenStreetMap
//  - enrichFromGoogle: horario/valoración desde Google Places (opcional, requiere clave en config.js)
// ============================================================

'use strict';

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const OSM_DAY_ID = { Su: 0, Mo: 1, Tu: 2, We: 3, Th: 4, Fr: 5, Sa: 6 };
const OSM_DAY_ORDER = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function expandOsmDays(spec) {
  const out = [];
  for (const part of spec.split(',').map(s => s.trim()).filter(Boolean)) {
    if (part === 'PH' || part === 'SH') continue;   // feriados y vacaciones: se ignoran
    const [a, b] = part.split('-').map(s => s.trim());
    const i = OSM_DAY_ORDER.indexOf(a);
    const j = b ? OSM_DAY_ORDER.indexOf(b) : i;
    if (i < 0 || j < 0) return null;
    for (let k = i; ; k = (k + 1) % 7) { out.push(OSM_DAY_ORDER[k]); if (k === j) break; }
  }
  return out;
}

function scheduleFromByDay(byDay) {
  // byDay: dayId -> [[abre, cierra], ...]; los días sin entrada quedan cerrados. Orden: lunes → domingo.
  // open/close son el primer y el último tramo; `ranges` solo existe con turno partido.
  return [1, 2, 3, 4, 5, 6, 0].map(dayId => {
    const r = byDay[dayId];
    const day = { dayId, name: DAY_NAMES[dayId], closed: !r, open: r ? r[0][0] : null, close: r ? r[r.length - 1][1] : null };
    if (r && r.length > 1) day.ranges = r;
    return day;
  });
}

// Abierto las 24 h, los 7 días ("24/7" en OSM; un único periodo sin cierre en Google)
const ALL_DAYS_24H = Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map(d => [d, [['00:00', '24:00']]]));

const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };

// Un tramo "18:00-02:00" cruza la medianoche: el cierre pasa a 26:00. Más de 16 h abierto se considera dato dudoso.
function normalizeRange(o, c) {
  let close = c;
  if (toMin(c) <= toMin(o) && c !== '24:00') {
    const h = Number(c.slice(0, 2)) + 24;
    close = pad2(h) + c.slice(2);
  }
  return toMin(close) - toMin(o) <= 16 * 60 ? [o, close] : null;
}

// Patrones simples ("Mo-Fr 08:00-18:00; Sa 09:00-12:00,14:00-18:00"); lo ambiguo devuelve null (sin horario).
function parseOsmHours(oh) {
  if (!oh) return null;
  if (oh.trim() === '24/7') return scheduleFromByDay(ALL_DAYS_24H);
  const byDay = {};
  for (const rule of oh.split(';').map(r => r.trim()).filter(Boolean)) {
    if (/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/.test(rule) || rule.endsWith('off')) continue;
    const m = rule.match(/^(?:([A-Za-z, \-]+?)\s+)?(\d\d:\d\d-\d\d:\d\d(?:\s*,\s*\d\d:\d\d-\d\d:\d\d)*)$/);
    if (!m) return null;
    const days = m[1] ? expandOsmDays(m[1]) : OSM_DAY_ORDER;
    if (!days || !days.length) return null;
    const ranges = m[2].split(',').map(t => normalizeRange(...t.trim().split('-')));
    if (ranges.some(r => !r)) return null;
    days.forEach(d => { byDay[OSM_DAY_ID[d]] = ranges; });
  }
  return Object.keys(byDay).length ? scheduleFromByDay(byDay) : null;
}

// ── Enlaces oficiales de cada local (de las etiquetas de OpenStreetMap: contact:instagram, website…) ──
// Mismas reglas que scripts/build_links.py. Solo se enlaza a la cuenta del local; no se copian fotos.
function instagramUrl(value) {
  if (!value) return null;
  const v = String(value).trim();
  const m = v.match(/^https?:\/\/(?:www\.)?instagram\.com\/([A-Za-z0-9._]{1,30})\/?(?:[?#].*)?$/i);
  const user = m ? m[1] : v.replace(/^@/, '');
  if (!/^[A-Za-z0-9._]{1,30}$/.test(user) || ['p', 'reel', 'explore', 'accounts'].includes(user.toLowerCase())) return null;
  return `https://www.instagram.com/${user}/`;
}
function webUrl(value) {
  if (!value) return null;
  let v = String(value).trim();
  if (!/^https?:\/\//i.test(v)) v = 'https://' + v;
  return /instagram\.com/i.test(v) || !/^https?:\/\/[^\s]+\.[^\s]+$/.test(v) ? null : v;
}
function linksFromTags(t) {
  const ig = instagramUrl(t['contact:instagram'] || t.instagram) || (/instagram\.com/i.test(t.website || '') ? instagramUrl(t.website) : null);
  const web = webUrl(t.website || t['contact:website']);
  const out = {};
  if (ig) out.instagram = ig;
  if (web) out.website = web;
  return out;
}

// ── Google Places (API "Places API (New)") ───────────────────
const GOOGLE_CONFIG = window.CAFECITO_CONFIG || {};
const GOOGLE_KEY = GOOGLE_CONFIG.googlePlacesKey || '';
let GOOGLE_ENABLED = Boolean(GOOGLE_KEY);   // se apaga solo si Google rechaza la clave, para no repetir llamadas fallidas
// Foto + enlace (plan "Pro") y, si googlePlacesDetails no es false, también horario, valoración, web y teléfono (plan "Enterprise", más caro).
// Se pide solo al abrir una ficha. La tarifa de la consulta es la del campo más caro que incluya.
const GOOGLE_FIELDS = ['places.displayName', 'places.location', 'places.googleMapsUri', 'places.photos']
  .concat(GOOGLE_CONFIG.googlePlacesDetails === false ? [] : ['places.regularOpeningHours', 'places.rating', 'places.userRatingCount', 'places.websiteUri', 'places.nationalPhoneNumber'])
  .join(',');
const GOOGLE_MATCH_METERS = 150;
const GOOGLE_CACHE_MS = 30 * 60 * 1000;   // Google no permite guardar nombres de foto: solo se reutilizan un rato dentro de la sesión
const googleCache = new Map();   // id -> { t, data }

// Los enlaces que devuelve Google se usan en href: solo se aceptan http(s) (descarta javascript: y similares)
const safeUrl = (u) => (typeof u === 'string' && /^https?:\/\//i.test(u)) ? u : null;

const pad2 = (n) => String(n).padStart(2, '0');

function scheduleFromGoogle(periods) {
  if (!periods || !periods.length) return null;
  // Abierto 24 h: un único periodo sin cierre
  if (periods.length === 1 && !periods[0].close) {
    return scheduleFromByDay(ALL_DAYS_24H);
  }
  const byDay = {};
  for (const p of periods) {
    if (!p.open || !p.close) continue;
    const day = p.open.day;
    const open = `${pad2(p.open.hour || 0)}:${pad2(p.open.minute || 0)}`;
    const extra = p.close.day !== day ? 24 : 0;   // cierra después de medianoche
    const close = `${pad2((p.close.hour || 0) + extra)}:${pad2(p.close.minute || 0)}`;
    (byDay[day] = byDay[day] || []).push([open, close]);
  }
  Object.values(byDay).forEach(r => r.sort((a, b) => a[0].localeCompare(b[0])));
  return Object.keys(byDay).length ? scheduleFromByDay(byDay) : null;
}

// Foto de Google: Google exige mostrar la atribución de su autor junto a la imagen.
function googlePhoto(p) {
  if (!p || !p.name) return null;
  const a = (p.authorAttributions || [])[0];
  return {
    src: `https://places.googleapis.com/v1/${p.name}/media?maxWidthPx=900&maxHeightPx=600&key=${encodeURIComponent(GOOGLE_KEY)}`,
    author: a ? a.displayName : 'Google Maps',
    authorUrl: a ? safeUrl(a.uri) : null,
  };
}

// Un lugar de Google solo se acepta si su nombre se parece al del local (una foto equivocada es peor que el dibujo).
const GENERIC_WORDS = new Set(['cafe', 'cafeteria', 'coffee', 'caracas', 'de', 'la', 'el', 'los', 'las', 'del', 'y', 'the', 'and', 'shop', 'deli']);
const nameTokens = (n) => String(n || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .split(/[^a-z0-9]+/).filter(t => t.length > 1 && !GENERIC_WORDS.has(t));
function editDistance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0]; row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[b.length];
}
function namesMatch(mine, theirs) {
  const a = nameTokens(mine), b = nameTokens(theirs);
  if (!a.length || !b.length) return false;   // nombres solo genéricos («Café»): no hay base para asegurar que sea el mismo
  return a.some(x => b.some(y => x === y || (Math.min(x.length, y.length) >= 4 && editDistance(x, y) <= 1)));
}

function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000, rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad, dLng = (lng2 - lng1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Devuelve { schedule, rating, ratingCount, mapsUri, phone, website, photo } o null si Google no tiene ese local (cerca y con nombre parecido).
async function enrichFromGoogle(cafe) {
  if (!GOOGLE_ENABLED) return null;
  const cached = googleCache.get(cafe.id);
  if (cached && Date.now() - cached.t < GOOGLE_CACHE_MS) return cached.data;
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': GOOGLE_KEY, 'X-Goog-FieldMask': GOOGLE_FIELDS },
    body: JSON.stringify({
      textQuery: `${cafe.name} Caracas`,
      languageCode: 'es',
      regionCode: 'VE',
      pageSize: 5,
      locationBias: { circle: { center: { latitude: cafe.lat, longitude: cafe.lng }, radius: 200 } },
    }),
  });
  if (!res.ok) {
    if (res.status === 400 || res.status === 403) {
      GOOGLE_ENABLED = false;
      console.error(`[Cafecito] Google Places respondió ${res.status}: revisa la clave en config.js (API activada, facturación y restricción de dominio). Se desactiva en esta sesión.`);
    }
    throw new Error('Google Places HTTP ' + res.status);
  }
  const places = (await res.json()).places || [];
  const near = places
    .filter(p => p.location && namesMatch(cafe.name, p.displayName && p.displayName.text))
    .map(p => ({ p, d: distanceMeters(cafe.lat, cafe.lng, p.location.latitude, p.location.longitude) }))
    .filter(x => x.d <= GOOGLE_MATCH_METERS)
    .sort((a, b) => a.d - b.d)[0];
  const out = near ? {
    schedule: scheduleFromGoogle(near.p.regularOpeningHours && near.p.regularOpeningHours.periods),
    rating: near.p.rating || null,
    ratingCount: near.p.userRatingCount || 0,
    mapsUri: safeUrl(near.p.googleMapsUri),
    phone: near.p.nationalPhoneNumber || null,
    website: safeUrl(near.p.websiteUri),
    photo: googlePhoto(near.p.photos && near.p.photos[0]),
  } : null;
  googleCache.set(cafe.id, { t: Date.now(), data: out });
  return out;
}
