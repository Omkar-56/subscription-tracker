import { ApiError } from '../utils/ApiError.js';

export function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Route not found' });
}

export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const statusCode = err.statusCode || err.status || 500;

  if (err instanceof ApiError || (statusCode >= 400 && statusCode < 500)) {
    return res.status(statusCode).json({
      error: err.message || 'Client error',
      ...(err.details ? { details: err.details } : {}),
    });
  }

  // Log error internally on server with full stack for debugging
  console.error('[API Error]:', err);

  const isProduction = process.env.NODE_ENV === 'production';

  // Never leak internal stack traces or database errors in production
  if (isProduction) {
    return res.status(500).json({
      error: 'An unexpected internal error occurred. Please try again later.',
    });
  }

  // Development environment only: return debug details
  res.status(500).json({
    error: err?.message || 'Internal server error',
    details: err?.stack || String(err),
  });
}
