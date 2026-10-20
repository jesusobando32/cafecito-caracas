// Captura pantallas clave para comparar contra tests/visual/baseline. Ejecutar desde la raíz del proyecto:
//   playwright-cli -s=web run-code --filename=tests/visual/capture.js     (sesión 1280x800)
//   playwright-cli -s=mov run-code --filename=tests/visual/capture.js     (sesión --mobile)
// Para que sea determinista se ocultan el mapa y lo que cambia con la hora o la red (estado abierto/cerrado, búsqueda en vivo).
async page => {
  const w = page.viewportSize().width, out = [];
  const shot = async (name) => { await page.waitForTimeout(500); await page.screenshot({ path: `tests/visual/actual/${w}-${name}.png` }); out.push(`${w}-${name}`); };
  const hash = async (h) => { await page.evaluate(h => { location.hash = h; dispatchEvent(new PopStateEvent('popstate')); }, h); await page.waitForTimeout(400); };
  const scrollAll = () => page.evaluate(async () => { const e = document.querySelector('.wiki-page'); for (let y = 0; y < e.scrollHeight; y += 600) { e.scrollTop = y; await new Promise(r => setTimeout(r, 70)); } e.scrollTop = 0; });
  await page.goto('http://localhost:8765/?v=' + Date.now()); await page.waitForTimeout(3000);
  await page.addStyleTag({ content: `*,*::before,*::after{transition:none!important;animation:none!important;scroll-behavior:auto!important}
    #map,#minimap,.leaflet-control-container,.maplibregl-canvas{visibility:hidden!important} .status,.card-status,.live-status,.header-badge,.results-count{visibility:hidden!important}` });
  await shot('mapa-lista');
  if (w > 860) { await page.getByRole('button', { name: /Filtros/ }).click(); await shot('mapa-filtros'); await page.getByRole('button', { name: /Filtros/ }).click(); }
  await page.getByText('Gran Café').first().click(); await page.waitForTimeout(1200); await shot('ficha');
  await page.locator('.detail-back').click();
  for (const [h, n] of [['#aprende', 'aprende-portada'], ['#aprende/historia', 'aprende-historia'], ['#aprende/metodos', 'aprende-metodos'], ['#aprende/bebidas', 'aprende-bebidas']]) {
    await hash(h); await scrollAll(); await shot(n);
  }
  return out;
}
