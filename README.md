# ghost-md-publisher

A Node.js CLI to publish to **Ghost** from a `.md` file with YAML front-matter. It uploads images (processed with `sharp` — resize, optimization, format, EXIF), supports native Ghost cards (Product Card, video embeds, image captions) and creates the post as a **draft** via the Admin API.

If the slug already exists, it **updates** the existing post instead of duplicating it.

> 🎨 **Built by the team behind [Xpresiva](https://xpresiva.com)** — a premium Ghost theme: three editions in one (Newspaper · Magazine · Blog), real built-in multilingual support and a privacy-first, accessible design. This publisher is its free, open-source companion. **[See the theme →](https://xpresiva.com)**

---

## Why it exists

Publishing a piece with several images by hand in the Ghost editor takes ~15 minutes of plumbing per post: paste the body, upload each image, fill in title/slug/excerpt/tags, build cards. This publisher does it in one command:

```bash
ghost-publish ./my-article/
```

You write in Markdown (in your editor, version-controlled if you like) and publish without touching the browser.

---

## Installation

### Recommended: global install from npm

```bash
npm install -g @oksigenia/ghost-md-publisher
```

This gives you the `ghost-publish` command anywhere.

### Alternative: from source

```bash
git clone https://github.com/OksigeniaSL/ghost-md-publisher.git
cd ghost-md-publisher
npm install
```

### First run: guided setup

The first time you run the publisher **without a `.env`**, an interactive wizard
starts: it lets you **pick a language** (English, Español, Français, Deutsch,
Português, Italiano, Nederlands), then asks for your **Ghost URL** and **Admin API
Key**, and writes the `.env` for you. The whole CLI then speaks the language you
chose. Before publishing, it also **verifies the connection** and gives a clear
message if the URL or key are wrong.

You can still create `.env` by hand (`cp .env.example .env`) if you prefer.

### Create the Admin API Key in Ghost

1. Open the admin: `https://your-site.com/ghost/`
2. **Settings → Integrations → + Add custom integration**
3. Give it a name (e.g. *"ghost-md-publisher"*).
4. Copy the whole **Admin API Key** (format `id:secret`) into `.env` as `GHOST_ADMIN_API_KEY`.

---

## Structure of a piece

```
my-article/
├── articulo.md          # front-matter + markdown body
├── encabezado.png       # feature image
├── interior_1.png
├── promo.png            # Product Card image (optional)
└── .cache/              # auto-generated: processed images (gitignored)
```

> The CLI looks for `articulo.md` when you pass a folder. You can also pass a `.md` file directly.

### Front-matter of `articulo.md`

```yaml
---
title:        "Article title"
slug:         "article-title"
excerpt:      "Short summary..."               # max 300 chars
tags:         ["Technology", "Tutorials"]
feature_image: ./encabezado.png
feature_image_caption: "Caption under the feature image"   # optional, light HTML
feature_image_alt:     "Alt text for SEO/accessibility"    # optional, max 191 chars
status:       draft                            # draft | published | scheduled
published_at: "2026-04-02T09:00:00.000Z"       # required only when status: scheduled (ISO 8601)
author:       jane-doe                         # optional, author slug in Ghost
# authors:    [jane-doe, john-roe]             # alternative for co-bylines (overrides `author`)
template:     custom-wide-feature-image        # optional — slug of a custom-*.hbs in the theme
historical_date: "2 April 1520"                # optional — event date (free string, supports BC)
historical_year: 1520                          # optional — integer (negative for BC); injected as data-year

# Product Card (optional promo block)
ad:
  title:        "Product hook text"
  product_name: "Product name"
  description:  "Product description..."
  image:        ./promo.png
  button_text:  "BUY NOW"
  button_url:   "https://example.com/buy"
  rating:       5
  disclaimer:   "Optional legal text"

# Image processing (all optional)
processing:
  enabled:    true
  max_width:  1920          # resize if larger
  format:     auto          # auto | webp | jpeg | png | preserve
  quality:    82

# Per-image metadata overrides (optional)
images:
  encabezado.png:
    description: "Descriptive alt text for the image."
---

(markdown body)
```

**Required fields:** `title`, `slug`, `tags`. If you add `ad`, then `ad.title`, `ad.description`, `ad.button_text` and `ad.button_url` are required.

---

## Markdown features

- **Image captions:** `![caption](./image.png)` becomes a Ghost `figure` with a `figcaption` (the alt text is used as the caption). Without alt text, the image renders with no caption.
- **Video embed:** `::video <url>` on its own line → an embed from **YouTube** (including **Shorts**, rendered vertical 9:16), **Vimeo**, **Odysee** (watch or embed URL) and **Rumble** (embed URL). With a caption: `::video <url> | My caption`. Handy for independent press publishing on alternative platforms.
- **Product Card:** the `ad` block in the front-matter generates a native Ghost `kg-product-card`, with star rating and an optional disclaimer.
- **Historical date:** `historical_date` inserts a block at the top of the post (CSS class configurable via `HISTORICAL_DATE_CLASS`), meant for the theme to display in place of the publish date.

---

## Image processing

With `sharp` installed (included in deps), each image is processed before upload:

1. **Resize** to `processing.max_width` (default 1920), preserving aspect ratio.
2. **Format conversion:** PNG → WebP by default (better compression with no visible loss).
3. **EXIF:** Software, plus `Copyright`/`Artist` if you set them in `.env` (`IMAGE_COPYRIGHT`, `IMAGE_ARTIST`).
4. **Cache:** processed versions are stored in `.cache/processed/` (key = SHA1 over mtime + config). If the image hasn't changed, the cache is reused.

To disable processing for a piece: `processing.enabled: false`.

---

## Usage

```bash
# Dry run — sends nothing, prints the payload that would be sent
ghost-publish --dry-run ./my-article/

# Publish (creates a draft, or updates if the slug already exists)
ghost-publish ./my-article/

# Also works on a single file
ghost-publish ./my-article/articulo.md
```

The command returns the public URL of the post (if published) and the Ghost editor URL to review the draft.

| Flag | Effect |
|---|---|
| `--dry-run`, `-n` | Sends nothing to Ghost. Prints the final payload. |
| `--help`, `-h` | Help. |
| `DEBUG=1` (env) | Full stack traces on errors. |

### Utilities

- `node scripts/audit-authors.js` — lists the authors in your Ghost (handy to find the exact `author` slug to use in the front-matter).
- `npm run test:dry -- ./my-article/` — shortcut for a dry run (or `ghost-publish --dry-run ./my-article/`).

---

## Environment variables (`.env`)

| Variable | Purpose |
|---|---|
| `GHOST_URL` | Ghost site URL (no trailing slash). |
| `GHOST_ADMIN_API_KEY` | Admin API key, format `id:secret`. |
| `GHOST_API_VERSION` | Admin API version (default `v5.0`). |
| `CLI_LANG` | CLI language: `en`, `es`, `fr`, `de`, `pt`, `it`, `nl` (default `en`; set by the first-run wizard). |
| `DEFAULT_AUTHOR_SLUG` | Fallback author when a piece doesn't set `author`. |
| `IMAGE_COPYRIGHT`, `IMAGE_ARTIST` | Optional EXIF metadata for uploaded images. |
| `HISTORICAL_DATE_CLASS` | CSS class for the historical-date block (default `historical-date`). |
| `AD_DISCLAIMER` | Default disclaimer text under the Product Card. |

---

## Ghost limits validated before sending

- `custom_excerpt`: 300 chars · `feature_image_alt`: 191 chars · `feature_image_caption`: 65535 chars.

The publisher validates these limits **before** the round-trip, so you don't waste image uploads on an error at the end of the flow.

---

## Upsert behavior

If the slug already exists, it runs `posts.edit` and **preserves the original status** (it won't downgrade `published` to `draft` even if the front-matter says `draft`). The front-matter status only applies on initial creation.

---

## Known limitations

- **No native video upload** yet — use `::video` with YouTube/Vimeo/Odysee/Rumble.
- **Non-existent tags:** if you pass a tag that doesn't exist in Ghost, it gets created. Use exact canonical names to avoid duplicates.

---

## Roadmap

- [ ] `--watch` — re-publish on `.md` change.
- [ ] Validate tags against existing ones in Ghost (warn before creating new ones).
- [ ] Feature video upload.
- [ ] `members-only` / paywall support from front-matter.

---

## From the makers — Xpresiva

This tool is free and MIT, built by [Oksigenia](https://oksigenia.com) as the companion to **[Xpresiva](https://xpresiva.com)**, a premium Ghost theme for people who publish seriously:

- **Three editions in one** — Newspaper, Magazine and Blog, switchable from settings.
- **Real multilingual** — not just 1:1 translations: independent editorial lines per language (a correspondent in Rome writing in Italian, one in Paris in French…), with per-post `hreflang`.
- **Privacy-first & accessible** — self-hosted fonts, no Google Fonts, no tracking cookies, AA contrast and visible keyboard focus throughout.
- **One year of updates, ethical email support**, and a published EULA.

Live demos and the full guide at **[xpresiva.com](https://xpresiva.com)**.

---

## License

MIT — © Oksigenia.
