'use strict';

const fs = require('node:fs');
const path = require('node:path');
const matter = require('gray-matter');

/**
 * Lee un archivo .md, separa front-matter YAML del cuerpo markdown, y valida
 * los campos mínimos requeridos.
 *
 * Front-matter aceptado:
 *   title           (string, requerido)
 *   slug            (string, requerido)
 *   excerpt         (string, opcional pero recomendado — Ghost lo limita a 300 chars)
 *   tags            (array de strings, requerido — nombres exactos en Ghost)
 *   feature_image   (path local relativo al .md, opcional)
 *   feature_image_caption (HTML ligero, opcional — caption visible bajo la imagen destacada)
 *   feature_image_alt     (texto plano, opcional — alt SEO/accesibilidad)
 *   status          ("draft" | "published" | "scheduled", default "draft")
 *   author          (slug o email de un autor en Ghost, opcional)
 *   authors         (array de slugs/emails, opcional — pisa a `author`; usar para co-firmas)
 *   template        (slug de custom template del theme, opcional — p.ej. "custom-wide-feature-image")
 *   historical_date (string libre con la fecha histórica del suceso, opcional —
 *                    p.ej. "2 de abril de 1520" o "44 a.C." Se renderiza al
 *                    inicio del post en `<div class="historical-date">` (clase
 *                    configurable con HISTORICAL_DATE_CLASS en .env),
 *                    sustituye visualmente a la fecha de publicación de Ghost.)
 *   historical_year (entero opcional, negativo para a.C. — útil para CSS / archivo
 *                    cronológico. Se inyecta como `data-year` en el div anterior.)
 *   published_at    (ISO 8601, opcional — solo si status="scheduled")
 *
 *   ad:             (bloque promocional / Product Card de Ghost, opcional)
 *     title:        (string, requerido si ad existe)
 *     product_name: (string, opcional)
 *     description:  (string, requerido si ad existe)
 *     image:        (path local relativo al .md, opcional)
 *     button_text:  (string, requerido si ad existe)
 *     button_url:   (string, requerido si ad existe)
 *     rating:       (0..5, default 5)
 *     disclaimer:   (string, opcional — default vacío, o AD_DISCLAIMER del .env)
 *
 *   images:         (overrides de metadata por imagen, opcional)
 *     "encabezado.png":
 *       description: "Texto descriptivo de la imagen..."
 *
 *   processing:     (config de procesado de imágenes, opcional)
 *     enabled:      (boolean, default true)
 *     max_width:    (number, default 1920)
 *     format:       ("auto"|"webp"|"jpeg"|"png"|"preserve", default "auto")
 *     quality:      (0..100, default 82)
 */
function readArticle(mdPath) {
  if (!fs.existsSync(mdPath)) throw new Error(`No existe: ${mdPath}`);
  const raw = fs.readFileSync(mdPath, 'utf8');
  const parsed = matter(raw);
  const data = parsed.data || {};
  const content = parsed.content || '';

  const errors = [];
  if (!data.title || typeof data.title !== 'string') errors.push('title (string) requerido');
  if (!data.slug || typeof data.slug !== 'string') {
    errors.push('slug (string) requerido');
  } else if (!/^[a-z0-9-]+$/.test(data.slug)) {
    errors.push(`slug inválido "${data.slug}" — solo minúsculas, números y guiones, sin espacios ni acentos (p.ej. "mi-articulo")`);
  }
  if (!Array.isArray(data.tags) || data.tags.length === 0) {
    errors.push('tags (array no vacío) requerido');
  } else if (data.tags.some(t => typeof t !== 'string' || !t.trim())) {
    errors.push('cada tag debe ser un string no vacío');
  }
  if (data.status && !['draft', 'published', 'scheduled'].includes(data.status)) {
    errors.push('status debe ser "draft", "published" o "scheduled"');
  }
  if (data.status === 'scheduled' && !data.published_at) {
    errors.push('published_at (ISO 8601) requerido cuando status="scheduled"');
  }
  if (typeof data.published_at === 'string' && isNaN(Date.parse(data.published_at))) {
    errors.push(`published_at no es una fecha válida — usa ISO 8601, p.ej. "2026-06-10T09:00:00.000Z" (recibido: ${data.published_at})`);
  }
  if (data.authors !== undefined && !Array.isArray(data.authors)) {
    errors.push('authors debe ser array de slugs/emails (usar `author` para uno solo)');
  }
  if (data.excerpt && typeof data.excerpt === 'string' && data.excerpt.length > 300) {
    errors.push(`excerpt excede los 300 caracteres permitidos por Ghost (longitud actual: ${data.excerpt.length})`);
  }
  if (data.feature_image_alt && typeof data.feature_image_alt === 'string' && data.feature_image_alt.length > 191) {
    errors.push(`feature_image_alt excede los 191 caracteres permitidos por Ghost (longitud actual: ${data.feature_image_alt.length})`);
  }
  if (data.feature_image_caption && typeof data.feature_image_caption === 'string' && data.feature_image_caption.length > 65535) {
    errors.push(`feature_image_caption excede el límite (longitud actual: ${data.feature_image_caption.length})`);
  }

  if (data.ad && typeof data.ad === 'object') {
    const ad = data.ad;
    if (!ad.title) errors.push('ad.title requerido si ad existe');
    if (!ad.description) errors.push('ad.description requerida si ad existe');
    if (!ad.button_text) errors.push('ad.button_text requerido si ad existe');
    if (!ad.button_url) errors.push('ad.button_url requerido si ad existe');
  }

  if (errors.length) {
    throw new Error(`Front-matter inválido en ${mdPath}:\n  - ${errors.join('\n  - ')}`);
  }

  data.status = data.status || 'draft';

  return {
    data,
    content,
    baseDir: path.dirname(path.resolve(mdPath))
  };
}

module.exports = { readArticle };
