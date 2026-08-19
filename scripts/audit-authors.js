#!/usr/bin/env node
'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env'), quiet: true });
const GhostAdminAPI = require('@tryghost/admin-api');

const api = new GhostAdminAPI({
  url: process.env.GHOST_URL,
  key: process.env.GHOST_ADMIN_API_KEY,
  version: process.env.GHOST_API_VERSION || 'v5.0'
});

(async () => {
  console.log('=== AUTORES ===\n');
  const users = await api.users.browse({ limit: 'all', include: 'roles,count.posts' });
  for (const u of users) {
    console.log(`- ${u.name}  (slug=${u.slug})`);
    console.log(`    email:        ${u.email}`);
    console.log(`    roles:        ${(u.roles || []).map(r => r.name).join(', ')}`);
    console.log(`    posts count:  ${u.count?.posts ?? '?'}`);
    console.log(`    profile_img:  ${u.profile_image || '—'}`);
    console.log(`    cover_img:    ${u.cover_image || '—'}`);
    console.log(`    bio:          ${(u.bio || '').replace(/\n/g, ' ').slice(0, 200)}`);
    console.log(`    location:     ${u.location || '—'}`);
    console.log(`    website:      ${u.website || '—'}`);
    console.log(`    meta_title:   ${u.meta_title || '—'}`);
    console.log(`    meta_descr:   ${u.meta_description || '—'}`);
    console.log(`    url público:  ${u.url}`);
    console.log('');
  }

  console.log('\n=== SETTINGS — Code Injection (CSS personalizado) ===\n');
  const settings = await api.settings.browse();
  // settings devuelve un objeto con keys plano
  const head = settings.codeinjection_head || settings.codeinjection_global_head || '';
  const foot = settings.codeinjection_foot || settings.codeinjection_global_foot || '';
  console.log('--- codeinjection_head ---');
  console.log(head || '(vacío)');
  console.log('\n--- codeinjection_foot ---');
  console.log(foot || '(vacío)');
})().catch((err) => {
  console.error('ERROR:', err.message);
  if (process.env.DEBUG) console.error(err);
  process.exit(1);
});
