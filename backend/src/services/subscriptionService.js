import { subscriptionModel } from '../models/subscriptionModel.js';
import { priceHistoryModel } from '../models/priceHistoryModel.js';
import { paymentModel } from '../models/paymentModel.js';
import { reminderModel } from '../models/reminderModel.js';
import { userModel } from '../models/userModel.js';
import { currencyService } from './currencyService.js';
import { ApiError } from '../utils/ApiError.js';
import { runBackground } from '../utils/runBackground.js';

const CYCLE_TO_MONTHS = {
  weekly: 12 / 52,
  monthly: 1,
  quarterly: 3,
  yearly: 12,
};

export function parseDateParts(dateInput) {
  if (dateInput instanceof Date) {
    return new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate());
  }
  const str = String(dateInput).slice(0, 10);
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatDateString(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addCycle(dateInput, cycle) {
  const d = parseDateParts(dateInput);
  if (cycle === 'weekly') {
    d.setDate(d.getDate() + 7);
    return d;
  }
  const monthsToAdd = { monthly: 1, quarterly: 3, yearly: 12 }[cycle] || 1;
  const originalDay = d.getDate();
  d.setMonth(d.getMonth() + monthsToAdd);
  if (d.getDate() < originalDay) {
    d.setDate(0);
  }
  return d;
}

export function getNextActiveRenewalDate(renewalDateInput, cycle, today = new Date()) {
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let current = parseDateParts(renewalDateInput);

  let guard = 0;
  while (current <= todayStart && guard < 500) {
    current = addCycle(current, cycle);
    guard += 1;
  }
  return formatDateString(current);
}

/**
 * Calculates in-memory projected renewal dates for overdue subscriptions.
 * Triggers background database auto-renewal without blocking the GET response.
 */
function syncOverdueSubscriptions(userId, subscriptions) {
  if (!Array.isArray(subscriptions)) return [];
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let hasDueSubs = false;

  for (const sub of subscriptions) {
    if (sub.status === 'active' && !sub.isFreeTrial) {
      const subDate = parseDateParts(sub.nextRenewalDate);
      if (subDate <= todayStart) {
        hasDueSubs = true;
        sub.nextRenewalDate = getNextActiveRenewalDate(sub.nextRenewalDate, sub.billingCycle, today);
      }
    }
  }

  // Trigger non-blocking database auto-renewal if any subscriptions reached their renewal date
  if (hasDueSubs && userId) {
    runBackground(() => subscriptionService.autoRenewDueSubscriptions({ userId }));
  }

  return subscriptions;
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(date) {
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function amountAsOf(subscription, changes, at) {
  if (!changes || changes.length === 0) return Number(subscription.amount);

  let amount = null;
  for (const change of changes) {
    if (new Date(change.changedAt) <= at) {
      amount = Number(change.newAmount);
    } else {
      if (amount === null) amount = Number(change.oldAmount);
      break;
    }
  }
  return amount === null ? Number(subscription.amount) : amount;
}

async function resolveUserBaseCurrency(userId, overrideCurrency) {
  if (overrideCurrency && overrideCurrency.length === 3) {
    return overrideCurrency.toUpperCase();
  }
  const user = await userModel.findById(userId);
  return user?.baseCurrency || 'INR';
}

export const subscriptionService = {
  async list(userId) {
    const subs = await subscriptionModel.findAllForUser(userId);
    return syncOverdueSubscriptions(userId, subs);
  },

  async create(userId, data) {
    return subscriptionModel.create(userId, data);
  },

  async get(userId, id) {
    const sub = await subscriptionModel.findById(userId, id);
    if (!sub) throw new ApiError(404, 'Subscription not found');

    if (sub.status === 'active' && !sub.isFreeTrial) {
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      if (parseDateParts(sub.nextRenewalDate) <= todayStart) {
        sub.nextRenewalDate = getNextActiveRenewalDate(sub.nextRenewalDate, sub.billingCycle, today);
        runBackground(() => subscriptionService.autoRenewDueSubscriptions({ userId }));
      }
    }

    return sub;
  },

  async update(userId, id, data) {
    const existing = await subscriptionModel.findById(userId, id);
    if (!existing) throw new ApiError(404, 'Subscription not found');

    const updated = await subscriptionModel.update(userId, id, data);

    if (Number(existing.amount) !== Number(data.amount)) {
      await priceHistoryModel.record(id, existing.amount, data.amount);
    }

    return updated;
  },

  async convertTrial(userId, id, customRenewalDate = null) {
    const sub = await this.get(userId, id);
    if (!sub) throw new ApiError(404, 'Subscription not found');

    const baseDate = sub.trialEndDate || sub.nextRenewalDate;
    const nextDate = customRenewalDate || formatDateString(addCycle(baseDate, sub.billingCycle));
    
    const updated = await subscriptionModel.convertTrialToActive(userId, id, nextDate);
    
    // Mark pending trial reminders as dismissed/paid
    await reminderModel.markPaidForSubscription(userId, id);

    return updated;
  },

  async advanceCycle(userId, id) {
    const sub = await this.get(userId, id);
    const nextDate = addCycle(sub.nextRenewalDate, sub.billingCycle);
    const nextDateStr = formatDateString(nextDate);
    return subscriptionModel.updateRenewalDate(userId, id, nextDateStr);
  },

  async confirmPayment(userId, id, paymentData = {}) {
    const sub = await this.get(userId, id);
    const amount = Number(paymentData.amount) || Number(sub.amount);
    const currency = paymentData.currency || sub.currency || 'INR';
    const paidDate = paymentData.paidDate || formatDateString(new Date());

    // 1. Record payment history (notes removed)
    const payment = await paymentModel.create({
      userId,
      subscriptionId: sub.id,
      amount,
      currency,
      paidDate,
      billingCycle: sub.billingCycle,
    });

    // 2. Advance renewal date to the next cycle
    const nextDate = addCycle(sub.nextRenewalDate, sub.billingCycle);
    const nextDateStr = formatDateString(nextDate);
    const updatedSub = await subscriptionModel.updateRenewalDate(userId, id, nextDateStr);

    // 3. Mark any pending reminders as paid
    await reminderModel.markPaidForSubscription(userId, id);

    return {
      subscription: updatedSub,
      payment,
    };
  },

  /**
   * Automatically renews any active recurring subscriptions that have reached their renewal date.
   * - Records payment history for each reached renewal date (idempotent).
   * - Advances next_renewal_date to the future.
   * - Marks overdue pending reminders as 'paid'.
   */
  async autoRenewDueSubscriptions({ userId = null } = {}) {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dueSubs = await subscriptionModel.findDueForRenewal(userId);

    const renewed = [];

    for (const sub of dueSubs) {
      try {
        let currentRenewal = parseDateParts(sub.nextRenewalDate);
        const originalRenewalStr = formatDateString(currentRenewal);

        if (currentRenewal > todayStart) continue;

        const paymentsToRecord = [];
        let guard = 0;

        while (currentRenewal <= todayStart && guard < 60) {
          const paidDateStr = formatDateString(currentRenewal);
          paymentsToRecord.push(paidDateStr);
          currentRenewal = addCycle(currentRenewal, sub.billingCycle);
          guard += 1;
        }

        const newRenewalDateStr = formatDateString(currentRenewal);

        // 1. Record payment history for each reached renewal date (idempotent)
        for (const paidDate of paymentsToRecord) {
          await paymentModel.recordPaymentIfNotExists({
            userId: sub.userId,
            subscriptionId: sub.id,
            amount: sub.amount,
            currency: sub.currency,
            paidDate,
            billingCycle: sub.billingCycle,
          });
        }

        // 2. Advance next_renewal_date in subscriptions table
        await subscriptionModel.updateRenewalDate(sub.userId, sub.id, newRenewalDateStr);

        // 3. Mark pending reminders prior to the new renewal date as paid
        await reminderModel.markPaidForSubscriptionBeforeDate(sub.userId, sub.id, newRenewalDateStr);

        renewed.push({
          subscriptionId: sub.id,
          name: sub.name,
          oldRenewalDate: originalRenewalStr,
          newRenewalDate: newRenewalDateStr,
          cyclesRenewed: paymentsToRecord.length,
        });
      } catch (err) {
        console.error(`[autoRenewDueSubscriptions] Error renewing subscription ${sub.id}:`, err.message);
      }
    }

    return {
      totalChecked: dueSubs.length,
      renewedCount: renewed.length,
      renewed,
    };
  },

  async getPayments(userId, id) {
    await this.get(userId, id);
    return paymentModel.findBySubscriptionId(userId, id);
  },

  async getAllPayments(userId, limit = 50) {
    return paymentModel.findRecentForUser(userId, limit);
  },

  async priceHistory(userId, id) {
    await this.get(userId, id);
    return priceHistoryModel.findForSubscription(userId, id);
  },

  async delete(userId, id) {
    const deleted = await subscriptionModel.delete(userId, id);
    if (!deleted) throw new ApiError(404, 'Subscription not found');
    return true;
  },

  async remove(userId, id) {
    return this.delete(userId, id);
  },

  async dashboard(userId, { upcomingWithinDays = 14, currency = null } = {}) {
    // 1. Fetch user, raw subscriptions, reminders, price increases, and live rates all concurrently
    const [user, rawSubs, pendingReminders, recentPriceIncreases, rates] = await Promise.all([
      userModel.findById(userId),
      subscriptionModel.findAllForUser(userId),
      reminderModel.findPendingForUser(userId).catch(() => []),
      priceHistoryModel.findRecentIncreasesForUser(userId, 30).catch(() => []),
      currencyService.getRates(),
    ]);

    const baseCurrency = (currency && currency.length === 3 ? currency : user?.baseCurrency) || 'INR';
    const all = syncOverdueSubscriptions(userId, rawSubs);
    const active = all.filter((s) => s.status === 'active');
    const cancelled = all.filter((s) => s.status === 'cancelled');

    let totalMonthly = 0;
    const byCategory = {};

    for (const s of active) {
      const converted = currencyService.convertWithRates(s.amount, s.currency, baseCurrency, rates);
      const months = CYCLE_TO_MONTHS[s.billingCycle] || 1;
      const normalizedMonthly = converted / months;

      totalMonthly += normalizedMonthly;

      if (!byCategory[s.category]) {
        byCategory[s.category] = { category: s.category, amount: 0, monthlySpend: 0, count: 0 };
      }
      byCategory[s.category].amount += converted;
      byCategory[s.category].monthlySpend += normalizedMonthly;
      byCategory[s.category].count += 1;
    }

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const horizon = new Date(todayStart);
    horizon.setDate(horizon.getDate() + upcomingWithinDays);

    const upcomingRenewals = [];
    for (const s of active) {
      const ren = parseDateParts(s.nextRenewalDate);
      if (ren >= todayStart && ren <= horizon) {
        const converted = currencyService.convertWithRates(s.amount, s.currency, baseCurrency, rates);
        upcomingRenewals.push({
          ...s,
          convertedAmount: converted,
        });
      }
    }

    const activeTrials = [];
    for (const s of active) {
      if (s.isFreeTrial) {
        const deadlineDate = s.cancellationDeadline || s.trialEndDate || s.nextRenewalDate;
        const diffDays = Math.ceil((new Date(deadlineDate) - todayStart) / (1000 * 60 * 60 * 24));
        activeTrials.push({
          ...s,
          daysLeft: diffDays,
          effectiveDeadline: deadlineDate,
        });
      }
    }

    let monthlySaved = 0;
    for (const s of cancelled) {
      const converted = currencyService.convertWithRates(s.amount, s.currency, baseCurrency, rates);
      const months = CYCLE_TO_MONTHS[s.billingCycle] || 1;
      monthlySaved += converted / months;
    }

    return {
      baseCurrency,
      totalMonthly,
      totalYearly: totalMonthly * 12,
      activeCount: active.length,
      trialsCount: activeTrials.length,
      upcomingRenewals,
      categoryBreakdown: Object.values(byCategory).map((cat) => {
        const spend = Number(cat.monthlySpend ?? cat.amount ?? 0);
        const percentage = totalMonthly > 0 ? Math.round((spend / totalMonthly) * 100) : 0;
        return {
          ...cat,
          monthlySpend: spend,
          percentage,
        };
      }),
      recentPriceIncreases,
      activeTrials,
      pendingReminders,
      savings: {
        monthlySaved,
        yearlySaved: monthlySaved * 12,
        cancelledCount: cancelled.length,
      },
    };
  },

  async forecast(userId, { monthsAhead = 12, currency = null } = {}) {
    const [user, rawSubs, rates] = await Promise.all([
      userModel.findById(userId),
      subscriptionModel.findAllForUser(userId),
      currencyService.getRates(),
    ]);

    const baseCurrency = (currency && currency.length === 3 ? currency : user?.baseCurrency) || 'INR';
    const subs = syncOverdueSubscriptions(userId, rawSubs);
    const active = subs.filter((s) => s.status === 'active');

    const today = new Date();
    const months = [];

    for (let i = 0; i < monthsAhead; i++) {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + i + 1, 0, 23, 59, 59, 999);

      let total = 0;
      const renewals = [];

      for (const s of active) {
        let renewalDate = parseDateParts(s.nextRenewalDate);
        let guard = 0;

        while (renewalDate <= endOfMonth && guard < 60) {
          if (renewalDate >= startOfMonth) {
            const converted = currencyService.convertWithRates(s.amount, s.currency, baseCurrency, rates);
            total += converted;
            renewals.push({
              subscriptionId: s.id,
              name: s.name,
              category: s.category,
              amount: s.amount,
              currency: s.currency,
              convertedAmount: converted,
              date: formatDateString(renewalDate),
            });
          }
          renewalDate = addCycle(renewalDate, s.billingCycle);
          guard += 1;
        }
      }

      months.push({
        month: monthLabel(startOfMonth),
        key: monthKey(startOfMonth),
        total,
        renewals,
      });
    }

    return { baseCurrency, months };
  },

  async trend(userId, { monthsBack = 12, currency = null } = {}) {
    const [user, subs, allChanges, rates] = await Promise.all([
      userModel.findById(userId),
      subscriptionModel.findAllForUser(userId),
      priceHistoryModel.findAllForUser(userId).catch(() => []),
      currencyService.getRates(),
    ]);

    const baseCurrency = (currency && currency.length === 3 ? currency : user?.baseCurrency) || 'INR';

    // Group price history by subscriptionId in memory (1 single query instead of N queries)
    const priceHistories = {};
    for (const change of allChanges) {
      if (!priceHistories[change.subscriptionId]) {
        priceHistories[change.subscriptionId] = [];
      }
      priceHistories[change.subscriptionId].push(change);
    }

    const today = new Date();
    const months = [];

    for (let i = monthsBack - 1; i >= 0; i--) {
      const point = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const pointEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);

      let total = 0;

      for (const s of subs) {
        const createdAt = new Date(s.createdAt);
        if (createdAt > pointEnd) continue;

        if (s.status === 'cancelled') {
          const updatedAt = new Date(s.updatedAt);
          if (updatedAt < point) continue;
        }

        const amountAtPoint = amountAsOf(s, priceHistories[s.id], pointEnd);
        const converted = currencyService.convertWithRates(amountAtPoint, s.currency, baseCurrency, rates);
        const cycleMonths = CYCLE_TO_MONTHS[s.billingCycle] || 1;
        total += converted / cycleMonths;
      }

      months.push({
        month: monthLabel(point),
        key: monthKey(point),
        total,
      });
    }

    return { baseCurrency, months };
  },
};
