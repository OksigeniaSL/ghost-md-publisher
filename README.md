# ghost-md-publisher

CLI en Node.js para publicar en **Ghost** desde un archivo `.md` con front-matter YAML. Sube las imágenes (procesadas con `sharp` — resize, optimización, formato, EXIF), soporta tarjetas nativas de Ghost (Product Card, embeds de vídeo, pies de foto) y crea el post como **draft** vía Admin API.

Si el slug ya existe, **actualiza** el post existente en lugar de duplicar.

---

## Por qué existe

Publicar una pieza con varias imágenes a mano en el editor de Ghost son ~15 minutos de fontanería por pieza: pegar el cuerpo, subir las imágenes una a una, rellenar título/slug/excerpt/tags, montar tarjetas. Este publisher lo resuelve con un comando:

```bash
ghost-publish ./mi-articulo/
```

Escribes en Markdown (en tu editor, con control de versiones si quieres) y publicas sin tocar el navegador.

---

## Instalación

```bash
git clone https://github.com/OksigeniaSL/ghost-md-publisher.git
cd ghost-md-publisher
npm install
cp .env.example .env
# rellena .env
```

### Crear la Admin API Key en Ghost

1. Entra al admin: `https://tu-sitio.com/ghost/`
2. **Settings → Integrations → + Add custom integration**
3. Ponle un nombre (p.ej. *"ghost-md-publisher"*).
4. Copia el campo **Admin API Key** entero (formato `id:secret`) en `.env` como `GHOST_ADMIN_API_KEY`.

---

## Estructura de una pieza

```
mi-articulo/
├── articulo.md
├── encabezado.png       # feature image
├── interior_1.png
├── promo.png            # imagen del Product Card (opcional)
└── .cache/              # generado automático: imágenes procesadas (gitignore)
```

### Front-matter del `articulo.md`

```yaml
---
title:        "Título del artículo"
slug:         "titulo-del-articulo"
excerpt:      "Resumen breve..."              # max 300 chars
tags:         ["Tecnología", "Tutoriales"]
feature_image: ./encabezado.png
status:       draft                           # draft | published | scheduled
author:       jane-doe                        # opcional, slug del autor en Ghost
# authors:    [jane-doe, john-roe]            # alternativa para co-firmas (pisa a `author`)
template:     custom-wide-feature-image       # opcional — slug de un custom-*.hbs del theme
historical_date: "2 de abril de 1520"         # opcional — fecha de evento (string libre, soporta a.C.)
historical_year: 1520                         # opcional — entero (negativo para a.C.); se inyecta como data-year

# Product Card (bloque promocional opcional)
ad:
  title:        "Texto gancho del producto"
  product_name: "Nombre del producto"
  description:  "Descripción del producto..."
  image:        ./promo.png
  button_text:  "COMPRAR AHORA"
  button_url:   "https://example.com/buy"
  rating:       5
  disclaimer:   "Texto legal opcional"

# Procesamiento de imágenes (todo opcional)
processing:
  enabled:    true
  max_width:  1920          # redimensiona si excede
  format:     auto          # auto | webp | jpeg | png | preserve
  quality:    82

# Overrides de metadata por imagen (opcional)
images:
  encabezado.png:
    description: "Texto descriptivo de la imagen."
---

(cuerpo en markdown)
```

**Campos obligatorios:** `title`, `slug`, `tags`. Si añades `ad`, son obligatorios `ad.title`, `ad.description`, `ad.button_text`, `ad.button_url`.

---

## Funciones de Markdown

- **Pies de foto:** `![pie de foto](./imagen.png)` se convierte en un `figure` de Ghost con `figcaption` (el alt se usa como caption). Sin alt, imagen sin pie.
- **Embed de vídeo:** `::video <url>` en una línea propia → embed de YouTube o Vimeo. Con caption: `::video <url> | Mi caption`.
- **Product Card:** el bloque `ad` del front-matter genera un `kg-product-card` nativo de Ghost, con estrellas y disclaimer opcional.
- **Fecha histórica:** `historical_date` inserta un bloque al inicio del post (clase CSS configurable con `HISTORICAL_DATE_CLASS`), pensado para que el theme la muestre en lugar de la fecha de publicación.

---

## Procesamiento de imágenes

Con `sharp` instalado (incluido en deps), cada imagen se procesa antes de subir:

1. **Resize** a `processing.max_width` (default 1920) preservando aspect ratio.
2. **Conversión de formato:** por defecto PNG → WebP (mejor compresión sin pérdida visible).
3. **EXIF:** Software, y `Copyright`/`Artist` si los defines en `.env` (`IMAGE_COPYRIGHT`, `IMAGE_ARTIST`).
4. **Cache:** las versiones procesadas quedan en `.cache/processed/` (clave SHA1 sobre mtime + config). Si la imagen no cambia, se reutiliza.

Para deshabilitar el procesamiento de una pieza: `processing.enabled: false`.

---

## Uso

```bash
# Dry run — no manda nada, imprime el payload que se enviaría
ghost-publish --dry-run ./mi-articulo/

# Publicar (crea draft o actualiza si ya existe el slug)
ghost-publish ./mi-articulo/

# También por archivo directo
ghost-publish ./mi-articulo/articulo.md
```

El comando devuelve la URL pública del post (si está publicado) y la URL del editor de Ghost para revisar el draft.

| Flag | Efecto |
|---|---|
| `--dry-run`, `-n` | No envía nada a Ghost. Imprime el payload final. |
| `--help`, `-h` | Ayuda. |
| `DEBUG=1` (env) | Stack traces completos en errores. |

---

## Límites de Ghost validados antes de enviar

- `custom_excerpt`: 300 chars · `feature_image_alt`: 191 chars · `feature_image_caption`: 65535 chars.

El publisher valida estos límites **antes** del round-trip, para no gastar subidas de imágenes en un error al final del flujo.

---

## Comportamiento del upsert

Si el slug ya existe, hace `posts.edit` y **preserva el status original** (no degrada `published` a `draft` aunque el front-matter diga `draft`). El status del front-matter solo manda en la creación inicial.

---

## Limitaciones conocidas

- **No subimos vídeos propios** todavía — usa `::video` con YouTube/Vimeo.
- **Tags inexistentes:** si pasas un tag que no existe en Ghost, lo crea. Usa los nombres canónicos exactos para evitar duplicados.

---

## Roadmap

- [ ] `--watch` — re-publica al cambiar el `.md`.
- [ ] Validación de tags contra los existentes en Ghost (warn antes de crear nuevos).
- [ ] Subida de feature video.
- [ ] Soporte `members-only` / paywall desde front-matter.
- [ ] Instalación global (`npm install -g`).

---

## Licencia

MIT — © Oksigenia.
