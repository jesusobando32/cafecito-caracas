// Mide FCP/LCP y cuándo aparecen la lista y el mapa con red 1.6 Mbps/150 ms y CPU x4, 3 corridas sin caché.
// Para comparar dos versiones, sirve la otra en el puerto 8766 (p. ej. `git archive <commit> | tar -x -C /tmp/old`) y añade su par [etiqueta, url].
async page => {
  const ctx = page.context(); const results = {};
  for (const [label, base] of [['actual', 'http://localhost:8765/']]) {
    results[label] = [];
    for (let i = 0; i < 3; i++) {
      const p = await ctx.newPage(); const c = await ctx.newCDPSession(p);
      await c.send('Network.enable'); await c.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8 });
      await c.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      await p.addInitScript(() => { window.__m = {}; new PerformanceObserver(l => { for (const e of l.getEntries()) window.__m.lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true }); });
      await c.send('Network.setCacheDisabled', { cacheDisabled: true });
      await p.goto(base + '?r=' + Date.now(), { waitUntil: 'commit' });
      await p.waitForSelector('.cafe-card', { timeout: 60000 });
      const cards = await p.evaluate(() => performance.now());
      await p.waitForSelector('.maplibregl-canvas', { timeout: 90000 }).catch(() => {});
      const gl = await p.evaluate(() => performance.now());
      const m = await p.evaluate(() => ({ lcp: Math.round(window.__m.lcp || 0), fcp: Math.round(performance.getEntriesByName('first-contentful-paint')[0].startTime) }));
      results[label].push({ listaVisible_ms: Math.round(cards), mapaGL_ms: Math.round(gl), lcp: m.lcp, fcp: m.fcp });
      await p.close();
    }
  }
  return results;
}
