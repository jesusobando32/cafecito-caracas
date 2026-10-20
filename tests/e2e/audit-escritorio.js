async page => {
  const out = { errors: [], broken: [], overflow: [], notes: [] };
  page.on('pageerror', e => out.errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/overpass|ERR_FAILED|CORS|Failed to load resource/i.test(m.text())) out.errors.push(m.text()); });
  const vp = page.viewportSize();
  const check = async (label) => {
    await page.waitForTimeout(700);
    const r = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth, iw: innerWidth,
      broken: [...document.images].filter(i => i.complete && i.naturalWidth === 0 && i.offsetParent).map(i => i.src.split('/').slice(-2).join('/')),
      over: [...document.querySelectorAll('body *')].filter(e => { const b = e.getBoundingClientRect(); return b.width > 0 && b.right > innerWidth + 1 && !e.closest('.leaflet-container,.toc ul,.maplibregl-map'); }).slice(0, 3).map(e => e.tagName + '.' + e.className),
    }));
    if (r.sw > r.iw + 1 || r.over.length) out.overflow.push(label + ' ' + JSON.stringify(r.over));
    r.broken.forEach(b => out.broken.push(label + ': ' + b));
  };
  await page.goto('http://localhost:8765/?t=' + Date.now()); await page.waitForTimeout(2500);
  await check('mapa');
  // ficha de Gran Café
  await page.getByText('Gran Café').first().click(); await page.waitForTimeout(1500); await check('ficha');
  const href = await page.locator('.minimap-link').getAttribute('href'); out.notes.push('minimap href: ' + href);
  out.notes.push('mapas leaflet en ficha: ' + await page.locator('#minimap.leaflet-container').count());
  await page.screenshot({ path: `${vp.width}-ficha.png` });
  await page.locator('.detail-back').click(); await page.waitForTimeout(400);
  // Aprende
  for (const id of ['', 'historia', 'regiones', 'especialidad', 'tipo', 'metodos', 'bebidas', 'glosario']) {
    await page.evaluate(h => { location.hash = h; dispatchEvent(new PopStateEvent('popstate')); }, id ? '#guia/' + id : '#guia');
    await page.waitForTimeout(500);
    await page.evaluate(async () => { const w = document.querySelector('.wiki-page'); for (let y = 0; y < w.scrollHeight; y += 700) { w.scrollTop = y; await new Promise(r => setTimeout(r, 60)); } });
    await check('guia/' + id);
  }
  await page.evaluate(() => { const w = document.querySelector('.wiki-page'); w.scrollTop = 0; });
  await page.evaluate(() => { location.hash = '#guia'; dispatchEvent(new PopStateEvent('popstate')); });
  await page.waitForTimeout(400);
  const det = page.locator('.credits details'); out.notes.push('créditos abiertos por defecto: ' + await det.evaluate(d => d.open));
  await page.evaluate(() => { const w = document.querySelector('.wiki-page'); w.scrollTop = w.scrollHeight; }); await page.waitForTimeout(400);
  await page.screenshot({ path: `${vp.width}-hub-fondo.png` });
  return out;
}
