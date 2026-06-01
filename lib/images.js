'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { processImage } = require('./image-processing');

const IMG_EXT = /\.(png|jpe?g|webp|gif|avif|svg)$/i;

/**
 * Extrae rutas locales de imágenes referenciadas en el markdown + front-matter.
 */
function findLocalImages(content, frontmatter, baseDir) {
  const found = new Set();

  if (frontmatter.feature_image && !/^https?:\/\//i.test(frontmatter.feature_image)) {
    found.add(frontmatter.feature_image);
  }
  if (frontmatter.ad && frontmatter.ad.image && !/^https?:\/\//i.test(frontmatter.ad.image)) {
    found.add(frontmatter.ad.image);
  }

  const mdImg = /!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  let m;
  while ((m = mdImg.exec(content)) !== null) {
    if (!/^https?:\/\//i.test(m[1])) found.add(m[1]);
  }

  const htmlImg = /<img[^>]+src=["']([^"']+)["']/gi;
  while ((m = htmlImg.exec(content)) !== null) {
    if (!/^https?:\/\//i.test(m[1])) found.add(m[1]);
  }

  return [...found]
    .filter((p) => IMG_EXT.test(p))
    .map((rel) => ({
      rel,
      abs: path.resolve(baseDir, rel)
    }));
}

/**
 * Para cada imagen: la procesa (resize + EXIF + format) si sharp está
 * disponible y luego la sube al Admin API.
 *
 * processingConfig: pasa-through a image-processing.js
 * perImageMeta: { [relPath]: { description, ... } } para overrides puntuales.
 */
async function uploadAll(client, images, opts = {}) {
  const { dryRun = false, processingConfig = {}, perImageMeta = {} } = opts;
  const map = new Map();
  for (const img of images) {
    if (!fs.existsSync(img.abs)) {
      throw new Error(`Imagen referenciada pero no encontrada: ${img.rel} (resuelta a ${img.abs})`);
    }
    let toUpload = img.abs;
    try {
      toUpload = await processImage(img.abs, processingConfig, perImageMeta[img.rel] || {});
    } catch (err) {
      console.warn(`  ! Procesado falló para ${img.rel} (${err.message}). Subo el original.`);
      toUpload = img.abs;
    }
    if (dryRun) {
      map.set(img.rel, `https://[dry-run]/${path.basename(toUpload)}`);
      continue;
    }
    const res = await client.images.upload({ file: toUpload, purpose: 'image' });
    map.set(img.rel, res.url);
  }
  return map;
}

function rewriteContent(content, urlMap) {
  let out = content;
  for (const [rel, url] of urlMap.entries()) {
    const escaped = rel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    out = out.replace(new RegExp(escaped, 'g'), url);
  }
  return out;
}

module.exports = { findLocalImages, uploadAll, rewriteContent };
