'use strict';

/**
 * i18n mínimo para los mensajes del CLI. El idioma se elige en el asistente de
 * primera ejecución y se guarda en .env como CLI_LANG. Por defecto, inglés.
 * Marcador de posición: %s (se sustituye por los argumentos en orden).
 */

// Nombres nativos para el selector de idioma del asistente.
const LANGS = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  pt: 'Português',
  it: 'Italiano',
  nl: 'Nederlands'
};

const STR = {
  reading: {
    en: 'Reading: %s', es: 'Leyendo: %s', fr: 'Lecture : %s', de: 'Lese: %s',
    pt: 'A ler: %s', it: 'Lettura: %s', nl: 'Lezen: %s'
  },
  imagesDetected: {
    en: 'Local images detected: %s', es: 'Imágenes locales detectadas: %s',
    fr: 'Images locales détectées : %s', de: 'Lokale Bilder erkannt: %s',
    pt: 'Imagens locais detetadas: %s', it: 'Immagini locali rilevate: %s',
    nl: 'Lokale afbeeldingen gevonden: %s'
  },
  dryRun: {
    en: 'DRY RUN — nothing will be sent to Ghost',
    es: 'SIMULACRO — no se enviará nada a Ghost',
    fr: 'SIMULATION — rien ne sera envoyé à Ghost',
    de: 'TESTLAUF — es wird nichts an Ghost gesendet',
    pt: 'SIMULAÇÃO — nada será enviado ao Ghost',
    it: 'SIMULAZIONE — non verrà inviato nulla a Ghost',
    nl: 'PROEFRUN — er wordt niets naar Ghost gestuurd'
  },
  uploading: {
    en: 'Processing and uploading images…', es: 'Procesando y subiendo imágenes…',
    fr: 'Traitement et envoi des images…', de: 'Bilder werden verarbeitet und hochgeladen…',
    pt: 'A processar e a enviar imagens…', it: 'Elaborazione e caricamento immagini…',
    nl: 'Afbeeldingen verwerken en uploaden…'
  },
  rendering: {
    en: 'Rendering Markdown to HTML…', es: 'Renderizando Markdown a HTML…',
    fr: 'Conversion du Markdown en HTML…', de: 'Markdown wird in HTML umgewandelt…',
    pt: 'A converter Markdown em HTML…', it: 'Conversione da Markdown a HTML…',
    nl: 'Markdown omzetten naar HTML…'
  },
  upserting: {
    en: 'Creating/updating post (status=%s)…', es: 'Creando/actualizando entrada (status=%s)…',
    fr: "Création/mise à jour de l'article (status=%s)…", de: 'Beitrag wird erstellt/aktualisiert (status=%s)…',
    pt: 'A criar/atualizar a publicação (status=%s)…', it: "Creazione/aggiornamento dell'articolo (status=%s)…",
    nl: 'Bericht aanmaken/bijwerken (status=%s)…'
  },
  dryPayload: {
    en: 'DRY RUN — final payload', es: 'SIMULACRO — payload final',
    fr: 'SIMULATION — charge utile finale', de: 'TESTLAUF — finale Nutzdaten',
    pt: 'SIMULAÇÃO — payload final', it: 'SIMULAZIONE — payload finale',
    nl: 'PROEFRUN — uiteindelijke payload'
  },
  done: {
    en: 'Done.', es: 'Listo.', fr: 'Terminé.', de: 'Fertig.',
    pt: 'Pronto.', it: 'Fatto.', nl: 'Klaar.'
  },
  labelEdit: {
    en: 'Edit:', es: 'Editar:', fr: 'Éditer :', de: 'Bearbeiten:',
    pt: 'Editar:', it: 'Modifica:', nl: 'Bewerken:'
  },
  statusPreserved: {
    en: 'Post already exists with status="%s"; keeping that state (front-matter asked for "%s")',
    es: 'La entrada ya existe con status="%s"; conservo ese estado (el front-matter pedía "%s")',
    fr: 'L\'article existe déjà avec status="%s" ; je conserve cet état (le front-matter demandait "%s")',
    de: 'Beitrag existiert bereits mit status="%s"; dieser Status bleibt erhalten (Front-Matter wollte "%s")',
    pt: 'A publicação já existe com status="%s"; mantenho esse estado (o front-matter pedia "%s")',
    it: 'L\'articolo esiste già con status="%s"; mantengo quello stato (il front-matter chiedeva "%s")',
    nl: 'Bericht bestaat al met status="%s"; die status blijft behouden (front-matter vroeg "%s")'
  },
  verifying: {
    en: 'Verifying connection to Ghost…', es: 'Verificando la conexión con Ghost…',
    fr: 'Vérification de la connexion à Ghost…', de: 'Verbindung zu Ghost wird überprüft…',
    pt: 'A verificar a ligação ao Ghost…', it: 'Verifica della connessione a Ghost…',
    nl: 'Verbinding met Ghost controleren…'
  },
  verifyFail: {
    en: 'Could not connect to Ghost with those details.\n   Check GHOST_URL and the Admin API Key (Settings → Integrations).\n   Detail: %s',
    es: 'No he podido conectar con Ghost con esos datos.\n   Revisa GHOST_URL y la Admin API Key (Settings → Integrations).\n   Detalle: %s',
    fr: 'Impossible de se connecter à Ghost avec ces informations.\n   Vérifiez GHOST_URL et la clé Admin API (Settings → Integrations).\n   Détail : %s',
    de: 'Verbindung zu Ghost mit diesen Daten nicht möglich.\n   Prüfe GHOST_URL und den Admin-API-Schlüssel (Settings → Integrations).\n   Detail: %s',
    pt: 'Não foi possível ligar ao Ghost com esses dados.\n   Verifique o GHOST_URL e a Admin API Key (Settings → Integrations).\n   Detalhe: %s',
    it: 'Impossibile connettersi a Ghost con questi dati.\n   Controlla GHOST_URL e la Admin API Key (Settings → Integrations).\n   Dettaglio: %s',
    nl: 'Kan geen verbinding maken met Ghost met die gegevens.\n   Controleer GHOST_URL en de Admin API Key (Settings → Integrations).\n   Detail: %s'
  },
  errNoUrl: {
    en: 'GHOST_URL is not set in .env', es: 'GHOST_URL no está definido en .env',
    fr: "GHOST_URL n'est pas défini dans .env", de: 'GHOST_URL ist in .env nicht gesetzt',
    pt: 'GHOST_URL não está definido no .env', it: 'GHOST_URL non è definito in .env',
    nl: 'GHOST_URL is niet ingesteld in .env'
  },
  errNoKey: {
    en: 'GHOST_ADMIN_API_KEY is not set in .env', es: 'GHOST_ADMIN_API_KEY no está definido en .env',
    fr: "GHOST_ADMIN_API_KEY n'est pas défini dans .env", de: 'GHOST_ADMIN_API_KEY ist in .env nicht gesetzt',
    pt: 'GHOST_ADMIN_API_KEY não está definido no .env', it: 'GHOST_ADMIN_API_KEY non è definito in .env',
    nl: 'GHOST_ADMIN_API_KEY is niet ingesteld in .env'
  },
  errKeyFormat: {
    en: 'GHOST_ADMIN_API_KEY has an invalid format (expected <24hex>:<64hex>)',
    es: 'GHOST_ADMIN_API_KEY tiene formato inválido (esperado <24hex>:<64hex>)',
    fr: 'GHOST_ADMIN_API_KEY a un format invalide (attendu <24hex>:<64hex>)',
    de: 'GHOST_ADMIN_API_KEY hat ein ungültiges Format (erwartet <24hex>:<64hex>)',
    pt: 'GHOST_ADMIN_API_KEY tem um formato inválido (esperado <24hex>:<64hex>)',
    it: 'GHOST_ADMIN_API_KEY ha un formato non valido (atteso <24hex>:<64hex>)',
    nl: 'GHOST_ADMIN_API_KEY heeft een ongeldig formaat (verwacht <24hex>:<64hex>)'
  },
  wizNoEnv: {
    en: "No .env found. Let's set it up (just this once).",
    es: 'No encuentro un .env. Vamos a configurarlo (solo esta vez).',
    fr: 'Aucun .env trouvé. Configurons-le (une seule fois).',
    de: 'Keine .env gefunden. Richten wir sie ein (nur dieses eine Mal).',
    pt: 'Não encontrei um .env. Vamos configurá-lo (só desta vez).',
    it: 'Nessun .env trovato. Configuriamolo (solo questa volta).',
    nl: 'Geen .env gevonden. Laten we die instellen (eenmalig).'
  },
  wizAskUrl: {
    en: 'Your Ghost site URL (e.g. https://mysite.com): ',
    es: 'URL de tu sitio Ghost (p.ej. https://misitio.com): ',
    fr: 'URL de votre site Ghost (ex. https://monsite.com) : ',
    de: 'URL deiner Ghost-Website (z.B. https://meineseite.com): ',
    pt: 'URL do seu site Ghost (ex. https://omeusite.com): ',
    it: 'URL del tuo sito Ghost (es. https://ilmiosito.com): ',
    nl: 'URL van je Ghost-site (bijv. https://mijnsite.com): '
  },
  wizUrlBad: {
    en: 'It must start with http:// or https://', es: 'Debe empezar por http:// o https://',
    fr: 'Doit commencer par http:// ou https://', de: 'Muss mit http:// oder https:// beginnen',
    pt: 'Deve começar por http:// ou https://', it: 'Deve iniziare con http:// o https://',
    nl: 'Moet beginnen met http:// of https://'
  },
  wizKeyHow: {
    en: 'Create the Admin API Key in: Settings → Integrations → + Add custom integration.\n  Copy the "Admin API Key" (format id:secret).',
    es: 'La Admin API Key se crea en: Settings → Integrations → + Add custom integration.\n  Copia el campo "Admin API Key" (formato id:secret).',
    fr: 'Créez la clé Admin API dans : Settings → Integrations → + Add custom integration.\n  Copiez le champ « Admin API Key » (format id:secret).',
    de: 'Erstelle den Admin-API-Schlüssel unter: Settings → Integrations → + Add custom integration.\n  Kopiere die "Admin API Key" (Format id:secret).',
    pt: 'Crie a Admin API Key em: Settings → Integrations → + Add custom integration.\n  Copie o campo "Admin API Key" (formato id:secret).',
    it: 'Crea la Admin API Key in: Settings → Integrations → + Add custom integration.\n  Copia il campo "Admin API Key" (formato id:secret).',
    nl: 'Maak de Admin API Key aan via: Settings → Integrations → + Add custom integration.\n  Kopieer de "Admin API Key" (formaat id:secret).'
  },
  wizAskKey: {
    en: 'Admin API Key: ', es: 'Admin API Key: ', fr: 'Admin API Key : ', de: 'Admin API Key: ',
    pt: 'Admin API Key: ', it: 'Admin API Key: ', nl: 'Admin API Key: '
  },
  wizKeyBad: {
    en: 'Expected format: 24 hex : 64 hex', es: 'Formato esperado: 24 hex : 64 hex',
    fr: 'Format attendu : 24 hex : 64 hex', de: 'Erwartetes Format: 24 Hex : 64 Hex',
    pt: 'Formato esperado: 24 hex : 64 hex', it: 'Formato atteso: 24 hex : 64 hex',
    nl: 'Verwacht formaat: 24 hex : 64 hex'
  },
  wizAskAuthor: {
    en: 'Default author (slug or email, optional): ',
    es: 'Autor por defecto (slug o email, opcional): ',
    fr: 'Auteur par défaut (slug ou e-mail, facultatif) : ',
    de: 'Standardautor (Slug oder E-Mail, optional): ',
    pt: 'Autor predefinido (slug ou email, opcional): ',
    it: 'Autore predefinito (slug o email, facoltativo): ',
    nl: 'Standaardauteur (slug of e-mail, optioneel): '
  },
  wizSaved: {
    en: 'Saved to %s', es: 'Guardado en %s', fr: 'Enregistré dans %s', de: 'Gespeichert in %s',
    pt: 'Guardado em %s', it: 'Salvato in %s', nl: 'Opgeslagen in %s'
  },
  wizRequired: {
    en: '(required)', es: '(obligatorio)', fr: '(obligatoire)', de: '(erforderlich)',
    pt: '(obrigatório)', it: '(obbligatorio)', nl: '(verplicht)'
  },
  wizReady: {
    en: 'All set. Running your command now…', es: 'Todo listo. Ejecuto tu comando…',
    fr: "C'est prêt. J'exécute votre commande…", de: 'Alles bereit. Führe deinen Befehl aus…',
    pt: 'Tudo pronto. A executar o teu comando…', it: 'Tutto pronto. Eseguo il comando…',
    nl: 'Klaar. Je opdracht wordt nu uitgevoerd…'
  }
};

function lang() {
  const l = (process.env.CLI_LANG || 'en').toLowerCase().slice(0, 2);
  return LANGS[l] ? l : 'en';
}

function t(key, ...args) {
  const entry = STR[key];
  let s = (entry && (entry[lang()] || entry.en)) || key;
  for (const a of args) s = s.replace('%s', String(a));
  return s;
}

module.exports = { t, lang, LANGS };
