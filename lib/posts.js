'use strict';

const { t } = require('./i18n');

/**
 * Crea (o actualiza si ya existe el slug) un post draft en Ghost.
 *
 * Mapeo front-matter → Ghost:
 *   title           → title
 *   slug            → slug
 *   excerpt         → custom_excerpt   (Ghost lo limita a 300 caracteres)
 *   tags            → tags (array de {name})
 *   feature_image   → feature_image (URL ya subida)
 *   feature_image_caption → feature_image_caption (HTML ligero: <a>, <em>, <strong>)
 *   feature_image_alt     → feature_image_alt (texto alternativo SEO/accesibilidad)
 *   status          → status
 *   author          → authors[0] (por slug o email; equivalente a authors=[author])
 *   authors         → authors (array de slugs/emails; mejor para co-firmas)
 *   template        → custom_template ("custom-wide", "custom-full", etc.,
 *                                       coincidiendo con custom-*.hbs del theme)
 *   published_at    → published_at (solo si status="scheduled")
 */
async function upsertPost(client, frontmatter, html, { dryRun = false, force = false } = {}) {
  const payload = {
    title: frontmatter.title,
    slug: frontmatter.slug,
    html,
    status: frontmatter.status,
    tags: frontmatter.tags.map((name) => ({ name }))
  };

  if (frontmatter.excerpt) payload.custom_excerpt = frontmatter.excerpt;
  if (frontmatter.feature_image) payload.feature_image = frontmatter.feature_image;
  if (frontmatter.feature_image_caption) payload.feature_image_caption = frontmatter.feature_image_caption;
  if (frontmatter.feature_image_alt) payload.feature_image_alt = frontmatter.feature_image_alt;

  // Ghost Admin API espera objetos {slug} o {email}; los strings sueltos se
  // ignoran silenciosamente y el post se queda con el autor por defecto (Owner).
  const toAuthorRef = (s) => (s && s.includes('@') ? { email: s } : { slug: s });
  if (Array.isArray(frontmatter.authors) && frontmatter.authors.length > 0) {
    payload.authors = frontmatter.authors.map(toAuthorRef);
  } else {
    const author = frontmatter.author || process.env.DEFAULT_AUTHOR_SLUG || null;
    if (author) payload.authors = [toAuthorRef(author)];
  }

  if (frontmatter.template) {
    payload.custom_template = frontmatter.template;
  }

  if (frontmatter.status === 'scheduled' && frontmatter.published_at) {
    payload.published_at = frontmatter.published_at;
  }

  if (dryRun) {
    return { dryRun: true, payload };
  }

  let existing = null;
  try {
    existing = await client.posts.read({ slug: frontmatter.slug });
  } catch (err) {
    // "no encontrado" = el slug no existe aún (crearemos). Preferimos el código/estado
    // de la Admin API; el texto del mensaje queda solo como último recurso.
    const notFound = err.code === 'NOT_FOUND'
      || (err.response && err.response.status === 404)
      || /not found/i.test(err.message || '');
    if (!notFound) throw err;
  }

  // Guardián de slug: si ya existe un post con este slug y no se pidió --force,
  // NO sobrescribimos (esto hace upsert por slug: sin este guardián, publicar un
  // .md cuyo slug coincida con un post viejo lo machacaría en silencio). Devolvemos
  // un bloqueo para que el CLI avise y aborte; --force lo salta a propósito.
  if (existing && !force) {
    return {
      blocked: true,
      existing: {
        id: existing.id,
        title: existing.title,
        slug: existing.slug,
        status: existing.status,
        url: existing.url
      }
    };
  }

  let result;
  if (existing) {
    // Preserva el status del post existente — no degradar published a draft
    // si el front-matter dice draft. El status del front-matter solo manda
    // en la creación inicial.
    const editPayload = { ...payload, id: existing.id, updated_at: existing.updated_at };
    if (existing.status && existing.status !== payload.status) {
      console.log('  ! ' + t('statusPreserved', existing.status, payload.status));
      editPayload.status = existing.status;
    }
    result = await client.posts.edit(editPayload, { source: 'html' });
  } else {
    result = await client.posts.add(payload, { source: 'html' });
  }
  return { dryRun: false, post: result };
}

module.exports = { upsertPost };
