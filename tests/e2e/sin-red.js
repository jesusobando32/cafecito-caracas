async page => {
  const out = { notes: [], errors: [] };
  page.on('pageerror', e => out.errors.push(e.message));
  await page.route(/overpass|tiles\.openfreemap|openstreetmap\.org\/.*png/i, r => r.abort());
  await page.goto('http://localhost:8765/?o=' + Date.now()); await page.waitForTimeout(6000);
  out.notes.push('estado en vivo: ' + (await page.locator('.live-status').innerText()).replace(/\n/g, ' '));
  out.notes.push('lista sigue funcionando: ' + await page.locator('.cafe-card').count() + ' tarjetas');
  out.notes.push('mapa base de respaldo (raster) o GL: gl=' + await page.locator('.maplibregl-canvas').count() + ' raster=' + await page.locator('#map .leaflet-tile').count());
  await page.locator('.cafe-card').first().click(); await page.waitForTimeout(800);
  out.notes.push('ficha abre: ' + await page.locator('.detail-name').innerText());
  await page.unroute(/overpass|tiles\.openfreemap|openstreetmap\.org\/.*png/i);   // la regla de bloqueo persiste en la sesión: se quita para no afectar a otras pruebas
  return out;
}
