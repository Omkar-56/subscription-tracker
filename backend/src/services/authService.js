import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { userModel } from "../models/userModel.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import {
  sendEmail,
  buildPasswordResetEmailHtml,
  buildPasswordResetEmailText,
} from "./emailService.js";
import { ALLOWED_CURRENCY_CODES } from "./currencyService.js";

const SALT_ROUNDS = 10;
const RESET_TOKEN_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes for security

// Whitelist of trusted production & development hostnames for reset password links
const TRUSTED_DOMAINS = [
  "subspens.com",
  "www.subspens.com",
  "subtrack.subtrackweb.workers.dev",
  "development-subtrack.subtrackweb.workers.dev",
];

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

export const authService = {
  async register({ name, email, password, baseCurrency = "INR" }) {
    const cleanEmail = email.trim().toLowerCase();
    const existing = await userModel.findByEmail(cleanEmail);
    if (existing) {
      throw new ApiError(409, "An account with this email already exists");
    }
    const cleanCurrency = (baseCurrency || "INR").toUpperCase();
    if (!ALLOWED_CURRENCY_CODES.includes(cleanCurrency)) {
      throw new ApiError(
        400,
        `Unsupported currency. Allowed: ${ALLOWED_CURRENCY_CODES.join(", ")}`,
      );
    }
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await userModel.create({
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      baseCurrency: cleanCurrency,
    });
    return { user, token: signToken(user) };
  },

  async login({ email, password }) {
    const cleanEmail = email.trim().toLowerCase();
    const user = await userModel.findByEmail(cleanEmail);
    if (!user) {
      throw new ApiError(401, "Invalid email or password");
    }
    if (!user.password_hash) {
      throw new ApiError(
        400,
        'This account was created with Google. Please use "Sign in with Google" or reset your password to set a manual password.',
      );
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new ApiError(401, "Invalid email or password");
    }
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      googleId: user.googleId,
      avatarUrl: user.avatarUrl,
      baseCurrency: user.baseCurrency || "INR",
    };
    return { user: safeUser, token: signToken(safeUser) };
  },

  async googleAuth(credential) {
    if (!credential) {
      throw new ApiError(400, "Google credential token is required");
    }

    // Verify token using Google's public tokeninfo endpoint
    let payload;
    try {
      const res = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
      );
      if (!res.ok) {
        throw new Error("Google token validation failed");
      }
      payload = await res.json();
    } catch (err) {
      throw new ApiError(401, "Invalid Google token: " + err.message);
    }

    // Verify audience matches configured Google Client ID to prevent token reuse across other apps
    const ALLOWED_GOOGLE_CLIENT_IDS = [
      env.googleClientId,
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      "716397457965-fu0mp9f7h1j0djfds3clff0psvad46do.apps.googleusercontent.com",
      "344939829448-qfvrfn4p17dkhv2h5q0citsp6kaj5kan.apps.googleusercontent.com",
    ].filter(Boolean);

    if (
      ALLOWED_GOOGLE_CLIENT_IDS.length > 0 &&
      !ALLOWED_GOOGLE_CLIENT_IDS.includes(payload.aud)
    ) {
      throw new ApiError(
        401,
        "Google token audience mismatch. Unauthorized client.",
      );
    }

    const { sub: googleId, email, name, picture: avatarUrl } = payload;
    if (!email) {
      throw new ApiError(400, "Google account does not have an email address");
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Check if user already exists by googleId
    let user = await userModel.findByGoogleId(googleId);

    // 2. If not found by googleId, check if account with same email already exists
    if (!user) {
      user = await userModel.findByEmail(cleanEmail);
      if (user) {
        // Link googleId to existing user
        user = await userModel.linkGoogleAccount(user.id, {
          googleId,
          avatarUrl,
        });
      } else {
        // Create new user from Google profile
        user = await userModel.create({
          name: name || cleanEmail.split("@")[0],
          email: cleanEmail,
          googleId,
          avatarUrl,
          baseCurrency: "INR",
        });
      }
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      googleId: user.googleId,
      avatarUrl: user.avatarUrl,
      baseCurrency: user.baseCurrency || "INR",
    };

    return { user: safeUser, token: signToken(safeUser) };
  },

  async forgotPassword(email, requestOrigin = null) {
    const genericSuccess = {
      message:
        "If an account with that email exists, we have sent a password reset link to it.",
    };

    if (!email) return genericSuccess;

    const cleanEmail = email.trim().toLowerCase();
    const user = await userModel.findByEmail(cleanEmail);

    if (!user) {
      return genericSuccess;
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

    await userModel.setResetPasswordToken(user.id, tokenHash, expiresAt);

    let appUrl = "https://subspens.com";

    if (requestOrigin) {
      try {
        const parsed = new URL(requestOrigin);
        const host = parsed.hostname.toLowerCase();

        const isAllowedDomain =
          TRUSTED_DOMAINS.includes(host) ||
          (env.nodeEnv !== "production" &&
            (host === "localhost" || host === "127.0.0.1"));

        if (isAllowedDomain) {
          appUrl = parsed.origin;
        } else {
          console.warn(
            `[Security Warning] Untrusted reset link origin rejected: ${requestOrigin}. Defaulting to https://subspens.com`,
          );
        }
      } catch (e) {
        console.warn(
          `[Security Warning] Malformed origin in forgot-password: ${requestOrigin}`,
        );
      }
    } else if (env.clientOrigin && env.clientOrigin !== "*") {
      appUrl = env.clientOrigin.split(",")[0].trim().replace(/\/$/, "");
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
        subject: "Reset your Subspens password",
        html,
        text,
      });
    } catch (err) {
      console.error("[forgotPassword email send error]:", err.message);
    }

    return genericSuccess;
  },

  async resetPassword({ token, newPassword }) {
    if (!token) {
      throw new ApiError(400, "Password reset token is required");
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(token.trim())
      .digest("hex");
    const user = await userModel.findByValidResetToken(tokenHash);

    if (!user) {
      throw new ApiError(
        400,
        "Invalid or expired password reset link. Please request a new link.",
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await userModel.updatePasswordAndClearResetToken(user.id, passwordHash);

    return {
      message:
        "Your password has been reset successfully. You can now log in with your new password.",
    };
  },

  async me(userId) {
    const user = await userModel.findById(userId);
    if (!user) throw new ApiError(404, "User not found");
    return user;
  },

  async updateCurrency(userId, currency) {
    const validCurrency = (currency || "INR").toUpperCase();
    if (!ALLOWED_CURRENCY_CODES.includes(validCurrency)) {
      throw new ApiError(
        400,
        `Unsupported currency. Allowed: ${ALLOWED_CURRENCY_CODES.join(", ")}`,
      );
    }
    const updated = await userModel.updateBaseCurrency(userId, validCurrency);
    return updated;
  },

  async updateName(userId, name) {
    const cleanName = (name || "").trim();
    if (!cleanName) {
      throw new ApiError(400, "Name cannot be empty");
    }
    const updated = await userModel.updateName(userId, cleanName);
    if (!updated) {
      throw new ApiError(404, "User not found");
    }
    return {
      user: updated,
      token: signToken(updated),
    };
  },

  async updateEmail(userId, email, currentPassword) {
    const cleanEmail = (email || "").trim().toLowerCase();
    if (!cleanEmail) {
      throw new ApiError(400, "Email cannot be empty");
    }

    const user = await userModel.findByIdWithPassword(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (user.email.toLowerCase() === cleanEmail) {
      const safe = await userModel.findById(userId);
      return { user: safe, token: signToken(safe) };
    }

    // Check if new email is already used by another account
    const existing = await userModel.findByEmail(cleanEmail);
    if (existing && existing.id !== userId) {
      throw new ApiError(409, "An account with this email address already exists");
    }

    // Require current password if account has password_hash
    if (user.password_hash) {
      if (!currentPassword) {
        throw new ApiError(400, "Current password is required to change your email address");
      }
      const valid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!valid) {
        throw new ApiError(401, "Incorrect current password");
      }
    }

    const updated = await userModel.updateEmail(userId, cleanEmail);
    return {
      user: updated,
      token: signToken(updated),
    };
  },

  async changePassword(userId, { currentPassword, newPassword }) {
    if (!newPassword || newPassword.length < 8) {
      throw new ApiError(400, "New password must be at least 8 characters long");
    }

    const user = await userModel.findByIdWithPassword(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // If account has an existing password, verify current password
    if (user.password_hash) {
      if (!currentPassword) {
        throw new ApiError(400, "Current password is required");
      }
      const valid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!valid) {
        throw new ApiError(401, "Incorrect current password");
      }
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await userModel.updatePassword(userId, passwordHash);

    return {
      message: "Password updated successfully",
    };
  },

  async deleteAccount(userId, { currentPassword }) {
    const user = await userModel.findByIdWithPassword(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Verify current password if password exists
    if (user.password_hash) {
      if (!currentPassword) {
        throw new ApiError(400, "Current password is required to delete your account");
      }
      const valid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!valid) {
        throw new ApiError(401, "Incorrect current password");
      }
    }

    await userModel.deleteUser(userId);
    return {
      message: "Account permanently deleted",
    };
  },
};
