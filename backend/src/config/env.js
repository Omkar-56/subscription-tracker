import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load default .env from current working directory
dotenv.config();

// Also load backend/.env if running from workspace root
try {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
} catch {
  // ignore
}

function getEnv(name, fallback = '') {
  return process.env[name] ?? fallback;
}

const nodeEnv = process.env.NODE_ENV || 'development';
const jwtSecret = getEnv('JWT_SECRET', nodeEnv === 'production' ? '' : 'fallback_dev_secret_only_for_local_testing');

// Production secret enforcement check
if (nodeEnv === 'production') {
  if (!jwtSecret || jwtSecret === 'fallback_dev_secret_only_for_local_testing' || jwtSecret.length < 32) {
    console.error('CRITICAL SECURITY WARNING: JWT_SECRET must be configured with at least 32 cryptographically random characters in production.');
  }
}

export const env = {
  port: Number(process.env.PORT || 4000),
  nodeEnv,
  databaseUrl: getEnv('DATABASE_URL'),
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientOrigin: process.env.CLIENT_ORIGIN || 'https://subspens.com',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  // Resend API configuration (Primary transactional email provider)
  resendApiKey: getEnv('RESEND_API_KEY'),
  emailFrom: process.env.EMAIL_FROM || 'Subspens <reminder@subspens.com>',
  // Optional SMTP fallback
  smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
  smtpPort: Number(process.env.SMTP_PORT || 465),
  smtpSecure: process.env.SMTP_SECURE !== undefined ? process.env.SMTP_SECURE === 'true' : true,
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  cronSecret: process.env.CRON_SECRET || '',
};
