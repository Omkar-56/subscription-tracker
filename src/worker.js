import { handleAsNodeRequest } from 'cloudflare:node';
import { createApp } from '../backend/src/app.js';
import { ensureSchema } from '../backend/src/config/db.js';
import { env as configEnv } from '../backend/src/config/env.js';
import { reminderService } from '../backend/src/services/reminderService.js';

let appInstance = null;
let initPromise = null;
const INTERNAL_PORT = 3000;

function syncEnv(env) {
  if (env) {
    for (const [key, val] of Object.entries(env)) {
      if (typeof val === 'string') {
        process.env[key] = val;
        if (key in configEnv) {
          configEnv[key] = val;
        }
      }
    }
    // Support Cloudflare Hyperdrive binding if present
    if (env.HYPERDRIVE && env.HYPERDRIVE.connectionString) {
      process.env.HYPERDRIVE_CONNECTION_STRING = env.HYPERDRIVE.connectionString;
      configEnv.hyperdriveConnectionString = env.HYPERDRIVE.connectionString;
    }
    // Map common casing / camelCase properties
    if (env.DATABASE_URL) configEnv.databaseUrl = env.DATABASE_URL;
    if (env.JWT_SECRET) configEnv.jwtSecret = env.JWT_SECRET;
    if (env.JWT_EXPIRES_IN) configEnv.jwtExpiresIn = env.JWT_EXPIRES_IN;
    if (env.CLIENT_ORIGIN) configEnv.clientOrigin = env.CLIENT_ORIGIN;
    if (env.GOOGLE_CLIENT_ID) configEnv.googleClientId = env.GOOGLE_CLIENT_ID;
    if (env.GEMINI_API_KEY) configEnv.geminiApiKey = env.GEMINI_API_KEY;
    if (env.SMTP_HOST) configEnv.smtpHost = env.SMTP_HOST;
    if (env.SMTP_PORT) configEnv.smtpPort = Number(env.SMTP_PORT);
    if (env.SMTP_SECURE) configEnv.smtpSecure = env.SMTP_SECURE === 'true';
    if (env.SMTP_USER) configEnv.smtpUser = env.SMTP_USER;
    if (env.SMTP_PASS) configEnv.smtpPass = env.SMTP_PASS;
    if (env.EMAIL_FROM) configEnv.emailFrom = env.EMAIL_FROM;
    if (env.CRON_SECRET) configEnv.cronSecret = env.CRON_SECRET;
  }
}

async function getOrCreateApp(env) {
  syncEnv(env);

  if (!initPromise) {
    initPromise = (async () => {
      try {
        await ensureSchema();
      } catch (err) {
        console.warn('[Cloudflare Worker] ensureSchema warning:', err.message);
      }

      const app = createApp();
      app.listen(INTERNAL_PORT);
      appInstance = app;
    })();
  }
  await initPromise;
  return appInstance;
}

export default {
  /**
   * HTTP request handler
   */
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Route API requests to the Express backend
    if (url.pathname.startsWith('/api')) {
      try {
        await getOrCreateApp(env);
        return await handleAsNodeRequest(INTERNAL_PORT, request);
      } catch (err) {
        console.error('[Worker fetch error]:', err);
        return new Response(JSON.stringify({ error: err.message || 'Worker API error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Serve static frontend assets from Cloudflare Workers Assets
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  },

  /**
   * Cloudflare Cron Trigger handler (invoked on schedule, e.g. 0 9 * * *)
   */
  async scheduled(event, env, ctx) {
    console.log('[Cloudflare Worker] Executing scheduled cron reminder trigger:', event.cron);
    ctx.waitUntil(
      (async () => {
        try {
          await getOrCreateApp(env);
          const outcome = await reminderService.sendDueReminders();
          console.log('[Cloudflare Worker] Scheduled reminder run complete:', JSON.stringify(outcome));
        } catch (err) {
          console.error('[Cloudflare Worker] Scheduled reminder cron error:', err);
        }
      })()
    );
  },
};
