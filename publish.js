#!/usr/bin/env node
'use strict';

require('dotenv').config();

const fs = require('node:fs');
const path = require('node:path');

const { getClient, verifyClient } = require('./lib/ghost-client');
const { readArticle } = require('./lib/frontmatter');
const { findLocalImages, uploadAll, rewriteContent } = require('./lib/images');
const { render } = require('./lib/markdown');
const { resolveBookmarks } = require('./lib/bookmarks');
const { upsertPost } = require('./lib/posts');
const { renderAd } = require('./lib/ad');
const { ensureEnv } = require('./lib/setup');
const { t } = require('./lib/i18n');

function parseArgs(argv) {
  const args = { dryRun: false, force: false, target: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run' || a === '-n') args.dryRun = true;
    else if (a === '--force' || a === '--overwrite') args.force = true;
    else if (a === '--help' || a === '-h') args.help = true;
    else if (!args.target) args.target = a;
  }
  return args;
}

function usage() {
  console.log(`Uso: ghost-publish [--dry-run] [--force] <ruta-a-articulo.md | ruta-a-carpeta>

Si pasas una carpeta, busca dentro 'articulo.md'.

Flags:
  --dry-run, -n           No envía nada a Ghost; imprime el payload final.
  --force, --overwrite    Sobrescribe un post existente con el mismo slug.
                          Sin este flag, si el slug ya existe se avisa y se aborta
                          (protege contra machacar un post viejo sin querer).

Front-matter típico:
  ---
  title:    "..."
  slug:     "..."
  excerpt:  "..."
  tags:     ["🧧 China Imperial", "Ingeniería"]
  feature_image: ./encabezado.png
  status:   draft

  ad:
    title:        "¿Cansado de tallar bloques de madera?"
    product_name: "Academia de Caligrafía Sūng Yǎ"
    description:  "..."
    image:        ./anuncio.png
    button_text:  "APUNTARME ANTES DE QUEDARME SIN OFICIO *"
    button_url:   "https://example.com/buy"
    rating:       5

  processing:
    max_width: 1920
    format:    auto       # auto | webp | jpeg | png | preserve
    quality:   82
  ---

Variables de entorno (.env):
  GHOST_URL, GHOST_ADMIN_API_KEY, GHOST_API_VERSION, DEFAULT_AUTHOR_SLUG
  IMAGE_COPYRIGHT, IMAGE_ARTIST   (opcionales — EXIF de las imágenes subidas)
  HISTORICAL_DATE_CLASS           (opcional — clase CSS del bloque de fecha histórica; default "historical-date")
  AD_DISCLAIMER                   (opcional — texto por defecto del disclaimer del Product Card)
`);
}

function resolveMdPath(target) {
  const abs = path.resolve(target);
  const stat = fs.statSync(abs);
  return stat.isDirectory() ? path.join(abs, 'articulo.md') : abs;
}

function buildProcessingConfig(frontmatter) {
  const p = frontmatter.processing || {};
  return {
    enabled: p.enabled !== false,
    maxWidth: p.max_width || 1920,
    format: p.format || 'auto',
    quality: p.quality || 82,
    exif: {
      Copyright: process.env.IMAGE_COPYRIGHT || '',
      Artist: process.env.IMAGE_ARTIST || frontmatter.author || '',
      Software: 'ghost-md-publisher',
      ImageDescription: frontmatter.title || ''
    }
  };
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help || !args.target) {
    usage();
    process.exit(args.help ? 0 : 1);
  }

  // Primera ejecución sin .env (y no dry-run): asistente interactivo de configuración.
  if (!args.dryRun) {
    await ensureEnv();
  }

  const mdPath = resolveMdPath(args.target);
  console.log('▶ ' + t('reading', mdPath));
  const article = readArticle(mdPath);
  console.log(`  · title:  ${article.data.title}`);
  console.log(`  · slug:   ${article.data.slug}`);
  console.log(`  · status: ${article.data.status}`);
  console.log(`  · tags:   ${article.data.tags.join(', ')}`);
  if (article.data.ad) console.log(`  · ad:     ${article.data.ad.product_name || article.data.ad.title}`);

  // Concatenar el bloque del anuncio AL FINAL del cuerpo (antes de subir imágenes,
  // para que el src local del anuncio quede dentro del contenido y se procese
  // en findLocalImages igual que las del cuerpo).
  let body = article.content;
  if (article.data.ad) {
    body = body.replace(/\s*$/, '') + '\n\n' + renderAd(article.data.ad, { defaultDisclaimer: process.env.AD_DISCLAIMER || '' }) + '\n';
  }

  const images = findLocalImages(body, article.data, article.baseDir);
  console.log('▶ ' + t('imagesDetected', images.length));
  for (const img of images) console.log(`  · ${img.rel}`);

  const processingConfig = buildProcessingConfig(article.data);
  const perImageMeta = article.data.images || {};

  const client = args.dryRun ? null : getClient();
  if (args.dryRun) {
    console.log('▶ ' + t('dryRun'));
  } else {
    console.log('▶ ' + t('verifying'));
    await verifyClient(client);
  }

  let urlMap = new Map();
  if (images.length) {
    console.log('▶ ' + t('uploading'));
    urlMap = await uploadAll(client, images, {
      dryRun: args.dryRun,
      processingConfig,
      perImageMeta
    });
    for (const [rel, url] of urlMap.entries()) {
      console.log(`  · ${rel} → ${url}`);
    }
  }

  body = rewriteContent(body, urlMap);
  if (article.data.feature_image && urlMap.has(article.data.feature_image)) {
    article.data.feature_image = urlMap.get(article.data.feature_image);
  }

  body = await resolveBookmarks(body);

  console.log('▶ ' + t('rendering'));
  const html = render(body, {
    historicalDate: article.data.historical_date,
    historicalYear: article.data.historical_year,
    historicalDateClass: process.env.HISTORICAL_DATE_CLASS || 'historical-date'
  });

  console.log('▶ ' + t('upserting', article.data.status));
  const result = await upsertPost(client, article.data, html, { dryRun: args.dryRun, force: args.force });

  if (result.dryRun) {
    console.log('\n=== ' + t('dryPayload') + ' ===');
    console.log(JSON.stringify({ ...result.payload, html: `[${html.length} chars]` }, null, 2));
    return;
  }

  if (result.blocked) {
    const e = result.existing;
    console.error('\n✗ ' + t('overwriteBlocked', e.slug, e.title, e.status));
    console.error('  ' + t('overwriteHint'));
    process.exit(1);
  }

  const post = result.post;
  console.log('\n✓ ' + t('done'));
  console.log(`  · ID:    ${post.id}`);
  console.log(`  · URL:   ${post.url}`);
  if (post.status === 'draft') {
    const adminPreview = `${process.env.GHOST_URL.replace(/\/$/, '')}/ghost/#/editor/post/${post.id}`;
    console.log(`  · ${t('labelEdit')} ${adminPreview}`);
  }
}

main().catch((err) => {
  console.error('\n✗ Error:', err.message);
  if (err.context) console.error('   contexto:', err.context);
  if (process.env.DEBUG) console.error(err.stack);
  process.exit(1);
});
