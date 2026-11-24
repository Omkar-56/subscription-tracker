import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let smtpTransporter = null;

function getSmtpTransporter() {
  if (!smtpTransporter && env.smtpUser && env.smtpPass) {
    smtpTransporter = nodemailer.createTransport({
      host: env.smtpHost || 'smtp.gmail.com',
      port: env.smtpPort || 465,
      secure: env.smtpSecure ?? env.smtpPort === 465,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass,
      },
    });
  }
  return smtpTransporter;
}

/**
 * Sanitize email subject to prevent header injection
 */
function sanitizeSubject(subject = '') {
  return String(subject).replace(/[\r\n]+/g, ' ').trim();
}

/**
 * Send an email via Resend REST API (preferred, fast, cloud-native).
 * Works across both Node.js and Cloudflare Workers runtime.
 */
async function sendViaResend({ apiKey, from, to, subject, html, text }) {
  const recipients = Array.isArray(to) ? to.map((e) => String(e).trim()) : [String(to).trim()];
  const cleanSubject = sanitizeSubject(subject);

  const payload = {
    from,
    to: recipients,
    subject: cleanSubject,
    ...(html ? { html } : {}),
    ...(text ? { text } : {}),
  };

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey.trim()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10000), // 10s request timeout
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `HTTP ${response.status} ${response.statusText}`;
    console.error(`[Resend Error] Status: ${response.status} | Details: ${errorMsg}`);
    throw new Error(`Resend email delivery failed: ${errorMsg}`);
  }

  console.log(`[Email Sent via Resend] To: ${recipients.join(', ')} | Id: ${data.id}`);
  return { success: true, provider: 'resend', id: data.id };
}

/**
 * Send an email using Resend (Primary), Nodemailer SMTP (Fallback),
 * or log simulated output if credentials are not yet configured.
 */
export async function sendEmail({ to, subject, html, text, from: customFrom }) {
  const from = customFrom || env.emailFrom || 'Subspens <reminder@subspens.com>';
  const cleanSubject = sanitizeSubject(subject);

  // 1. Primary: Send via Resend HTTP API
  if (env.resendApiKey) {
    try {
      return await sendViaResend({
        apiKey: env.resendApiKey,
        from,
        to,
        subject: cleanSubject,
        html,
        text,
      });
    } catch (err) {
      console.error('[Email Delivery Error - Resend]:', err.message);
      // If SMTP is also configured, attempt fallback; otherwise rethrow
      if (!env.smtpUser || !env.smtpPass) {
        throw err;
      }
      console.warn('[Email Fallback] Attempting secondary delivery via SMTP...');
    }
  }

  // 2. Secondary Fallback: Send via Nodemailer SMTP (if configured)
  const transporter = getSmtpTransporter();
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from,
        to,
        subject: cleanSubject,
        html,
        text,
      });
      console.log(`[Email Sent via SMTP] To: ${to} | MessageId: ${info.messageId}`);
      return { success: true, provider: 'smtp', id: info.messageId };
    } catch (err) {
      console.error('[SMTP Delivery Error]:', err.message);
      throw err;
    }
  }

  // 3. Development / Simulation Mode (when neither RESEND_API_KEY nor SMTP credentials are set)
  console.log('----------------------------------------------------');
  console.log('[EMAIL REMINDER SIMULATED]');
  console.log(`To: ${to}`);
  console.log(`Subject: ${cleanSubject}`);
  console.log(`From: ${from}`);
  console.log('[Note: Configure RESEND_API_KEY in environment to send live emails from reminder@subspens.com]');
  console.log('----------------------------------------------------');

  return {
    success: true,
    provider: 'simulated',
    note: 'Email simulated in server logs. Set RESEND_API_KEY in environment variables for live delivery.',
  };
}

/**
 * Format a clean HTML reminder email
 */
export function buildReminderEmailHtml({
  userName = 'there',
  subscriptionName,
  category = 'other',
  amount,
  currency = 'INR',
  billingCycle = 'monthly',
  dueDateFormatted,
  daysLeft,
  isTrial = false,
  postTrialAmount = null,
  postTrialCurrency = null,
  appUrl = 'https://subspens.com',
}) {
  const isUrgent = daysLeft <= 1;
  const daysText =
    daysLeft === 0
      ? 'DUE TODAY'
      : daysLeft === 1
        ? 'DUE TOMORROW'
        : `DUE IN ${daysLeft} DAYS`;

  const bannerBg = isTrial
    ? '#EA580C' // Alert orange
    : isUrgent
      ? '#DC2626' // Alert red
      : '#0F3D2E'; // Subspens Forest Green

  const chargeAmountStr =
    isTrial && postTrialAmount !== null
      ? `${postTrialCurrency || currency} ${Number(postTrialAmount).toFixed(2)} / ${billingCycle}`
      : `${currency} ${Number(amount).toFixed(2)} / ${billingCycle}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Subspens Reminder</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F9FA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E293B;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F8F9FA; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 540px; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05); border: 1px solid #E2E8F0;" cellspacing="0" cellpadding="0">
          <!-- Top Accent Banner -->
          <tr>
            <td style="background-color: ${bannerBg}; padding: 16px 28px; text-align: left;">
              <span style="color: #FFFFFF; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;">
                ${isTrial ? 'Free Trial Deadline' : 'Upcoming Renewal Alert'}
              </span>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 28px 28px 20px 28px;">
              <h1 style="margin: 0 0 10px 0; font-size: 20px; font-weight: 600; color: #0F172A; line-height: 1.3;">
                Hi ${userName || 'there'},
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 15px; color: #475569; line-height: 1.6;">
                ${
                  isTrial
                    ? `Your free trial for <strong style="color: #0F172A;">${subscriptionName}</strong> ends on <strong style="color: #0F172A;">${dueDateFormatted}</strong>. Cancel before this deadline to avoid being automatically charged.`
                    : `Your subscription for <strong style="color: #0F172A;">${subscriptionName}</strong> is scheduled to renew on <strong style="color: #0F172A;">${dueDateFormatted}</strong>.`
                }
              </p>

              <!-- Highlight Subscription Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 18px 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="font-size: 16px; font-weight: 600; color: #0F172A; padding-bottom: 8px;">
                          ${subscriptionName}
                        </td>
                        <td align="right" style="font-size: 12px; font-weight: 700; color: ${bannerBg}; text-transform: uppercase; letter-spacing: 0.05em; padding-bottom: 8px;">
                          ${daysText}
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 13px; color: #64748B; text-transform: capitalize;">
                          Category: ${category}
                        </td>
                        <td align="right" style="font-size: 15px; font-weight: 700; color: #0F172A;">
                          ${chargeAmountStr}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Call to Action -->
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center" style="border-radius: 6px; background-color: #0F3D2E;">
                    <a href="${appUrl}/subscriptions" target="_blank" style="font-size: 14px; font-weight: 600; color: #FFFFFF; text-decoration: none; padding: 11px 22px; display: inline-block; border-radius: 6px;">
                      View in Subspens &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 12px; color: #94A3B8; line-height: 1.5;">
                Tip: You can customize advance reminder windows or record manual payments from your Subspens dashboard anytime.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8FAFC; padding: 18px 28px; border-top: 1px solid #E2E8F0; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #64748B;">
                Sent with care by <strong style="color: #0F172A;">Subspens</strong> &bull; Minimalist Subscription Ledger &bull; <a href="https://subspens.com" style="color: #64748B; text-decoration: underline;">subspens.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Format a plain-text fallback reminder email
 */
export function buildReminderEmailText({
  userName = 'there',
  subscriptionName,
  amount,
  currency = 'INR',
  billingCycle = 'monthly',
  dueDateFormatted,
  daysLeft,
  isTrial = false,
  postTrialAmount = null,
  postTrialCurrency = null,
  appUrl = 'https://subspens.com',
}) {
  const daysText =
    daysLeft === 0
      ? 'DUE TODAY'
      : daysLeft === 1
        ? 'DUE TOMORROW'
        : `DUE IN ${daysLeft} DAYS`;

  const subjectPrefix = isTrial ? 'Trial Expiry Alert' : 'Renewal Reminder';

  return `
Subspens ${subjectPrefix}: ${subscriptionName} (${daysText})

Hi ${userName || 'there'},

${
  isTrial
    ? `Your free trial for ${subscriptionName} ends on ${dueDateFormatted}. Cancel before then to avoid being charged ${postTrialCurrency || currency} ${Number(postTrialAmount || amount).toFixed(2)}/${billingCycle}.`
    : `Your subscription to ${subscriptionName} is scheduled to renew on ${dueDateFormatted} for ${currency} ${Number(amount).toFixed(2)}/${billingCycle}.`
}

Subscription Details:
- Name: ${subscriptionName}
- Status: ${daysText}
- Due Date: ${dueDateFormatted}
- Amount: ${currency} ${Number(amount).toFixed(2)} (${billingCycle})

Manage your subscriptions at: ${appUrl}/subscriptions

--
Subspens · Minimalist Recurring Bill & Subscription Tracker (https://subspens.com)
`.trim();
}

/**
 * Format a clean HTML password reset email
 */
export function buildPasswordResetEmailHtml({ userName = 'there', resetUrl }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Subspens Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F9FA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E293B;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F8F9FA; padding: 36px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05); border: 1px solid #E2E8F0;" cellspacing="0" cellpadding="0">
          <!-- Top Accent Banner -->
          <tr>
            <td style="background-color: #0F3D2E; padding: 18px 28px; text-align: left;">
              <span style="color: #FFFFFF; font-size: 13px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;">
                Subspens &bull; Account Security
              </span>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px 28px 24px 28px;">
              <h1 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 600; color: #0F172A; line-height: 1.3;">
                Reset Your Password
              </h1>
              <p style="margin: 0 0 16px 0; font-size: 15px; color: #475569; line-height: 1.6;">
                Hi ${userName || 'there'},
              </p>
              <p style="margin: 0 0 24px 0; font-size: 15px; color: #475569; line-height: 1.6;">
                We received a request to reset the password for your Subspens account. Click the button below to choose a new password:
              </p>

              <!-- Call to Action Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
                <tr>
                  <td align="center" style="border-radius: 6px; background-color: #0F3D2E;">
                    <a href="${resetUrl}" target="_blank" style="font-size: 14px; font-weight: 600; color: #FFFFFF; text-decoration: none; padding: 12px 26px; display: inline-block; border-radius: 6px;">
                      Reset Password &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Expiration and Security Notice -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 14px 16px; font-size: 13px; color: #64748B; line-height: 1.5;">
                    <strong style="color: #0F172A;">Important:</strong> This link is valid for <strong>30 minutes</strong> and can only be used once. If you did not request a password reset, you can safely ignore this email &mdash; your password will remain unchanged.
                  </td>
                </tr>
              </table>

              <!-- Fallback Plain URL -->
              <p style="margin: 0; font-size: 12px; color: #94A3B8; line-height: 1.6; word-break: break-all;">
                Button not working? Copy and paste this link into your browser:<br>
                <a href="${resetUrl}" style="color: #0F3D2E; text-decoration: underline;">${resetUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8FAFC; padding: 16px 28px; border-top: 1px solid #E2E8F0; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #64748B;">
                Subspens &bull; Minimalist Subscription Ledger &bull; <a href="https://subspens.com" style="color: #64748B; text-decoration: underline;">subspens.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Format a plain-text password reset email
 */
export function buildPasswordResetEmailText({ userName = 'there', resetUrl }) {
  return `
Reset Your Subspens Password

Hi ${userName || 'there'},

We received a request to reset the password for your Subspens account.
To reset your password, visit the following link:

${resetUrl}

This link is valid for 30 minutes.

If you didn't request a password reset, you can safely ignore this email - your password will remain unchanged.

--
Subspens · Minimalist Recurring Bill & Subscription Tracker (https://subspens.com)
`.trim();
}
