async page => {
  const res = {};
  const run = async (label) => {
    await page.waitForTimeout(900);
    const r = await page.evaluate(async () => {
      const x = await axe.run(document, { resultTypes: ['violations'], runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] });
      return x.violations.map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length, help: v.help, sample: (v.nodes[0].target || []).join(' ').slice(0, 70) }));
    });
    res[label] = r;
  };
  await page.goto('http://localhost:8765/?a=' + Date.now()); await page.waitForTimeout(2500);
  await page.addScriptTag({ url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js' });
  await run('mapa');
  await page.getByText('Gran Café').first().click(); await run('ficha');
  await page.locator('.detail-back').click();
  for (const h of ['#aprende', '#aprende/historia', '#aprende/metodos', '#aprende/bebidas']) {
    await page.evaluate(h => { location.hash = h; dispatchEvent(new PopStateEvent('popstate')); }, h); await run(h);
  }
  return res;
}
