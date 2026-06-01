'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

let _sharp = null;
function loadSharp() {
  if (_sharp) return _sharp;
  try {
    _sharp = require('sharp');
    return _sharp;
  } catch (e) {
    return null;
  }
}

const DEFAULTS = {
  enabled: true,
  maxWidth: 1920,
  format: 'auto',          // "auto" | "webp" | "jpeg" | "png" | "preserve"
  quality: 82,
  exif: {                   // metadata por defecto
    Copyright: '',
    Artist: '',
    Software: 'ghost-md-publisher'
  }
};

function sha1(str) {
  return crypto.createHash('sha1').update(str).digest('hex').slice(0, 10);
}

function pickFormat(input, fmtOpt) {
  if (fmtOpt && fmtOpt !== 'auto') return fmtOpt;
  const ext = path.extname(input).toLowerCase();
  if (ext === '.png') return 'webp';   // PNG → WebP por defecto (mejor compresión)
  if (ext === '.jpg' || ext === '.jpeg') return 'jpeg';
  if (ext === '.webp') return 'webp';
  if (ext === '.avif') return 'avif';
  if (ext === '.gif') return 'preserve';
  if (ext === '.svg') return 'preserve';
  return 'webp';
}

/**
 * Procesa una imagen: redimensiona, convierte de formato, inyecta EXIF.
 * Devuelve la ruta del archivo procesado (en cacheDir).
 *
 * Si sharp no está instalado, devuelve la ruta original sin tocar.
 *
 * config:
 *   enabled       boolean (default true)
 *   maxWidth      number  (default 1920)
 *   format        "auto"|"webp"|"jpeg"|"png"|"preserve"
 *   quality       0..100
 *   exif          { Copyright, Artist, Software, ImageDescription, ... }
 *
 * imageMeta (override por imagen):
 *   description   → EXIF ImageDescription
 *   keywords      → ignorado por sharp/exif simple (necesitaría XMP)
 */
async function processImage(absPath, config = {}, imageMeta = {}) {
  const cfg = { ...DEFAULTS, ...config, exif: { ...DEFAULTS.exif, ...(config.exif || {}) } };
  if (!cfg.enabled) return absPath;

  const sharp = loadSharp();
  if (!sharp) {
    // sin sharp instalado, devolvemos el archivo tal cual
    return absPath;
  }

  const fmt = pickFormat(absPath, cfg.format);
  if (fmt === 'preserve') return absPath;

  const cacheDir = path.join(path.dirname(absPath), '.cache', 'processed');
  fs.mkdirSync(cacheDir, { recursive: true });
  const stat = fs.statSync(absPath);
  const cacheKey = sha1(`${absPath}|${stat.mtimeMs}|${cfg.maxWidth}|${fmt}|${cfg.quality}|${JSON.stringify(cfg.exif)}|${JSON.stringify(imageMeta)}`);
  const outName = `${path.basename(absPath, path.extname(absPath))}.${cacheKey}.${fmt}`;
  const outPath = path.join(cacheDir, outName);

  if (fs.existsSync(outPath)) return outPath;

  let pipeline = sharp(absPath, { failOn: 'error' }).rotate(); // respeta orientación EXIF
  const meta = await pipeline.metadata();
  if (meta.width && meta.width > cfg.maxWidth) {
    pipeline = pipeline.resize({ width: cfg.maxWidth, withoutEnlargement: true });
  }

  const exif = { ...cfg.exif };
  if (imageMeta.description) exif.ImageDescription = imageMeta.description;

  // sharp.withExif espera un objeto con secciones IFD0 / Exif / etc.
  pipeline = pipeline.withExif({
    IFD0: {
      Copyright: exif.Copyright || '',
      Artist: exif.Artist || '',
      Software: exif.Software || '',
      ImageDescription: exif.ImageDescription || ''
    }
  });

  if (fmt === 'webp') pipeline = pipeline.webp({ quality: cfg.quality });
  else if (fmt === 'jpeg') pipeline = pipeline.jpeg({ quality: cfg.quality, mozjpeg: true });
  else if (fmt === 'png') pipeline = pipeline.png({ compressionLevel: 9 });
  else if (fmt === 'avif') pipeline = pipeline.avif({ quality: cfg.quality });

  await pipeline.toFile(outPath);
  return outPath;
}

module.exports = { processImage, DEFAULTS };
