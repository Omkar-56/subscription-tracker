/**
 * Hybrid Rate Limiter
 * 1. Cloudflare Native Rate Limiting: When deployed to Cloudflare Workers, leverages native
 *    distributed edge RateLimit bindings (AUTH_RATE_LIMITER, AI_RATE_LIMITER, API_RATE_LIMITER).
 * 2. Sliding Window In-Memory Fallback: Operates when running in local Node development,
 *    testing suites, or environments without Cloudflare bindings.
 *
 * NOTE: Cloudflare Workers forbids calling setInterval / setTimeout in global module scope.
 * Cleanup is performed lazily inside request handling to avoid startup validation errors.
 */

class HybridRateLimiter {
  constructor({
    cfBindingName,
    windowMs = 60 * 1000,
    max = 100,
    message = 'Too many requests. Please try again later.',
  }) {
    this.cfBindingName = cfBindingName;
    this.windowMs = windowMs;
    this.max = max;
    this.message = message;
    this.hits = new Map();
  }

  getClientKey(req) {
    const cfIp = req.headers['cf-connecting-ip'];
    if (cfIp) return String(cfIp).trim();

    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      return String(forwarded).split(',')[0].trim();
    }

    return req.ip || req.socket?.remoteAddress || 'unknown-client';
  }

  cleanup(now) {
    // Only prune when cache grows large to keep operations fast
    if (this.hits.size < 500) return;

    for (const [key, timestamps] of this.hits.entries()) {
      const valid = timestamps.filter((t) => now - t < this.windowMs);
      if (valid.length === 0) {
        this.hits.delete(key);
      } else {
        this.hits.set(key, valid);
      }
    }
  }

  middleware() {
    return async (req, res, next) => {
      const key = this.getClientKey(req);

      // Check if Cloudflare native binding is active on worker environment
      const cfLimiter = globalThis.__cf_env?.[this.cfBindingName];
      if (cfLimiter && typeof cfLimiter.limit === 'function') {
        try {
          const { success } = await cfLimiter.limit({ key });
          if (!success) {
            res.setHeader('Retry-After', 60);
            res.setHeader('RateLimit-Limit', this.max);
            res.setHeader('RateLimit-Remaining', 0);
            res.setHeader('X-RateLimit-Source', 'Cloudflare-Worker-RateLimiter');

            console.warn(`[Cloudflare RateLimit - Exceeded] IP: ${key} on ${req.method} ${req.originalUrl}`);
            return res.status(429).json({
              error: this.message,
              retryAfter: 60,
            });
          }

          res.setHeader('X-RateLimit-Source', 'Cloudflare-Worker-RateLimiter');
          return next();
        } catch (cfErr) {
          console.warn(`[Cloudflare RateLimit Error] Falling back to local limiter:`, cfErr.message);
        }
      }

      // In-Memory sliding window fallback for local testing / development
      const now = Date.now();
      this.cleanup(now);

      const clientTimestamps = this.hits.get(key) || [];
      const validTimestamps = clientTimestamps.filter((t) => now - t < this.windowMs);

      if (validTimestamps.length >= this.max) {
        const oldestValid = validTimestamps[0];
        const retryAfterSeconds = Math.max(1, Math.ceil((oldestValid + this.windowMs - now) / 1000));

        res.setHeader('Retry-After', retryAfterSeconds);
        res.setHeader('RateLimit-Limit', this.max);
        res.setHeader('RateLimit-Remaining', 0);
        res.setHeader('RateLimit-Reset', retryAfterSeconds);
        res.setHeader('X-RateLimit-Source', 'Local-SlidingWindow');

        console.warn(`[Security - RateLimit Exceeded] IP: ${key} on ${req.method} ${req.originalUrl}`);
        return res.status(429).json({
          error: this.message,
          retryAfter: retryAfterSeconds,
        });
      }

      validTimestamps.push(now);
      this.hits.set(key, validTimestamps);

      res.setHeader('RateLimit-Limit', this.max);
      res.setHeader('RateLimit-Remaining', Math.max(0, this.max - validTimestamps.length));
      res.setHeader('X-RateLimit-Source', 'Local-SlidingWindow');

      next();
    };
  }
}

// 1. Strict rate limiter for authentication endpoints (login, register, password reset)
// 10 attempts per minute via Cloudflare Rate Limiter
export const authRateLimiter = new HybridRateLimiter({
  cfBindingName: 'AUTH_RATE_LIMITER',
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many authentication attempts. For your security, access has been temporarily delayed. Please try again in 1 minute.',
}).middleware();

// 2. Rate limiter for AI receipt parsing
// 15 uploads per minute via Cloudflare Rate Limiter
export const aiRateLimiter = new HybridRateLimiter({
  cfBindingName: 'AI_RATE_LIMITER',
  windowMs: 60 * 1000,
  max: 15,
  message: 'Receipt parsing limit reached. Please wait a minute before uploading more documents.',
}).middleware();

// 3. General API rate limiter for all other routes
// 120 requests per minute via Cloudflare Rate Limiter
export const apiRateLimiter = new HybridRateLimiter({
  cfBindingName: 'API_RATE_LIMITER',
  windowMs: 60 * 1000,
  max: 120,
  message: 'Too many requests. Please slow down and try again.',
}).middleware();
