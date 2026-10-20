// Simula la API de Google Places (sin clave real ni gasto) y verifica el puente completo:
//  petición correcta (clave, field mask, pageSize, sesgo de zona), foto con atribución, horario y valoración de Google,
//  rechazo de un lugar con otro nombre, foto rota -> dibujo, y clave rechazada (403) -> la app sigue y deja de llamar.
// Esperado: {"ok":true,...}. Ojo: registra reglas de red; las quita al terminar.
async page => {
  const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
  const llamadas = [], fallos = [], consola = [];
  page.on('console', m => { if (m.type() === 'error' && /Google Places/.test(m.text())) consola.push(m.text()); });
  const place = (nombre, lat, lng, extra = {}) => Object.assign({ displayName: { text: nombre }, location: { latitude: lat, longitude: lng }, googleMapsUri: 'https://maps.google.com/?cid=123' }, extra);
  const semana = [0, 1, 2, 3, 4, 5, 6].map(d => ({ open: { day: d, hour: 8, minute: 0 }, close: { day: d, hour: 20, minute: 0 } }));
  const handler = async (route) => {
    const body = route.request().postDataJSON(), headers = route.request().headers();
    llamadas.push({ body, key: headers['x-goog-api-key'], mask: headers['x-goog-fieldmask'] });
    const q = body.textQuery;
    if (q.startsWith('Gran Café')) {
      return route.fulfill({ json: { places: [
        place('Otro sitio cualquiera', 10.4957, -66.8802),   // misma zona pero otro nombre: no debe elegirse
        place('Gran Café', 10.495604, -66.880284, {
          rating: 4.5, userRatingCount: 120, websiteUri: 'https://example.com/gran', nationalPhoneNumber: '0212 555 0000',
          regularOpeningHours: { periods: semana },
          photos: [{ name: 'places/ABC/photos/XYZ', authorAttributions: [{ displayName: 'María Pérez', uri: 'https://maps.google.com/contrib/1' }] }],
        }),
      ] } });
    }
    if (q.startsWith('Moka Caracas')) {
      return route.fulfill({ json: { places: [place('Starbucks', 10.49225, -66.87554, { photos: [{ name: 'places/S/photos/1', authorAttributions: [] }] })] } });
    }
    if (q.startsWith('Makao')) {
      return route.fulfill({ json: { places: [place('Macao', 10.48216, -66.86270, { photos: [{ name: 'places/M/photos/BROKEN', authorAttributions: [] }] })] } });
    }
    if (q.startsWith('Cafetería Kaldi')) return route.fulfill({ status: 403, json: { error: { message: 'API key not valid' } } });
    return route.fulfill({ json: { places: [] } });
  };
  const media = (route) => route.request().url().includes('BROKEN')
    ? route.fulfill({ status: 404, body: 'no' })
    : route.fulfill({ status: 200, contentType: 'image/png', body: PNG });
  const abrir = async (nombre) => {
    if (await page.locator('.detail-back').count()) { await page.locator('.detail-back').click(); await page.waitForTimeout(150); }   // el buscador solo existe en la lista
    await page.locator('.search-input').fill(nombre); await page.waitForTimeout(200);
    await page.locator('.cafe-card', { hasText: nombre }).first().click(); await page.waitForTimeout(1200);
    return page.evaluate(() => ({
      foto: !!document.querySelector('.cafe-photo img'), src: (document.querySelector('.cafe-photo img') || {}).src || null,
      dibujo: !!document.querySelector('.cafe-photo-fallback svg'), pie: (document.querySelector('.cafe-photo figcaption') || {}).innerText || null,
      valoracion: (document.querySelector('.detail-rating') || {}).innerText || null,
      horario: document.querySelectorAll('.schedule li').length, primerDia: (document.querySelector('.schedule li') || {}).innerText || null,
      web: [...document.querySelectorAll('.detail-actions a')].some(a => /Sitio web/.test(a.innerText)),
    }));
  };
  const cargar = async (detalles) => {
    await page.route('**/config.js*', r => r.fulfill({ contentType: 'application/javascript', body: `window.CAFECITO_CONFIG = { googlePlacesKey: 'TEST_KEY', googlePlacesDetails: ${detalles} };` }));
    await page.route('**/places.googleapis.com/v1/places:searchText', handler);
    await page.route('**/places.googleapis.com/v1/places/**/media**', media);
    await page.goto('http://localhost:8765/?gp=' + Date.now()); await page.waitForTimeout(2000);
  };
  const quitar = async () => {
    await page.unroute('**/config.js*');
    await page.unroute('**/places.googleapis.com/v1/places:searchText', handler);
    await page.unroute('**/places.googleapis.com/v1/places/**/media**', media);
  };

  await cargar(true);
  const gran = await abrir('Gran Café');
  const moka = await abrir('Moka Caracas');
  const makao = await abrir('Makao');
  await page.waitForTimeout(500);
  const makaoTrasError = await page.evaluate(() => ({ foto: !!document.querySelector('.cafe-photo img'), dibujo: !!document.querySelector('.cafe-photo-fallback svg') }));
  const kaldi = await abrir('Cafetería Kaldi');
  const trasKaldi = llamadas.length;
  const amelie = await abrir('Amelie Café');
  const sinLlamadaTras403 = llamadas.length === trasKaldi;

  const p = llamadas[0];
  if (p.key !== 'TEST_KEY') fallos.push('no envía la clave');
  if (p.body.pageSize !== 5 || 'maxResultCount' in p.body) fallos.push('debe usar pageSize y no maxResultCount');
  if (p.body.regionCode !== 'VE' || p.body.languageCode !== 'es') fallos.push('region/idioma');
  if (!p.body.locationBias || p.body.locationBias.circle.radius !== 200) fallos.push('sesgo de zona');
  for (const f of ['places.photos', 'places.displayName', 'places.regularOpeningHours', 'places.rating']) if (!p.mask.includes(f)) fallos.push('falta en el field mask: ' + f);
  if (!gran.foto || !/places\.googleapis\.com\/v1\/places\/ABC\/photos\/XYZ\/media\?.*key=TEST_KEY/.test(gran.src)) fallos.push('foto de Gran Café: ' + gran.src);
  if (!/María Pérez/.test(gran.pie || '') || !/Google Maps/.test(gran.pie || '')) fallos.push('atribución: ' + gran.pie);
  if (gran.horario !== 7 || !/8:00 AM – 8:00 PM/.test(gran.primerDia || '')) fallos.push('horario de Google: ' + gran.primerDia);
  if (!/4\.5/.test(gran.valoracion || '') || !gran.web) fallos.push('valoración/web');
  if (moka.foto || !moka.dibujo) fallos.push('Moka: no debía usar la foto de Starbucks');
  if (makaoTrasError.foto || !makaoTrasError.dibujo) fallos.push('Makao: la foto rota debe caer al dibujo');
  if (kaldi.foto || !kaldi.dibujo) fallos.push('Kaldi (403): debe mostrar el dibujo');
  if (!sinLlamadaTras403) fallos.push('tras un 403 no debe seguir llamando');
  if (!consola.length) fallos.push('el 403 debe dejar un aviso claro en consola');
  if (!amelie.dibujo) fallos.push('Amelie: ficha rota tras el 403');
  await quitar();

  // Modo barato: solo foto + enlace (sin campos Enterprise)
  llamadas.length = 0; await cargar(false); await abrir('Gran Café');
  const mask2 = (llamadas[0] || {}).mask || '';
  if (/regularOpeningHours|rating|websiteUri|nationalPhoneNumber/.test(mask2) || !/photos/.test(mask2)) fallos.push('googlePlacesDetails:false debe pedir solo fotos: ' + mask2);
  await quitar();
  return { ok: fallos.length === 0, fallos, maskCompleta: p.mask, maskBarata: mask2, gran: { src: gran.src, pie: gran.pie, valoracion: gran.valoracion, primerDia: gran.primerDia } };
}
