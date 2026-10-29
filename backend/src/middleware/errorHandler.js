import { ApiError } from '../utils/ApiError.js';

export function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Route not found' });
}

export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ error: err.message, details: err.details });
  }
  console.error('[API Error]:', err);
  const isDev = process.env.NODE_ENV !== 'production';
  res.status(500).json({ 
    error: err?.message || 'Internal server error',
    ...(isDev || !process.env.DATABASE_URL ? { details: err?.stack || String(err) } : {})
  });
}
