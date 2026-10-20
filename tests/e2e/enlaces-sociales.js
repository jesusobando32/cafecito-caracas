// Botones «Instagram del local» y «Sitio web» de la ficha (datos de OpenStreetMap):
//  - los locales curados con enlaces en data/links.js los muestran, y solo hacia instagram.com / http(s)
//  - un local en vivo con etiquetas de OSM los muestra; entradas peligrosas (javascript:, ruta de publicación) se descartan
//  - un local sin enlaces no muestra botones vacíos
// Esperado: {"ok":true}. Registra una regla de red y la quita al terminar.
async page => {
  const fallos = [];
  const els = [
    { type: 'node', id: 910001, lat: 10.48, lon: -66.90, tags: { amenity: 'cafe', name: 'Social Uno', 'contact:instagram': '@social_uno', website: 'socialuno.com' } },
    { type: 'node', id: 910002, lat: 10.481, lon: -66.901, tags: { amenity: 'cafe', name: 'Social Dos', website: 'https://www.instagram.com/socialdos/?hl=es' } },
    { type: 'node', id: 910003, lat: 10.482, lon: -66.902, tags: { amenity: 'cafe', name: 'Social Malo', 'contact:instagram': 'javascript:alert(1)', website: 'javascript:alert(2)' } },
    { type: 'node', id: 910004, lat: 10.483, lon: -66.903, tags: { amenity: 'cafe', name: 'Social Cuatro', 'contact:instagram': 'https://instagram.com/p/ABC123/' } },
    { type: 'node', id: 910005, lat: 10.484, lon: -66.904, tags: { amenity: 'cafe', name: 'Social Cinco' } },
  ];
  const handler = (route) => route.fulfill({ json: { elements: els } });
  await page.route(/overpass/, handler);
  await page.goto('http://localhost:8765/?s=' + Date.now()); await page.evaluate(() => localStorage.clear());
  await page.goto('http://localhost:8765/?s=' + Date.now());
  await page.waitForFunction(() => /En vivo/.test((document.querySelector('.live-status') || {}).innerText || ''), null, { timeout: 30000 }).catch(() => {});

  const botones = async (nombre) => {
    if (await page.locator('.detail-back').count()) { await page.locator('.detail-back').click(); await page.waitForTimeout(150); }
    await page.locator('.search-input').fill(nombre); await page.waitForTimeout(200);
    await page.locator('.cafe-card', { hasText: nombre }).first().click(); await page.waitForTimeout(400);
    return page.evaluate(() => Object.fromEntries([...document.querySelectorAll('.detail-actions a')].map(a => [a.innerText.trim(), a.href])));
  };
  const uno = await botones('Social Uno');
  if (uno['Instagram del local'] !== 'https://www.instagram.com/social_uno/') fallos.push('Social Uno instagram: ' + uno['Instagram del local']);
  if (uno['Sitio web'] !== 'https://socialuno.com/') fallos.push('Social Uno web: ' + uno['Sitio web']);
  const dos = await botones('Social Dos');
  if (dos['Instagram del local'] !== 'https://www.instagram.com/socialdos/') fallos.push('Social Dos (instagram en el campo web): ' + dos['Instagram del local']);
  if ('Sitio web' in dos) fallos.push('Social Dos no debe tener web');
  const malo = await botones('Social Malo');
  if ('Instagram del local' in malo || 'Sitio web' in malo) fallos.push('Social Malo: debe descartar javascript: ' + JSON.stringify(malo));
  const cuatro = await botones('Social Cuatro');
  if ('Instagram del local' in cuatro) fallos.push('Social Cuatro: una ruta /p/ no es una cuenta');
  const cinco = await botones('Social Cinco');
  if ('Instagram del local' in cinco || 'Sitio web' in cinco) fallos.push('Social Cinco: no debe mostrar botones vacíos');

  // Locales curados con enlaces en data/links.js
  const curados = await page.evaluate(() => CAFES_DATA.filter(c => CAFE_LINKS[c.osm] && CAFE_LINKS[c.osm].instagram).map(c => ({ name: c.name, ig: CAFE_LINKS[c.osm].instagram })));
  if (curados.length < 5) fallos.push('se esperaban varios locales curados con Instagram, hay ' + curados.length);
  for (const c of curados.slice(0, 6)) {
    const b = await botones(c.name);
    if (!Object.values(b).includes(c.ig)) fallos.push(`${c.name}: falta el botón de Instagram ${c.ig}`);
    if (!/^https:\/\/www\.instagram\.com\/[A-Za-z0-9._]+\/$/.test(c.ig)) fallos.push(`${c.name}: enlace de Instagram raro ${c.ig}`);
  }
  await page.unroute(/overpass/, handler);
  return { ok: fallos.length === 0, fallos, curadosConInstagram: curados.length, muestra: curados.slice(0, 3) };
}
