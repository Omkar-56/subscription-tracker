'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import SubscriptionCard from '../components/SubscriptionCard';
import SubscriptionForm from '../components/SubscriptionForm';
import ReceiptParserModal from '../components/ReceiptParserModal';
import PaymentConfirmModal from '../components/PaymentConfirmModal';
import PaymentHistoryModal from '../components/PaymentHistoryModal';
import CancellationGuideModal from '../components/CancellationGuideModal';
import { formatMoney } from '../utils/date';
import { formatCategoryLabel } from '../utils/brands';

const CYCLE_TO_MONTHS = {
  weekly: 12 / 52,
  monthly: 1,
  quarterly: 3,
  yearly: 12,
};

const CYCLES = [
  { id: 'weekly',    label: 'Weekly'    },
  { id: 'monthly',   label: 'Monthly'   },
  { id: 'quarterly', label: 'Quarterly' },
  { id: 'yearly',    label: 'Yearly'    },
];

const SORT_OPTIONS = [
  { id: 'renewal_asc',  label: 'Next renewal (soonest)'  },
  { id: 'renewal_desc', label: 'Next renewal (furthest)' },
  { id: 'cost_desc',    label: 'Cost — high to low'      },
  { id: 'cost_asc',     label: 'Cost — low to high'      },
  { id: 'name_asc',     label: 'Name (A → Z)'            },
  { id: 'name_desc',    label: 'Name (Z → A)'            },
];

function monthlyEquivalent(sub) {
  const months = CYCLE_TO_MONTHS[sub.billingCycle] || 1;
  const amt = sub.convertedAmount !== undefined ? sub.convertedAmount : Number(sub.amount);
  return amt / months;
}

function getGuestSubs() {
  const stored = localStorage.getItem('subtrack_guest_subs');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        // Purge any pre-populated demo subscriptions
        const realSubs = parsed.filter(
          (s) => !(typeof s.id === 'string' && s.id.startsWith('demo-'))
        );
        if (realSubs.length !== parsed.length) {
          localStorage.setItem('subtrack_guest_subs', JSON.stringify(realSubs));
        }
        return realSubs;
      }
    } catch {
      // ignore
    }
  }
  return [];
}

function saveGuestSubs(subs) {
  localStorage.setItem('subtrack_guest_subs', JSON.stringify(subs));
}

export default function Subscriptions() {
  const { user, baseCurrency: ctxBaseCurrency } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [priceIncreases, setPriceIncreases] = useState([]);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showReceiptParser, setShowReceiptParser] = useState(false);
  const [editing, setEditing] = useState(null);

  // Modals for Payment Confirmation, History & Cancellation Guides
  const [payingSub, setPayingSub] = useState(null);
  const [historySub, setHistorySub] = useState(null);
  const [guideSub, setGuideSub] = useState(null);

  const baseCurrency = user?.baseCurrency || ctxBaseCurrency || 'USD';

  // Search, Filter & Sort States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [cycleFilter, setCycleFilter] = useState('all');
  const [sortBy, setSortBy] = useState('renewal_asc');

  // Filter panel state
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [filterSection, setFilterSection] = useState('categories'); // 'categories' | 'cycles'
  // Pending (uncommitted) filter state while panel is open
  const [pendingCategory, setPendingCategory] = useState('all');
  const [pendingCycle, setPendingCycle] = useState('all');
  const filterPanelRef = useRef(null);

  // Sort dropdown state
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef(null);

  async function refresh() {
    try {
      const [{ subscriptions: rawSubs }, summary] = await Promise.all([
        api.listSubscriptions(),
        api.dashboardSummary(14, baseCurrency),
      ]);

      const upcomingMap = new Map((summary?.upcomingRenewals || []).map((u) => [u.id, u]));
      const enriched = rawSubs.map((s) => {
        const matchingUpcoming = upcomingMap.get(s.id);
        if (matchingUpcoming) {
          return { ...s, convertedAmount: matchingUpcoming.convertedAmount };
        }
        return s;
      });

      setSubscriptions(enriched);
      setPriceIncreases(summary?.recentPriceIncreases || []);
      setError('');
    } catch {
      // Fallback to guest subscriptions when unauthenticated or offline
      setSubscriptions(getGuestSubs());
      setError('');
    }
  }

  useEffect(() => { refresh(); }, [user, baseCurrency]);

  useEffect(() => {
    function onExternalRefresh() { refresh(); }
    window.addEventListener('subtrack:refresh', onExternalRefresh);
    return () => window.removeEventListener('subtrack:refresh', onExternalRefresh);
  }, [user, baseCurrency]);

  // Close panels on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (filterPanelRef.current && !filterPanelRef.current.contains(e.target)) {
        setFilterPanelOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setSortOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync pending state when panel opens
  function openFilterPanel() {
    setPendingCategory(categoryFilter);
    setPendingCycle(cycleFilter);
    setFilterSection('categories');
    setFilterPanelOpen(true);
  }

  function applyFilters() {
    setCategoryFilter(pendingCategory);
    setCycleFilter(pendingCycle);
    setFilterPanelOpen(false);
  }

  function closeFilterPanel() {
    setFilterPanelOpen(false);
  }

  // Active filter count badge
  const activeFilterCount = (categoryFilter !== 'all' ? 1 : 0) + (cycleFilter !== 'all' ? 1 : 0);

  async function handleCreate(data) {
    try {
      await api.createSubscription(data);
    } catch {
      const guestSubs = getGuestSubs();
      const newSub = {
        ...data,
        id: 'guest-' + Date.now(),
        amount: Number(data.amount),
        status: data.status || 'active',
        convertedAmount: Number(data.amount),
      };
      saveGuestSubs([newSub, ...guestSubs]);
    }
    setShowForm(false);
    refresh();
  }

  async function handleUpdate(data) {
    try {
      await api.updateSubscription(editing.id, data);
    } catch {
      const guestSubs = getGuestSubs().map((s) =>
        s.id === editing.id ? { ...s, ...data, amount: Number(data.amount) } : s
      );
      saveGuestSubs(guestSubs);
    }
    setEditing(null);
    refresh();
  }

  async function handleConvertTrial(subscription) {
    try {
      await api.convertTrial(subscription.id);
    } catch {
      const guestSubs = getGuestSubs().map((s) =>
        s.id === subscription.id ? { ...s, isFreeTrial: false } : s
      );
      saveGuestSubs(guestSubs);
    }
    refresh();
  }

  async function handleConfirmPayment(paymentData) {
    if (!payingSub) return;
    try {
      await api.confirmPayment(payingSub.id, paymentData);
    } catch {
      const guestSubs = getGuestSubs().map((s) => {
        if (s.id === payingSub.id) {
          const next = new Date(s.nextRenewalDate);
          next.setMonth(next.getMonth() + 1);
          return { ...s, nextRenewalDate: next.toISOString().slice(0, 10) };
        }
        return s;
      });
      saveGuestSubs(guestSubs);
    }
    setPayingSub(null);
    refresh();
  }

  async function handleStatusChange(subscription, newStatus) {
    try {
      await api.updateSubscription(subscription.id, {
        name: subscription.name,
        category: subscription.category || 'other',
        amount: Number(subscription.amount),
        currency: subscription.currency || 'USD',
        billingCycle: subscription.billingCycle || 'monthly',
        nextRenewalDate: String(subscription.nextRenewalDate).slice(0, 10),
        status: newStatus,
        notes: subscription.notes || '',
        reminderDaysBefore: subscription.reminderDaysBefore || 3,
        isFreeTrial: Boolean(subscription.isFreeTrial),
        trialEndDate: subscription.trialEndDate ? String(subscription.trialEndDate).slice(0, 10) : null,
        cancellationDeadline: subscription.cancellationDeadline ? String(subscription.cancellationDeadline).slice(0, 10) : null,
        postTrialAmount: subscription.postTrialAmount !== null && subscription.postTrialAmount !== undefined ? Number(subscription.postTrialAmount) : null,
        postTrialCurrency: subscription.postTrialCurrency || subscription.currency,
      });
    } catch {
      const guestSubs = getGuestSubs().map((s) =>
        s.id === subscription.id ? { ...s, status: newStatus } : s
      );
      saveGuestSubs(guestSubs);
    }
    refresh();
  }

  async function handleDelete(subscription) {
    if (!confirm(`Delete ${subscription.name}?`)) return;
    try {
      await api.deleteSubscription(subscription.id);
    } catch {
      const guestSubs = getGuestSubs().filter((s) => s.id !== subscription.id);
      saveGuestSubs(guestSubs);
    }
    refresh();
  }

  // Extract unique categories from actual data
  const availableCategories = useMemo(() => {
    const set = new Set(subscriptions.map((s) => s.category).filter(Boolean));
    return Array.from(set).sort();
  }, [subscriptions]);

  // Counts by status
  const counts = useMemo(() => ({
    all:       subscriptions.length,
    active:    subscriptions.filter((s) => s.status === 'active' && !s.isFreeTrial).length,
    trials:    subscriptions.filter((s) => s.isFreeTrial && s.status === 'active').length,
    paused:    subscriptions.filter((s) => s.status === 'paused').length,
    cancelled: subscriptions.filter((s) => s.status === 'cancelled').length,
  }), [subscriptions]);

  // Filtered and sorted subscriptions
  const filteredSubscriptions = useMemo(() => {
    return subscriptions
      .filter((s) => {
        if (statusFilter === 'trials') {
          if (!s.isFreeTrial || s.status !== 'active') return false;
        } else if (statusFilter !== 'all' && s.status !== statusFilter) {
          return false;
        }
        if (categoryFilter !== 'all' && s.category.toLowerCase() !== categoryFilter.toLowerCase()) return false;
        if (cycleFilter !== 'all' && s.billingCycle !== cycleFilter) return false;
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchName  = s.name.toLowerCase().includes(q);
          const matchCat   = s.category.toLowerCase().includes(q);
          const matchNotes = (s.notes || '').toLowerCase().includes(q);
          if (!matchName && !matchCat && !matchNotes) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'renewal_asc')  { const dA = a.isFreeTrial && a.cancellationDeadline ? a.cancellationDeadline : a.nextRenewalDate; const dB = b.isFreeTrial && b.cancellationDeadline ? b.cancellationDeadline : b.nextRenewalDate; return new Date(dA) - new Date(dB); }
        if (sortBy === 'renewal_desc') { const dA = a.isFreeTrial && a.cancellationDeadline ? a.cancellationDeadline : a.nextRenewalDate; const dB = b.isFreeTrial && b.cancellationDeadline ? b.cancellationDeadline : b.nextRenewalDate; return new Date(dB) - new Date(dA); }
        if (sortBy === 'cost_desc')    return monthlyEquivalent(b) - monthlyEquivalent(a);
        if (sortBy === 'cost_asc')     return monthlyEquivalent(a) - monthlyEquivalent(b);
        if (sortBy === 'name_asc')     return a.name.localeCompare(b.name);
        if (sortBy === 'name_desc')    return b.name.localeCompare(a.name);
        if (sortBy === 'created_desc') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        return 0;
      });
  }, [subscriptions, statusFilter, categoryFilter, cycleFilter, searchTerm, sortBy]);

  const filteredMonthlySpend = useMemo(() =>
    filteredSubscriptions
      .filter((s) => s.status === 'active')
      .reduce((sum, s) => sum + monthlyEquivalent(s), 0),
    [filteredSubscriptions]
  );

  const hasActiveFilters =
    searchTerm !== '' || statusFilter !== 'all' ||
    categoryFilter !== 'all' || cycleFilter !== 'all' || sortBy !== 'renewal_asc';

  function resetFilters() {
    setSearchTerm('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setCycleFilter('all');
    setSortBy('renewal_asc');
  }

  const currentSortLabel = SORT_OPTIONS.find((o) => o.id === sortBy)?.label ?? 'Sort';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Subscriptions</h1>
          <p className="mt-1 text-sm text-ink/60">
            Everything you&apos;re paying for or trialing, in one searchable ledger.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowReceiptParser(true)}
            className="flex items-center gap-2 rounded-sm border border-line bg-white px-3.5 py-2 text-sm font-medium text-ink shadow-2xs hover:bg-stone-50 transition-colors cursor-pointer"
            title="Upload invoice, document, screenshot, or paste text to auto-create subscriptions with Gemini"
          >
            <svg className="h-4 w-4 text-ink/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Upload Receipt</span>
          </button>
          {subscriptions.length > 0 && (
            <button
              onClick={() => setShowForm(true)}
              className="rounded-sm bg-ledger px-4 py-2 text-sm font-medium text-white shadow-2xs hover:bg-ledger-dark transition-colors cursor-pointer"
            >
              + Add subscription
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-rust">{error}</p>}

      {showReceiptParser && (
        <ReceiptParserModal
          isOpen={showReceiptParser}
          onClose={() => setShowReceiptParser(false)}
          onParsed={() => refresh()}
        />
      )}
      {showForm && (
        <SubscriptionForm
          defaultCurrency={baseCurrency}
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      )}
      {editing && (
        <SubscriptionForm
          defaultCurrency={baseCurrency}
          initial={{
            name: editing.name,
            category: editing.category,
            amount: editing.amount,
            currency: editing.currency,
            billingCycle: editing.billingCycle,
            nextRenewalDate: editing.nextRenewalDate?.slice(0, 10),
            status: editing.status,
            notes: editing.notes || '',
            reminderDaysBefore: editing.reminderDaysBefore || 3,
            isFreeTrial: Boolean(editing.isFreeTrial),
            trialEndDate: editing.trialEndDate ? String(editing.trialEndDate).slice(0, 10) : '',
            cancellationDeadline: editing.cancellationDeadline ? String(editing.cancellationDeadline).slice(0, 10) : '',
            postTrialAmount: editing.postTrialAmount,
            postTrialCurrency: editing.postTrialCurrency || editing.currency,
          }}
          onSubmit={handleUpdate}
          onCancel={() => setEditing(null)}
        />
      )}

      {/* ── Filter & Search Card ────────────────────────────────────── */}
      <div className="space-y-3 rounded-t border border-line bg-paper p-4 shadow-2xs">

        {/* Row 1: Status tabs + Search */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="w-full overflow-x-auto">
            <div className="inline-flex min-w-max rounded-sm bg-paper p-0.5 text-xs font-medium border border-line">
              {[
                { id: 'all',       label: 'All',        count: counts.all       },
                { id: 'active',    label: 'Active',      count: counts.active    },
                { id: 'trials',    label: 'Trials',   count: counts.trials    },
                { id: 'paused',    label: 'Paused',      count: counts.paused    },
                { id: 'cancelled', label: 'Cancelled',   count: counts.cancelled },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`flex items-center gap-1.5 rounded-xs px-3 py-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === tab.id
                      ? 'bg-ledger-light text-ledger-dark shadow-2xs font-semibold'
                      : 'text-ink/60 hover:text-ink'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                    statusFilter === tab.id
                      ? tab.id === 'trials' ? 'bg-amber text-white' : 'bg-ledger text-white'
                      : 'bg-line/60 text-ink/50'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search by name, category, notes…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-sm border border-line bg-line/15 hover:bg-line/25 px-3 py-1.5 pl-8 text-xs text-ink outline-none transition-all placeholder:text-ink/40 focus:border-line focus:bg-line/60 focus:outline-none focus:ring-0"
            />
            <svg className="absolute left-2.5 top-2 h-3.5 w-3.5 text-ink/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1.5 text-xs text-ink/40 hover:text-ink cursor-pointer">✕</button>
            )}
          </div>
        </div>

        {/* Row 2: Filters button + Sort dropdown + summary */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-line/60">
          <div className="flex items-center gap-2">

            {/* ── Filters button + panel ─────────────────────────── */}
            <div className="relative" ref={filterPanelRef}>
              <button
                onClick={() => filterPanelOpen ? closeFilterPanel() : openFilterPanel()}
                className={`flex items-center gap-2 rounded-sm border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  filterPanelOpen || activeFilterCount > 0
                    ? 'border-ledger bg-ledger/5 text-ledger'
                    : 'border-line bg-paper/30 text-ink/70 hover:border-ink/30 hover:text-ink'
                }`}
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                </svg>
                Filters
                {activeFilterCount > 0 && (
                  <span className="rounded-full bg-ledger px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Filter panel dropdown */}
              {filterPanelOpen && (
                <div className="absolute left-0 top-full z-40 mt-1.5 w-[300px] rounded-md border border-line bg-white shadow-lg">
                  {/* Header */}
                  <div className="border-b border-line/60 px-4 py-2.5">
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-ink/40">Filters</span>
                  </div>

                  {/* Two-column body */}
                  <div className="flex" style={{ minHeight: '200px' }}>
                    {/* Left: filter sections */}
                    <div className="w-[110px] shrink-0 border-r border-line/60 py-1">
                      {[
                        { id: 'categories', label: 'Categories' },
                        { id: 'cycles',     label: 'Cycles'     },
                      ].map((sec) => (
                        <button
                          key={sec.id}
                          onClick={() => setFilterSection(sec.id)}
                          className={`w-full px-4 py-2.5 text-left text-xs font-medium transition-colors cursor-pointer ${
                            filterSection === sec.id
                              ? 'bg-ink text-white'
                              : 'text-ink/60 hover:bg-paper hover:text-ink'
                          }`}
                        >
                          {sec.label}
                          {/* Active indicator */}
                          {((sec.id === 'categories' && pendingCategory !== 'all') ||
                            (sec.id === 'cycles'     && pendingCycle     !== 'all')) && (
                            <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-ledger align-middle" />
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Right: options for selected section */}
                    <div className="flex-1 overflow-y-auto py-1 max-h-64">
                      {filterSection === 'categories' && (
                        <>
                          <button
                            onClick={() => setPendingCategory('all')}
                            className={`flex w-full items-center justify-between px-4 py-2.5 text-xs transition-colors cursor-pointer ${
                              pendingCategory === 'all' ? 'bg-ledger-light/50 font-semibold text-ledger-dark' : 'text-ink/60 hover:bg-paper hover:text-ink'
                            }`}
                          >
                            <span>All Categories</span>
                            {pendingCategory === 'all' && (
                              <svg className="h-3.5 w-3.5 text-ledger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                          {availableCategories.length === 0 && (
                            <p className="px-4 py-3 text-xs text-ink/40 italic">No categories yet</p>
                          )}
                          {availableCategories.map((cat) => (
                            <button
                              key={cat}
                              onClick={() => setPendingCategory(cat)}
                              className={`flex w-full items-center justify-between px-4 py-2.5 text-xs transition-colors cursor-pointer ${
                                pendingCategory === cat ? 'bg-ledger-light/50 font-semibold text-ledger-dark' : 'text-ink/60 hover:bg-paper hover:text-ink'
                              }`}
                            >
                              <span>{formatCategoryLabel(cat)}</span>
                              {pendingCategory === cat && (
                                <svg className="h-3.5 w-3.5 text-ledger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                          ))}
                        </>
                      )}

                      {filterSection === 'cycles' && (
                        <>
                          <button
                            onClick={() => setPendingCycle('all')}
                            className={`flex w-full items-center justify-between px-4 py-2.5 text-xs transition-colors cursor-pointer ${
                              pendingCycle === 'all' ? 'bg-ledger-light/50 font-semibold text-ledger-dark' : 'text-ink/60 hover:bg-paper hover:text-ink'
                            }`}
                          >
                            <span>All Cycles</span>
                            {pendingCycle === 'all' && (
                              <svg className="h-3.5 w-3.5 text-ledger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                          {CYCLES.map((cyc) => (
                            <button
                              key={cyc.id}
                              onClick={() => setPendingCycle(cyc.id)}
                              className={`flex w-full items-center justify-between px-4 py-2.5 text-xs transition-colors cursor-pointer ${
                                pendingCycle === cyc.id ? 'bg-ledger-light/50 font-semibold text-ledger-dark' : 'text-ink/60 hover:bg-paper hover:text-ink'
                              }`}
                            >
                              <span>{cyc.label}</span>
                              {pendingCycle === cyc.id && (
                                <svg className="h-3.5 w-3.5 text-ledger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Footer: Close + Apply */}
                  <div className="flex items-center justify-between border-t border-line/60 px-4 py-2.5">
                    <button
                      onClick={closeFilterPanel}
                      className="text-xs font-semibold uppercase tracking-wide text-ink/40 hover:text-ink transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                    <button
                      onClick={applyFilters}
                      className="text-xs font-semibold uppercase tracking-wide text-ledger hover:text-ledger-dark transition-colors cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── Sort dropdown ─────────────────────────────────── */}
            <div className="relative" ref={sortRef}>
              <button
                onClick={() => setSortOpen((o) => !o)}
                className={`flex items-center gap-2 rounded-sm border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  sortOpen || sortBy !== 'renewal_asc'
                    ? 'border-ledger bg-ledger/5 text-ledger'
                    : 'border-line bg-paper/30 text-ink/70 hover:border-ink/30 hover:text-ink'
                }`}
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
                <span className="sm:hidden">Sort</span>
                <span className="hidden sm:inline">Sort:</span>
                <span className="hidden sm:inline max-w-[120px] truncate">{currentSortLabel}</span>
                <svg className={`h-3 w-3 transition-transform ${sortOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {sortOpen && (
                <div className="absolute left-0 top-full z-40 mt-1.5 w-56 rounded-md border border-line bg-white shadow-lg py-1">
                  <div className="border-b border-line/60 px-4 py-2">
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-ink/40">Sort by</span>
                  </div>
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => { setSortBy(opt.id); setSortOpen(false); }}
                      className={`flex w-full items-center justify-between px-4 py-2.5 text-xs transition-colors cursor-pointer ${
                        sortBy === opt.id ? 'bg-ledger-light/50 font-semibold text-ledger-dark' : 'text-ink/60 hover:bg-paper hover:text-ink'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {sortBy === opt.id && (
                        <svg className="h-3.5 w-3.5 text-ledger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Active filter chips */}
            {categoryFilter !== 'all' && (
              <span className="flex items-center gap-1 rounded-full border border-ledger/30 bg-ledger/5 px-2.5 py-1 text-[11px] font-medium text-ledger">
                {formatCategoryLabel(categoryFilter)}
                <button onClick={() => setCategoryFilter('all')} className="ml-0.5 text-ledger/60 hover:text-ledger cursor-pointer">✕</button>
              </span>
            )}
            {cycleFilter !== 'all' && (
              <span className="flex items-center gap-1 rounded-full border border-ledger/30 bg-ledger/5 px-2.5 py-1 text-[11px] font-medium text-ledger">
                {CYCLES.find((c) => c.id === cycleFilter)?.label}
                <button onClick={() => setCycleFilter('all')} className="ml-0.5 text-ledger/60 hover:text-ledger cursor-pointer">✕</button>
              </span>
            )}
          </div>

          {/* Summary + reset */}
          <div className="flex items-center gap-3 text-xs">
            <span className="text-ink/60">
              Showing <strong className="text-ink">{filteredSubscriptions.length}</strong> of {subscriptions.length}{' '}
              (<span className="tabular font-medium text-ledger-dark">{formatMoney(filteredMonthlySpend, baseCurrency)}/mo</span>)
            </span>
            {hasActiveFilters && (
              <button onClick={resetFilters} className="font-medium text-rust hover:underline cursor-pointer">
                Reset all
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Subscription List */}
      <div className="border border-t-0 border-line bg-paper px-4">
        {filteredSubscriptions.length === 0 && (
          <div className="py-14 text-center flex flex-col items-center justify-center">
            {subscriptions.length === 0 && (
              <button
                onClick={() => setShowForm(true)}
                className="mb-4 inline-flex items-center gap-2 rounded-sm bg-ledger px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-ledger-dark transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                + Add subscription
              </button>
            )}
            <p className="text-sm font-medium text-ink/70">No subscriptions found</p>
            <p className="mt-1 text-xs text-ink/40">
              {hasActiveFilters
                ? 'Try tweaking or resetting your search and filter criteria.'
                : 'Add your first subscription or free trial to get started.'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="mt-3 rounded-sm border border-line bg-paper px-3 py-1.5 text-xs text-ink hover:bg-line/40 transition-colors cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
        {filteredSubscriptions.map((s) => (
          <SubscriptionCard
            key={s.id}
            subscription={s}
            baseCurrency={baseCurrency}
            priceIncrease={priceIncreases.find((p) => p.subscriptionId === s.id)}
            onEdit={(sub) => { setShowForm(false); setEditing(sub); }}
            onConvertTrial={handleConvertTrial}
            onConfirmPayment={(sub) => setPayingSub(sub)}
            onCancelGuide={(sub) => setGuideSub(sub)}
            onViewPayments={(sub) => setHistorySub(sub)}
            onDelete={handleDelete}
          />
        ))}
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
      {historySub && (
        <PaymentHistoryModal
          subscription={historySub}
          onClose={() => setHistorySub(null)}
        />
      )}
    </div>
  );
}
