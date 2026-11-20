import { handleAsNodeRequest } from 'cloudflare:node';
import { createApp } from '../backend/src/app.js';
import { ensureSchema } from '../backend/src/config/db.js';
import { env as configEnv } from '../backend/src/config/env.js';
import { reminderService } from '../backend/src/services/reminderService.js';
import { subscriptionService } from '../backend/src/services/subscriptionService.js';

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
    if (env.RESEND_API_KEY) configEnv.resendApiKey = env.RESEND_API_KEY;
    if (env.EMAIL_FROM) configEnv.emailFrom = env.EMAIL_FROM;
    if (env.SMTP_HOST) configEnv.smtpHost = env.SMTP_HOST;
    if (env.SMTP_PORT) configEnv.smtpPort = Number(env.SMTP_PORT);
    if (env.SMTP_SECURE) configEnv.smtpSecure = env.SMTP_SECURE === 'true';
    if (env.SMTP_USER) configEnv.smtpUser = env.SMTP_USER;
    if (env.SMTP_PASS) configEnv.smtpPass = env.SMTP_PASS;
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

    // 1. Enforce HTTPS: Redirect plain HTTP requests to HTTPS for public domains
    if (url.protocol === 'http:' && !url.hostname.includes('localhost') && !url.hostname.includes('127.0.0.1')) {
      url.protocol = 'https:';
      return Response.redirect(url.toString(), 301);
    }

    // 2. Cloudflare Native Edge Rate Limiting
    const clientIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'edge-client';

    // A. Auth route rate limiting (login, register, google, forgot-password, reset-password)
    const isAuthRoute =
      url.pathname.startsWith('/api/auth/login') ||
      url.pathname.startsWith('/api/auth/register') ||
      url.pathname.startsWith('/api/auth/google') ||
      url.pathname.startsWith('/api/auth/forgot-password') ||
      url.pathname.startsWith('/api/auth/reset-password');

    if (isAuthRoute && env.AUTH_RATE_LIMITER) {
      try {
        const { success } = await env.AUTH_RATE_LIMITER.limit({ key: clientIp });
        if (!success) {
          console.warn(`[Cloudflare RateLimit] Auth limit exceeded for IP: ${clientIp}`);
          return new Response(
            JSON.stringify({
              error: 'Too many authentication attempts. For your security, access has been temporarily delayed by Cloudflare Rate Limiter. Please try again in 1 minute.',
              retryAfter: 60,
            }),
            {
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                'Retry-After': '60',
                'X-RateLimit-Limit': '10',
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Source': 'Cloudflare-Worker-RateLimiter',
              },
            }
          );
        }
      } catch (err) {
        console.warn('[Cloudflare RateLimit] Error evaluating auth rate limit:', err);
      }
    }

    // B. AI parsing route rate limiting
    const isAiRoute = url.pathname.startsWith('/api/subscriptions/parse-receipt');
    if (isAiRoute && env.AI_RATE_LIMITER) {
      try {
        const { success } = await env.AI_RATE_LIMITER.limit({ key: clientIp });
        if (!success) {
          console.warn(`[Cloudflare RateLimit] AI parse limit exceeded for IP: ${clientIp}`);
          return new Response(
            JSON.stringify({
              error: 'Receipt parsing limit reached. Please wait a minute before uploading more documents.',
              retryAfter: 60,
            }),
            {
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                'Retry-After': '60',
                'X-RateLimit-Limit': '15',
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Source': 'Cloudflare-Worker-RateLimiter',
              },
            }
          );
        }
      } catch (err) {
        console.warn('[Cloudflare RateLimit] Error evaluating AI rate limit:', err);
      }
    }

    // C. General API rate limiting
    if (url.pathname.startsWith('/api') && env.API_RATE_LIMITER) {
      try {
        const { success } = await env.API_RATE_LIMITER.limit({ key: clientIp });
        if (!success) {
          console.warn(`[Cloudflare RateLimit] API limit exceeded for IP: ${clientIp}`);
          return new Response(
            JSON.stringify({
              error: 'Too many requests. Please slow down and try again.',
              retryAfter: 60,
            }),
            {
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                'Retry-After': '60',
                'X-RateLimit-Limit': '120',
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Source': 'Cloudflare-Worker-RateLimiter',
              },
            }
          );
        }
      } catch (err) {
        console.warn('[Cloudflare RateLimit] Error evaluating API rate limit:', err);
      }
    }

    // 3. Route API requests to the Express backend
    if (url.pathname.startsWith('/api')) {
      try {
        globalThis.__cf_ctx = ctx;
        globalThis.__cf_env = env;
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

    // 4. Serve static frontend assets with security headers
    if (env.ASSETS) {
      const response = await env.ASSETS.fetch(request);
      const newHeaders = new Headers(response.headers);
      newHeaders.set('X-Content-Type-Options', 'nosniff');
      newHeaders.set('X-Frame-Options', 'DENY');
      newHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      newHeaders.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    }

    return new Response('Not Found', { status: 404 });
  },

  /**
   * Cloudflare Cron Trigger handler (invoked on schedule, e.g. 0 9 * * *)
   */
  async scheduled(event, env, ctx) {
    console.log('[Cloudflare Worker] Executing scheduled cron trigger:', event.cron);
    ctx.waitUntil(
      (async () => {
        try {
          globalThis.__cf_ctx = ctx;
          globalThis.__cf_env = env;
          await getOrCreateApp(env);

          // 1. Auto-renew subscriptions that reached their renewal date
          const renewOutcome = await subscriptionService.autoRenewDueSubscriptions();
          console.log('[Cloudflare Worker] Scheduled auto-renewal complete:', JSON.stringify(renewOutcome));

          // 2. Send due reminders for upcoming renewals
          const reminderOutcome = await reminderService.sendDueReminders();
          console.log('[Cloudflare Worker] Scheduled reminder run complete:', JSON.stringify(reminderOutcome));
        } catch (err) {
          console.error('[Cloudflare Worker] Scheduled cron error:', err);
        }
      })()
    );
  },
};
