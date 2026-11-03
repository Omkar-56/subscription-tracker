import { z } from 'zod';

export const ALLOWED_CURRENCIES = ['INR', 'USD', 'EUR', 'CAD', 'AED', 'JPY', 'SGD', 'AUD'];

export const subscriptionSchema = z.object({
  name: z.string().min(1).max(120),
  category: z.string().min(1).max(60).default('other'),
  amount: z.coerce.number().nonnegative(),
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
  postTrialAmount: z.coerce.number().nonnegative().nullish().transform((v) => (v !== undefined && v !== null ? Number(v) : null)),
  postTrialCurrency: z
    .string()
    .nullish()
    .transform((str) => (str ? str.toUpperCase() : 'INR'))
    .refine((c) => ALLOWED_CURRENCIES.includes(c), {
      message: `Post-trial currency must be one of: ${ALLOWED_CURRENCIES.join(', ')}`,
    })
    .default('INR'),
});
