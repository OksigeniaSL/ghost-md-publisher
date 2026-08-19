'use strict';

const { t } = require('./i18n');

/**
 * Resuelve las líneas `::bookmark <url>` a bookmark cards de Ghost.
 *
 * Ghost convierte un <figure class="kg-bookmark-card"> (enviado con ?source=html)
 * en un nodo Lexical `bookmark` NATIVO. Pero necesita los metadatos del enlace
 * (título, descripción, publisher, imagen), que en el editor Ghost saca al pegar
 * la URL. Aquí los buscamos nosotros: fetch de la página + parseo de las etiquetas
 * OpenGraph. Si la red falla, degradamos a la URL desnuda (markdown la enlaza).
 */

function decodeEntities(s) {
  return String(s)
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'").replace(/&#x27;/gi, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Busca el content de la primera <meta property|name="<key>"> que exista.
function metaContent(html, keys) {
  for (const k of keys) {
    const tag = html.match(new RegExp('<meta[^>]+(?:property|name)=["\']' + k + '["\'][^>]*>', 'i'));
    if (tag) {
      const c = tag[0].match(/content=["']([\s\S]*?)["']/i);
      if (c) return decodeEntities(c[1]).trim();
    }
  }
  return '';
}

async function fetchMeta(url, timeoutMs) {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, {
      redirect: 'follow',
      signal: ctrl.signal,
      headers: { 'User-Agent': 'ghost-md-publisher (bookmark card fetcher)' }
    });
    if (!r.ok) return null;
    const html = await r.text();
    const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = metaContent(html, ['og:title', 'twitter:title'])
      || (titleTag ? decodeEntities(titleTag[1]).trim() : '');
    const description = metaContent(html, ['og:description', 'twitter:description', 'description']);
    const image = metaContent(html, ['og:image', 'twitter:image', 'twitter:image:src']);
    const publisher = metaContent(html, ['og:site_name']) || new URL(url).hostname.replace(/^www\./, '');
    let icon = '';
    const link = html.match(/<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]*>/i);
    if (link) {
      const href = link[0].match(/href=["']([^"']+)["']/i);
      if (href) { try { icon = new URL(href[1], url).href; } catch { /* ignora href inválido */ } }
    }
    return { title: title || url, description, image, publisher, icon };
  } catch {
    return null;
  } finally {
    clearTimeout(to);
  }
}

function buildBookmark(url, m) {
  const thumb = m.image
    ? `<div class="kg-bookmark-thumbnail"><img src="${escapeHtml(m.image)}" alt="" loading="lazy"></div>`
    : '';
  const icon = m.icon
    ? `<img class="kg-bookmark-icon" src="${escapeHtml(m.icon)}" alt="" loading="lazy">`
    : '';
  const desc = m.description
    ? `<div class="kg-bookmark-description">${escapeHtml(m.description)}</div>`
    : '';
  // Quirk de Ghost (kg-html-to-lexical): mapea la clase 'kg-bookmark-author' al campo
  // metadata.PUBLISHER (y 'kg-bookmark-publisher' a author). Verificado contra Ghost 6.
  // Por eso el nombre del sitio va en un span con clase kg-bookmark-author, para que
  // aparezca como publisher en la card. No emitimos author (rara vez aporta y confunde).
  const pub = `<span class="kg-bookmark-author">${escapeHtml(m.publisher)}</span>`;
  return `<figure class="kg-card kg-bookmark-card"><a class="kg-bookmark-container" href="${escapeHtml(url)}"><div class="kg-bookmark-content"><div class="kg-bookmark-title">${escapeHtml(m.title)}</div>${desc}<div class="kg-bookmark-metadata">${icon}${pub}</div></div>${thumb}</a></figure>`;
}

async function resolveBookmarks(md, { timeoutMs = 8000 } = {}) {
  const lines = md.split('\n');
  const re = /^::bookmark\s+(https?:\/\/\S+)\s*$/;
  const jobs = [];
  lines.forEach((line, i) => {
    const mch = line.match(re);
    if (mch) jobs.push({ i, url: mch[1] });
  });
  if (!jobs.length) return md;

  await Promise.all(jobs.map(async (job) => {
    const meta = await fetchMeta(job.url, timeoutMs);
    if (meta) {
      lines[job.i] = buildBookmark(job.url, meta);
    } else {
      console.warn('  ! ' + t('bookmarkFail', job.url));
      lines[job.i] = job.url; // fallback: URL desnuda, linkify la enlaza
    }
  }));
  return lines.join('\n');
}

module.exports = { resolveBookmarks };
