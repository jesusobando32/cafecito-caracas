"""Compara tests/visual/actual contra tests/visual/baseline.  Uso: python tests/visual/compare.py [umbral_%]
Falla (código 1) si alguna captura cambia más del umbral (0.2 % de píxeles por defecto) o si falta/sobra alguna."""
import os, sys
sys.stdout.reconfigure(encoding='utf-8')
from PIL import Image, ImageChops
root = os.path.dirname(os.path.abspath(__file__))
base_dir, act_dir, diff_dir = (os.path.join(root, d) for d in ('baseline', 'actual', 'diff'))
limit = float(sys.argv[1]) if len(sys.argv) > 1 else 0.2
os.makedirs(diff_dir, exist_ok=True)
names = sorted(set(os.listdir(base_dir)) | set(os.listdir(act_dir)))
bad = 0
for n in names:
    if not n.endswith('.png'): continue
    b, a = os.path.join(base_dir, n), os.path.join(act_dir, n)
    if not (os.path.exists(b) and os.path.exists(a)):
        print(f'FALTA   {n} ({"sin baseline" if not os.path.exists(b) else "sin captura"})'); bad += 1; continue
    ib, ia = Image.open(b).convert('RGB'), Image.open(a).convert('RGB')
    if ib.size != ia.size:
        print(f'TAMAÑO  {n}: {ib.size} -> {ia.size}'); bad += 1; continue
    diff = ImageChops.difference(ib, ia).convert('L').point(lambda v: 255 if v > 24 else 0)
    pct = 100 * diff.histogram()[255] / (ib.width * ib.height)
    ok = pct <= limit
    print(f'{"OK     " if ok else "CAMBIO "} {n}: {pct:.3f}% de píxeles distintos')
    if not ok:
        bad += 1; diff.save(os.path.join(diff_dir, n))
sys.exit(1 if bad else 0)
