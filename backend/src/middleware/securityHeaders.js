/**
 * Defensive Security Headers Middleware
 * Protects against XSS, clickjacking, MIME sniffing, and insecure protocols.
 */

export function securityHeaders(req, res, next) {
  // Prevent browsers from MIME-sniffing a response away from declared content-type
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Protect against Clickjacking by forbidding the site to be framed in an iframe
  res.setHeader('X-Frame-Options', 'DENY');

  // Legacy XSS filter for older browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Control referrer information sent in HTTP requests
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Enforce HTTPS via HSTS (1 year, includes subdomains, preload-ready)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // Restrict access to sensitive browser features / hardware APIs
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');

  // Content Security Policy (CSP)
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://accounts.google.com https://www.googletagmanager.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://subspens.com https://www.subspens.com https://subtrack.subtrackweb.workers.dev https://oauth2.googleapis.com https://generativelanguage.googleapis.com",
    "frame-src https://accounts.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];
  res.setHeader('Content-Security-Policy', cspDirectives.join('; '));

  next();
}
