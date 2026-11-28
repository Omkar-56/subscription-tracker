'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import ForecastChart from '../components/ForecastChart';
import CategoryBreakdown from '../components/CategoryBreakdown';
import BrandLogo from '../components/BrandLogo';
import PaymentConfirmModal from '../components/PaymentConfirmModal';
import CancellationGuideModal from '../components/CancellationGuideModal';
import { CATEGORY_LEGEND, normalizeCategory } from '../utils/brands';
import { formatDate, formatMoney, daysUntil, addCycleToDate, formatDateIso } from '../utils/date';
import { getGuestSubs, saveGuestSubs } from '../utils/guestSubs';

function computeGuestSummary(currency) {
  const subs = getGuestSubs();

  const activeSubs = subs.filter((s) => s.status === 'active' && !s.isFreeTrial);
  const byCategory = {};

  const monthlyTotal = activeSubs.reduce((acc, s) => {
    const cycle = s.billingCycle || 'monthly';
    const factor = cycle === 'yearly' ? 1 / 12 : cycle === 'quarterly' ? 1 / 3 : cycle === 'weekly' ? 52 / 12 : 1;
    const monthlyAmount = (Number(s.amount) || 0) * factor;
    const cat = normalizeCategory(s.category || 'other').toLowerCase();

    if (!byCategory[cat]) {
      byCategory[cat] = { category: cat, amount: 0, monthlySpend: 0, count: 0 };
    }
    byCategory[cat].amount += Number(s.amount) || 0;
    byCategory[cat].monthlySpend += monthlyAmount;
    byCategory[cat].count += 1;

    return acc + monthlyAmount;
  }, 0);

  const activeTrials = subs.filter((s) => s.isFreeTrial && s.status === 'active').map((t) => ({
    ...t,
    effectiveDeadline: t.cancellationDeadline || t.trialEndDate || t.nextRenewalDate,
    daysLeft: daysUntil(t.cancellationDeadline || t.trialEndDate || t.nextRenewalDate),
  }));

  const categoryBreakdown = Object.values(byCategory).map((item) => ({
    ...item,
    percentage: monthlyTotal > 0 ? Math.round((item.monthlySpend / monthlyTotal) * 100) : 0,
  }));

  return {
    baseCurrency: currency,
    monthlyCommitment: monthlyTotal,
    totalMonthly: monthlyTotal,
    totalYearly: monthlyTotal * 12,
    yearlyRunRate: monthlyTotal * 12,
    activeCount: activeSubs.length,
    trialsCount: activeTrials.length,
    activeTrials,
    recentPriceIncreases: [],
    upcomingRenewals: activeSubs.slice(0, 3).map((s) => ({
      ...s,
      daysLeft: daysUntil(s.nextRenewalDate),
      convertedAmount: Number(s.amount),
    })),
    categoryBreakdown,
    savings: {
      monthlySaved: 0,
      yearlySaved: 0,
      cancelledCount: 0,
    },
  };
}

function computeGuestForecast(currency) {
  const subs = getGuestSubs();
  const activeSubs = subs.filter((s) => s.status === 'active' && !s.isFreeTrial);
  const monthlyTotal = activeSubs.reduce((acc, s) => {
    const cycle = s.billingCycle || 'monthly';
    const factor = cycle === 'yearly' ? 1 / 12 : cycle === 'quarterly' ? 1 / 3 : cycle === 'weekly' ? 52 / 12 : 1;
    return acc + (Number(s.amount) || 0) * factor;
  }, 0);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const timeline = [];
  for (let i = 0; i < 12; i++) {
    const m = new Date(now.getFullYear(), now.getMonth() + i, 1);
    timeline.push({
      month: months[m.getMonth()] + ' ' + m.getFullYear().toString().slice(2),
      total: monthlyTotal,
      renewals: [],
    });
  }
  return {
    baseCurrency: currency,
    months: timeline,
  };
}

export default function Dashboard() {
  const { user, baseCurrency: ctxBaseCurrency } = useAuth();
  const [summary, setSummary] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [payingSub, setPayingSub] = useState(null);
  const [guideSub, setGuideSub] = useState(null);
  const [error, setError] = useState('');

  const currentCurrency = user?.baseCurrency || ctxBaseCurrency || 'INR';

  const refresh = useCallback(() => {
    if (!user) {
      setSummary(computeGuestSummary(currentCurrency));
      setForecast(computeGuestForecast(currentCurrency));
      setError('');
      return;
    }

    api.dashboardSummary(14, currentCurrency)
      .then((data) => {
        setSummary(data);
        setError('');
      })
      .catch((err) => {
        if (err?.status !== 401) {
          console.warn('Failed to load dashboard summary from server:', err);
        }
        setSummary(computeGuestSummary(currentCurrency));
        setError('');
      });

    api.dashboardForecast(12, currentCurrency)
      .then((data) => {
        setForecast(data);
      })
      .catch(() => {
        setForecast(computeGuestForecast(currentCurrency));
      });
  }, [user, currentCurrency]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    window.addEventListener('subspens:refresh', refresh);
    window.addEventListener('subtrack:refresh', refresh);
    return () => {
      window.removeEventListener('subspens:refresh', refresh);
      window.removeEventListener('subtrack:refresh', refresh);
    };
  }, [refresh]);

  const activeCategoryCount = useMemo(() => {
    if (!summary?.categoryBreakdown) return 0;
    const activeKeys = new Set();
    for (const c of summary.categoryBreakdown) {
      const spend = Number(c.monthlySpend ?? c.amount ?? 0);
      if (spend > 0 || Number(c.count ?? 0) > 0) {
        activeKeys.add(normalizeCategory(c.category).toLowerCase());
      }
    }
    return activeKeys.size;
  }, [summary?.categoryBreakdown]);

  async function handleConfirmPayment(paymentData) {
    if (!payingSub) return;
    try {
      await api.confirmPayment(payingSub.id, paymentData);
    } catch {
      const guestSubs = getGuestSubs().map((s) => {
        if (s.id === payingSub.id) {
          const nextDateStr = formatDateIso(addCycleToDate(s.nextRenewalDate, s.billingCycle || 'monthly'));
          return { ...s, nextRenewalDate: nextDateStr };
        }
        return s;
      });
      saveGuestSubs(guestSubs);
    }
    setPayingSub(null);
    refresh();
    window.dispatchEvent(new CustomEvent('subspens:reminders-refresh'));
  }

  async function handleConvertTrial(sub) {
    try {
      await api.convertTrial(sub.id);
      refresh();
      window.dispatchEvent(new CustomEvent('subspens:reminders-refresh'));
    } catch {
      const guestSubs = getGuestSubs().map((s) =>
        s.id === sub.id ? { ...s, isFreeTrial: false } : s
      );
      saveGuestSubs(guestSubs);
      refresh();
    }
  }

  async function handleStatusChange(subscription, newStatus) {
    try {
      await api.updateSubscription(subscription.id, {
        name: subscription.name,
        category: subscription.category || 'other',
        amount: Number(subscription.amount),
        currency: subscription.currency || 'INR',
        billingCycle: subscription.billingCycle || 'monthly',
        nextRenewalDate: String(subscription.nextRenewalDate).slice(0, 10),
        status: newStatus,
        notes: subscription.notes || '',
      });
      setGuideSub(null);
      refresh();
      window.dispatchEvent(new CustomEvent('subspens:reminders-refresh'));
    } catch {
      const guestSubs = getGuestSubs().map((s) =>
        s.id === subscription.id ? { ...s, status: newStatus } : s
      );
      saveGuestSubs(guestSubs);
      setGuideSub(null);
      refresh();
    }
  }

  if (error) return <p className="text-sm text-rust">{error}</p>;
  if (!summary) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 grid grid-cols-2 gap-3.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-2xl squircle bg-ink/5 border border-ink/10" />
            ))}
          </div>
          <div className="lg:col-span-6 h-60 rounded-2xl squircle bg-ink/5 border border-ink/10" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 h-80 rounded-2xl squircle bg-ink/5 border border-ink/10" />
          <div className="lg:col-span-6 h-80 rounded-2xl squircle bg-ink/5 border border-ink/10" />
        </div>
      </div>
    );
  }

  const baseCurrency = summary.baseCurrency || currentCurrency;
  const activeTrials = summary.activeTrials || [];
  const savings = summary.savings || {
    monthlySaved: 0,
    yearlySaved: 0,
    cancelledCount: 0,
  };

  return (
    <>
    <div className="space-y-8">
      {/* Free-Trial Expiry Sentinel Banner */}
      {activeTrials.length > 0 && (
        <div className="rounded-2xl squircle border border-amber/40 bg-amber-light/40 p-4 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber text-white text-base shadow-xs">
                🛡️
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-sm font-bold text-ink">
                    Free-Trial Expiry Sentinel ({activeTrials.length} Active {activeTrials.length === 1 ? 'Trial' : 'Trials'})
                  </h3>
                  <span className="rounded-lg squircle bg-amber px-1.5 py-0.2 text-[10px] font-bold text-white uppercase tracking-wide">
                    Live Sentinel
                  </span>
                </div>
                <p className="text-xs text-ink/85">
                  Cancellation deadlines detected. Cancel before the deadline to avoid auto-converting to full-price recurring charges.
                </p>
              </div>
            </div>

            <Link
              href="/subscriptions"
              className="text-xs font-semibold text-amber-dark hover:underline flex items-center gap-1"
            >
              <span>Manage all trials</span>
              <span>→</span>
            </Link>
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-amber/25">
            {activeTrials.map((t) => {
              const deadline = t.effectiveDeadline;
              const days = t.daysLeft;
              const isUrgent = days <= 2;

              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-xl squircle bg-white/90 border border-amber/30 p-3 shadow-2xs hover:bg-white transition-colors gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <BrandLogo name={t.name} category={t.category} size="md" bare />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-xs text-ink truncate">{t.name ? t.name.charAt(0).toUpperCase() + t.name.slice(1) : ''}</p>
                        <span
                          className={`rounded-lg squircle px-1.5 py-0.2 text-[10px] font-bold ${
                            isUrgent ? 'bg-rust text-white animate-pulse' : 'bg-amber-light text-amber-dark'
                          }`}
                        >
                          {days <= 0 ? 'Cutoff TODAY!' : `${days}d left`}
                        </span>
                      </div>
                      <p className="text-[11px] text-ink/80 mt-0.5">
                        Cancel cutoff: <strong>{formatDate(deadline)}</strong>
                      </p>
                      <p className="text-[10px] text-ink/80 mt-0.2">
                        Post-trial: {formatMoney(t.postTrialAmount || t.amount, t.postTrialCurrency || t.currency)}/{t.billingCycle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setGuideSub(t)}
                      className="rounded-xl squircle bg-rust px-2.5 py-1 text-xs font-semibold text-white shadow-2xs hover:bg-rust-dark transition-colors cursor-pointer"
                    >
                      Cancel Guide
                    </button>
                    <button
                      onClick={() => handleConvertTrial(t)}
                      className="rounded-xl squircle border border-line bg-paper px-2 py-1 text-xs font-medium text-ink/70 hover:bg-ledger-light hover:text-ledger-dark transition-colors cursor-pointer"
                      title="Keep this subscription and convert to regular cycle"
                    >
                      Keep Sub
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ROW 1: Overview (left) and Spend by Category (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:items-stretch">
        {/* Left Side: Overview Header & Stat Cards */}
        <section className="lg:col-span-6 flex flex-col">
          <div className="flex items-baseline justify-between gap-2">
            <h1 className="font-display text-xl sm:text-2xl font-semibold">Overview</h1>
            <span className="text-xs text-ink/80 shrink-0">
              Normalized in <strong className="text-ink font-medium">{baseCurrency}</strong>
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2.5 sm:gap-3.5 items-stretch flex-1">
            <StatCard
              label="Monthly commitment"
              value={formatMoney(summary.totalMonthly, baseCurrency)}
              sublabel="Active recurring charges"
              tone="ledger"
            />
            <StatCard
              label="Yearly run rate"
              value={formatMoney(summary.totalYearly, baseCurrency)}
              sublabel="Projected 12-month total"
            />
            <StatCard
              label="Active subscriptions"
              value={summary.activeCount}
              sublabel={`${summary.trialsCount || 0} active trial${summary.trialsCount === 1 ? '' : 's'}`}
            />
            <StatCard
              label="Monthly savings"
              value={formatMoney(savings.monthlySaved, baseCurrency)}
              sublabel={`≈ ${formatMoney(savings.yearlySaved, baseCurrency)}/yr (${savings.cancelledCount} cancelled)`}
              tone={savings.monthlySaved > 0 ? 'emerald' : 'default'}
            />
          </div>
        </section>

        {/* Right Side: Spend by category (equal height to 4 summary cards on lg+) */}
        <section className="lg:col-span-6 flex flex-col">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="font-display text-xl sm:text-2xl font-semibold">Spend by category</h2>
            <span className="text-xs text-ink/80 shrink-0">
              {activeCategoryCount} of {CATEGORY_LEGEND.length} active
            </span>
          </div>
          <div className="mt-3 lg:relative lg:flex-1">
            <div className="lg:absolute lg:inset-0">
              <CategoryBreakdown
                categories={summary.categoryBreakdown}
                totalMonthly={summary.totalMonthly}
                currency={baseCurrency}
              />
            </div>
          </div>
        </section>
      </div>

      {/* ROW 2: 12-month forecast (left) and Renewing soon (right, equal height & scrollable) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:items-stretch">
        {/* Left Side: 12-month forecast */}
        <section className="lg:col-span-6 flex flex-col">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="font-display text-lg sm:text-xl font-semibold">12-month forecast</h2>
            <span className="text-xs text-ink/80 shrink-0">
              Normalized in <strong className="text-ink font-medium">{baseCurrency}</strong>
            </span>
          </div>
          {forecast ? (
            <ForecastChart months={forecast.months || forecast.forecast} currency={baseCurrency} />
          ) : (
            <div className="mt-3 rounded-2xl squircle border border-line bg-paper p-8 text-center text-sm text-ink/80 shadow-2xs">
              Add subscriptions to see your projected 12-month spend.
            </div>
          )}
        </section>

        {/* Right Side: Renewing soon (equal height to 12-month forecast on lg+) */}
        <section className="lg:col-span-6 flex flex-col">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="font-display text-lg sm:text-xl font-semibold">Renewing soon</h2>
            <Link href="/subscriptions" className="text-xs sm:text-sm text-ledger hover:underline font-medium shrink-0">
              See all →
            </Link>
          </div>
          <div className="mt-3 lg:relative lg:flex-1">
            <div className="lg:absolute lg:inset-0 flex flex-col overflow-hidden rounded-2xl squircle border border-line bg-paper py-2 pl-2.5 pr-1.5 sm:py-2.5 sm:pl-3 sm:pr-1.5 shadow-2xs">
              <div className="flex-1 min-h-0 max-h-80 sm:max-h-96 lg:max-h-none overflow-y-auto custom-scrollbar pl-1.5 pr-2 divide-y divide-line">
                {summary.upcomingRenewals.length === 0 ? (
                  <div className="flex h-full min-h-[120px] items-center justify-center px-4 py-8 text-center text-sm text-ink/80">
                    Nothing renewing in the next two weeks.
                  </div>
                ) : (
                  summary.upcomingRenewals.map((s) => {
                    const isDifferentCurrency = s.currency !== baseCurrency && s.convertedAmount;
                    const days = daysUntil(s.nextRenewalDate);
                    return (
                      <div
                        key={s.id}
                        className="flex items-center justify-between px-1.5 py-2.5 hover:bg-paper/30 transition-colors gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <BrandLogo name={s.name} category={s.category} size="md" bare />
                          <div className="min-w-0">
                            <p className="font-medium text-xs sm:text-sm truncate">
                              {s.name ? s.name.charAt(0).toUpperCase() + s.name.slice(1) : ''}
                            </p>
                            <p className="text-[11px] sm:text-xs text-ink/80">
                              {formatDate(s.nextRenewalDate)} · in {days}d
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5 shrink-0">
                          <div className="text-right">
                            <p className="tabular font-display font-semibold text-xs sm:text-sm">
                              {formatMoney(s.amount, s.currency)}
                            </p>
                            {isDifferentCurrency && (
                              <p className="tabular text-[10px] sm:text-[11px] text-ink/75">
                                ≈ {formatMoney(s.convertedAmount, baseCurrency)}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => setPayingSub(s)}
                            className="rounded-xl squircle bg-ledger-light border border-ledger/30 px-2.5 py-1 text-[11px] font-semibold text-ledger-dark hover:bg-ledger hover:text-white transition-colors cursor-pointer"
                            title="Confirm payment & roll over to next billing cycle"
                          >
                            ✓ Paid
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>

    {payingSub && (
      <PaymentConfirmModal
        subscription={payingSub}
        onConfirm={handleConfirmPayment}
        onCancel={() => setPayingSub(null)}
      />
    )}

    {guideSub && (
      <CancellationGuideModal
        subscription={guideSub}
        onClose={() => setGuideSub(null)}
        onStatusChange={handleStatusChange}
      />
    )}
    </>
  );
}
