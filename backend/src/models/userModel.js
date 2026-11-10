import { query } from '../config/db.js';

const USER_COLUMNS = 'id, name, email, google_id AS "googleId", avatar_url AS "avatarUrl", COALESCE(base_currency, \'INR\') AS "baseCurrency", created_at AS "createdAt"';

export const userModel = {
  async create({ name, email, passwordHash = null, googleId = null, avatarUrl = null, baseCurrency = 'INR' }) {
    const { rows } = await query(
      `INSERT INTO users (name, email, password_hash, google_id, avatar_url, base_currency)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING ${USER_COLUMNS}`,
      [name, email, passwordHash, googleId, avatarUrl, baseCurrency]
    );
    return rows[0];
  },

  async findByEmail(email) {
    const { rows } = await query(
      `SELECT id, name, email, password_hash, google_id AS "googleId", avatar_url AS "avatarUrl", COALESCE(base_currency, 'INR') AS "baseCurrency", created_at AS "createdAt" FROM users WHERE LOWER(email) = LOWER($1)`,
      [email]
    );
    return rows[0] || null;
  },

  async findByGoogleId(googleId) {
    const { rows } = await query(
      `SELECT id, name, email, password_hash, google_id AS "googleId", avatar_url AS "avatarUrl", COALESCE(base_currency, 'INR') AS "baseCurrency", created_at AS "createdAt" FROM users WHERE google_id = $1`,
      [googleId]
    );
    return rows[0] || null;
  },

  async linkGoogleAccount(id, { googleId, avatarUrl }) {
    const { rows } = await query(
      `UPDATE users 
       SET google_id = $2, 
           avatar_url = COALESCE(avatar_url, $3)
       WHERE id = $1
       RETURNING ${USER_COLUMNS}`,
      [id, googleId, avatarUrl]
    );
    return rows[0] || null;
  },

  async findById(id) {
    const { rows } = await query(
      `SELECT ${USER_COLUMNS} FROM users WHERE id = $1`,
      [id]
    );
    return rows[0] || null;
  },

  async updateBaseCurrency(id, baseCurrency) {
    const { rows } = await query(
      `UPDATE users SET base_currency = $2 WHERE id = $1 RETURNING ${USER_COLUMNS}`,
      [id, baseCurrency]
    );
    return rows[0] || null;
  },

  async setResetPasswordToken(id, tokenHash, expiresAt) {
    await query(
      `UPDATE users 
       SET reset_password_token = $2, reset_password_expires_at = $3 
       WHERE id = $1`,
      [id, tokenHash, expiresAt]
    );
  },

  async findByValidResetToken(tokenHash) {
    const { rows } = await query(
      `SELECT id, name, email, reset_password_expires_at 
       FROM users 
       WHERE reset_password_token = $1 
         AND reset_password_expires_at > now()`,
      [tokenHash]
    );
    return rows[0] || null;
  },

  async updatePasswordAndClearResetToken(id, passwordHash) {
    const { rows } = await query(
      `UPDATE users 
       SET password_hash = $2, 
           reset_password_token = NULL, 
           reset_password_expires_at = NULL 
       WHERE id = $1 
       RETURNING ${USER_COLUMNS}`,
      [id, passwordHash]
    );
    return rows[0] || null;
  },
};
