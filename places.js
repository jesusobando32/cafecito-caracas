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
  if (oh.trim() === '24/7') return scheduleFromByDay(Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map(d => [d, [['00:00', '24:00']]])));
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

// ── Google Places (API "Places API (New)") ───────────────────
const GOOGLE_KEY = (window.CAFECITO_CONFIG && window.CAFECITO_CONFIG.googlePlacesKey) || '';
const GOOGLE_ENABLED = Boolean(GOOGLE_KEY);
// Ojo: pedir horario, valoración o fotos sube la tarifa de la consulta (SKU "Enterprise"); por eso solo se hace al abrir una ficha.
const GOOGLE_FIELDS = 'places.location,places.regularOpeningHours,places.rating,places.userRatingCount,places.googleMapsUri,places.nationalPhoneNumber,places.websiteUri,places.photos';
const GOOGLE_MATCH_METERS = 150;
const googleCache = new Map();   // id -> datos | null (por sesión; evita repetir llamadas de pago)

const pad2 = (n) => String(n).padStart(2, '0');

function scheduleFromGoogle(periods) {
  if (!periods || !periods.length) return null;
  // Abierto 24 h: un único periodo sin cierre
  if (periods.length === 1 && !periods[0].close) {
    return scheduleFromByDay(Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map(d => [d, [['00:00', '24:00']]])));
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
    authorUrl: a ? a.uri : null,
  };
}

function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000, rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad, dLng = (lng2 - lng1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Devuelve { schedule, rating, ratingCount, mapsUri, phone, website } o null si no hay coincidencia.
async function enrichFromGoogle(cafe) {
  if (!GOOGLE_ENABLED) return null;
  if (googleCache.has(cafe.id)) return googleCache.get(cafe.id);
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': GOOGLE_KEY, 'X-Goog-FieldMask': GOOGLE_FIELDS },
    body: JSON.stringify({
      textQuery: `${cafe.name} Caracas`,
      languageCode: 'es',
      maxResultCount: 5,
      locationBias: { circle: { center: { latitude: cafe.lat, longitude: cafe.lng }, radius: 200 } },
    }),
  });
  if (!res.ok) throw new Error('Google Places HTTP ' + res.status);
  const places = (await res.json()).places || [];
  const near = places
    .map(p => ({ p, d: distanceMeters(cafe.lat, cafe.lng, p.location.latitude, p.location.longitude) }))
    .filter(x => x.d <= GOOGLE_MATCH_METERS)
    .sort((a, b) => a.d - b.d)[0];
  const out = near ? {
    schedule: scheduleFromGoogle(near.p.regularOpeningHours && near.p.regularOpeningHours.periods),
    rating: near.p.rating || null,
    ratingCount: near.p.userRatingCount || 0,
    mapsUri: near.p.googleMapsUri || null,
    phone: near.p.nationalPhoneNumber || null,
    website: near.p.websiteUri || null,
    photo: googlePhoto(near.p.photos && near.p.photos[0]),
  } : null;
  googleCache.set(cafe.id, out);
  return out;
}
