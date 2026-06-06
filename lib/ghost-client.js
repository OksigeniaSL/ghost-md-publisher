'use strict';

const GhostAdminAPI = require('@tryghost/admin-api');
const { t } = require('./i18n');

function getClient() {
  const url = process.env.GHOST_URL;
  const key = process.env.GHOST_ADMIN_API_KEY;
  const version = process.env.GHOST_API_VERSION || 'v5.0';

  if (!url) throw new Error(t('errNoUrl'));
  if (!key) throw new Error(t('errNoKey'));
  if (!/^[0-9a-f]{24}:[0-9a-f]{64}$/i.test(key)) {
    throw new Error(t('errKeyFormat'));
  }

  return new GhostAdminAPI({ url, key, version });
}

// Comprueba que la URL + clave conectan de verdad (llamada autenticada mínima).
// Si falla, lanza un mensaje claro en vez de un error técnico a media subida.
async function verifyClient(client) {
  try {
    await client.posts.browse({ limit: 1 });
  } catch (err) {
    const detail = (err && err.message) ? err.message : String(err);
    throw new Error(t('verifyFail', detail));
  }
}

module.exports = { getClient, verifyClient };
