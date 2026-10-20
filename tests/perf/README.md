# Rendimiento

## 1. Lighthouse (escritorio y móvil)
```bash
python -m http.server 8765
CHROME_PATH="C:/Program Files/Google/Chrome/Application/chrome.exe" \
  npx -y lighthouse@12 http://localhost:8765/ --only-categories=performance,accessibility,best-practices,seo \
  --chrome-flags="--headless=new" --preset=desktop --output=json --output-path=desktop.json
# móvil: sustituye --preset=desktop por  --form-factor=mobile --screenEmulation.mobile
```
Referencia (19-oct-2026): escritorio 94 / 100 / 100 / 100 y móvil ~62-69 / 100 / 100 / 100 (rendimiento / accesibilidad / buenas prácticas / SEO).
Lighthouse simula la red y varía ±2 s entre corridas; el servidor de Python no comprime, así que «text compression» no aplica a GitHub Pages.

## 2. Carga con red y CPU limitadas (medida real)
```bash
playwright-cli -s=web open http://localhost:8765/
playwright-cli -s=web run-code --filename=tests/perf/carga-limitada.js
```
Resultado al diferir MapLibre (~800 KB): primer pintado 3.8 s → 2.5 s y lista visible 4.2 s → 2.6 s; el mapa vectorial llega igual (~4.5 s).
