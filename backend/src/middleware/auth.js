import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Strict authentication middleware.
 * Verifies the JWT Bearer token supplied in the Authorization header.
 * Rejects unauthenticated requests with HTTP 401.
 */
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Authentication required. Please log in.'));
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    return next(new ApiError(401, 'Authentication required. Please log in.'));
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    if (!payload || !payload.sub) {
      return next(new ApiError(401, 'Invalid authentication token'));
    }
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Your session has expired. Please log in again.'));
    }
    next(new ApiError(401, 'Invalid or expired token'));
  }
}
