'use client';

import { useState, useRef, useEffect } from 'react';
import BrandLogo from './BrandLogo';
import { formatDate, formatMoney, daysUntil } from '../utils/date';
import { formatCategoryLabel, getCategoryChartColor } from '../utils/brands';



export default function SubscriptionCard({
  subscription,
  baseCurrency = 'USD',
  onEdit,
  onDelete,
  onConfirmPayment,
  onViewPayments,
  onCancelGuide,
  onConvertTrial,
  priceIncrease,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;

    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  const isTrial = subscription.isFreeTrial;
  const deadlineDate = isTrial
    ? subscription.cancellationDeadline || subscription.trialEndDate || subscription.nextRenewalDate
    : subscription.nextRenewalDate;

  const days = daysUntil(deadlineDate);
  const soon = subscription.status === 'active' && days >= 0 && days <= 7;
  const overdue = subscription.status === 'active' && days < 0;
  const isDifferentCurrency = baseCurrency && subscription.currency !== baseCurrency && subscription.convertedAmount;
  const isCancelled = subscription.status === 'cancelled';
  const displayName = subscription.name
    ? subscription.name.trim().charAt(0).toUpperCase() + subscription.name.trim().slice(1)
    : '';
  const renewalTooltip = isTrial
    ? `Trial cancellation deadline: ${formatDate(deadlineDate)} (${days < 0 ? `passed ${Math.abs(days)}d ago` : days === 0 ? 'today' : `in ${days}d`})`
    : `Renewal deadline: ${formatDate(deadlineDate)} (${days < 0 ? `overdue by ${Math.abs(days)}d` : days === 0 ? 'today' : `in ${days}d`})`;

  return (
    <div
      className={`group relative flex items-center justify-between gap-3 sm:gap-4 border-b border-line px-1 sm:px-2 py-3.5 transition-colors hover:bg-paper/40 last:border-b-0 ${
        isTrial ? 'bg-amber-light/10' : ''
      } ${menuOpen ? 'z-30' : ''} ${
        isCancelled ? 'opacity-40 hover:opacity-75 bg-stone-100/30' : ''
      }`}
    >
      {/* Left section: BrandLogo + Info */}
      <div className="flex min-w-0 items-center gap-3 sm:gap-3.5 flex-1">
        <BrandLogo name={displayName || subscription.name} category={subscription.category} size="md" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <p className="truncate font-medium text-ink text-sm sm:text-base max-w-[140px] xs:max-w-[180px] sm:max-w-none">
                {displayName}
              </p>
              <span
                className="w-2 h-2 rounded-full shrink-0 shadow-2xs"
                style={{ backgroundColor: getCategoryChartColor(subscription.category) }}
                title={`Category: ${formatCategoryLabel(subscription.category)}`}
              />
            </div>

            {isTrial && (
              <span className="rounded bg-amber-light border border-amber/40 px-1.5 py-0.5 text-[11px] font-bold text-amber tracking-wide flex items-center gap-1 shrink-0">
                <span>🛡️</span>
                <span>TRIAL</span>
              </span>
            )}

            {/* Renewal Urgency "!" Icon with Red BG Tint & Hover Tooltip */}
            {subscription.status === 'active' && (soon || overdue) && (
              <div className="relative inline-flex items-center group/alert shrink-0">
                <span
                  className="flex items-center justify-center w-[18px] h-[18px] rounded-full bg-rust-light text-rust border border-rust/40 text-[11px] font-bold cursor-help select-none shadow-2xs"
                  aria-label={renewalTooltip}
                >
                  !
                </span>
                {/* Tooltip on hover */}
                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/alert:flex flex-col items-center z-50 whitespace-nowrap">
                  <div className="rounded bg-ink px-2 py-1 text-[11px] font-medium text-white shadow-md">
                    {renewalTooltip}
                  </div>
                  <div className="w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-ink" />
                </div>
              </div>
            )}

            {priceIncrease && (
              <span className="rounded bg-rust-light border border-rust/30 px-1.5 py-0.5 text-xs font-medium text-rust shrink-0">
                price hike {formatMoney(priceIncrease.oldAmount, subscription.currency)} →{' '}
                {formatMoney(priceIncrease.newAmount, subscription.currency)}
              </span>
            )}
          </div>

          <p className="mt-1 sm:mt-0.5 text-xs text-ink/60">
            {isTrial ? (
              <>
                <span>
                  Trial ends {formatDate(subscription.trialEndDate || subscription.nextRenewalDate)}
                </span>
                {subscription.postTrialAmount && (
                  <span className="ml-2 font-medium text-ink/80">
                    • Then {formatMoney(subscription.postTrialAmount, subscription.postTrialCurrency || subscription.currency)} / {subscription.billingCycle}
                  </span>
                )}
              </>
            ) : (
              <>
                <span className="capitalize">{subscription.billingCycle}</span>
                <span className="mx-1">•</span>
                <span>Next: {formatDate(subscription.nextRenewalDate)}</span>
              </>
            )}
            {subscription.notes && (
              <>
                <span className="mx-1">•</span>
                <span className="italic text-ink/50">{subscription.notes}</span>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Right section: Subscription Price + Actions Menu */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="text-right shrink-0">
          <p className="tabular font-display text-base font-semibold text-ink">
            {formatMoney(subscription.amount, subscription.currency)}
          </p>
          {isDifferentCurrency ? (
            <p className="tabular text-[11px] font-medium text-ledger-dark" title="Converted using live rates">
              ≈ {formatMoney(subscription.convertedAmount, baseCurrency)}
            </p>
          ) : (
            <p className="text-[11px] text-ink/50 capitalize">per {subscription.billingCycle}</p>
          )}
        </div>

        {/* 3-dots Menu placed after the Subscription Price */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((prev) => !prev);
            }}
            className={`p-1.5 rounded-sm transition-colors cursor-pointer text-ink/60 hover:text-ink hover:bg-line/40 focus:outline-none ${
              menuOpen ? 'bg-line/50 text-ink' : ''
            }`}
            aria-label="Actions"
            aria-haspopup="true"
            aria-expanded={menuOpen}
            title="Actions"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-44 rounded-md border border-line bg-white py-1 shadow-lg z-50">
              {/* Cancel Guide */}
              {onCancelGuide && subscription.status === 'active' && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onCancelGuide(subscription);
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium text-ink/80 hover:bg-paper hover:text-ink transition-colors cursor-pointer"
                  title="How to cancel this subscription (instructions & link)"
                >
                  <svg className="w-3.5 h-3.5 text-ink/50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Cancel Guide</span>
                </button>
              )}

              {/* Receipts */}
              {onViewPayments && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onViewPayments(subscription);
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium text-ink/80 hover:bg-paper hover:text-ink transition-colors cursor-pointer"
                  title="View payment receipt history"
                >
                  <svg className="w-3.5 h-3.5 text-ink/50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Receipts</span>
                </button>
              )}

              {/* Payment Status */}
              {onConfirmPayment && subscription.status === 'active' && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onConfirmPayment(subscription);
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium text-ledger-dark hover:bg-ledger-light/50 transition-colors cursor-pointer"
                  title="Record that you paid this renewal"
                >
                  <svg className="w-3.5 h-3.5 text-ledger shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Payment Status</span>
                </button>
              )}

              {/* Keep & Convert (Trial) */}
              {isTrial && subscription.status === 'active' && onConvertTrial && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onConvertTrial(subscription);
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium text-amber hover:bg-amber-light/40 transition-colors cursor-pointer"
                  title="Convert this trial into an active paid subscription"
                >
                  <span className="text-xs shrink-0">🛡️</span>
                  <span>Keep & Convert</span>
                </button>
              )}

              {/* Edit */}
              {onEdit && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(subscription);
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium text-ink/80 hover:bg-paper hover:text-ink transition-colors cursor-pointer"
                  title="Edit subscription details"
                >
                  <svg className="w-3.5 h-3.5 text-ink/50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Edit</span>
                </button>
              )}

              {/* Delete */}
              {onDelete && (
                <>
                  <div className="border-t border-line/60 my-1" />
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(subscription);
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium text-rust hover:bg-rust-light hover:text-rust transition-colors cursor-pointer"
                    title="Delete subscription"
                  >
                    <svg className="w-3.5 h-3.5 text-rust shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Delete</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
