async page => {
  const out = { errors: [], notes: [] };
  page.on('pageerror', e => out.errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/overpass|ERR_FAILED|CORS|Failed to load resource/i.test(m.text())) out.errors.push(m.text()); });
  const vp = page.viewportSize(); out.notes.push('viewport ' + JSON.stringify(vp));
  await page.goto('http://localhost:8765/?t=' + Date.now()); await page.waitForTimeout(3000);
  const st = () => page.evaluate(() => ({ cls: document.querySelector('.app-body').className, h: Math.round(document.querySelector('.sidebar').getBoundingClientRect().height), vh: innerHeight }));
  out.peek = await st();
  await page.screenshot({ path: 'mov-peek.png' });
  // clip del asa/filtros en peek: ¿qué elementos quedan cortados por el borde del panel?
  out.peekClipped = await page.evaluate(() => { const sb = document.querySelector('.sidebar').getBoundingClientRect(); return [...document.querySelectorAll('.sidebar .search-wrap, .sidebar .filters-toggle, .sidebar .results-count')].map(e => { const r = e.getBoundingClientRect(); return e.className + ': ' + (r.bottom > sb.bottom + 1 ? 'CORTADO' : r.top >= sb.bottom ? 'fuera' : 'ok'); }); });
  await page.locator('.sheet-handle').click(); await page.waitForTimeout(500); out.afterTap = await st();
  await page.screenshot({ path: 'mov-half.png' });
  // seleccionar un local desde la lista
  await page.getByText('Gran Café').first().click(); await page.waitForTimeout(1800);
  out.afterSelect = await st();
  out.detailScroll = await page.evaluate(() => document.querySelector('.sidebar').scrollTop);
  await page.screenshot({ path: 'mov-ficha.png' });
  // arrastrar el asa hacia arriba (touch no disponible: mouse)
  const hb = await page.locator('.sheet-handle').boundingBox();
  await page.mouse.move(hb.x + hb.width / 2, hb.y + 10); await page.mouse.down(); await page.mouse.move(hb.x + hb.width / 2, hb.y - 200, { steps: 6 }); await page.mouse.up(); await page.waitForTimeout(500);
  out.afterDragUp = await st();
  await page.mouse.move(hb.x + hb.width / 2, 120); // fuera
  // tocar el mapa para bajar
  await page.mouse.click(vp.width / 2, 80); await page.waitForTimeout(500); out.afterMapTap = await st();
  // Aprende en móvil
  if (await page.locator('.nav-toggle').isVisible()) await page.locator('.nav-toggle').click(); await page.getByRole('link', { name: 'Guía', exact: true }).click(); await page.waitForTimeout(600);
  out.aprende = await page.evaluate(() => ({ title: document.title, sw: document.documentElement.scrollWidth, iw: innerWidth, hash: location.hash }));
  await page.screenshot({ path: 'mov-aprende.png' });
  await page.goBack().catch(() => {}); await page.waitForTimeout(500);
  out.backFromAprende = await page.evaluate(() => ({ hash: location.hash, mapVisible: !!document.querySelector('.app-body') && getComputedStyle(document.querySelector('.app-body')).display !== 'none' }));
  return out;
}
