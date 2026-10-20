// ============================================================
//  CAFECITO CARACAS — Vue 3 + Leaflet
//  Buscador de cafeterías de Caracas (Caricuao → Petare, La Trinidad, El Hatillo)
// ============================================================

'use strict';

if (typeof Vue === 'undefined') throw new Error('[Cafecito] Vue 3 no cargó. Revisa los <script> de index.html');
if (typeof L === 'undefined') throw new Error('[Cafecito] Leaflet no cargó. Revisa los <script> de index.html');
if (typeof CAFES_DATA === 'undefined' || !Array.isArray(CAFES_DATA)) {
  throw new Error('[Cafecito] CAFES_DATA no existe. data/cafes.js debe cargar antes que app.js');
}

const { createApp, ref, reactive, computed, watch, nextTick, shallowRef, onMounted, onUnmounted } = Vue;

// ── Constantes ───────────────────────────────────────────────
const REPO_URL = 'https://github.com/jesusobando32/cafecito-caracas';
const CUP_SVG = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9z"/><path d="M16 10h2a2.5 2.5 0 0 1 0 5h-2"/><path d="M8 3v2M12 3v2"/></svg>';
// CARTO ahora exige API key (sus tiles devuelven un aviso); OSM estándar es gratuito con atribución (uso ligero).
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
// Mapa base claro y sin ruido: OpenFreeMap "Positron" (vectorial, gratis y sin clave). Si WebGL o el estilo fallan, se usa OSM raster.
const BASE_STYLE = 'https://tiles.openfreemap.org/styles/positron';
const BASE_ATTRIBUTION = '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> © <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> · Datos de <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';
const SHEET_HALF = 0.52;   // fracción de la altura que ocupa el panel móvil en estado "half"
const isMobile = () => window.matchMedia('(max-width: 860px)').matches;
function hasWebGL() {
  try { const c = document.createElement('canvas'); return Boolean(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; }
}
// MapLibre pesa ~800 KB: se descarga después de pintar la app para no retrasar la lista y los filtros
const MAPLIBRE_CSS = 'https://cdn.jsdelivr.net/npm/maplibre-gl@4.7.1/dist/maplibre-gl.css';
const MAPLIBRE_JS = 'https://cdn.jsdelivr.net/npm/maplibre-gl@4.7.1/dist/maplibre-gl.js';
const MAPLIBRE_LEAFLET_JS = 'https://cdn.jsdelivr.net/npm/@maplibre/maplibre-gl-leaflet@0.0.22/leaflet-maplibre-gl.js';
let mapLibreReady = null;
function loadMapLibre() {
  if (window.maplibregl && L.maplibreGL) return Promise.resolve();
  if (!mapLibreReady) {
    const script = (src) => new Promise((resolve, reject) => {
      const el = document.createElement('script');
      el.src = src; el.onload = resolve; el.onerror = () => reject(new Error('No cargó ' + src));
      document.head.appendChild(el);
    });
    const css = document.createElement('link');
    css.rel = 'stylesheet'; css.href = MAPLIBRE_CSS; document.head.appendChild(css);
    mapLibreReady = script(MAPLIBRE_JS).then(() => script(MAPLIBRE_LEAFLET_JS));
  }
  return mapLibreReady;
}
function addBaseLayer(m) {
  const raster = () => L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19, className: 'base-tiles' }).addTo(m);
  if (!hasWebGL()) { raster(); return; }
  loadMapLibre().then(() => {
    if (!m._container || !m._container.isConnected) return;   // el mapa se destruyó mientras cargaba
    const gl = L.maplibreGL({ style: BASE_STYLE, attribution: BASE_ATTRIBUTION }).addTo(m);
    const mgl = gl.getMaplibreMap();
    let fellBack = false;
    mgl.on('error', () => {
      if (fellBack || mgl.isStyleLoaded()) return;
      fellBack = true; m.removeLayer(gl); raster();
    });
  }).catch(raster);
}
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const TYPE_INFO = {
  especialidad: { label: 'Café de especialidad', short: 'Especialidad' },
  cafeteria:    { label: 'Cafetería',            short: 'Cafetería' },
};
const TYPE_OPTIONS = ['cafeteria', 'especialidad'];

// Lecturas de la guía, en orden. Los artículos salen de WIKI_DATA.articles; el resto se renderiza a medida.
// Menú superior: las secciones más usadas de la guía van directas; «Guía» abre la portada con todas las lecturas.
const NAV = [
  { id: 'mapa', label: 'Mapa', href: './' },
  { id: 'historia', label: 'Historia', topic: 'historia', href: '#guia/historia' },
  { id: 'metodos', label: 'Métodos', topic: 'metodos', href: '#guia/metodos' },
  { id: 'bebidas', label: 'Bebidas', topic: 'bebidas', href: '#guia/bebidas' },
  { id: 'guia', label: 'Guía', topic: null, href: '#guia' },
];
const NAV_DIRECT_TOPICS = ['historia', 'metodos', 'bebidas'];

const LEARN_EXTRA = {
  metodos:  { title: 'Métodos de preparación', lead: 'Las formas más comunes de preparar café en una cafetería o en casa.' },
  bebidas:  { title: 'Bebidas', lead: 'Del guayoyo de casa al flat white de especialidad.' },
  glosario: { title: 'Glosario', lead: 'Palabras que verás en las cartas y en las bolsas de café.' },
};
// Imágenes de cada lectura (ids de data/images.js). Lo que no tiene foto libre queda solo con dibujo.
const LEARN_HERO = { historia: 'hero-historia', regiones: 'hero-regiones', especialidad: 'hero-especialidad', tipo: 'hero-tipo' };
const LEARN_SECTION_IMAGES = { historia: { 2: 'sec-venezuela', 3: 'sec-auge' }, especialidad: { 1: 'sec-cereza', 3: 'sec-tueste' } };
const METHOD_IMAGES = {
  'Espresso': 'm-espresso', 'V60': 'm-v60', 'Chemex': 'm-chemex', 'AeroPress': 'm-aeropress',
  'Prensa francesa': 'm-prensa', 'Moka': 'm-moka', 'Cold Brew': 'm-coldbrew', 'Sifón': 'm-sifon',
};
const DRINK_IMAGES = {
  'Café con leche': 'd-conleche', 'Negrito': 'd-negrito', 'Guayoyo': 'd-guayoyo', 'Cappuccino': 'd-cappuccino',
  'Latte': 'd-latte', 'Flat white': 'd-flatwhite', 'Americano': 'd-americano',
};
const CREDITS = Object.entries(IMAGES).map(([id, img]) => ({ id, ...img }));

// Aparición al hacer scroll: añade .is-in cuando el elemento entra en pantalla (v-reveal="retraso_ms"). Sin animación si el usuario pide menos movimiento.
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealObserver = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); revealObserver.unobserve(e.target); } });
}, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }) : null;
const vReveal = {
  mounted(el, binding) {
    el.classList.add('reveal');
    if (binding.value) el.style.setProperty('--d', binding.value + 'ms');
    if (!revealObserver || prefersReducedMotion()) el.classList.add('is-in'); else revealObserver.observe(el);
  },
  unmounted(el) { if (revealObserver) revealObserver.unobserve(el); },
};

// Foto con pie de crédito (autor, licencia y fuente salen de data/images.js)
const Fig = {
  props: { id: String, sizes: { type: String, default: '100vw' }, eager: Boolean, dark: Boolean },
  computed: {
    img() { return IMAGES[this.id] || null; },
    srcset() { return this.img.widths.map(w => `${this.img.src}-${w}.jpg ${w}w`).join(', '); },
    src() { return `${this.img.src}-${this.img.widths[this.img.widths.length - 1]}.jpg`; },
    width() { return this.img.widths[0]; },
    height() { return Math.round(this.img.widths[0] / this.img.ratio); },
  },
  template: `
    <figure v-if="img" class="fig" :class="{ 'fig-dark': dark }">
      <img :src="src" :srcset="srcset" :sizes="sizes" :alt="img.alt" :width="width" :height="height"
           :loading="eager ? 'eager' : 'lazy'" decoding="async" />
      <figcaption>
        Foto: {{ img.author }} ·
        <a :href="img.licenseUrl" target="_blank" rel="noopener">{{ img.license }}</a> ·
        <a :href="img.source" target="_blank" rel="noopener">Wikimedia Commons</a>
      </figcaption>
    </figure>`,
};

const LEARN_TOPICS = ['historia', 'regiones', 'especialidad', 'tipo', 'metodos', 'bebidas', 'glosario'].map((id, i) => {
  const article = WIKI_DATA.articles.find(a => a.id === id);
  const base = article ? { title: article.title, lead: article.lead, kind: 'article' } : { ...LEARN_EXTRA[id], kind: id };
  return { id, num: String(i + 1).padStart(2, '0'), ...base };
});

const uniqSorted = (arr) => [...new Set(arr)].sort((a, b) => a.localeCompare(b, 'es'));

// Encuadre inicial: se ajusta a todas las cafeterías curadas (Caricuao → Petare, La Trinidad, El Hatillo)
const ZONE_BOUNDS = L.latLngBounds(CAFES_DATA.map(c => [c.lat, c.lng])).pad(0.06);

// ── Búsqueda en vivo (OpenStreetMap vía Overpass API) ────────
// CAFES_DATA son los locales curados (con tipo/métodos/snacks y fuente); lo demás se pide a Overpass
// según la zona visible del mapa y se mezcla, sin duplicar por id de OSM.
const OVERPASS_URLS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];
const OVERPASS_ATTEMPT_MS = 20000;   // tiempo máximo por servidor
const OVERPASS_STAGGER_MS = 2500;    // cada servidor de respaldo arranca si el anterior aún no ha respondido; gana el primero
const LIVE_CACHE_KEY = 'cafecito-live-v1';
const LIVE_CACHE_MAX_AGE = 7 * 24 * 3600 * 1000;
const LIVE_MAX_SPAN = 0.4;   // grados; si la vista es más grande se pide solo esta zona alrededor del centro
const LIVE_SKIP_SPAN = 0.9;  // por encima de esto el mapa está demasiado alejado y no se busca
const LIVE_TIMEOUT_MS = 30000;
const CURATED_OSM = new Set(CAFES_DATA.map(c => c.osm).filter(Boolean));

async function fetchOverpassCafes(bounds, signal) {
  const bb = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;
  const data = `[out:json][timeout:25];(node["amenity"="cafe"](${bb});way["amenity"="cafe"](${bb}););out center tags;`;
  const attempts = [];   // controladores de los intentos en curso (se cancelan al ganar uno)
  const abortError = () => Object.assign(new Error('Búsqueda cancelada'), { name: 'AbortError' });

  const tryServer = async (url, delay) => {
    if (delay) {
      await new Promise((resolve, reject) => {
        const t = setTimeout(resolve, delay);
        signal.addEventListener('abort', () => { clearTimeout(t); reject(abortError()); }, { once: true });
      });
    }
    if (signal.aborted) throw abortError();
    const ctrl = new AbortController();
    attempts.push(ctrl);
    const onAbort = () => ctrl.abort();
    signal.addEventListener('abort', onAbort, { once: true });
    const timer = setTimeout(onAbort, OVERPASS_ATTEMPT_MS);
    try {
      const res = await fetch(url, { method: 'POST', body: new URLSearchParams({ data }), signal: ctrl.signal });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const json = await res.json();
      // Overpass responde 200 con "remark" y sin elementos cuando se queda sin tiempo o memoria
      if (json.remark && !(json.elements && json.elements.length)) throw new Error(json.remark);
      return json.elements || [];
    } finally {
      clearTimeout(timer);
      signal.removeEventListener('abort', onAbort);
    }
  };

  try {
    return await Promise.any(OVERPASS_URLS.map((url, i) => tryServer(url, i * OVERPASS_STAGGER_MS)));
  } catch (err) {
    if (signal.aborted) throw abortError();
    throw (err.errors && err.errors[0]) || err;
  } finally {
    attempts.forEach(c => c.abort());
  }
}

function liveToCafe(el) {
  const t = el.tags || {};
  const lat = el.lat ?? (el.center && el.center.lat);
  const lng = el.lon ?? (el.center && el.center.lon);
  const osm = el.type[0] + el.id;
  if (!t.name || lat == null || lng == null || CURATED_OSM.has(osm)) return null;
  const neighborhood = t['addr:suburb'] || t['addr:neighbourhood'] || 'Sin barrio';
  const street = [t['addr:street'], t['addr:housenumber']].filter(Boolean).join(' ');
  return {
    id: osm, osm, name: t.name,
    type: 'cafeteria', typeConfirmed: false,
    neighborhood, address: street || (neighborhood !== 'Sin barrio' ? neighborhood : 'Dirección sin confirmar'),
    lat, lng, schedule: parseOsmHours(t.opening_hours), methods: [], drinks: [], snacks: [], description: '',
    sources: [`https://www.openstreetmap.org/${el.type}/${el.id}`],
  };
}

const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// ── Horario (siempre en hora de Caracas, UTC-4 fijo) ─────────
function caracasNow() {
  const d = new Date(Date.now() - 4 * 3600 * 1000);
  return { day: d.getUTCDay(), minutes: d.getUTCHours() * 60 + d.getUTCMinutes() };
}
const toMinutes = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };

function formatTime(time24) {
  if (!time24) return '';
  const [h, m] = time24.split(':');
  const hours = parseInt(h, 10) % 24;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  return `${hours % 12 || 12}:${m} ${ampm}`;
}

const dayRangeList = (d) => d.ranges || [[d.open, d.close]];
const dayRanges = (d) => dayRangeList(d).map(([o, c]) => `${formatTime(o)} – ${formatTime(c)}`).join(' y ');

function getStatus(schedule) {
  if (!schedule) return { state: 'unknown', text: 'Horario sin confirmar' };
  const { day, minutes } = caracasNow();
  // Un local que cierra pasada la medianoche (p. ej. 26:00) sigue abierto de madrugada del día siguiente
  const yesterday = schedule.find(s => s.dayId === (day + 6) % 7);
  if (yesterday && !yesterday.closed) {
    const last = dayRangeList(yesterday).slice(-1)[0];
    if (toMinutes(last[1]) > 1440 && minutes < toMinutes(last[1]) - 1440) return { state: 'open', text: `Abierto hasta las ${formatTime(last[1])}` };
  }
  const today = schedule.find(s => s.dayId === day);
  if (!today || today.closed) return { state: 'closed', text: 'Cerrado hoy' };
  const ranges = dayRangeList(today);
  for (const [o, c] of ranges) {
    if (minutes >= toMinutes(o) && minutes < toMinutes(c)) return { state: 'open', text: `Abierto hasta las ${formatTime(c)}` };
  }
  const next = ranges.find(([o]) => minutes < toMinutes(o));
  if (next) return { state: 'closed', text: `Abre hoy a las ${formatTime(next[0])}` };
  return { state: 'closed', text: 'Cerrado ahora' };
}

// ── Marcadores ───────────────────────────────────────────────
function createMarkerIcon(cafe, selected) {
  return L.divIcon({
    html: `<span class="pin pin-${cafe.type}${selected ? ' is-selected' : ''}" aria-hidden="true">${CUP_SVG}</span>`,
    className: 'pin-wrap',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

function clusterIcon(cluster) {
  const n = cluster.getChildCount();
  return L.divIcon({
    html: `<span class="cluster">${n}</span>`,
    className: 'cluster-wrap',
    iconSize: [40, 40],
  });
}

function issueUrl(cafe) {
  const title = `Completar datos: ${cafe.name} (${cafe.neighborhood})`;
  const body = [
    `Local: ${cafe.name}`, `Barrio: ${cafe.neighborhood}`, '',
    '- Tipo (cafetería / café de especialidad):',
    '- Métodos de preparación (espresso, V60, Chemex…):',
    '- Snacks:', '- Horario:', '- Fuente (web, Instagram, visita propia):',
  ].join('\n');
  return `${REPO_URL}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
}

// ════════════════════════════════════════════════════════════
const App = {
  template: `
    <header class="app-header">
      <a class="app-logo" href="./" @click.prevent="view = 'map'" aria-label="Cafecito Caracas">
        <span class="app-logo-icon" aria-hidden="true" v-html="cupIcon"></span>
        <span class="app-logo-text">Cafecito <em>Caracas</em></span>
      </a>
      <nav id="main-nav" class="main-nav" :class="{ open: menuOpen }" aria-label="Secciones">
        <a v-for="item in NAV" :key="item.id" class="nav-btn" :class="{ active: navActive(item) }" :aria-current="navActive(item) ? 'page' : null"
           :href="item.href" @click.prevent="goNav(item)">{{ item.label }}</a>
      </nav>
      <button class="nav-toggle" type="button" :aria-expanded="menuOpen" aria-controls="main-nav" @click="menuOpen = !menuOpen">
        <span class="sr-only">Menú</span><span class="nav-toggle-bars" aria-hidden="true"></span>
      </button>
      <span class="header-badge" aria-live="polite">{{ filteredCafes.length }} de {{ totalCount }}</span>
    </header>

    <!-- ═════════ MAPA ═════════ -->
    <div v-show="view === 'map'" class="app-body" role="main" :class="'sheet-' + sheet">
      <h1 class="sr-only">Cafecito Caracas: mapa de cafeterías de Caracas</h1>
      <aside class="sidebar" ref="sidebarEl" aria-label="Cafeterías">
        <button class="sheet-handle" type="button" :aria-label="sheet === 'peek' ? 'Ver la lista de cafeterías' : 'Bajar la lista'"
                @pointerdown="onHandleDown" @pointerup="onHandleUp" @pointercancel="onHandleCancel"><span></span></button>

        <!-- Detalle de una cafetería -->
        <article v-if="activeCafe" class="detail" aria-live="polite">
          <button class="detail-back" @click="closeDetail" type="button">← Volver a la lista</button>

          <figure class="cafe-photo">
            <img v-if="cafePhoto" width="800" height="500" :src="cafePhoto.src" :alt="'Foto de ' + activeCafe.name" loading="lazy" decoding="async" referrerpolicy="no-referrer" @error="photoFailed = true" />
            <div v-else class="cafe-photo-fallback" :class="'type-' + activeCafe.type" v-html="CAFE_FALLBACK_SVG" role="img" aria-label="Ilustración de una cafetería: este local aún no tiene foto"></div>
            <figcaption v-if="cafePhoto && cafePhoto.author">
              Foto: <a v-if="cafePhoto.authorUrl" :href="cafePhoto.authorUrl" target="_blank" rel="noopener">{{ cafePhoto.author }}</a><template v-else>{{ cafePhoto.author }}</template>
              <template v-if="cafePhoto.google"> · Google Maps</template>
            </figcaption>
          </figure>

          <header class="detail-head">
            <span class="type-chip" :class="'type-' + activeCafe.type">{{ TYPE_INFO[activeCafe.type].label }}</span>
            <span v-if="!activeCafe.typeConfirmed" class="tag tag-muted" title="La categoría aún no tiene fuente">por confirmar</span>
            <h2 class="detail-name">{{ activeCafe.name }}</h2>
            <div class="status" :class="'status-' + activeStatus.state"><span class="status-dot"></span>{{ activeStatus.text }}</div>
            <p v-if="activeCafe.google && activeCafe.google.rating" class="detail-rating">⭐ {{ activeCafe.google.rating.toFixed(1) }} <span class="muted">({{ activeCafe.google.ratingCount }} reseñas en Google)</span></p>
            <p v-if="googleLoading" class="muted">Consultando Google Maps…</p>
          </header>

          <section class="detail-section">
            <h2 class="detail-label">Ubicación</h2>
            <div class="minimap">
              <div id="minimap" class="minimap-canvas"></div>
              <a class="minimap-link" :href="mapsUrl(activeCafe)" target="_blank" rel="noopener" :aria-label="'Abrir ' + activeCafe.name + ' en Google Maps'">
                <span class="minimap-cta">Abrir en Google Maps ↗</span>
              </a>
            </div>
            <p class="detail-address">📍 {{ activeCafe.address }}</p>
            <p class="detail-pin"><a :href="mapsPinUrl(activeCafe)" target="_blank" rel="noopener">Ver el punto exacto en Google Maps</a></p>
          </section>

          <section class="detail-section">
            <h2 class="detail-label">Horario</h2>
            <ul v-if="activeCafe.schedule" class="schedule">
              <li v-for="day in activeCafe.schedule" :key="day.dayId" :class="{ 'is-today': day.dayId === todayId }">
                <span>{{ day.name }}</span>
                <span v-if="!day.closed">{{ dayRanges(day) }}</span>
                <span v-else class="muted">Cerrado</span>
              </li>
            </ul>
            <p v-else class="muted">Horario sin confirmar. <a :href="mapsUrl(activeCafe)" target="_blank" rel="noopener">Ver horario en Google Maps</a></p>
          </section>

          <div class="detail-actions">
            <a class="btn btn-primary" :href="directionsUrl(activeCafe)" target="_blank" rel="noopener">Cómo llegar</a>
            <a v-if="activeCafe.google && activeCafe.google.website" class="btn" :href="activeCafe.google.website" target="_blank" rel="noopener">Sitio web</a>
            <a class="btn" :href="issueUrl(activeCafe)" target="_blank" rel="noopener">¿Falta algo? Aporta datos</a>
          </div>

          <p v-if="activeCafe.description" class="detail-desc">{{ activeCafe.description }}</p>

          <section v-if="activeCafe.methods.length" class="detail-section">
            <h2 class="detail-label">Métodos de preparación</h2>
            <div class="tag-row">
              <button v-for="m in activeCafe.methods" :key="m" class="tag tag-method" @click="openWikiMethod(m)" type="button" title="Aprende sobre este método">{{ m }}</button>
            </div>
          </section>

          <section v-if="activeCafe.drinks.length" class="detail-section">
            <h2 class="detail-label">Bebidas destacadas</h2>
            <div class="tag-row"><span v-for="d in activeCafe.drinks" :key="d" class="tag">{{ d }}</span></div>
          </section>

          <section v-if="activeCafe.snacks.length" class="detail-section">
            <h2 class="detail-label">Snacks y comida</h2>
            <div class="tag-row"><span v-for="s in activeCafe.snacks" :key="s" class="tag tag-food">{{ s }}</span></div>
          </section>

          <p v-if="activeCafe.google" class="detail-sources">Horario y valoración: Google Maps</p>
          <p v-if="activeCafe.sources.length" class="detail-sources">
            Fuentes:
            <template v-for="(s, i) in activeCafe.sources" :key="s"><a :href="s" target="_blank" rel="noopener">[{{ i + 1 }}]</a> </template>
          </p>
        </article>


        <!-- Filtros y lista -->
        <template v-else>
          <section class="filters" aria-label="Filtros">
            <div class="search-wrap">
              <span class="search-icon" aria-hidden="true">🔍</span>
              <input class="search-input" type="search" v-model="query" @focus="onSearchFocus" placeholder="Buscar por nombre, barrio, snack…" autocomplete="off" aria-label="Buscar cafetería" />
            </div>

            <button class="filters-toggle" type="button" @click="filtersOpen = !filtersOpen" :aria-expanded="filtersOpen">
              Filtros <span v-if="activeFilterCount" class="badge">{{ activeFilterCount }}</span>
              <span class="chev">{{ filtersOpen ? '▴' : '▾' }}</span>
            </button>

            <div class="filters-body" :class="{ open: filtersOpen }">
              <div class="filter-group">
                <span class="filter-label">Tipo de local</span>
                <div class="chip-group">
                  <button v-for="t in TYPE_OPTIONS" :key="t" class="chip" :class="{ active: selTypes.includes(t), empty: !facet.type[t] && !selTypes.includes(t) }" @click="toggle('types', t)" type="button">
                    {{ TYPE_INFO[t].short }} <small>{{ facet.type[t] || 0 }}</small>
                  </button>
                </div>
              </div>

              <div class="filter-group" v-if="METHOD_OPTIONS.length">
                <span class="filter-label">Método de preparación</span>
                <div class="chip-group">
                  <button v-for="m in METHOD_OPTIONS" :key="m" class="chip" :class="{ active: selMethods.includes(m), empty: !facet.method[m] && !selMethods.includes(m) }" @click="toggle('methods', m)" type="button">
                    {{ m }} <small>{{ facet.method[m] || 0 }}</small>
                  </button>
                </div>
              </div>

              <div class="filter-group" v-if="SNACK_OPTIONS.length">
                <span class="filter-label">Snacks y comida</span>
                <div class="chip-group">
                  <button v-for="s in SNACK_OPTIONS" :key="s" class="chip" :class="{ active: selSnacks.includes(s), empty: !facet.snack[s] && !selSnacks.includes(s) }" @click="toggle('snacks', s)" type="button">
                    {{ s }} <small>{{ facet.snack[s] || 0 }}</small>
                  </button>
                </div>
              </div>

              <div class="filter-group">
                <label class="filter-label" for="hood">Barrio</label>
                <select id="hood" class="select" v-model="selHood">
                  <option value="">Todos los barrios</option>
                  <option v-for="h in HOOD_OPTIONS" :key="h" :value="h">{{ h }}</option>
                </select>
              </div>

              <button v-if="activeFilterCount || query" class="btn-link" @click="clearFilters" type="button">✕ Limpiar filtros</button>
            </div>
          </section>

          <p class="results-count" aria-live="polite"><strong>{{ filteredCafes.length }}</strong> {{ filteredCafes.length === 1 ? 'resultado' : 'resultados' }}</p>
          <p class="live-status" :class="'live-' + liveState" aria-live="polite">
            <span class="live-dot"></span>{{ liveText }}
            <button v-if="liveState !== 'loading'" class="btn-link" type="button" @click="refreshLive">Actualizar</button>
          </p>

          <ul class="cafe-list" ref="listEl">
            <li v-if="!filteredCafes.length" class="empty-state">
              <p class="empty-title">Ninguna cafetería coincide</p>
              <p class="muted">Prueba con menos filtros. Si un dato falta en el mapa, puedes aportarlo desde la ficha de cada local.</p>
              <button class="btn" @click="clearFilters" type="button">Limpiar filtros</button>
            </li>
            <li v-for="cafe in filteredCafes" :key="cafe.id">
              <button class="cafe-card" :class="{ 'is-hover': hoverId === cafe.id }" type="button"
                      @click="select(cafe)" @mouseenter="hoverId = cafe.id" @mouseleave="hoverId = null">
                <span class="card-avatar" :class="'type-' + cafe.type" aria-hidden="true" v-html="cupIcon"></span>
                <span class="card-main">
                  <span class="card-name">{{ cafe.name }}</span>
                  <span class="card-sub">{{ cafe.neighborhood }}</span>
                  <span class="card-tags">
                    <span class="tag" :class="'type-' + cafe.type">{{ TYPE_INFO[cafe.type].short }}</span>
                    <span v-for="s in cafe.snacks.slice(0, 2)" :key="s" class="tag tag-food">{{ s }}</span>
                  </span>
                </span>
                <span class="card-status status" :class="'status-' + statusOf(cafe).state" :title="statusOf(cafe).text"><span class="status-dot"></span></span>
              </button>
            </li>
          </ul>
        </template>
      </aside>

      <section class="map-pane" aria-label="Mapa">
        <div id="map" role="application" aria-label="Mapa de cafeterías de Caracas"></div>
      </section>
    </div>

    <!-- ═════════ GUÍA ═════════ -->
    <div v-show="view === 'wiki'" class="wiki-page" role="main" ref="wikiEl">

      <!-- Portada: landing de la guía -->
      <div v-if="!topic" class="learn" key="hub">
        <section class="learn-hero">
          <div class="learn-wrap learn-hero-grid">
            <div>
              <p class="eyebrow">Guía del café</p>
              <h1 class="learn-title">Todo lo que hay detrás de tu taza</h1>
              <p class="learn-intro">Siete lecturas cortas para entender de dónde viene el café, qué significa «de especialidad» y qué pedir la próxima vez que estés frente a la barra.</p>
              <div class="learn-actions">
                <button class="btn btn-primary" type="button" @click="openTopic(LEARN_TOPICS[0].id)">Empezar por la historia</button>
                <a class="btn btn-ghost" href="./" @click.prevent="view = 'map'">Ver cafeterías en el mapa</a>
              </div>
            </div>
            <svg class="learn-art" viewBox="0 0 200 200" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M40 90h96v38a40 40 0 0 1-40 40h-16a40 40 0 0 1-40-40V90z"/>
              <path d="M136 100h14a20 20 0 0 1 0 40h-14"/>
              <path class="steam" d="M70 70c-8-10 8-16 0-28M98 70c-8-10 8-16 0-28M126 70c-8-10 8-16 0-28"/>
            </svg>
          </div>
        </section>

        <section class="learn-wrap learn-index" aria-labelledby="idx-title">
          <h2 id="idx-title" class="eyebrow eyebrow-dark">Índice</h2>
          <ol class="idx-list">
            <li v-for="(t, i) in LEARN_TOPICS" :key="t.id" v-reveal="i * 70">
              <a class="idx-row" :href="'#guia/' + t.id" @click.prevent="openTopic(t.id)">
                <span class="idx-num">{{ t.num }}</span>
                <span class="idx-text">
                  <span class="idx-title">{{ t.title }}</span>
                  <span class="idx-lead">{{ t.lead }}</span>
                </span>
                <span class="idx-arrow" aria-hidden="true">→</span>
              </a>
            </li>
          </ol>
        </section>

        <section class="learn-close">
          <div class="learn-wrap learn-close-inner" v-reveal>
            <h2 class="learn-close-title">Ahora, a probarlo</h2>
            <p>Con lo que sabes, el mapa se lee distinto: filtra por método, busca un V60 o un buen espresso.</p>
            <a class="btn btn-primary" href="./" @click.prevent="view = 'map'">Abrir el mapa</a>
          </div>
        </section>
        <div class="learn-wrap credits" v-reveal>
          <details>
            <summary>Créditos de las imágenes <span class="credits-count">{{ CREDITS.length }}</span></summary>
            <p class="credits-intro">Las fotos son de Wikimedia Commons con licencia libre; se recortaron y redimensionaron. Los dibujos son propios.</p>
            <ul class="credits-list">
              <li v-for="c in CREDITS" :key="c.id">
                {{ c.alt }} — {{ c.author }},
                <a :href="c.licenseUrl" target="_blank" rel="noopener">{{ c.license }}</a>,
                <a :href="c.source" target="_blank" rel="noopener">fuente</a>
              </li>
            </ul>
          </details>
        </div>
      </div>

      <!-- Tema -->
      <div v-else class="learn" :key="topic.id">
        <div class="topic-hero">
          <div class="learn-wrap topic-hero-grid" :class="{ 'has-img': topicHero }">
            <div>
              <a class="crumb" href="#guia" @click.prevent="openTopic(null)">← Guía</a>
              <p class="eyebrow">Lectura {{ topic.num }} de {{ LEARN_TOPICS.length }}</p>
              <h1 class="learn-title topic-title">{{ topic.title }}</h1>
              <p class="learn-intro">{{ topic.lead }}</p>
            </div>
            <a-fig v-if="topicHero" :id="topicHero" sizes="(max-width: 860px) 92vw, 480px" eager dark />
          </div>
        </div>

        <div class="learn-wrap topic-layout">
          <aside v-if="topicToc.length > 1" class="toc" aria-label="En esta página">
            <p class="toc-label">En esta página</p>
            <ul>
              <li v-for="item in topicToc" :key="item.id">
                <button type="button" @click="scrollToId(item.id)">{{ item.label }}</button>
              </li>
            </ul>
          </aside>

          <div class="topic-main">
            <!-- Artículo en secciones -->
            <div v-if="topic.kind === 'article'" class="prose">
              <section v-for="(sec, i) in topicArticle.sections" :key="sec.subtitle" :id="'sec-' + i" class="prose-sec" v-reveal>
                <span class="sec-num" aria-hidden="true">{{ String(i + 1).padStart(2, '0') }}</span>
                <div>
                  <h2 class="sec-title">{{ sec.subtitle }}</h2>
                  <p>{{ sec.text }}</p>
                  <a-fig v-if="sectionImage(i)" :id="sectionImage(i)" sizes="(max-width: 860px) 92vw, 640px" class="sec-fig" />
                </div>
              </section>
            </div>

            <!-- Métodos -->
            <div v-else-if="topic.kind === 'metodos'" class="rows">
              <section v-for="(m, name) in WIKI_DATA.methods" :key="name" :id="'method-' + name" class="row-item" v-reveal>
                <div class="row-head">
                  <h2 class="row-title">{{ m.title }}</h2>
                  <p class="row-kicker">{{ m.description }}</p>
                </div>
                <div class="row-body">
                  <p>{{ m.details }}</p>
                  <dl class="spec">
                    <div><dt>Molienda</dt><dd>{{ m.grind }}</dd></div>
                    <div><dt>Tiempo</dt><dd>{{ m.time }}</dd></div>
                    <div><dt>Ratio</dt><dd>{{ m.ratio }}</dd></div>
                  </dl>
                  <div class="row-media">
                    <a-fig v-if="METHOD_IMAGES[name]" :id="METHOD_IMAGES[name]" sizes="(max-width: 560px) 92vw, 280px" />
                    <figure v-if="METHOD_DIAGRAMS[name]" class="diagram">
                      <div class="diagram-art" v-html="METHOD_DIAGRAMS[name]"></div>
                      <figcaption>Cómo fluye el agua y el café</figcaption>
                    </figure>
                  </div>
                </div>
              </section>
            </div>

            <!-- Bebidas -->
            <div v-else-if="topic.kind === 'bebidas'" class="rows">
              <section v-for="d in WIKI_DATA.drinks" :key="d.name" class="row-item row-compact" v-reveal>
                <div class="row-head"><h2 class="row-title">{{ d.name }}</h2></div>
                <div class="row-body">
                  <p>{{ d.text }}</p>
                  <div class="row-media">
                    <a-fig v-if="DRINK_IMAGES[d.name]" :id="DRINK_IMAGES[d.name]" sizes="(max-width: 560px) 92vw, 280px" />
                    <figure v-if="drinkSvg(d.name)" class="diagram">
                      <div class="diagram-art" v-html="drinkSvg(d.name)"></div>
                      <figcaption class="legend">
                        <span v-for="l in drinkLegend(d.name)" :key="l.label" class="legend-item"><i :style="{ background: l.color }"></i>{{ l.label }}</span>
                      </figcaption>
                    </figure>
                  </div>
                </div>
              </section>
            </div>

            <!-- Glosario -->
            <dl v-else class="rows glossary">
              <div v-for="g in WIKI_DATA.glossary" :key="g.term" class="row-item row-compact" v-reveal>
                <dt class="row-head row-title">{{ g.term }}</dt>
                <dd class="row-body">{{ g.text }}</dd>
              </div>
            </dl>
          </div>
        </div>

        <nav class="learn-wrap pager" aria-label="Otras lecturas" v-reveal>
          <a v-if="prevTopic" class="pager-link pager-prev" :href="'#guia/' + prevTopic.id" @click.prevent="openTopic(prevTopic.id)">
            <span class="pager-dir">← Anterior</span><span class="pager-name">{{ prevTopic.title }}</span>
          </a>
          <a v-if="nextTopic" class="pager-link pager-next" :href="'#guia/' + nextTopic.id" @click.prevent="openTopic(nextTopic.id)">
            <span class="pager-dir">Siguiente →</span><span class="pager-name">{{ nextTopic.title }}</span>
          </a>
          <a v-else class="pager-link pager-next" href="./" @click.prevent="view = 'map'">
            <span class="pager-dir">Para terminar →</span><span class="pager-name">Abrir el mapa de cafeterías</span>
          </a>
        </nav>
      </div>
    </div>

    <footer class="app-footer">
      Datos de cafeterías © colaboradores de <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> (ODbL) ·
      <a :href="repoUrl" target="_blank" rel="noopener">Contribuir en GitHub</a>
    </footer>
  `,

  setup() {
    const view = ref('map');          // 'map' | 'wiki'
    const sheet = ref('peek');        // panel móvil: 'peek' | 'half' | 'full'
    const wikiTab = ref(null);        // null = portada de la guía; si no, id del tema
    const menuOpen = ref(false);
    const navActive = (item) => {
      if (item.id === 'mapa') return view.value === 'map';
      if (view.value !== 'wiki') return false;
      return item.id === 'guia' ? !NAV_DIRECT_TOPICS.includes(wikiTab.value) : wikiTab.value === item.topic;
    };
    function goNav(item) {
      menuOpen.value = false;
      if (item.id === 'mapa') view.value = 'map'; else openTopic(item.topic);
    }
    const closeMenuOutside = (e) => { if (menuOpen.value && !e.target.closest('.app-header')) menuOpen.value = false; };
    const closeMenuEsc = (e) => { if (e.key === 'Escape') menuOpen.value = false; };
    document.addEventListener('click', closeMenuOutside);
    document.addEventListener('keydown', closeMenuEsc);
    const wikiEl = ref(null);
    const sidebarEl = ref(null);

    const query = ref('');
    const selTypes = ref([]);
    const selMethods = ref([]);
    const selSnacks = ref([]);
    const selHood = ref('');
    const filtersOpen = ref(false);

    const activeId = ref(null);
    const hoverId = ref(null);
    const listEl = ref(null);

    const map = shallowRef(null);
    let cluster = null;
    const markers = new Map();   // id -> { marker, cafe }

    // Curados + los que llegan en vivo desde Overpass
    const liveCafes = shallowRef([]);
    const cafes = computed(() => [...CAFES_DATA, ...liveCafes.value]);
    const totalCount = computed(() => cafes.value.length);
    const methodOptions = computed(() => uniqSorted(cafes.value.flatMap(c => c.methods)));
    const snackOptions = computed(() => uniqSorted(cafes.value.flatMap(c => c.snacks)));
    const hoodOptions = computed(() => uniqSorted(cafes.value.map(c => c.neighborhood)));

    const liveState = ref('idle');   // idle | loading | ok | zoom | error
    const liveUpdated = ref(null);
    const liveText = computed(() => ({
      idle: 'Buscando cafeterías en la zona…',
      loading: 'Buscando en OpenStreetMap…',
      ok: `En vivo desde OpenStreetMap${liveUpdated.value ? ' · ' + liveUpdated.value : ''}`,
      zoom: 'Acerca el mapa para buscar más cafeterías en vivo',
      error: 'Sin conexión con OpenStreetMap: mostrando los locales guardados',
    })[liveState.value]);

    const liveById = new Map();

    // Última búsqueda guardada: la lista aparece al instante y se refresca en segundo plano
    try {
      const saved = JSON.parse(localStorage.getItem(LIVE_CACHE_KEY) || 'null');
      if (saved && Date.now() - saved.t < LIVE_CACHE_MAX_AGE) {
        saved.cafes.filter(c => !CURATED_OSM.has(c.osm)).forEach(c => liveById.set(c.id, c));
        liveCafes.value = [...liveById.values()];
      }
    } catch (e) { /* sin caché: no pasa nada */ }
    const saveLiveCache = () => {
      try { localStorage.setItem(LIVE_CACHE_KEY, JSON.stringify({ t: Date.now(), cafes: [...liveById.values()] })); } catch (e) { /* cuota o modo privado */ }
    };

    const fetchedAreas = [];
    let liveAbort = null;
    let liveTimer = null;

    async function loadLive({ force = false } = {}) {
      const m = map.value;
      if (!m) return;
      const bounds = m.getBounds();
      const spanLat = bounds.getNorth() - bounds.getSouth(), spanLng = bounds.getEast() - bounds.getWest();
      if (spanLat > LIVE_SKIP_SPAN || spanLng > LIVE_SKIP_SPAN) {
        liveState.value = liveUpdated.value ? 'ok' : 'zoom';
        return;
      }
      // Pantallas altas (móvil) abarcan más de lo que conviene pedir de una vez: se limita a una zona centrada en el mapa
      const view = (spanLat > LIVE_MAX_SPAN || spanLng > LIVE_MAX_SPAN)
        ? L.latLng(m.getCenter()).toBounds(LIVE_MAX_SPAN * 111000)
        : bounds;
      if (!force && fetchedAreas.some(a => a.contains(view))) { liveState.value = 'ok'; return; }

      if (liveAbort) liveAbort.abort();
      const ctrl = liveAbort = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), LIVE_TIMEOUT_MS);
      const area = view.pad(0.25);
      liveState.value = 'loading';
      try {
        const elements = await fetchOverpassCafes(area, ctrl.signal);
        elements.map(liveToCafe).filter(Boolean).forEach(c => liveById.set(c.id, c));
        liveCafes.value = [...liveById.values()];
        saveLiveCache();
        fetchedAreas.push(area);
        liveUpdated.value = new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
        liveState.value = 'ok';
      } catch (err) {
        if (ctrl !== liveAbort) return;   // reemplazada por una búsqueda más reciente
        liveState.value = 'error';
      } finally {
        clearTimeout(timeout);
      }
    }
    function scheduleLive() {
      clearTimeout(liveTimer);
      liveTimer = setTimeout(() => loadLive(), 600);
    }
    function refreshLive() {
      fetchedAreas.length = 0;
      loadLive({ force: true });
    }

    // Datos de Google Places por local (solo si hay clave en config.js); se piden al abrir la ficha
    const googleInfo = reactive({});
    const googleLoading = ref(false);
    const activeCafe = computed(() => {
      const base = cafes.value.find(c => c.id === activeId.value);
      const g = base && googleInfo[base.id];
      return g ? { ...base, schedule: g.schedule || base.schedule, google: g } : base || null;
    });
    watch(activeId, async (id) => {
      const cafe = cafes.value.find(c => c.id === id);
      if (!cafe || !GOOGLE_ENABLED || id in googleInfo) return;
      googleLoading.value = true;
      try {
        const info = await enrichFromGoogle(cafe);
        googleInfo[id] = info;
      } catch (err) {
        console.warn('[Cafecito] Google Places no respondió:', err);
      } finally {
        googleLoading.value = false;
      }
    });
    const activeStatus = computed(() => activeCafe.value ? getStatus(activeCafe.value.schedule) : null);
    const todayId = computed(() => caracasNow().day);

    // ── Guía: portada + una página por tema ─────────────
    const topicIndex = computed(() => LEARN_TOPICS.findIndex(t => t.id === wikiTab.value));
    const topic = computed(() => LEARN_TOPICS[topicIndex.value] || null);
    const prevTopic = computed(() => LEARN_TOPICS[topicIndex.value - 1] || null);
    const nextTopic = computed(() => LEARN_TOPICS[topicIndex.value + 1] || null);
    const topicArticle = computed(() => (topic.value && topic.value.kind === 'article')
      ? WIKI_DATA.articles.find(a => a.id === topic.value.id) : null);
    const topicToc = computed(() => {
      if (!topic.value) return [];
      if (topicArticle.value) return topicArticle.value.sections.map((s, i) => ({ id: 'sec-' + i, label: s.subtitle }));
      if (topic.value.kind === 'metodos') return Object.entries(WIKI_DATA.methods).map(([name, m]) => ({ id: 'method-' + name, label: m.title }));
      return [];
    });

    const topicHero = computed(() => (topic.value && LEARN_HERO[topic.value.id]) || null);
    const sectionImage = (i) => (topic.value && (LEARN_SECTION_IMAGES[topic.value.id] || {})[i]) || null;

    function scrollToId(id) {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    function openTopic(id) {
      view.value = 'wiki';
      wikiTab.value = id;
      nextTick(() => { if (wikiEl.value) wikiEl.value.scrollTo({ top: 0, behavior: 'instant' }); });
    }

    // La URL refleja dónde estás (#guia, #guia/historia) para que "atrás" y los enlaces funcionen
    const hashFor = () => view.value === 'map' ? '' : (wikiTab.value ? '#guia/' + wikiTab.value : '#guia');
    function readHash() {
      const [section, id] = location.hash.replace(/^#/, '').split('/');
      if (section === 'guia' || section === 'aprende') {   // «aprende» era el nombre anterior: se siguen aceptando esos enlaces
        view.value = 'wiki';
        wikiTab.value = LEARN_TOPICS.some(t => t.id === id) ? id : null;
      } else {
        view.value = 'map';
      }
    }
    readHash();
    watch([view, wikiTab], () => {
      const next = hashFor();
      if (location.hash !== next) {
        try { history.pushState(null, '', next || location.pathname + location.search); } catch (e) { /* file:// */ }
      }
      if (view.value === 'wiki') {
        document.title = (topic.value ? topic.value.title : 'Guía del café') + ' · Cafecito Caracas';
      } else {
        document.title = activeCafe.value ? `${activeCafe.value.name} · Cafecito Caracas` : 'Cafecito Caracas · Mapa de cafeterías';
      }
    });
    window.addEventListener('popstate', readHash);

    // ── Filtrado ───────────────────────────────────────────
    function matches(cafe, skip) {
      const q = norm(query.value).trim();
      if (q) {
        const hay = norm([cafe.name, cafe.neighborhood, cafe.address, cafe.description, ...cafe.snacks, ...cafe.methods, ...cafe.drinks].join(' '));
        if (!hay.includes(q)) return false;
      }
      if (skip !== 'type' && selTypes.value.length && !selTypes.value.includes(cafe.type)) return false;
      if (skip !== 'method' && selMethods.value.length && !selMethods.value.every(m => cafe.methods.includes(m))) return false;
      if (skip !== 'snack' && selSnacks.value.length && !selSnacks.value.every(s => cafe.snacks.includes(s))) return false;
      if (selHood.value && cafe.neighborhood !== selHood.value) return false;
      return true;
    }

    const filteredCafes = computed(() =>
      cafes.value.filter(c => matches(c)).sort((a, b) => a.name.localeCompare(b.name, 'es')));

    // Cuántos resultados daría cada opción de filtro con el resto de filtros aplicados
    const facet = computed(() => {
      const count = (skip, pick) => {
        const out = {};
        cafes.value.filter(c => matches(c, skip)).forEach(c => pick(c).forEach(v => { out[v] = (out[v] || 0) + 1; }));
        return out;
      };
      return {
        type: count('type', c => [c.type]),
        method: count('method', c => c.methods),
        snack: count('snack', c => c.snacks),
      };
    });

    const activeFilterCount = computed(() =>
      selTypes.value.length + selMethods.value.length + selSnacks.value.length + (selHood.value ? 1 : 0));

    // La plantilla desenvuelve los refs, así que el filtro se indica por nombre
    const filterRefs = { types: selTypes, methods: selMethods, snacks: selSnacks };
    function toggle(name, value) {
      const r = filterRefs[name];
      r.value = r.value.includes(value) ? r.value.filter(v => v !== value) : [...r.value, value];
    }
    function clearFilters() {
      query.value = ''; selTypes.value = []; selMethods.value = []; selSnacks.value = []; selHood.value = '';
    }

    const statusOf = (cafe) => getStatus(cafe.schedule);
    const directionsUrl = (c) => `https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}`;
    // Enlaces a Google Maps. OJO: una búsqueda de texto libre ("nombre lat,lng") se interpreta sin zona y puede caer en otro país.
    //  - mapsSearchUrl: busca el nombre con el visor ya centrado en el local (zoom 18): abre su ficha si Google la tiene
    //    (horario, fotos, reseñas) y, si no, muestra los resultados de esa misma calle. Nunca otra ciudad.
    //  - mapsPinUrl: pone un marcador en las coordenadas exactas, sin depender de que Google conozca el local.
    const mapsSearchUrl = (c) => `https://www.google.com/maps/search/${encodeURIComponent(c.name)}/@${c.lat},${c.lng},18z`;
    const mapsPinUrl = (c) => `https://www.google.com/maps/search/?api=1&query=${c.lat},${c.lng}`;
    const mapsUrl = (c) => (c.google && c.google.mapsUri) || mapsSearchUrl(c);

    // Foto de la ficha: la propia (data/photos.js) > Google Maps (con clave) > dibujo de cafetería
    const photoFailed = ref(false);
    const cafePhoto = computed(() => {
      const c = activeCafe.value;
      if (!c || photoFailed.value) return null;
      const own = c.osm && CAFE_PHOTOS[c.osm];
      if (own) return own;
      return c.google && c.google.photo ? { ...c.google.photo, google: true } : null;
    });
    watch(activeId, () => {
      photoFailed.value = false;
      nextTick(() => { if (sidebarEl.value) sidebarEl.value.scrollTop = 0; });
    });

    // Mapita fijo de la ficha: sin interacción; el enlace superpuesto abre Google Maps
    let miniMap = null;
    function destroyMiniMap() { if (miniMap) { miniMap.remove(); miniMap = null; } }
    function mountMiniMap() {
      destroyMiniMap();
      const cafe = activeCafe.value;
      const el = document.getElementById('minimap');
      if (!cafe || !el) return;
      miniMap = L.map(el, {
        center: [cafe.lat, cafe.lng], zoom: 16, zoomControl: false, attributionControl: false,
        dragging: false, touchZoom: false, scrollWheelZoom: false, doubleClickZoom: false, boxZoom: false, keyboard: false,
      });
      L.tileLayer(TILE_URL, { maxZoom: 19, className: 'base-tiles' }).addTo(miniMap);
      L.control.attribution({ prefix: false }).addAttribution(TILE_ATTRIBUTION).addTo(miniMap);
      L.marker([cafe.lat, cafe.lng], { icon: createMarkerIcon(cafe, false), interactive: false, keyboard: false }).addTo(miniMap);
    }
    watch(() => activeCafe.value && activeCafe.value.id, () => nextTick(mountMiniMap), { flush: 'post' });

    // ── Selección ──────────────────────────────────────────
    function select(cafe, { fly = true } = {}) {
      activeId.value = cafe.id;
      document.title = `${cafe.name} · Cafecito Caracas`;
      if (isMobile()) sheet.value = 'half';
      if (map.value && fly) {
        const m = map.value, zoom = Math.max(m.getZoom(), 16);
        let target = L.latLng(cafe.lat, cafe.lng);
        // En móvil el panel tapa la parte baja: se desplaza el centro para que el pin quede visible arriba
        if (isMobile()) target = m.unproject(m.project(target, zoom).add([0, m.getSize().y * SHEET_HALF / 2]), zoom);
        m.flyTo(target, zoom, { duration: 0.7 });
      }
      refreshIcons();
    }
    function closeDetail() {
      activeId.value = null;
      document.title = 'Cafecito Caracas · Mapa de cafeterías';
      refreshIcons();
      nextTick(() => fitToResults());
    }
    // Panel inferior (móvil): tocar el asa lo alterna; arrastrarla hacia arriba/abajo cambia de estado
    const SHEETS = ['peek', 'half', 'full'];
    let dragY = null;
    function moveSheet(dir) {
      const i = SHEETS.indexOf(sheet.value) + dir;
      sheet.value = SHEETS[Math.max(0, Math.min(SHEETS.length - 1, i))];
    }
    function onHandleDown(e) { dragY = e.clientY; if (e.currentTarget.setPointerCapture) e.currentTarget.setPointerCapture(e.pointerId); }
    function onHandleCancel() { dragY = null; }
    function onHandleUp(e) {
      if (dragY === null) return;
      const dy = e.clientY - dragY; dragY = null;
      if (Math.abs(dy) < 24) sheet.value = sheet.value === 'peek' ? 'half' : 'peek';   // toque
      else moveSheet(dy < 0 ? 1 : -1);
    }
    function onSearchFocus() { if (isMobile() && sheet.value === 'peek') sheet.value = 'half'; }
    function openWikiMethod(name) {
      openTopic('metodos');
      nextTick(() => {
        const el = document.getElementById('method-' + name);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }

    // ── Mapa ───────────────────────────────────────────────
    function refreshIcons() {
      markers.forEach(({ marker, cafe }, id) => marker.setIcon(createMarkerIcon(cafe, id === activeId.value)));
    }

    function getMarker(cafe) {
      let entry = markers.get(cafe.id);
      if (!entry) {
        const marker = L.marker([cafe.lat, cafe.lng], { icon: createMarkerIcon(cafe, cafe.id === activeId.value), keyboard: true });
        // El nombre va como tooltip propio solo con ratón (en táctil se quedaría pegado) y como etiqueta accesible
        if (window.matchMedia('(hover: hover)').matches) {
          // Leaflet interpreta un string como HTML y el nombre puede venir de OpenStreetMap (editable por cualquiera): se pasa como nodo de texto
          const tip = document.createElement('span');
          tip.textContent = cafe.name;
          marker.bindTooltip(tip, { direction: 'top', offset: [0, -16], className: 'pin-tip' });
        }
        marker.on('add', () => { const el = marker.getElement(); if (el) { el.setAttribute('aria-label', cafe.name); el.setAttribute('role', 'button'); } });
        marker.on('click', () => select(cafe));
        marker.on('mouseover', () => { hoverId.value = cafe.id; });
        marker.on('mouseout', () => { hoverId.value = null; });
        entry = { marker, cafe };
        markers.set(cafe.id, entry);
      }
      return entry.marker;
    }

    function syncMarkers() {
      if (!cluster) return;
      cluster.clearLayers();
      cluster.addLayers(filteredCafes.value.map(getMarker));
    }

    function fitToResults() {
      if (!map.value) return;
      const list = filteredCafes.value;
      if (!list.length) return;
      const bounds = (activeFilterCount.value || query.value.trim())
        ? L.latLngBounds(list.map(c => [c.lat, c.lng])).pad(0.2)
        : ZONE_BOUNDS;
      map.value.flyToBounds(bounds, { maxZoom: 16, duration: 0.6, paddingBottomRight: isMobile() ? [0, 140] : [0, 0] });
    }

    watch(filteredCafes, syncMarkers, { flush: 'post' });
    // Solo al cambiar filtros: si encuadrara también al llegar datos en vivo, mover el mapa dispararía otra búsqueda
    watch([query, selTypes, selMethods, selSnacks, selHood], () => {
      if (!activeId.value) fitToResults();
    }, { flush: 'post' });

    watch(view, (v) => { if (v === 'map') nextTick(() => map.value && map.value.invalidateSize()); });

    onMounted(() => {
      nextTick(() => {
        const m = L.map('map', { zoomControl: false, attributionControl: false, minZoom: 10, maxZoom: 19 });
        L.control.attribution({ prefix: false }).addTo(m);
        L.control.zoom({ position: 'bottomright' }).addTo(m);
        m.fitBounds(ZONE_BOUNDS, { paddingBottomRight: isMobile() ? [0, 140] : [0, 0] });
        map.value = m;

        addBaseLayer(m);

        cluster = L.markerClusterGroup({
          showCoverageOnHover: false,
          maxClusterRadius: 42,
          disableClusteringAtZoom: 16,
          iconCreateFunction: clusterIcon,
        });
        m.addLayer(cluster);
        syncMarkers();
        setTimeout(() => m.invalidateSize(), 250);

        m.on('moveend', scheduleLive);
        m.on('click', () => { if (isMobile() && sheet.value !== 'peek') sheet.value = 'peek'; });
        loadLive();
      });
    });

    onUnmounted(() => {
      window.removeEventListener('popstate', readHash);
      document.removeEventListener('click', closeMenuOutside);
      document.removeEventListener('keydown', closeMenuEsc);
      destroyMiniMap();
      clearTimeout(liveTimer);
      if (liveAbort) liveAbort.abort();
      if (map.value) { map.value.remove(); map.value = null; }
    });

    return {
      WIKI_DATA, TYPE_INFO, TYPE_OPTIONS,
      METHOD_OPTIONS: methodOptions, SNACK_OPTIONS: snackOptions, HOOD_OPTIONS: hoodOptions,
      liveState, liveText, refreshLive, googleLoading,
      repoUrl: REPO_URL, totalCount, cupIcon: CUP_SVG,
      NAV, navActive, goNav, menuOpen, LEARN_TOPICS, wikiEl, sidebarEl, topic, topicArticle, topicToc, prevTopic, nextTopic, openTopic, scrollToId,
      cafePhoto, photoFailed, mapsUrl, mapsPinUrl, dayRanges, CAFE_FALLBACK_SVG: ILLUSTRATIONS.CAFE_FALLBACK_SVG,
      topicHero, sectionImage, CREDITS, METHOD_IMAGES, DRINK_IMAGES,
      METHOD_DIAGRAMS: ILLUSTRATIONS.METHOD_DIAGRAMS, drinkSvg: ILLUSTRATIONS.drinkSvg, drinkLegend: ILLUSTRATIONS.drinkLegend,
      view, sheet, onHandleDown, onHandleUp, onHandleCancel, onSearchFocus,
      query, selTypes, selMethods, selSnacks, selHood, filtersOpen,
      activeId, hoverId, listEl, activeCafe, activeStatus, todayId,
      filteredCafes, facet, activeFilterCount,
      toggle, clearFilters, select, closeDetail, openWikiMethod,
      statusOf, directionsUrl, issueUrl, formatTime,
    };
  },
};

createApp(App).component('AFig', Fig).directive('reveal', vReveal).mount('#app');
