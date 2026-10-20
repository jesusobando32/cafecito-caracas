// Simula Overpass (sin depender de que el servicio público esté arriba) y comprueba la búsqueda en vivo:
// - llegan locales nuevos y se mezclan con los curados, sin duplicar los que ya existen (por id de OSM)
// - el primer servidor que responde gana aunque otros fallen o tarden
// - en móvil (vista alta) la búsqueda también arranca sola, con una zona recortada alrededor del centro
// Se ejecuta en escritorio y móvil. Esperado: ok:true.
async page => {
  const hits = { n: 0, bodies: [] };
  const els = [
    { type: 'node', id: 900001, lat: 10.4806, lon: -66.9036, tags: { amenity: 'cafe', name: 'Café Simulado Uno', opening_hours: 'Mo-Su 08:00-18:00' } },
    { type: 'node', id: 900002, lat: 10.4900, lon: -66.8800, tags: { amenity: 'cafe', name: 'Café Simulado Dos' } },
    { type: 'node', id: 8362532414, lat: 10.499032, lon: -66.843504, tags: { amenity: 'cafe', name: 'Quiero 1 Café' } },   // ya existe en los curados: no debe duplicarse
  ];
  let rutas = 0;
  const handler = async (route) => {
    const url = route.request().url(); rutas++; hits.n++; hits.bodies.push(decodeURIComponent(route.request().postData() || '').slice(0, 160));
    if (url.includes('overpass-api.de')) return route.fulfill({ status: 502, body: 'at capacity' });                         // falla rápido
    if (url.includes('private.coffee')) { await new Promise(r => setTimeout(r, 1500)); return route.fulfill({ json: { elements: els } }); }   // responde tarde
    return route.fulfill({ json: { elements: els } });
  };
  await page.route(/overpass/, handler);
  await page.goto('http://localhost:8765/?b=' + Date.now()); await page.evaluate(() => localStorage.clear());
  await page.goto('http://localhost:8765/?b=' + Date.now());
  await page.waitForFunction(() => /En vivo/.test((document.querySelector('.live-status') || {}).innerText || ''), null, { timeout: 30000 }).catch(() => {});
  const estado = (await page.locator('.live-status').first().innerText()).replace(/\n/g, ' ');
  const total = await page.evaluate(() => document.querySelectorAll('.cafe-card').length);
  const curados = await page.evaluate(() => CAFES_DATA.length);
  await page.locator('.search-input').fill('Simulado'); await page.waitForTimeout(300);
  const simulados = await page.locator('.cafe-card').count();
  await page.locator('.search-input').fill('Quiero 1'); await page.waitForTimeout(300);
  const duplicado = await page.locator('.cafe-card').count();
  await page.unroute(/overpass/, handler);   // la regla persiste en la sesión: se quita para no afectar a otras pruebas
  const ok = /En vivo/.test(estado) && total === curados + 2 && simulados === 2 && duplicado === 1;
  return { ok, w: page.viewportSize().width, estado, totalTarjetas: total, curados, simulados, quiero1: duplicado, peticiones: hits.n, primeraConsulta: hits.bodies[0] };
}
