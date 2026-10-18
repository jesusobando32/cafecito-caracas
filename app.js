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

const { createApp, ref, computed, watch, nextTick, shallowRef, onMounted, onUnmounted } = Vue;

// ── Constantes ───────────────────────────────────────────────
const REPO_URL = 'https://github.com/jesusobando32/cafecito-caracas';
const CUP_SVG = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9z"/><path d="M16 10h2a2.5 2.5 0 0 1 0 5h-2"/><path d="M8 3v2M12 3v2"/></svg>';
// CARTO exige API key desde 2025; OSM estándar sigue siendo gratuito con atribución (uso ligero).
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const TYPE_INFO = {
  especialidad: { label: 'Café de especialidad', short: 'Especialidad' },
  cafeteria:    { label: 'Cafetería',            short: 'Cafetería' },
};
const TYPE_OPTIONS = ['cafeteria', 'especialidad'];

const uniqSorted = (arr) => [...new Set(arr)].sort((a, b) => a.localeCompare(b, 'es'));
const METHOD_OPTIONS = uniqSorted(CAFES_DATA.flatMap(c => c.methods));
const SNACK_OPTIONS = uniqSorted(CAFES_DATA.flatMap(c => c.snacks));
const HOOD_OPTIONS = uniqSorted(CAFES_DATA.map(c => c.neighborhood));

// Encuadre inicial: se ajusta a todas las cafeterías (Caricuao → Petare, La Trinidad, El Hatillo)
const ZONE_BOUNDS = L.latLngBounds(CAFES_DATA.map(c => [c.lat, c.lng])).pad(0.06);

function distanceKm(a, b) {
  const R = 6371, rad = (d) => d * Math.PI / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
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

function getStatus(schedule) {
  if (!schedule) return { state: 'unknown', text: 'Horario sin confirmar' };
  const { day, minutes } = caracasNow();
  const today = schedule.find(s => s.dayId === day);
  if (!today || today.closed) return { state: 'closed', text: 'Cerrado hoy' };
  const open = toMinutes(today.open), close = toMinutes(today.close);
  if (minutes >= open && minutes < close) return { state: 'open', text: `Abierto hasta las ${formatTime(today.close)}` };
  if (minutes < open) return { state: 'closed', text: `Abre hoy a las ${formatTime(today.open)}` };
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
      <nav class="main-nav" aria-label="Secciones">
        <button class="nav-btn" :class="{ active: view === 'map' }" @click="view = 'map'" type="button">Mapa</button>
        <button class="nav-btn" :class="{ active: view === 'wiki' }" @click="view = 'wiki'" type="button">Aprende</button>
      </nav>
      <span class="header-badge" aria-live="polite">{{ filteredCafes.length }} de {{ totalCount }}</span>
    </header>

    <!-- ═════════ MAPA ═════════ -->
    <div v-show="view === 'map'" class="app-body" :class="'mobile-' + mobileView">
      <aside class="sidebar" aria-label="Cafeterías">

        <!-- Detalle de una cafetería -->
        <article v-if="activeCafe" class="detail" aria-live="polite">
          <button class="detail-back" @click="closeDetail" type="button">← Volver a la lista</button>

          <header class="detail-head">
            <span class="type-chip" :class="'type-' + activeCafe.type">{{ TYPE_INFO[activeCafe.type].label }}</span>
            <span v-if="!activeCafe.typeConfirmed" class="tag tag-muted" title="La categoría aún no tiene fuente">por confirmar</span>
            <h1 class="detail-name">{{ activeCafe.name }}</h1>
            <p class="detail-address">📍 {{ activeCafe.address }}</p>
            <div class="status" :class="'status-' + activeStatus.state"><span class="status-dot"></span>{{ activeStatus.text }}</div>
          </header>

          <p v-if="activeCafe.description" class="detail-desc">{{ activeCafe.description }}</p>

          <section class="detail-section">
            <h2 class="detail-label">Métodos de preparación</h2>
            <div v-if="activeCafe.methods.length" class="tag-row">
              <button v-for="m in activeCafe.methods" :key="m" class="tag tag-method" @click="openWikiMethod(m)" type="button" title="Aprende sobre este método">{{ m }}</button>
            </div>
            <p v-else class="muted">Sin confirmar.</p>
          </section>

          <section v-if="activeCafe.drinks.length" class="detail-section">
            <h2 class="detail-label">Bebidas destacadas</h2>
            <div class="tag-row"><span v-for="d in activeCafe.drinks" :key="d" class="tag">{{ d }}</span></div>
          </section>

          <section class="detail-section">
            <h2 class="detail-label">Snacks y comida</h2>
            <div v-if="activeCafe.snacks.length" class="tag-row"><span v-for="s in activeCafe.snacks" :key="s" class="tag tag-food">{{ s }}</span></div>
            <p v-else class="muted">Sin confirmar.</p>
          </section>

          <section class="detail-section">
            <h2 class="detail-label">Horario</h2>
            <ul v-if="activeCafe.schedule" class="schedule">
              <li v-for="day in activeCafe.schedule" :key="day.dayId" :class="{ 'is-today': day.dayId === todayId }">
                <span>{{ day.name }}</span>
                <span v-if="!day.closed">{{ formatTime(day.open) }} – {{ formatTime(day.close) }}</span>
                <span v-else class="muted">Cerrado</span>
              </li>
            </ul>
            <p v-else class="muted">Sin horario confirmado.</p>
          </section>

          <div class="detail-actions">
            <a class="btn btn-primary" :href="directionsUrl(activeCafe)" target="_blank" rel="noopener">Cómo llegar</a>
            <a class="btn" :href="issueUrl(activeCafe)" target="_blank" rel="noopener">¿Falta algo? Aporta datos</a>
          </div>
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
              <input class="search-input" type="search" v-model="query" placeholder="Buscar por nombre, barrio, snack…" autocomplete="off" aria-label="Buscar cafetería" />
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
                <span class="filter-label">Disponibilidad</span>
                <div class="chip-group">
                  <button class="chip" :class="{ active: openNow }" @click="openNow = !openNow" type="button" title="Solo locales con horario confirmado">Abierto ahora</button>
                  <button class="chip" :class="{ active: userPos }" @click="locate" type="button" title="Ordena por distancia">Cerca de mí</button>
                </div>
                <p v-if="geoMsg" class="muted small">{{ geoMsg }}</p>
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
                  <span class="card-sub">{{ cafe.neighborhood }}<template v-if="userPos"> · {{ distanceText(cafe) }}</template></span>
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
        <div class="map-legend" aria-hidden="true">
          <span><i class="pin-dot pin-especialidad"></i> Especialidad</span>
          <span><i class="pin-dot pin-cafeteria"></i> Cafetería</span>
        </div>
      </section>

      <div class="mobile-switch" role="tablist" aria-label="Vista">
        <button :class="{ active: mobileView === 'list' }" @click="setMobileView('list')" type="button">☰ Lista</button>
        <button :class="{ active: mobileView === 'map' }" @click="setMobileView('map')" type="button">🗺️ Mapa</button>
      </div>
    </div>

    <!-- ═════════ APRENDE ═════════ -->
    <div v-show="view === 'wiki'" class="wiki-page">
      <div class="wiki-container">
        <nav class="wiki-nav" aria-label="Índice">
          <button v-for="t in wikiTabs" :key="t.id" class="wiki-nav-item" :class="{ active: wikiTab === t.id }" @click="wikiTab = t.id" type="button">
            <span aria-hidden="true">{{ t.icon }}</span> {{ t.title }}
          </button>
        </nav>

        <main class="wiki-content">
          <article v-if="wikiArticle" class="wiki-article">
            <h1 class="wiki-h1">{{ wikiArticle.icon }} {{ wikiArticle.title }}</h1>
            <p class="wiki-lead">{{ wikiArticle.lead }}</p>
            <section v-for="sec in wikiArticle.sections" :key="sec.subtitle" class="wiki-section">
              <h3 class="wiki-h3">{{ sec.subtitle }}</h3>
              <p class="wiki-p">{{ sec.text }}</p>
            </section>
          </article>

          <article v-else-if="wikiTab === 'metodos'" class="wiki-article">
            <h1 class="wiki-h1">☕ Métodos de preparación</h1>
            <p class="wiki-lead">Las formas más comunes de preparar café en una cafetería o en casa.</p>
            <div class="wiki-grid">
              <section v-for="(m, name) in WIKI_DATA.methods" :key="name" class="wiki-card" :id="'method-' + name">
                <h3 class="wiki-card-title">{{ m.icon }} {{ m.title }}</h3>
                <p class="wiki-card-desc">{{ m.description }}</p>
                <p class="wiki-p">{{ m.details }}</p>
                <dl class="wiki-meta">
                  <div><dt>Molienda</dt><dd>{{ m.grind }}</dd></div>
                  <div><dt>Tiempo</dt><dd>{{ m.time }}</dd></div>
                  <div><dt>Ratio</dt><dd>{{ m.ratio }}</dd></div>
                </dl>
              </section>
            </div>
          </article>

          <article v-else-if="wikiTab === 'bebidas'" class="wiki-article">
            <h1 class="wiki-h1">🥛 Bebidas</h1>
            <p class="wiki-lead">Del guayoyo de casa al flat white de especialidad.</p>
            <div class="wiki-grid">
              <section v-for="d in WIKI_DATA.drinks" :key="d.name" class="wiki-card">
                <h3 class="wiki-card-title">{{ d.name }}</h3>
                <p class="wiki-p">{{ d.text }}</p>
              </section>
            </div>
          </article>

          <article v-else-if="wikiTab === 'glosario'" class="wiki-article">
            <h1 class="wiki-h1">🔤 Glosario</h1>
            <p class="wiki-lead">Palabras que verás en las cartas y en las bolsas de café.</p>
            <dl class="wiki-glossary">
              <div v-for="g in WIKI_DATA.glossary" :key="g.term"><dt>{{ g.term }}</dt><dd>{{ g.text }}</dd></div>
            </dl>
          </article>
        </main>
      </div>
    </div>

    <footer class="app-footer">
      Datos de cafeterías © colaboradores de <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> (ODbL) ·
      <a :href="repoUrl" target="_blank" rel="noopener">Contribuir en GitHub</a>
    </footer>
  `,

  setup() {
    const view = ref('map');          // 'map' | 'wiki'
    const mobileView = ref('list');   // 'list' | 'map' (solo móvil)
    const wikiTab = ref('historia');

    const query = ref('');
    const selTypes = ref([]);
    const selMethods = ref([]);
    const selSnacks = ref([]);
    const selHood = ref('');
    const openNow = ref(false);
    const filtersOpen = ref(false);
    const userPos = ref(null);
    const geoMsg = ref('');
    let userMarker = null;

    const activeId = ref(null);
    const hoverId = ref(null);
    const listEl = ref(null);

    const map = shallowRef(null);
    let cluster = null;
    const markers = {};
    const totalCount = CAFES_DATA.length;

    const activeCafe = computed(() => CAFES_DATA.find(c => c.id === activeId.value) || null);
    const activeStatus = computed(() => activeCafe.value ? getStatus(activeCafe.value.schedule) : null);
    const todayId = computed(() => caracasNow().day);

    const wikiTabs = [
      ...WIKI_DATA.articles.map(a => ({ id: a.id, icon: a.icon, title: a.title })),
      { id: 'metodos', icon: '☕', title: 'Métodos' },
      { id: 'bebidas', icon: '🥛', title: 'Bebidas' },
      { id: 'glosario', icon: '🔤', title: 'Glosario' },
    ];
    const wikiArticle = computed(() => WIKI_DATA.articles.find(a => a.id === wikiTab.value) || null);

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
      if (openNow.value && getStatus(cafe.schedule).state !== 'open') return false;
      return true;
    }

    const filteredCafes = computed(() => {
      const list = CAFES_DATA.filter(c => matches(c));
      const me = userPos.value;
      return me
        ? list.sort((a, b) => distanceKm(me, a) - distanceKm(me, b))
        : list.sort((a, b) => a.name.localeCompare(b.name, 'es'));
    });

    const distanceText = (cafe) => {
      if (!userPos.value) return '';
      const km = distanceKm(userPos.value, cafe);
      return km < 1 ? `${Math.round(km * 10) * 100} m` : `${km.toFixed(1)} km`;
    };

    function locate() {
      if (userPos.value) {
        userPos.value = null; geoMsg.value = '';
        if (userMarker && map.value) { map.value.removeLayer(userMarker); userMarker = null; }
        return;
      }
      if (!navigator.geolocation) { geoMsg.value = 'Tu navegador no permite ubicarte.'; return; }
      geoMsg.value = 'Buscando tu ubicación…';
      navigator.geolocation.getCurrentPosition((pos) => {
        userPos.value = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const inZone = ZONE_BOUNDS.pad(0.5).contains([userPos.value.lat, userPos.value.lng]);
        geoMsg.value = inZone ? '' : 'Estás lejos de Caracas; las distancias son desde tu ubicación.';
        if (map.value) {
          userMarker = L.circleMarker([userPos.value.lat, userPos.value.lng], { radius: 8, color: '#fff', weight: 3, fillColor: '#2f6fdb', fillOpacity: 1 }).addTo(map.value);
          if (inZone) map.value.flyTo([userPos.value.lat, userPos.value.lng], 15, { duration: 0.8 });
        }
      }, () => { geoMsg.value = 'No pudimos obtener tu ubicación (revisa el permiso del navegador).'; },
      { enableHighAccuracy: true, timeout: 10000 });
    }

    // Cuántos resultados daría cada opción de filtro con el resto de filtros aplicados
    const facet = computed(() => {
      const count = (skip, pick) => {
        const out = {};
        CAFES_DATA.filter(c => matches(c, skip)).forEach(c => pick(c).forEach(v => { out[v] = (out[v] || 0) + 1; }));
        return out;
      };
      return {
        type: count('type', c => [c.type]),
        method: count('method', c => c.methods),
        snack: count('snack', c => c.snacks),
      };
    });

    const activeFilterCount = computed(() =>
      selTypes.value.length + selMethods.value.length + selSnacks.value.length + (selHood.value ? 1 : 0) + (openNow.value ? 1 : 0));

    // La plantilla desenvuelve los refs, así que el filtro se indica por nombre
    const filterRefs = { types: selTypes, methods: selMethods, snacks: selSnacks };
    function toggle(name, value) {
      const r = filterRefs[name];
      r.value = r.value.includes(value) ? r.value.filter(v => v !== value) : [...r.value, value];
    }
    function clearFilters() {
      query.value = ''; selTypes.value = []; selMethods.value = []; selSnacks.value = []; selHood.value = ''; openNow.value = false;
    }

    const statusOf = (cafe) => getStatus(cafe.schedule);
    const directionsUrl = (c) => `https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}`;

    // ── Selección ──────────────────────────────────────────
    function select(cafe, { fly = true } = {}) {
      activeId.value = cafe.id;
      document.title = `${cafe.name} · Cafecito Caracas`;
      if (window.matchMedia('(max-width: 860px)').matches) mobileView.value = 'list';
      if (map.value && fly) {
        map.value.flyTo([cafe.lat, cafe.lng], Math.max(map.value.getZoom(), 16), { duration: 0.7 });
      }
      refreshIcons();
    }
    function closeDetail() {
      activeId.value = null;
      document.title = 'Cafecito Caracas · Mapa de cafeterías';
      refreshIcons();
      nextTick(() => fitToResults());
    }
    function setMobileView(v) {
      mobileView.value = v;
      if (v === 'map') nextTick(() => map.value && map.value.invalidateSize());
    }
    function openWikiMethod(name) {
      view.value = 'wiki';
      wikiTab.value = 'metodos';
      nextTick(() => {
        const el = document.getElementById('method-' + name);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }

    // ── Mapa ───────────────────────────────────────────────
    function refreshIcons() {
      Object.entries(markers).forEach(([id, marker]) => {
        const cafe = CAFES_DATA.find(c => c.id === Number(id));
        marker.setIcon(createMarkerIcon(cafe, Number(id) === activeId.value));
      });
    }

    function syncMarkers() {
      if (!cluster) return;
      cluster.clearLayers();
      cluster.addLayers(filteredCafes.value.map(c => markers[c.id]));
    }

    function fitToResults() {
      if (!map.value) return;
      const list = filteredCafes.value;
      if (!list.length) return;
      const bounds = (activeFilterCount.value || query.value.trim())
        ? L.latLngBounds(list.map(c => [c.lat, c.lng])).pad(0.2)
        : ZONE_BOUNDS;
      map.value.flyToBounds(bounds, { maxZoom: 16, duration: 0.6 });
    }

    watch(filteredCafes, () => {
      syncMarkers();
      if (!activeId.value) fitToResults();
    }, { flush: 'post' });

    watch(view, (v) => { if (v === 'map') nextTick(() => map.value && map.value.invalidateSize()); });

    onMounted(() => {
      nextTick(() => {
        const m = L.map('map', { zoomControl: false, attributionControl: true, minZoom: 10, maxZoom: 19 });
        L.control.zoom({ position: 'bottomright' }).addTo(m);
        m.fitBounds(ZONE_BOUNDS);
        map.value = m;

        L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19, className: 'base-tiles' }).addTo(m);

        cluster = L.markerClusterGroup({
          showCoverageOnHover: false,
          maxClusterRadius: 42,
          disableClusteringAtZoom: 16,
          iconCreateFunction: clusterIcon,
        });
        CAFES_DATA.forEach((cafe) => {
          const marker = L.marker([cafe.lat, cafe.lng], { icon: createMarkerIcon(cafe, false), title: cafe.name, keyboard: true });
          marker.bindTooltip(cafe.name, { direction: 'top', offset: [0, -16], className: 'pin-tip' });
          marker.on('click', () => select(cafe));
          marker.on('mouseover', () => { hoverId.value = cafe.id; });
          marker.on('mouseout', () => { hoverId.value = null; });
          markers[cafe.id] = marker;
        });
        m.addLayer(cluster);
        syncMarkers();
        setTimeout(() => m.invalidateSize(), 250);
      });
    });

    onUnmounted(() => { if (map.value) { map.value.remove(); map.value = null; } });

    return {
      WIKI_DATA, TYPE_INFO, TYPE_OPTIONS, METHOD_OPTIONS, SNACK_OPTIONS, HOOD_OPTIONS,
      repoUrl: REPO_URL, totalCount, cupIcon: CUP_SVG,
      view, mobileView, wikiTab, wikiTabs, wikiArticle,
      query, selTypes, selMethods, selSnacks, selHood, openNow, filtersOpen,
      activeId, hoverId, listEl, activeCafe, activeStatus, todayId,
      filteredCafes, facet, activeFilterCount, userPos, geoMsg, locate, distanceText,
      toggle, clearFilters, select, closeDetail, setMobileView, openWikiMethod,
      statusOf, directionsUrl, issueUrl, formatTime,
    };
  },
};

createApp(App).mount('#app');
