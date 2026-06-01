'use strict';

/**
 * Genera un bloque promocional como Product Card nativo de Ghost
 * (kg-product-card) + un disclaimer opcional pequeño debajo.
 *
 * Estructura aceptada en front-matter:
 *
 *   ad:
 *     title:         "Texto gancho del producto"          # gancho
 *     product_name:  "Nombre del producto"                # opcional
 *     description:   "Descripción del producto..."        # cuerpo
 *     image:         ./promo.png              # ruta local (relativa)
 *     button_text:   "COMPRAR AHORA"
 *     button_url:    "https://example.com/buy"
 *     rating:        5                        # 0..5; default 5
 *     disclaimer:    "Texto legal opcional"   # default: vacío (o AD_DISCLAIMER del .env)
 *
 * El campo `image` se trata como las demás imágenes locales: el módulo
 * lib/images detecta y sube; aquí solo emitimos el HTML con el placeholder
 * de la ruta original — el publish.js reemplaza por la URL remota tras subir.
 */

const STAR_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12.729,1.2l3.346,6.629,6.44.638a.805.805,0,0,1,.5,1.374l-5.3,5.253,1.965,7.138a.813.813,0,0,1-1.151.935L12,19.934,5.48,23.163a.813.813,0,0,1-1.151-.935L6.294,15.09.99,9.837a.805.805,0,0,1,.5-1.374l6.44-.638L11.271,1.2A.819.819,0,0,1,12.729,1.2Z"></path></svg>';

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderStars(n) {
  const stars = Math.max(0, Math.min(5, Number.isFinite(+n) ? +n : 5));
  let out = '<div class="kg-product-card-rating">';
  for (let i = 0; i < stars; i++) {
    out += `<span class="kg-product-card-rating-active kg-product-card-rating-star">${STAR_SVG}</span>`;
  }
  for (let i = stars; i < 5; i++) {
    out += `<span class="kg-product-card-rating-star">${STAR_SVG}</span>`;
  }
  out += '</div>';
  return out;
}

/**
 * Devuelve el HTML del bloque anuncio listo para concatenar al markdown.
 * El image src deja la ruta local — lib/images la reemplaza por la URL remota.
 */
function renderAd(ad, opts = {}) {
  if (!ad || typeof ad !== 'object') return '';

  const errors = [];
  if (!ad.title) errors.push('ad.title');
  if (!ad.description) errors.push('ad.description');
  if (!ad.button_text) errors.push('ad.button_text');
  if (!ad.button_url) errors.push('ad.button_url');
  if (errors.length) {
    throw new Error(`Sección 'ad' incompleta — faltan: ${errors.join(', ')}`);
  }

  const imgHtml = ad.image
    ? `<img src="${escapeHtml(ad.image)}" class="kg-product-card-image" loading="lazy" alt="${escapeHtml(ad.product_name || ad.title)}">`
    : '';

  const titleHtml = ad.product_name
    ? `<h4 class="kg-product-card-title">${escapeHtml(ad.product_name)}</h4>`
    : `<h4 class="kg-product-card-title">${escapeHtml(ad.title)}</h4>`;

  // Si hay product_name, el title (gancho) va al inicio de la descripción.
  const descBody = ad.product_name
    ? `<p><strong>${escapeHtml(ad.title)}</strong></p><p>${escapeHtml(ad.description)}</p>`
    : `<p>${escapeHtml(ad.description)}</p>`;

  const stars = renderStars(ad.rating);
  const disclaimer = ad.disclaimer || opts.defaultDisclaimer || '';
  const disclaimerHtml = disclaimer
    ? `\n<div style="text-align: center; margin-top: 20px; margin-bottom: 10px;">
  <p style="font-size: 0.85em; color: #738a94; font-style: italic; margin: 0;">${escapeHtml(disclaimer)}</p>
</div>`
    : '';

  return `
<!--kg-card-begin: html-->
<div class="kg-card kg-product-card">
  <div class="kg-product-card-container">
    ${imgHtml}
    <div class="kg-product-card-title-container">
      ${titleHtml}
    </div>
    ${stars}
    <div class="kg-product-card-description">${descBody}</div>
    <a href="${escapeHtml(ad.button_url)}" class="kg-product-card-button kg-product-card-btn-accent" target="_blank" rel="noopener noreferrer"><span>${escapeHtml(ad.button_text)}</span></a>
  </div>
</div>${disclaimerHtml}
<!--kg-card-end: html-->
`.trim();
}

/**
 * Cuando lib/images sube las imágenes, el src del anuncio queda con la ruta
 * local. Como rewriteContent ya hace la sustitución global por todas las
 * rutas detectadas, esto funciona automáticamente. Esta función expone la
 * ruta local para que findLocalImages la incluya en su escaneo.
 */
function localImagePath(ad) {
  if (!ad || !ad.image) return null;
  if (/^https?:\/\//i.test(ad.image)) return null;
  return ad.image;
}

module.exports = { renderAd, localImagePath };
