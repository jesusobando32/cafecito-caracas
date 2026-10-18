// ============================================================
//  QUIERO UN CAFÉ — Vue 3 Application (v3.0)
//  Real Data, Dynamic UI, Better Markers
// ============================================================

'use strict';

// ── Defensive guards — fail fast with clear error messages ───
if (typeof Vue === 'undefined') {
  throw new Error('[Quiero un Café] Vue 3 not loaded. Check CDN link in index.html');
}
if (typeof L === 'undefined') {
  throw new Error('[Quiero un Café] Leaflet not loaded. Check CDN link in index.html');
}
if (typeof CAFES_DATA === 'undefined' || !Array.isArray(CAFES_DATA)) {
  throw new Error('[Quiero un Café] CAFES_DATA not found. Ensure data/cafes.js loads before app.js');
}

// ── Destructure Vue 3 APIs from the global Vue build ────────
const {
  createApp, ref, computed, watch, nextTick, shallowRef, onMounted, onUnmounted
} = Vue;

// ════════════════════════════════════════════════════════════
//  CONSTANTS & MOCK MENUS/GALLERIES
// ════════════════════════════════════════════════════════════

const RATING_OPTIONS = [
  { label: 'Todos', value: 0 },
  { label: '4+',    value: 4 },
  { label: '4.5+',  value: 4.5 },
  { label: '4.8+',  value: 4.8 },
];
const PRICE_OPTIONS = ['$', '$$', '$$$'];
const METHOD_OPTIONS = [...new Set(CAFES_DATA.flatMap(c => c.coffeeMethods))].sort();
const FOOD_OPTIONS = [...new Set(CAFES_DATA.flatMap(c => c.food))].sort();

function starsFromRating(rating) {
  const full = Math.round(rating);
  return '★'.repeat(Math.max(0, full)) + '☆'.repeat(Math.max(0, 5 - full));
}

// Helper to determine if a cafe is currently open
function getCafeStatus(schedule) {
  if (!schedule) return { isOpen: false, text: 'Horario no disponible' };
  
  const now = new Date();
  const currentDayId = now.getDay(); // 0 = Sunday, 1 = Monday...
  const currentHourStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
  
  const todaySchedule = schedule.find(s => s.dayId === currentDayId);
  if (!todaySchedule || todaySchedule.closed) {
    return { isOpen: false, text: 'Cerrado ahora' };
  }
  
  if (currentHourStr >= todaySchedule.open && currentHourStr <= todaySchedule.close) {
    return { isOpen: true, text: `Abierto hasta las ${formatTime(todaySchedule.close)}` };
  }
  return { isOpen: false, text: 'Cerrado ahora' };
}

function formatTime(time24) {
  if (!time24) return '';
  const [h, m] = time24.split(':');
  let hours = parseInt(h, 10);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${m} ${ampm}`;
}

// Generate dynamic menus for all 12 cafes
const CAFE_MENUS = {};
const defaultMenuItems = [
  { name: 'Espresso', price: '$2.00', desc: 'Sabor intenso y concentrado' },
  { name: 'Latte', price: '$3.50', desc: 'Espresso con leche cremosa' },
  { name: 'Cold Brew', price: '$4.00', desc: 'Extracción en frío por 18h' },
  { name: 'Croissant', price: '$2.50', desc: 'De mantequilla, horneado hoy' },
  { name: 'Tostada de Aguacate', price: '$5.00', desc: 'Pan de masa madre, aguacate fresco' }
];
CAFES_DATA.forEach(c => { CAFE_MENUS[c.id] = defaultMenuItems; });

// Generate galleries for all 12 cafes
const CAFE_GALLERIES = {};
const galleryPool = [
  'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&q=75',
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=75',
  'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=400&q=75',
  'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=75',
  'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=400&q=75'
];
CAFES_DATA.forEach(c => { 
  // Pick 3 random images for gallery
  CAFE_GALLERIES[c.id] = [galleryPool[c.id%5], galleryPool[(c.id+1)%5], galleryPool[(c.id+2)%5]]; 
});

// XSS-safe popup DOM builder
function buildPopupDOM(cafe, onDetailClick) {
  const root = document.createElement('div');
  root.className = 'map-popup';

  const nameEl = document.createElement('p');
  nameEl.className = 'popup-name';
  nameEl.textContent = cafe.name;

  const status = getCafeStatus(cafe.schedule);
  const statusEl = document.createElement('p');
  statusEl.className = 'popup-neighborhood';
  statusEl.style.color = status.isOpen ? '#059669' : '#dc2626';
  statusEl.textContent = `📍 ${cafe.neighborhood} • ${status.text}`;

  const metaRow = document.createElement('div');
  metaRow.className = 'popup-meta-row';

  const starsWrap = document.createElement('span');
  const starsEl = document.createElement('span');
  starsEl.className = 'popup-stars';
  starsEl.textContent = starsFromRating(cafe.rating);
  
  const ratingNum = document.createElement('span');
  ratingNum.className = 'popup-rating-num';
  ratingNum.textContent = cafe.rating.toFixed(1);
  
  starsWrap.appendChild(starsEl);
  starsWrap.appendChild(ratingNum);

  const priceEl = document.createElement('span');
  priceEl.className = 'popup-price';
  priceEl.textContent = cafe.price;

  metaRow.appendChild(starsWrap);
  metaRow.appendChild(priceEl);

  const btn = document.createElement('button');
  btn.className = 'popup-detail-btn';
  btn.textContent = 'Ver detalles →';
  btn.setAttribute('type', 'button');
  btn.addEventListener('click', onDetailClick);

  root.appendChild(nameEl);
  root.appendChild(statusEl);
  root.appendChild(metaRow);
  root.appendChild(btn);

  return root;
}

function createMarkerIcon(cafe, highlighted = false) {
  const maxLen = 18;
  const label = cafe.name.length > maxLen ? cafe.name.slice(0, maxLen - 1) + '…' : cafe.name;
  const highlightClass = highlighted ? 'is-highlighted' : '';
  const escapedLabel = label.replace(/[&<>"']/g, match => {
    return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[match];
  });
  
  // Real map marker aesthetic
  const html = `<div class="custom-marker-wrap">
    <div class="marker-label ${highlightClass}" role="img" aria-label="${escapedLabel}">
      <span class="marker-icon">☕</span> ${escapedLabel}
    </div>
  </div>`;

  return L.divIcon({
    html,
    className: '',
    iconSize: [140, 40],
    iconAnchor: [70, 40],
    popupAnchor: [0, -42],
  });
}


// ════════════════════════════════════════════════════════════
//  ROOT VUE COMPONENT
// ════════════════════════════════════════════════════════════
const App = {
  template: `
    <header class="app-header" role="banner">
      <a class="app-logo" href="#" @click.prevent="currentView = 'home'" aria-label="Quiero un Café — Inicio">
        <span class="app-logo-icon" aria-hidden="true">☕</span>
        <span class="app-logo-text">Quiero un <span class="accent">café</span></span>
      </a>
      
      <!-- Navegación Principal -->
      <nav class="main-nav">
        <button 
          class="nav-btn" 
          :class="{ active: currentView === 'home' }" 
          @click="currentView = 'home'"
        >📍 Mapa de Cafeterías</button>
        <button 
          class="nav-btn" 
          :class="{ active: currentView === 'wiki' }" 
          @click="currentView = 'wiki'"
        >📖 Cultura y Aprender</button>
      </nav>

      <div class="header-right">
        <span class="header-badge" aria-live="polite">
          <span class="header-badge-text">Caracas · </span>
          {{ filteredCafes.length }}/{{ totalCount }} cafés
        </span>
      </div>
    </header>

    <!-- ── VISTA PRINCIPAL: MAPA Y DIRECTORIO ──────────────── -->
    <div v-show="currentView === 'home'" class="app-body">
      
      <!-- PANEL LATERAL IZQUIERDO: DIRECTORIO -->
      <aside class="sidebar" aria-label="Filtros">
        <section class="filter-panel" aria-label="Panel de filtros">
          <div class="search-wrap" style="margin-bottom: 8px;">
            <span class="search-icon" aria-hidden="true">🔍</span>
            <input id="cafe-search" class="search-input" type="search" v-model="searchQuery" placeholder="Buscar cafetería..." autocomplete="off" />
            <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''" type="button">✕</button>
          </div>
          <div class="filter-row">
            <div class="filter-group">
              <span class="filter-label">⭐ Calificación</span>
              <div class="pill-group">
                <button v-for="opt in RATING_OPTIONS" :key="opt.value" class="pill" :class="{ active: minRating === opt.value }" @click="minRating = opt.value" type="button">{{ opt.label }}</button>
              </div>
            </div>
            <div class="filter-group">
              <span class="filter-label">💰 Precio</span>
              <div class="pill-group">
                <button v-for="p in PRICE_OPTIONS" :key="p" class="pill" :class="{ active: selectedPrices.includes(p) }" @click="togglePrice(p)" type="button">{{ p }}</button>
              </div>
            </div>
            <div class="filter-group">
              <span class="filter-label">☕ Método</span>
              <div class="pill-group">
                <button v-for="m in METHOD_OPTIONS" :key="m" class="pill" :class="{ active: selectedMethods.includes(m) }" @click="toggleMethod(m)" type="button">{{ m }}</button>
              </div>
            </div>
            <Transition name="fade">
              <button v-if="hasActiveFilters" class="btn-clear-filters" @click="clearFilters" type="button">✕ Limpiar</button>
            </Transition>
          </div>
        </section>

        <div class="results-header" aria-live="polite">
          <p class="results-count">
            <span class="count-num">{{ filteredCafes.length }}</span> resultados
          </p>
        </div>

        <main id="cafe-list" class="cafe-list" tabindex="-1">
          <div v-if="filteredCafes.length === 0" class="empty-state">
            <div class="empty-icon" aria-hidden="true">🫙</div>
            <p class="empty-title">Sin resultados</p>
            <p class="empty-sub">Prueba con otros filtros.</p>
          </div>

          <TransitionGroup name="card-list" tag="div" style="position: relative;">
            <article
              v-for="cafe in filteredCafes"
              :key="cafe.id"
              class="cafe-card"
              :class="{'is-selected': activeCafeId === cafe.id, 'is-map-highlighted': highlightedCafeId === cafe.id}"
              @click="openDetail(cafe)"
              @keydown.enter.prevent="openDetail(cafe)"
              :ref="el => registerCardRef(cafe.id, el)"
              tabindex="0"
              role="button"
            >
              <div class="card-img-wrap">
                <img :src="cafe.image" :alt="cafe.name" class="card-img" loading="lazy" />
                <div class="card-img-overlay"></div>
                <span class="card-price-badge">{{ cafe.price }}</span>
              </div>
              <div class="card-body">
                <h3 class="card-name">{{ cafe.name }}</h3>
                <p class="card-neighborhood">📍 {{ cafe.neighborhood }}</p>
                <div class="card-meta-row">
                  <span class="stars">{{ starsFromRating(cafe.rating) }}</span>
                  <span class="rating-num">{{ cafe.rating.toFixed(1) }}</span>
                </div>
                <!-- Open/Closed indicator on card -->
                <div class="status-badge" :class="getCafeStatus(cafe.schedule).isOpen ? 'open' : 'closed'">
                  <div class="status-dot"></div>
                  {{ getCafeStatus(cafe.schedule).text }}
                </div>
              </div>
            </article>
          </TransitionGroup>
        </main>
      </aside>

      <!-- MAPA CENTRAL -->
      <div id="map-container">
        <div id="map"></div>
        <div class="map-hint-badge" v-if="!activeCafeId">🗺️ Haz clic en un marcador para explorar</div>
      </div>

      <!-- PANEL LATERAL DERECHO: DETALLES DE CAFETERÍA (Reemplaza al Modal) -->
      <Transition name="slide-right">
        <aside class="detail-sidebar" v-if="activeCafe">
          <div class="detail-hero">
            <img :src="activeCafe.image" :alt="activeCafe.name" class="detail-hero-img" />
            <div class="detail-hero-gradient"></div>
            <div class="detail-hero-content">
              <h1 class="detail-cafe-name">{{ activeCafe.name }}</h1>
              <p class="detail-cafe-slogan">{{ activeCafe.slogan }}</p>
            </div>
            <button class="btn-modal-close" @click="closeDetail" ref="closeButtonRef" aria-label="Cerrar panel">✕</button>
          </div>

          <div class="detail-body">
            <div class="detail-meta-strip">
              <div class="detail-rating-group">
                <span class="detail-stars">{{ starsFromRating(activeCafe.rating) }}</span>
                <span class="detail-rating-num">{{ activeCafe.rating.toFixed(1) }} ({{ activeCafe.reviewCount }})</span>
              </div>
              <span class="detail-price-chip">{{ activeCafe.price }} · {{ activeCafe.priceLabel }}</span>
            </div>

            <!-- Horario Visual -->
            <section class="detail-section">
              <p class="detail-section-label">Horario</p>
              <div class="status-badge" :class="getCafeStatus(activeCafe.schedule).isOpen ? 'open' : 'closed'" style="font-size: 0.85rem; padding: 6px 12px; margin-top: 0">
                <div class="status-dot"></div>
                {{ getCafeStatus(activeCafe.schedule).text }}
              </div>
              <div class="schedule-grid">
                <div 
                  v-for="day in activeCafe.schedule" 
                  :key="day.dayId"
                  class="schedule-row"
                  :class="[
                    day.dayId === new Date().getDay() ? 'is-today' : '',
                    day.closed ? 'is-closed-day' : 'is-open-day'
                  ]"
                >
                  <div class="schedule-day">
                    <div class="schedule-day-dot"></div>
                    {{ day.name }}
                  </div>
                  <div class="schedule-hours" v-if="!day.closed">
                    {{ formatTime(day.open) }} - {{ formatTime(day.close) }}
                  </div>
                  <div class="schedule-closed-text" v-else>Cerrado</div>
                </div>
              </div>
            </section>
            
            <section class="detail-section">
              <p class="detail-section-label">Ubicación</p>
              <div class="detail-info-row">
                <span class="detail-info-icon">📍</span>
                <address style="font-style:normal;">{{ activeCafe.address }}</address>
              </div>
            </section>

            <section class="detail-section">
              <p class="detail-section-label">Menú destacado</p>
              <div class="detail-menu-grid">
                <div v-for="item in cafeMenu" :key="item.name" class="menu-item">
                  <span class="menu-item-name">{{ item.name }}</span>
                  <span class="menu-item-price">{{ item.price }}</span>
                  <span class="menu-item-desc">{{ item.desc }}</span>
                </div>
              </div>
            </section>

            <section class="detail-section">
              <p class="detail-section-label">Métodos de Filtrado (Haz clic para aprender)</p>
              <div class="detail-tags">
                <span 
                  v-for="m in activeCafe.coffeeMethods" 
                  :key="m" 
                  class="detail-tag detail-tag-method clickable-tag" 
                  @click="openWikiMethod(m)"
                  title="Leer más sobre este método"
                >☕ {{ m }}</span>
              </div>
            </section>

            <section class="detail-section">
              <p class="detail-section-label">Comida</p>
              <div class="detail-tags">
                <span v-for="f in activeCafe.food" :key="f" class="detail-tag detail-tag-food">🍽️ {{ f }}</span>
              </div>
            </section>
          </div>
        </aside>
      </Transition>
    </div>

    <!-- ── VISTA EXTRA: ENCICLOPEDIA (WIKI) ──────────────── -->
    <div v-show="currentView === 'wiki'" class="wiki-page">
      <div class="wiki-container">
        
        <!-- Sidebar de la Wiki -->
        <aside class="wiki-sidebar">
          <h2 class="wiki-sidebar-title">📚 Índice</h2>
          <nav class="wiki-nav">
            <button 
              class="wiki-nav-item" 
              :class="{ active: activeWikiTab === 'historia' }" 
              @click="activeWikiTab = 'historia'"
            >📖 Historia del Café</button>
            <button 
              class="wiki-nav-item" 
              :class="{ active: activeWikiTab === 'especialidad' }" 
              @click="activeWikiTab = 'especialidad'"
            >🌱 Café de Especialidad</button>
            <button 
              class="wiki-nav-item" 
              :class="{ active: activeWikiTab === 'metodos' }" 
              @click="activeWikiTab = 'metodos'"
            >☕ Métodos de Filtrado</button>
          </nav>
        </aside>

        <!-- Contenido de la Wiki -->
        <main class="wiki-content">
          
          <!-- Secciones Generales (Historia / Especialidad) -->
          <div v-if="activeWikiTab !== 'metodos'" class="wiki-article">
            <h1 class="wiki-h1">{{ activeWikiGeneralData.title }}</h1>
            <section v-for="(sec, idx) in activeWikiGeneralData.sections" :key="idx" class="wiki-section">
              <h3 class="wiki-h3">{{ sec.subtitle }}</h3>
              <p class="wiki-p">{{ sec.text }}</p>
            </section>
          </div>

          <!-- Sección de Métodos -->
          <div v-if="activeWikiTab === 'metodos'" class="wiki-article">
            <h1 class="wiki-h1">☕ Guía de Métodos de Extracción</h1>
            <p class="wiki-p">Explora los diferentes métodos manuales y máquinas que las cafeterías utilizan para resaltar lo mejor del grano de café.</p>
            
            <div class="wiki-methods-grid">
              <article v-for="(method, name) in WIKI_DATA.methods" :key="name" class="wiki-method-card" :id="'method-' + name">
                <h3 class="wiki-method-title">{{ method.title }}</h3>
                <p class="wiki-method-desc"><strong>{{ method.description }}</strong></p>
                <p class="wiki-method-details">{{ method.details }}</p>
                <div class="wiki-method-meta">
                  <span><strong>⚙️ Molienda:</strong> {{ method.grind }}</span>
                  <span><strong>⏱️ Tiempo:</strong> {{ method.time }}</span>
                </div>
              </article>
            </div>
          </div>

        </main>
      </div>
    </div>
  `,

  setup() {
    // Layout State
    const currentView = ref('home'); // 'home' | 'wiki'
    const activeWikiTab = ref('historia'); // 'historia' | 'especialidad' | 'metodos'

    // Directory State
    const searchQuery = ref('');
    const minRating = ref(0);
    const selectedPrices = ref([]);
    const selectedMethods = ref([]);

    const activeCafe = shallowRef(null);
    const activeCafeId = ref(null);
    const highlightedCafeId = ref(null);
    
    const closeButtonRef = ref(null);
    const cardRefs = {};

    const leafletMap = shallowRef(null);
    const leafletMarkers = {};
    const totalCount = CAFES_DATA.length;

    const filteredCafes = computed(() => {
      const q = searchQuery.value.toLowerCase().trim();
      return CAFES_DATA.filter(cafe => {
        if (q && !`${cafe.name} ${cafe.neighborhood} ${cafe.slogan} ${cafe.description}`.toLowerCase().includes(q)) return false;
        if (cafe.rating < minRating.value) return false;
        if (selectedPrices.value.length > 0 && !selectedPrices.value.includes(cafe.price)) return false;
        if (selectedMethods.value.length > 0 && !selectedMethods.value.every(m => cafe.coffeeMethods.includes(m))) return false;
        return true;
      });
    });

    const hasActiveFilters = computed(() => searchQuery.value || minRating.value > 0 || selectedPrices.value.length > 0 || selectedMethods.value.length > 0);
    const cafeMenu = computed(() => activeCafe.value ? CAFE_MENUS[activeCafe.value.id] : []);

    const activeWikiGeneralData = computed(() => {
      if (activeWikiTab.value === 'historia') return WIKI_DATA.general.find(i => i.id === 'historia');
      if (activeWikiTab.value === 'especialidad') return WIKI_DATA.general.find(i => i.id === 'especialidad');
      return {};
    });

    function togglePrice(p) { selectedPrices.value = selectedPrices.value.includes(p) ? selectedPrices.value.filter(x => x !== p) : [...selectedPrices.value, p]; }
    function toggleMethod(m) { selectedMethods.value = selectedMethods.value.includes(m) ? selectedMethods.value.filter(x => x !== m) : [...selectedMethods.value, m]; }
    function clearFilters() { searchQuery.value = ''; minRating.value = 0; selectedPrices.value = []; selectedMethods.value = []; }
    function registerCardRef(cafeId, el) { if (el) cardRefs[cafeId] = el; else delete cardRefs[cafeId]; }
    function scrollToCard(cafeId) { nextTick(() => { const el = cardRefs[cafeId]; if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }); }

    function openDetail(cafe) {
      activeCafe.value = cafe;
      activeCafeId.value = cafe.id;
      document.title = `${cafe.name} · Quiero un Café Caracas`;
      
      const map = leafletMap.value;
      if (map) {
        // Center slightly to the left so the marker isn't hidden by the right panel
        const offsetLng = cafe.lng - 0.012; 
        map.flyTo([cafe.lat, offsetLng], 15, { duration: 0.9 });
        
        const marker = leafletMarkers[cafe.id];
        if (marker) setTimeout(() => marker.openPopup(), 600);
      }
      nextTick(() => { if (closeButtonRef.value) closeButtonRef.value.focus(); });
    }

    function closeDetail() {
      activeCafeId.value = null;
      document.title = 'Quiero un Café · Caracas';
      setTimeout(() => { activeCafe.value = null; }, 300);
      
      // Re-center map to general view
      const map = leafletMap.value;
      if (map) map.flyTo([10.4900, -66.8600], 13, { duration: 0.9 });
    }
    
    // Jump to Wiki Method from Map Detail
    function openWikiMethod(methodName) {
      currentView.value = 'wiki';
      activeWikiTab.value = 'metodos';
      nextTick(() => {
        const el = document.getElementById('method-' + methodName);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }

    function refreshMarkerIcons() {
      const hid = highlightedCafeId.value;
      Object.entries(leafletMarkers).forEach(([id, marker]) => {
        const cafe = CAFES_DATA.find(c => c.id === Number(id));
        if (cafe) marker.setIcon(createMarkerIcon(cafe, Number(id) === hid));
      });
    }

    watch(filteredCafes, (newList) => {
      const map = leafletMap.value;
      if (!map) return;
      const visibleIds = new Set(newList.map(c => c.id));
      CAFES_DATA.forEach(cafe => {
        const marker = leafletMarkers[cafe.id];
        if (!marker) return;
        const isVisible = visibleIds.has(cafe.id);
        const isOnMap = map.hasLayer(marker);
        if (isVisible && !isOnMap) map.addLayer(marker);
        if (!isVisible && isOnMap) map.removeLayer(marker);
      });
    }, { flush: 'post' });
    
    // When returning to home view, make sure map resizes properly
    watch(currentView, (newVal) => {
      if (newVal === 'home') {
        nextTick(() => {
          const map = leafletMap.value;
          if (map) map.invalidateSize();
        });
      }
    });

    onMounted(() => {
      nextTick(() => {
        const mapEl = document.getElementById('map');
        if (!mapEl) return;
        
        const map = L.map('map', { center: [10.4900, -66.8600], zoom: 13, zoomControl: true });
        leafletMap.value = map;

        // ── Tile Layer: Google Maps Normal (Con Calles) ──
        // El usuario necesita calles completas. Eliminamos el parámetro experimental apistyle.
        L.tileLayer(
          'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
          { attribution: '&copy; Google Maps', maxZoom: 20 }
        ).addTo(map);

        CAFES_DATA.forEach(cafe => {
          const marker = L.marker([cafe.lat, cafe.lng], {
            icon: createMarkerIcon(cafe, false),
            title: cafe.name,
            riseOnHover: true,
          });

          const popupDOM = buildPopupDOM(cafe, () => {
            marker.closePopup();
            openDetail(cafe);
          });

          const popup = L.popup({ closeButton: false, className: 'custom-popup', autoPan: true }).setContent(popupDOM);
          marker.bindPopup(popup);
          
          marker.on('popupopen', () => { highlightedCafeId.value = cafe.id; refreshMarkerIcons(); scrollToCard(cafe.id); });
          marker.on('popupclose', () => { if (highlightedCafeId.value === cafe.id) { highlightedCafeId.value = null; refreshMarkerIcons(); } });

          marker.addTo(map);
          leafletMarkers[cafe.id] = marker;
        });

        map.invalidateSize({ pan: false });
        setTimeout(() => map.invalidateSize({ pan: false }), 200);
      });
    });

    onUnmounted(() => {
      if (leafletMap.value) { leafletMap.value.remove(); leafletMap.value = null; }
    });

    return {
      WIKI_DATA,
      RATING_OPTIONS, PRICE_OPTIONS, METHOD_OPTIONS, FOOD_OPTIONS, totalCount,
      searchQuery, minRating, selectedPrices, selectedMethods,
      activeCafe, activeCafeId, highlightedCafeId,
      currentView, activeWikiTab, activeWikiGeneralData,
      closeButtonRef,
      filteredCafes, hasActiveFilters, cafeMenu,
      togglePrice, toggleMethod, clearFilters, openDetail, closeDetail, registerCardRef,
      openWikiMethod,
      starsFromRating, getCafeStatus, formatTime
    };
  }
};

const vueApp = createApp(App);
vueApp.mount('#app');
