import { z } from 'zod';

export const ALLOWED_CURRENCIES = ['INR', 'USD', 'EUR', 'CAD', 'AED', 'JPY', 'SGD', 'AUD'];

export const ALLOWED_UPLOAD_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/pdf',
];

// Maximum upload payload: 10 MB base64 (~7.5 MB raw binary file)
const MAX_BASE64_LENGTH = 14 * 1024 * 1024;
const MAX_RAW_TEXT_LENGTH = 50000;

export const subscriptionSchema = z.object({
  name: z.string().trim().min(1, 'Subscription name is required').max(120),
  category: z.string().trim().min(1).max(60).default('other'),
  amount: z.coerce.number().min(0, 'Amount must be non-negative').max(1000000000, 'Amount exceeds maximum allowable threshold'),
  currency: z
    .string()
    .transform((str) => (str || 'INR').toUpperCase())
    .refine((c) => ALLOWED_CURRENCIES.includes(c), {
      message: `Currency must be one of: ${ALLOWED_CURRENCIES.join(', ')}`,
    })
    .default('INR'),
  billingCycle: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']),
  nextRenewalDate: z.string().transform((str) => str.slice(0, 10)).pipe(
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD')
  ),
  status: z.enum(['active', 'cancelled']).default('active'),
  notes: z.string().max(500).nullish().transform((v) => v || ''),
  reminderDaysBefore: z.coerce.number().int().min(1).max(30).optional().default(2),
  // Free-Trial Expiry Sentinel & Cancellation Deadline
  isFreeTrial: z.coerce.boolean().optional().default(false),
  trialEndDate: z.string().nullish().transform((val) => (val ? String(val).slice(0, 10) : null)),
  cancellationDeadline: z.string().nullish().transform((val) => (val ? String(val).slice(0, 10) : null)),
  postTrialAmount: z.coerce.number().min(0).max(1000000000).nullish().transform((v) => (v !== undefined && v !== null ? Number(v) : null)),
  postTrialCurrency: z
    .string()
    .nullish()
    .transform((str) => (str ? str.toUpperCase() : 'INR'))
    .refine((c) => ALLOWED_CURRENCIES.includes(c), {
      message: `Post-trial currency must be one of: ${ALLOWED_CURRENCIES.join(', ')}`,
    })
    .default('INR'),
});

export const parseReceiptSchema = z.object({
  text: z.string().max(MAX_RAW_TEXT_LENGTH, 'Receipt text exceeds maximum length of 50KB').optional(),
  fileBase64: z.string().max(MAX_BASE64_LENGTH, 'File payload exceeds maximum allowable size (10MB)').optional(),
  mimeType: z
    .string()
    .optional()
    .refine((m) => !m || ALLOWED_UPLOAD_MIME_TYPES.includes(m.toLowerCase()), {
      message: `Invalid file type. Allowed formats: PDF, PNG, JPEG, WEBP, HEIC`,
    }),
}).refine((data) => Boolean(data.text || data.fileBase64), {
  message: 'Either receipt text or an uploaded file must be provided.',
});

export const confirmPaymentSchema = z.object({
  amount: z.coerce.number().min(0, 'Payment amount must be non-negative').max(1000000000).optional(),
  currency: z
    .string()
    .optional()
    .transform((str) => (str ? str.toUpperCase() : undefined))
    .refine((c) => !c || ALLOWED_CURRENCIES.includes(c), {
      message: `Currency must be one of: ${ALLOWED_CURRENCIES.join(', ')}`,
    }),
  paidDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD').optional(),
});

export const convertTrialSchema = z.object({
  nextRenewalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD').optional(),
});
