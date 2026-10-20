// Comprueba, para cada local curado, que los enlaces a Google Maps apuntan a SU ubicación (no a otra ciudad):
//  - minimapa y «Ver horario»: búsqueda por nombre con el visor centrado en las coordenadas del local
//  - «Ver el punto exacto»: marcador en sus coordenadas · «Cómo llegar»: destino en sus coordenadas
// Además valida que todas las coordenadas caigan dentro de la zona de Caracas. Esperado: {"fallos":[]}.
async page => {
  const fallos = [];
  await page.goto('http://localhost:8765/?m=' + Date.now()); await page.waitForTimeout(2500);
  const cafes = await page.evaluate(() => CAFES_DATA.map(c => ({ name: c.name, lat: c.lat, lng: c.lng })));
  for (const c of cafes) {
    if (!(c.lat > 10.38 && c.lat < 10.53 && c.lng > -67.0 && c.lng < -66.77)) fallos.push(`${c.name}: coordenadas fuera de Caracas (${c.lat}, ${c.lng})`);
  }
  const porNombre = {};   // hay nombres repetidos (p. ej. dos Granier): se acepta cualquiera de sus coordenadas
  cafes.forEach(c => (porNombre[c.name] = porNombre[c.name] || []).push(c));
  for (const [name, grupo] of Object.entries(porNombre)) {
    await page.locator('.search-input').fill(name); await page.waitForTimeout(150);
    const cards = page.locator('.cafe-card', { hasText: name });
    const n = await cards.count();
    if (n < grupo.length) fallos.push(`${name}: ${n} tarjetas para ${grupo.length} locales`);
    for (let i = 0; i < Math.min(n, grupo.length); i++) {
      await cards.nth(i).click(); await page.waitForTimeout(250);
      const h = await page.evaluate(() => ({
        mini: document.querySelector('.minimap-link').href, pin: document.querySelector('.detail-pin a').href,
        dir: [...document.querySelectorAll('.detail-actions a')].find(a => /Cómo llegar/.test(a.innerText)).href,
      }));
      const ok = grupo.some(c => h.mini === `https://www.google.com/maps/search/${encodeURIComponent(c.name)}/@${c.lat},${c.lng},18z`
        && h.pin === `https://www.google.com/maps/search/?api=1&query=${c.lat},${c.lng}` && h.dir.includes(`destination=${c.lat},${c.lng}`));
      if (!ok) fallos.push(`${name}: enlaces incoherentes ${JSON.stringify(h)}`);
      await page.locator('.detail-back').click(); await page.waitForTimeout(80);
    }
  }
  return { locales: cafes.length, fallos };
}
