/**
 * Security Audit & Activity Logging Middleware
 * Monitors and logs authentication failures, access violations, rate limit events, and suspicious activity.
 * Always redacts passwords, tokens, and sensitive headers.
 */

const SENSITIVE_FIELDS = new Set([
  'password',
  'newpassword',
  'password_hash',
  'credential',
  'token',
  'secret',
  'authorization',
  'cookie',
]);

export function sanitizeForLogging(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeForLogging);

  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
      clean[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      clean[key] = sanitizeForLogging(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

export function securityAuditLogger(req, res, next) {
  const start = Date.now();
  const ip = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  // Listen to response finish to log security events
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;

    // Log security-relevant events (401 Unauthorized, 403 Forbidden, 429 Too Many Requests, 500 Server Errors)
    if (status === 401 || status === 403 || status === 429 || status >= 500) {
      console.warn(`[Security Alert] Status: ${status} | Method: ${req.method} | URL: ${req.originalUrl} | IP: ${ip} | UA: ${userAgent} | Duration: ${duration}ms`);
    } else if (req.originalUrl.startsWith('/api/auth/') && req.method === 'POST') {
      // Log successful auth attempts (without sensitive credentials)
      console.info(`[Auth Event] Success (${status}) | Path: ${req.originalUrl} | IP: ${ip} | Duration: ${duration}ms`);
    }
  });

  next();
}
