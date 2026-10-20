async page => {
  // Simula un local de OSM con nombre malicioso, entrando por la caché local que lee la app al arrancar
  await page.goto('http://localhost:8765/?x=' + Date.now());
  await page.evaluate(() => {
    const evil = { id: 'n999', osm: 'n999', name: '<img src=x onerror="window.__pwned=1">Cafe Malo', type: 'cafeteria', typeConfirmed: false,
      neighborhood: 'Prueba', address: 'Prueba', lat: 10.4806, lng: -66.9036, schedule: null, methods: [], drinks: [], snacks: [], description: '', sources: [] };
    localStorage.setItem('cafecito-live-v1', JSON.stringify({ t: Date.now(), cafes: [evil] }));
  });
  await page.goto('http://localhost:8765/?x=' + Date.now()); await page.waitForTimeout(2500);
  // acercar al punto y pasar el ratón por el pin
  await page.getByText('Cafe Malo').first().click(); await page.waitForTimeout(2500);
  const pin = page.locator('.pin-wrap[aria-label*="Cafe Malo"] .pin').first();
  await pin.hover({ force: true }).catch(() => {}); await page.waitForTimeout(800);
  return { pwned: await page.evaluate(() => window.__pwned === 1), tooltipHTML: await page.evaluate(() => (document.querySelector('.pin-tip') || {}).innerHTML) };
}
