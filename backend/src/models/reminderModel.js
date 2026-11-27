import { query } from '../config/db.js';

const REMINDER_COLUMNS = `
  r.id, r.user_id AS "userId", r.subscription_id AS "subscriptionId",
  r.due_date AS "dueDate", r.status, r.sent_at AS "sentAt",
  r.channel, r.message, r.created_at AS "createdAt"
`;

const EFFECTIVE_DUE_DATE_SQL = `
  CASE
    WHEN COALESCE(s.is_free_trial, FALSE) THEN COALESCE(s.cancellation_deadline, s.trial_end_date, s.next_renewal_date)
    ELSE s.next_renewal_date
  END
`;

export const reminderModel = {
  async create({ userId, subscriptionId, dueDate, status = 'pending', sentAt = new Date(), channel = 'in_app', message }) {
    const { rows } = await query(
      `INSERT INTO reminders
        (user_id, subscription_id, due_date, status, sent_at, channel, message)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, user_id AS "userId", subscription_id AS "subscriptionId",
                 due_date AS "dueDate", status, sent_at AS "sentAt", channel, message, created_at AS "createdAt"`,
      [userId, subscriptionId, dueDate, status, sentAt, channel, message]
    );
    return rows[0];
  },

  /**
   * Inserts a pending reminder for (userId, subscriptionId, dueDate) or refreshes the existing
   * pending reminder instead of creating duplicate alerts for the same billing cycle.
   */
  async createOrUpdatePending({ userId, subscriptionId, dueDate, sentAt = new Date(), channel = 'in_app', message }) {
    const { rows: existing } = await query(
      `SELECT id
       FROM reminders
       WHERE user_id = $1 AND subscription_id = $2 AND due_date = $3 AND status = 'pending'
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId, subscriptionId, dueDate]
    );

    if (existing[0]) {
      const { rows } = await query(
        `UPDATE reminders
         SET sent_at = $2, channel = $3, message = $4
         WHERE id = $1
         RETURNING id, user_id AS "userId", subscription_id AS "subscriptionId",
                   due_date AS "dueDate", status, sent_at AS "sentAt", channel, message, created_at AS "createdAt"`,
        [existing[0].id, sentAt, channel, message]
      );
      return rows[0];
    }

    return this.create({
      userId,
      subscriptionId,
      dueDate,
      status: 'pending',
      sentAt,
      channel,
      message,
    });
  },

  /**
   * Synchronizes pending reminders with the current state of subscriptions for a user:
   * - Marks reminders whose subscription is no longer active as 'dismissed'.
   * - Marks reminders from past/superseded cycles (where due_date != effective subscription date) as 'paid' (or 'dismissed' for trials).
   * - Deduplicates multiple pending reminders for the same (subscription_id, due_date), keeping the newest one.
   */
  async syncStaleForUser(userId) {
    // 1. Resolve reminders that are out of sync with their subscription's status or renewal/deadline date
    await query(
      `UPDATE reminders r
       SET status = CASE
         WHEN s.status <> 'active' OR COALESCE(s.is_free_trial, FALSE) = TRUE THEN 'dismissed'
         ELSE 'paid'
       END
       FROM subscriptions s
       WHERE r.subscription_id = s.id
         AND r.user_id = $1
         AND r.status = 'pending'
         AND (
           s.status <> 'active'
           OR r.due_date IS NULL
           OR r.due_date <> (${EFFECTIVE_DUE_DATE_SQL})
         )`,
      [userId]
    );

    // 2. Deduplicate any remaining pending reminders for the same (subscription_id, due_date)
    await query(
      `WITH ranked AS (
         SELECT id,
                ROW_NUMBER() OVER (
                  PARTITION BY user_id, subscription_id, due_date
                  ORDER BY created_at DESC, id DESC
                ) AS rn
         FROM reminders
         WHERE user_id = $1 AND status = 'pending'
       )
       UPDATE reminders
       SET status = 'dismissed'
       WHERE id IN (SELECT id FROM ranked WHERE rn > 1)`,
      [userId]
    );
  },

  async findPendingForUser(userId) {
    const { rows } = await query(
      `SELECT * FROM (
         SELECT DISTINCT ON (r.subscription_id, r.due_date)
                ${REMINDER_COLUMNS}, s.name AS "subscriptionName", s.amount, s.currency, s.category, s.billing_cycle AS "billingCycle",
                COALESCE(s.is_free_trial, FALSE) AS "isFreeTrial", s.trial_end_date AS "trialEndDate",
                s.cancellation_deadline AS "cancellationDeadline", s.post_trial_amount AS "postTrialAmount",
                s.post_trial_currency AS "postTrialCurrency"
         FROM reminders r
         JOIN subscriptions s ON s.id = r.subscription_id
         WHERE r.user_id = $1
           AND r.status = 'pending'
           AND s.status = 'active'
           AND r.due_date = (${EFFECTIVE_DUE_DATE_SQL})
         ORDER BY r.subscription_id, r.due_date ASC, r.created_at DESC, r.id DESC
       ) sub
       ORDER BY sub."dueDate" ASC`,
      [userId]
    );
    return rows;
  },

  async findRecentForSubscription(userId, subscriptionId, dueDate) {
    const { rows } = await query(
      `SELECT id, status, due_date AS "dueDate", sent_at AS "sentAt"
       FROM reminders
       WHERE user_id = $1 AND subscription_id = $2 AND due_date = $3
       LIMIT 1`,
      [userId, subscriptionId, dueDate]
    );
    return rows[0] || null;
  },

  async findSentTodayForSubscription(userId, subscriptionId) {
    const { rows } = await query(
      `SELECT id, status, due_date AS "dueDate", sent_at AS "sentAt"
       FROM reminders
       WHERE user_id = $1 AND subscription_id = $2 AND channel = 'email'
         AND sent_at >= CURRENT_DATE
       LIMIT 1`,
      [userId, subscriptionId]
    );
    return rows[0] || null;
  },

  async markPaidForSubscription(userId, subscriptionId) {
    const { rows } = await query(
      `UPDATE reminders
       SET status = 'paid'
       WHERE user_id = $1 AND subscription_id = $2 AND status = 'pending'
       RETURNING id`,
      [userId, subscriptionId]
    );
    return rows;
  },

  async markPaidForSubscriptionBeforeDate(userId, subscriptionId, beforeDate) {
    const { rows } = await query(
      `UPDATE reminders
       SET status = 'paid'
       WHERE user_id = $1
         AND subscription_id = $2
         AND status = 'pending'
         AND (due_date IS NULL OR due_date < $3)
       RETURNING id`,
      [userId, subscriptionId, beforeDate]
    );
    return rows;
  },

  async dismiss(userId, id) {
    const { rows } = await query(
      `UPDATE reminders
       SET status = 'dismissed'
       WHERE user_id = $1 AND id = $2
       RETURNING id`,
      [userId, id]
    );
    return rows[0] || null;
  },
};
