async page => {
  const out = { overflow: [], notes: [], errors: [] };
  page.on('pageerror', e => out.errors.push(e.message));
  const long = 'Cafetería-' + 'SuperLargoSinEspacios'.repeat(12);
  const mk = (id, name, extra = {}) => Object.assign({ id, osm: id, name, type: 'cafeteria', typeConfirmed: false, neighborhood: 'Barrio '.repeat(15), address: 'Calle '.repeat(40), lat: 10.48 + Math.random() * 0.01, lng: -66.9 + Math.random() * 0.01, schedule: null, methods: [], drinks: [], snacks: [], description: 'Texto '.repeat(120), sources: [] }, extra);
  await page.goto('http://localhost:8765/?s=' + Date.now());
  await page.evaluate((cafes) => localStorage.setItem('cafecito-live-v1', JSON.stringify({ t: Date.now(), cafes })), [
    mk('n9001', long), mk('n9002', '☕🔥 Café ñandú 日本語 العربية'), mk('n9003', 'A'), mk('n9004', 'x@' + 'y'.repeat(120) + '.com'),
    mk('n9005', 'Con horario raro', { schedule: [1, 2, 3, 4, 5, 6, 0].map(d => ({ dayId: d, name: 'Día', closed: false, open: '07:00', close: '26:00', ranges: [['07:00', '12:00'], ['13:00', '26:00']] })) }),
  ]);
  await page.goto('http://localhost:8765/?s=' + Date.now()); await page.waitForTimeout(2500);
  const ov = async (label) => { await page.waitForTimeout(500); const r = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth, over: [...document.querySelectorAll('.sidebar *, .detail *')].filter(e => { const b = e.getBoundingClientRect(); const sb = document.querySelector('.sidebar').getBoundingClientRect(); return b.width > 0 && b.right > sb.right + 1 && !e.closest('.leaflet-container'); }).slice(0, 3).map(e => e.tagName + '.' + e.className) })); if (r.sw > r.iw + 1 || r.over.length) out.overflow.push(label + ' ' + JSON.stringify(r)); };
  await page.locator('.search-input').fill('Cafetería-Super'); await ov('lista larga');
  await page.locator('.cafe-card').first().click(); await ov('ficha nombre largo');
  await page.locator('.detail-back').click(); await page.locator('.search-input').fill('日本'); await ov('lista unicode');
  await page.locator('.cafe-card').first().click(); await ov('ficha unicode');
  await page.locator('.detail-back').click(); await page.locator('.search-input').fill('horario raro'); await page.locator('.cafe-card').first().click(); await page.waitForTimeout(500);
  out.notes.push('horario raro: ' + await page.locator('.schedule li').first().innerText().catch(() => 'sin lista') + ' | estado: ' + await page.locator('.detail .status').innerText());
  await page.locator('.detail-back').click(); await page.locator('.search-input').fill('zzzzzz'); out.notes.push('vacío: ' + (await page.locator('.empty-title').innerText()));
  return out;
}
