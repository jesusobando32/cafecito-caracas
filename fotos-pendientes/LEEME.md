# Fotos pendientes de procesar

Guarda aquí las fotos de **fachada** que enviaron los locales (con su autorización), con el nombre del local:
`Moka Caracas.jpg`. Si hay dos locales con el mismo nombre, antepón el id: `n11841838790 Granier.jpg`.

```bash
python -X utf8 scripts/add_photos_batch.py --list   # qué locales con Instagram faltan
python -X utf8 scripts/add_photos_batch.py          # procesa todo lo que haya aquí
```

Las originales no se suben a GitHub (solo la versión recortada y comprimida en `img/cafes/`). Las ya procesadas pasan a `procesadas/`.
Guarda los mensajes donde cada local autorizó el uso de la foto, por si alguna vez hace falta demostrarlo.
