'use strict';

const MarkdownIt = require('markdown-it');

/**
 * Convierte markdown a HTML que Ghost (?source=html) acepta y convierte a Lexical.
 * Habilitamos: GFM tables, linkify, typographer, html (porque algunos artículos
 * usan <small>, <em>, <iframe> u otros tags inline puntuales).
 *
 * Pre-proceso aplicado al markdown antes del render:
 *   - `::video <url>` en línea propia → <figure class="kg-card kg-embed-card xp-embed">
 *     con iframe según la fuente: YouTube (incl. Shorts, que se marcan verticales),
 *     Vimeo, Odysee (URL de visionado o de embed) y Rumble (URL de embed).
 *   - `::video <url> | <caption>` añade un figcaption con el texto del caption.
 *
 * Post-proceso aplicado al HTML resultante:
 *   - `<p><img alt="caption" src="..."></p>` → <figure class="kg-card kg-image-card[
 *     kg-card-hascaption]"> + <figcaption> con el texto del alt. Esto es lo que
 *     Ghost / Headline esperan para mostrar pie de foto debajo de la imagen.
 */
function makeRenderer() {
  return new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks: false
  });
}

function buildVideoFigure(iframeHtml, caption, vertical) {
  const cls = 'kg-card kg-embed-card xp-embed'
    + (vertical ? ' xp-embed-vertical' : '')
    + (caption ? ' kg-card-hascaption' : '');
  const captionHtml = caption
    ? `<figcaption><p><span style="white-space: pre-wrap;">${escapeHtml(caption)}</span></p></figcaption>`
    : '';
  return `<!--kg-card-begin: embed-->
<figure class="${cls}">
${iframeHtml}${captionHtml}
</figure>
<!--kg-card-end: embed-->`;
}

function transformVideoShortcodes(md) {
  return md.replace(
    /^::video\s+(https?:\/\/\S+?)(?:\s+\|\s+(.+?))?\s*$/gm,
    (match, url, caption) => {
      const cap = caption ? caption.trim() : null;
      // YouTube (watch, youtu.be, embed y Shorts) — los Shorts se marcan verticales (9:16)
      const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]{6,20})/);
      const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
      // Odysee: URL de embed directa, o URL de visionado (@canal/nombre:claim)
      const odEmbed = url.match(/odysee\.com\/\$\/embed\/\S+/);
      const odWatch = url.match(/odysee\.com\/@[^/]+\/([^/?#:]+):([\w-]+)/);
      // Rumble: URL de embed (rumble.com/embed/<id>/) — el id de embed no coincide con el de la URL de visionado
      const ru = url.match(/rumble\.com\/embed\/[\w.-]+/);
      if (yt) {
        const vertical = /youtube\.com\/shorts\//.test(url);
        const iframe = `<iframe width="640" height="360" src="https://www.youtube.com/embed/${yt[1]}?feature=oembed" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
        return buildVideoFigure(iframe, cap, vertical);
      }
      if (vm) {
        const iframe = `<iframe width="640" height="360" src="https://player.vimeo.com/video/${vm[1]}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
        return buildVideoFigure(iframe, cap, false);
      }
      if (odEmbed || odWatch) {
        const src = odEmbed ? odEmbed[0] : `https://odysee.com/$/embed/${odWatch[1]}/${odWatch[2]}`;
        const iframe = `<iframe width="640" height="360" src="${src}" frameborder="0" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
        return buildVideoFigure(iframe, cap, false);
      }
      if (ru) {
        const iframe = `<iframe width="640" height="360" src="${ru[0]}" frameborder="0" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
        return buildVideoFigure(iframe, cap, false);
      }
      return match; // URL no reconocida — la deja literal; el usuario verá el aviso al revisar el draft
    }
  );
}

function escapeAttr(s) {
  return String(s).replace(/"/g, '&quot;');
}

function postProcessImages(html) {
  return html.replace(
    /<p>\s*<img\s+([^>]+?)\s*\/?>\s*<\/p>/g,
    (match, attrs) => {
      const altMatch = attrs.match(/\balt="([^"]*)"/);
      const srcMatch = attrs.match(/\bsrc="([^"]*)"/);
      if (!srcMatch) return match;
      const src = srcMatch[1];
      const alt = altMatch ? altMatch[1] : '';
      if (!alt.trim()) {
        return `<figure class="kg-card kg-image-card"><img class="kg-image" src="${escapeAttr(src)}" alt="" loading="lazy"></figure>`;
      }
      return `<figure class="kg-card kg-image-card kg-card-hascaption"><img class="kg-image" src="${escapeAttr(src)}" alt="${escapeAttr(alt)}" loading="lazy"><figcaption><span style="white-space: pre-wrap;">${escapeAttr(alt)}</span></figcaption></figure>`;
    }
  );
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildHistoricalDateBlock(historicalDate, historicalYear, className) {
  if (!historicalDate) return '';
  const cls = className || 'historical-date';
  const yearAttr = (historicalYear !== undefined && historicalYear !== null && historicalYear !== '')
    ? ` data-year="${escapeAttr(String(historicalYear))}"`
    : '';
  return `<!--kg-card-begin: html--><div class="${escapeAttr(cls)}"${yearAttr}>${escapeHtml(historicalDate)}</div><!--kg-card-end: html-->\n\n`;
}

function render(md, opts = {}) {
  const pre = transformVideoShortcodes(md);
  const html = makeRenderer().render(pre);
  const body = postProcessImages(html);
  const dateBlock = buildHistoricalDateBlock(opts.historicalDate, opts.historicalYear, opts.historicalDateClass);
  return dateBlock + body;
}

module.exports = { render };
