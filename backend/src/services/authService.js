import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userModel } from '../models/userModel.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { sendEmail, buildPasswordResetEmailHtml, buildPasswordResetEmailText } from './emailService.js';
import { ALLOWED_CURRENCY_CODES } from './currencyService.js';

const SALT_ROUNDS = 10;

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

export const authService = {
  async register({ name, email, password, baseCurrency = 'INR' }) {
    const existing = await userModel.findByEmail(email);
    if (existing) {
      throw new ApiError(409, 'An account with this email already exists');
    }
    const cleanCurrency = (baseCurrency || 'INR').toUpperCase();
    if (!ALLOWED_CURRENCY_CODES.includes(cleanCurrency)) {
      throw new ApiError(400, `Unsupported currency. Allowed: ${ALLOWED_CURRENCY_CODES.join(', ')}`);
    }
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await userModel.create({ name, email, passwordHash, baseCurrency: cleanCurrency });
    return { user, token: signToken(user) };
  },

  async login({ email, password }) {
    const user = await userModel.findByEmail(email);
    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }
    if (!user.password_hash) {
      throw new ApiError(400, 'This account was created with Google. Please use "Sign in with Google" or reset your password to set a manual password.');
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new ApiError(401, 'Invalid email or password');
    }
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      googleId: user.googleId,
      avatarUrl: user.avatarUrl,
      baseCurrency: user.baseCurrency || 'INR',
    };
    return { user: safeUser, token: signToken(safeUser) };
  },

  async googleAuth(credential) {
    if (!credential) {
      throw new ApiError(400, 'Google credential token is required');
    }

    // Verify token using Google's public tokeninfo endpoint
    let payload;
    try {
      const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
      if (!res.ok) {
        throw new Error('Google token validation failed');
      }
      payload = await res.json();
    } catch (err) {
      throw new ApiError(401, 'Invalid Google token: ' + err.message);
    }

    // Verify audience matches if client id is configured
    if (env.googleClientId && payload.aud && payload.aud !== env.googleClientId) {
      console.warn(`[Google OAuth] Audience mismatch: got ${payload.aud}, expected ${env.googleClientId}`);
    }

    const { sub: googleId, email, name, picture: avatarUrl } = payload;
    if (!email) {
      throw new ApiError(400, 'Google account has no associated email address');
    }

    // Check if user exists by googleId
    let user = await userModel.findByGoogleId(googleId);

    // If not found by googleId, check by email
    if (!user) {
      user = await userModel.findByEmail(email);
      if (user) {
        // Link google account to existing email user
        user = await userModel.linkGoogleAccount(user.id, { googleId, avatarUrl });
      } else {
        // Create brand new user
        user = await userModel.create({
          name: name || email.split('@')[0],
          email,
          googleId,
          avatarUrl,
          passwordHash: null,
          baseCurrency: 'INR',
        });
      }
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      googleId: user.googleId,
      avatarUrl: user.avatarUrl,
      baseCurrency: user.baseCurrency || 'INR',
    };

    return { user: safeUser, token: signToken(safeUser) };
  },

  async forgotPassword(email, requestOrigin = null) {
    const normalizedEmail = (email || '').trim().toLowerCase();
    const user = await userModel.findByEmail(normalizedEmail);

    // Standard security: Always return the exact same response to prevent user enumeration
    const genericSuccess = {
      message: 'If an account exists with this email address, you will receive password reset instructions.',
    };

    if (!user) {
      return genericSuccess;
    }

    // Generate secure random token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await userModel.setResetPasswordToken(user.id, tokenHash, expiresAt);

    // Determine the base app URL securely:
    // Prefer trusted request origin (localhost:3000, preview .workers.dev / .pages.dev, or production domain),
    // otherwise fallback to env.clientOrigin or 'http://localhost:3000'.
    let appUrl = (env.clientOrigin || 'http://localhost:3000').replace(/\/$/, '');
    if (requestOrigin) {
      try {
        const parsed = new URL(requestOrigin);
        const host = parsed.hostname;
        if (
          host === 'localhost' ||
          host === '127.0.0.1' ||
          host.endsWith('.workers.dev') ||
          host.endsWith('.pages.dev') ||
          (env.clientOrigin && requestOrigin.startsWith(env.clientOrigin))
        ) {
          appUrl = parsed.origin;
        }
      } catch {
        // Ignore parsing errors and keep appUrl fallback
      }
    }

    const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;

    const html = buildPasswordResetEmailHtml({
      userName: user.name,
      resetUrl,
    });

    const text = buildPasswordResetEmailText({
      userName: user.name,
      resetUrl,
    });

    try {
      await sendEmail({
        to: user.email,
        subject: 'Reset your SubTrack password',
        html,
        text,
      });
    } catch (err) {
      console.error('[forgotPassword email send error]:', err.message);
    }

    return genericSuccess;
  },

  async resetPassword({ token, newPassword }) {
    if (!token) {
      throw new ApiError(400, 'Password reset token is required');
    }

    const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');
    const user = await userModel.findByValidResetToken(tokenHash);

    if (!user) {
      throw new ApiError(400, 'Invalid or expired password reset link. Please request a new link.');
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await userModel.updatePasswordAndClearResetToken(user.id, passwordHash);

    return {
      message: 'Your password has been reset successfully. You can now log in with your new password.',
    };
  },

  async me(userId) {
    const user = await userModel.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');
    return user;
  },

  async updateCurrency(userId, currency) {
    const validCurrency = (currency || 'INR').toUpperCase();
    if (!ALLOWED_CURRENCY_CODES.includes(validCurrency)) {
      throw new ApiError(400, `Unsupported currency. Allowed: ${ALLOWED_CURRENCY_CODES.join(', ')}`);
    }
    const updated = await userModel.updateBaseCurrency(userId, validCurrency);
    return updated;
  },
};
