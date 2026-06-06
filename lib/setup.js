'use strict';

/**
 * Asistente de primera ejecución. Si no existe .env, pregunta (de forma interactiva)
 * el idioma, la URL de Ghost y la Admin API Key, y escribe el .env. El idioma elegido
 * se guarda como CLI_LANG para que TODO el CLI hable en ese idioma a partir de ahí.
 */

const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');
const { t, LANGS } = require('./i18n');

const ENV_PATH = path.join(__dirname, '..', '.env');

function envExists(p) {
  return fs.existsSync(p || ENV_PATH);
}

function ask(rl, q) {
  return new Promise((resolve) => rl.question(q, (a) => resolve((a || '').trim())));
}

async function askValid(rl, q, { required, validate, retryMsg }) {
  for (;;) {
    const a = await ask(rl, q);
    if (!a && required) { console.log('  ' + t('wizRequired')); continue; }
    if (a && validate && !validate(a)) { console.log('  ' + retryMsg); continue; }
    return a;
  }
}

// Selector de idioma. Se muestra bilingüe (EN/ES) porque aún no se ha elegido idioma.
async function pickLanguage(rl) {
  const codes = Object.keys(LANGS);
  console.log('\n  Select language / Selecciona idioma:');
  codes.forEach((c, i) => console.log(`    ${i + 1}) ${LANGS[c]}`));
  for (;;) {
    const a = await ask(rl, `  Number / Número [1-${codes.length}]: `);
    const n = parseInt(a, 10);
    if (n >= 1 && n <= codes.length) return codes[n - 1];
  }
}

async function runWizard(envPath = ENV_PATH) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const chosen = await pickLanguage(rl);
    process.env.CLI_LANG = chosen;

    console.log('\n  ' + t('wizNoEnv') + '\n');
    const url = await askValid(rl, '  ' + t('wizAskUrl'), {
      required: true,
      validate: (v) => /^https?:\/\/.+/.test(v),
      retryMsg: t('wizUrlBad')
    });
    console.log('\n  ' + t('wizKeyHow') + '\n');
    const key = await askValid(rl, '  ' + t('wizAskKey'), {
      required: true,
      validate: (v) => /^[0-9a-f]{24}:[0-9a-f]{64}$/i.test(v),
      retryMsg: t('wizKeyBad')
    });
    const author = await ask(rl, '  ' + t('wizAskAuthor'));

    const cleanUrl = url.replace(/\/$/, '');
    const lines = [
      '# ghost-md-publisher — generado por el asistente',
      'CLI_LANG=' + chosen,
      'GHOST_URL=' + cleanUrl,
      'GHOST_ADMIN_API_KEY=' + key,
      'GHOST_API_VERSION=v5.0',
      'DEFAULT_AUTHOR_SLUG=' + author,
      ''
    ];
    fs.writeFileSync(envPath, lines.join('\n'), 'utf8');

    // Cargar en process.env para esta misma ejecución (dotenv ya corrió antes).
    process.env.GHOST_URL = cleanUrl;
    process.env.GHOST_ADMIN_API_KEY = key;
    if (!process.env.GHOST_API_VERSION) process.env.GHOST_API_VERSION = 'v5.0';
    if (author) process.env.DEFAULT_AUTHOR_SLUG = author;

    console.log('\n  ✓ ' + t('wizSaved', envPath));
    console.log('  ' + t('wizReady') + '\n');
  } finally {
    rl.close();
  }
}

// Lanza el asistente solo si no hay .env y hay una terminal interactiva. En entornos
// no interactivos (CI), no bloquea: getClient lanzará un error claro si faltan datos.
async function ensureEnv() {
  if (envExists()) return;
  if (!process.stdin.isTTY) return;
  await runWizard();
}

module.exports = { ensureEnv, runWizard, envExists, ENV_PATH };
