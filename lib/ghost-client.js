'use strict';

const GhostAdminAPI = require('@tryghost/admin-api');

function getClient() {
  const url = process.env.GHOST_URL;
  const key = process.env.GHOST_ADMIN_API_KEY;
  const version = process.env.GHOST_API_VERSION || 'v5.0';

  if (!url) throw new Error('GHOST_URL no está definido en .env');
  if (!key) throw new Error('GHOST_ADMIN_API_KEY no está definido en .env');
  if (!/^[0-9a-f]{24}:[0-9a-f]{64}$/i.test(key)) {
    throw new Error('GHOST_ADMIN_API_KEY tiene formato inválido (esperado <24hex>:<64hex>)');
  }

  return new GhostAdminAPI({ url, key, version });
}

module.exports = { getClient };
