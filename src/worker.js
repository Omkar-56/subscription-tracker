import { handleAsNodeRequest } from 'cloudflare:node';
import { createApp } from '../backend/src/app.js';
import { ensureSchema } from '../backend/src/config/db.js';
import { reminderService } from '../backend/src/services/reminderService.js';

let appInstance = null;
let initPromise = null;
const INTERNAL_PORT = 3000;

async function getOrCreateApp(env) {
  if (!initPromise) {
    initPromise = (async () => {
      // Sync worker env into process.env
      if (env) {
        for (const [key, val] of Object.entries(env)) {
          if (typeof val === 'string' && !process.env[key]) {
            process.env[key] = val;
          }
        }
      }

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
      await getOrCreateApp(env);
      return handleAsNodeRequest(INTERNAL_PORT, request);
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
