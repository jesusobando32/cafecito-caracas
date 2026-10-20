// MANUAL (usa internet y Google Maps real; puede variar con el tiempo): abre el enlace de búsqueda de varios locales y verifica
// que Google deja el mapa centrado a pocos metros de las coordenadas del local (nunca en otra ciudad) e indica si abrió una ficha.
//   FICHA = Google reconoció un único lugar · LISTA = muestra los resultados de esa zona
async page => {
  await page.goto('http://localhost:8765/?g=' + Date.now());
  const rows = await page.evaluate(() => CAFES_DATA.filter(c => ['Moka Caracas', 'Makao', 'Cafetería Kaldi', 'Gran Café', 'Amelie Café', 'Oro café'].includes(c.name)).map(c => [c.name, c.lat, c.lng]));
  const out = [];
  for (const [n, lat, lng] of rows) {
    await page.goto(`https://www.google.com/maps/search/${encodeURIComponent(n)}/@${lat},${lng},18z`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4500);
    const m = page.url().match(/@(-?[0-9.]+),(-?[0-9.]+)/);
    const d = m ? Math.round(Math.hypot((m[1] - lat) * 111000, (m[2] - lng) * 111000 * Math.cos(lat * Math.PI / 180))) : null;
    out.push(`${n} -> ${page.url().includes('/place/') ? 'FICHA' : 'LISTA'} a ${d} m | ${(await page.title()).slice(0, 40)}`);
  }
  return out;
}
