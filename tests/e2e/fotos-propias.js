// Foto propia de un local (data/photos.js): se muestra con el crédito del local y «cortesía del local», con prioridad sobre Google,
// y si el archivo falta vuelve al dibujo. Usa una foto de relleno ya existente; registra una regla de red y la quita al terminar.
// Esperado: {"ok":true}
async page => {
  const fallos = [];
  const fotos = {
    n6184602085: { src: 'img/aprende/d-latte-800.jpg', author: '@mokaccs', authorUrl: 'https://www.instagram.com/mokaccs/', note: 'cortesía del local' },   // Moka Caracas
    n4410920290: { src: 'img/cafes/no-existe.jpg', author: '@makao', note: 'cortesía del local' },                                                          // Makao: archivo roto
  };
  const handler = (route) => route.fulfill({ contentType: 'application/javascript', body: 'var CAFE_PHOTOS = ' + JSON.stringify(fotos) + ';' });
  await page.route('**/data/photos.js*', handler);
  await page.goto('http://localhost:8765/?fp=' + Date.now()); await page.waitForTimeout(2000);
  const abrir = async (nombre) => {
    if (await page.locator('.detail-back').count()) { await page.locator('.detail-back').click(); await page.waitForTimeout(150); }
    await page.locator('.search-input').fill(nombre); await page.waitForTimeout(200);
    await page.locator('.cafe-card', { hasText: nombre }).first().click(); await page.waitForTimeout(1000);
    return page.evaluate(() => ({
      foto: !!document.querySelector('.cafe-photo img'), src: (document.querySelector('.cafe-photo img') || {}).src || null,
      dibujo: !!document.querySelector('.cafe-photo-fallback svg'), pie: (document.querySelector('.cafe-photo figcaption') || {}).innerText || null,
      enlace: (document.querySelector('.cafe-photo figcaption a') || {}).href || null,
      cargada: (() => { const i = document.querySelector('.cafe-photo img'); return !!i && i.complete && i.naturalWidth > 0; })(),
    }));
  };
  const moka = await abrir('Moka Caracas');
  if (!moka.foto || !moka.cargada) fallos.push('Moka: la foto propia no se muestra ' + JSON.stringify(moka));
  if (moka.pie !== 'Foto: @mokaccs · cortesía del local') fallos.push('Moka: crédito «' + moka.pie + '»');
  if (moka.enlace !== 'https://www.instagram.com/mokaccs/') fallos.push('Moka: el crédito debe enlazar a su Instagram: ' + moka.enlace);
  const makao = await abrir('Makao');
  await page.waitForTimeout(600);
  const makaoFinal = await page.evaluate(() => ({ dibujo: !!document.querySelector('.cafe-photo-fallback svg'), foto: !!document.querySelector('.cafe-photo img') }));
  if (!makaoFinal.dibujo || makaoFinal.foto) fallos.push('Makao: con el archivo roto debe volver al dibujo');
  const otro = await abrir('Gran Café');
  if (!otro.dibujo) fallos.push('Gran Café (sin foto): debe mostrar el dibujo');
  await page.unroute('**/data/photos.js*', handler);
  return { ok: fallos.length === 0, fallos, moka: { pie: moka.pie, enlace: moka.enlace } };
}
