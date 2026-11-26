import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import reminderRoutes from './routes/reminderRoutes.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import { securityHeaders } from './middleware/securityHeaders.js';
import { securityAuditLogger } from './middleware/securityAudit.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';

export function createApp() {
  const app = express();

  // Trusted production & preview origins
  const ALLOWED_ORIGINS = new Set([
    'https://subspens.com',
    'https://www.subspens.com',
    'https://subtrack.subtrackweb.workers.dev',
    'https://development-subtrack.subtrackweb.workers.dev',
  ]);

  if (env.clientOrigin && env.clientOrigin !== '*') {
    ALLOWED_ORIGINS.add(env.clientOrigin);
  }

  const corsOrigin = (origin, callback) => {
    // Allow non-browser requests or same-origin requests with no Origin header
    if (!origin) return callback(null, true);

    // Allow whitelisted production & preview domains
    if (ALLOWED_ORIGINS.has(origin)) {
      return callback(null, true);
    }

    // Allow localhost during development or testing
    if (env.nodeEnv !== 'production') {
      try {
        const u = new URL(origin);
        if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
          return callback(null, true);
        }
      } catch {}
    }

    // Strictly reject unauthorized origin
    const err = new Error(`CORS blocked for origin: ${origin}`);
    err.status = 403;
    return callback(err);
  };

  // 1. Security audit logging
  app.use(securityAuditLogger);

  // 2. Defensive security headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options, etc.)
  app.use(securityHeaders);

  // 3. Strict CORS configuration
  app.use(cors({ origin: corsOrigin, credentials: true }));

  // 4. General API rate limiter (sliding window, 120 req/min per IP)
  app.use('/api', apiRateLimiter);

  // 5. Body parsers with bounded limit (12MB max for receipt base64 / documents)
  app.use(express.json({ limit: '12mb' }));
  app.use(express.urlencoded({ extended: true, limit: '12mb' }));

  app.get('/api', (req, res) => res.json({ status: 'ok', name: 'Subspens API' }));
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  app.use('/api/auth', authRoutes);
  app.use('/api/subscriptions', subscriptionRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/reminders', reminderRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
