"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import SubscriptionCard from "../components/SubscriptionCard";
import SubscriptionForm from "../components/SubscriptionForm";
import ReceiptParserModal from "../components/ReceiptParserModal";
import PaymentConfirmModal from "../components/PaymentConfirmModal";
import PaymentHistoryModal from "../components/PaymentHistoryModal";
import CancellationGuideModal from "../components/CancellationGuideModal";
import RadialFillButton from "../components/RadialFillButton";
import { formatMoney, addCycleToDate, formatDateIso } from "../utils/date";
import { getGuestSubs, saveGuestSubs } from "../utils/guestSubs";
import {
  formatCategoryLabel,
  CATEGORY_LEGEND,
  normalizeCategory,
} from "../utils/brands";

const CYCLE_TO_MONTHS = {
  weekly: 12 / 52,
  monthly: 1,
  quarterly: 3,
  yearly: 12,
};

const CYCLES = [
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "quarterly", label: "Quarterly" },
  { id: "yearly", label: "Yearly" },
];

const SORT_OPTIONS = [
  { id: "default", label: "Default" },
  { id: "renewal_asc", label: "Next renewal (soonest)" },
  { id: "renewal_desc", label: "Next renewal (furthest)" },
  { id: "cost_desc", label: "Cost - high to low" },
  { id: "cost_asc", label: "Cost - low to high" },
  { id: "name_asc", label: "Name (A → Z)" },
  { id: "name_desc", label: "Name (Z → A)" },
];

function monthlyEquivalent(sub) {
  const months = CYCLE_TO_MONTHS[sub.billingCycle] || 1;
  const amt =
    sub.convertedAmount !== undefined
      ? sub.convertedAmount
      : Number(sub.amount);
  return amt / months;
}

function getSubscriptionCreationTime(sub) {
  if (sub?.createdAt) {
    const t = new Date(sub.createdAt).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  if (typeof sub?.id === "string" && sub.id.startsWith("guest-")) {
    const ts = Number(sub.id.replace("guest-", ""));
    if (!isNaN(ts) && ts > 0) return ts;
  }
  return 0;
}

export default function Subscriptions() {
  const { user, baseCurrency: ctxBaseCurrency } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [priceIncreases, setPriceIncreases] = useState([]);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showReceiptParser, setShowReceiptParser] = useState(false);
  const [editing, setEditing] = useState(null);

  // Modals for Payment Confirmation, History & Cancellation Guides
  const [payingSub, setPayingSub] = useState(null);
  const [historySub, setHistorySub] = useState(null);
  const [guideSub, setGuideSub] = useState(null);

  const baseCurrency = user?.baseCurrency || ctxBaseCurrency || "INR";

  // Search, Filter & Sort States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [cycleFilter, setCycleFilter] = useState("all");
  const [sortBy, setSortBy] = useState("default");

  // Filter panel state
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [filterSection, setFilterSection] = useState("categories"); // 'categories' | 'cycles'
  // Pending (uncommitted) filter state while panel is open
  const [pendingCategory, setPendingCategory] = useState("all");
  const [pendingCycle, setPendingCycle] = useState("all");
  const filterPanelRef = useRef(null);

  // Status tab refs for sliding pill measurement
  const tabRefs = useRef([]);
  const [pillStyle, setPillStyle] = useState({ left: 2, width: 0 });

  // Sort dropdown state
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef(null);

  // Category color legend state
  const [legendOpen, setLegendOpen] = useState(false);
  const legendRef = useRef(null);

  // Update sliding pill position whenever statusFilter changes
  const STATUS_TABS = [
    { id: "all", label: "All" },
    { id: "active", label: "Active" },
    { id: "trials", label: "Trials" },
    { id: "cancelled", label: "Cancelled" },
  ];
  useEffect(() => {
    const updatePill = () => {
      const activeIndex = STATUS_TABS.findIndex((t) => t.id === statusFilter);
      const el = tabRefs.current[activeIndex];
      if (el) {
        setPillStyle({ left: el.offsetLeft, width: el.offsetWidth });
      }
    };
    updatePill();
    const raf = requestAnimationFrame(updatePill);
    return () => cancelAnimationFrame(raf);
  }, [statusFilter]);

  async function refresh() {
    if (!user) {
      setSubscriptions(getGuestSubs());
      setError("");
      return;
    }

    try {
      // 1. Fetch subscriptions list directly and display immediately
      const res = await api.listSubscriptions();
      const rawSubs = res?.subscriptions || [];
      setSubscriptions(rawSubs);
      setError("");

      // 2. Fetch summary non-blockingly to enrich price increases and conversions
      api
        .dashboardSummary(14, baseCurrency)
        .then((summary) => {
          if (summary) {
            setPriceIncreases(summary.recentPriceIncreases || []);
            const upcomingMap = new Map(
              (summary.upcomingRenewals || []).map((u) => [u.id, u]),
            );
            setSubscriptions((current) =>
              current.map((s) => {
                const match = upcomingMap.get(s.id);
                return match
                  ? { ...s, convertedAmount: match.convertedAmount }
                  : s;
              }),
            );
          }
        })
        .catch(() => {});
    } catch (err) {
      if (err?.status === 401) {
        setSubscriptions(getGuestSubs());
        setError("");
      } else {
        console.warn("Failed to load subscriptions from server:", err);
        setSubscriptions(getGuestSubs());
        setError("");
      }
    }
  }

  useEffect(() => {
    refresh();
  }, [user, baseCurrency]);

  useEffect(() => {
    function onExternalRefresh() {
      refresh();
    }
    window.addEventListener("subspens:refresh", onExternalRefresh);
    window.addEventListener("subtrack:refresh", onExternalRefresh);
    return () => {
      window.removeEventListener("subspens:refresh", onExternalRefresh);
      window.removeEventListener("subtrack:refresh", onExternalRefresh);
    };
  }, [user, baseCurrency]);

  // Close panels on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        filterPanelRef.current &&
        !filterPanelRef.current.contains(e.target)
      ) {
        setFilterPanelOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setSortOpen(false);
      }
      if (legendRef.current && !legendRef.current.contains(e.target)) {
        setLegendOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        setFilterPanelOpen(false);
        setSortOpen(false);
        setLegendOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Sync pending state when panel opens
  function openFilterPanel() {
    setSortOpen(false);
    setLegendOpen(false);
    setPendingCategory(categoryFilter);
    setPendingCycle(cycleFilter);
    setFilterSection("categories");
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
  const activeFilterCount =
    (categoryFilter !== "all" ? 1 : 0) + (cycleFilter !== "all" ? 1 : 0);

  async function handleCreate(data) {
    const rawName = (data.name || "").trim();
    const formattedData = {
      ...data,
      name: rawName ? rawName.charAt(0).toUpperCase() + rawName.slice(1) : "",
    };
    setShowForm(false);

    try {
      const res = await api.createSubscription(formattedData);
      if (res?.subscription) {
        setSubscriptions((prev) => [res.subscription, ...prev]);
      }
    } catch {
      const guestSubs = getGuestSubs();
      const newSub = {
        ...formattedData,
        id: "guest-" + Date.now(),
        amount: Number(formattedData.amount),
        status: formattedData.status || "active",
        convertedAmount: Number(formattedData.amount),
        createdAt: new Date().toISOString(),
      };
      saveGuestSubs([newSub, ...guestSubs]);
      setSubscriptions((prev) => [newSub, ...prev]);
    }
    refresh();
    window.dispatchEvent(new CustomEvent("subspens:reminders-refresh"));
  }

  async function handleUpdate(data) {
    const rawName = (data.name || "").trim();
    const formattedData = {
      ...data,
      name: rawName ? rawName.charAt(0).toUpperCase() + rawName.slice(1) : "",
    };
    const idToEdit = editing?.id;
    setEditing(null);

    // Optimistic update
    setSubscriptions((prev) =>
      prev.map((s) =>
        s.id === idToEdit
          ? { ...s, ...formattedData, amount: Number(formattedData.amount) }
          : s,
      ),
    );

    try {
      await api.updateSubscription(idToEdit, formattedData);
    } catch {
      const guestSubs = getGuestSubs().map((s) =>
        s.id === idToEdit
          ? { ...s, ...formattedData, amount: Number(formattedData.amount) }
          : s,
      );
      saveGuestSubs(guestSubs);
    }
    refresh();
    window.dispatchEvent(new CustomEvent("subspens:reminders-refresh"));
  }

  async function handleConvertTrial(subscription) {
    // Optimistic update
    setSubscriptions((prev) =>
      prev.map((s) =>
        s.id === subscription.id ? { ...s, isFreeTrial: false } : s,
      ),
    );
    try {
      await api.convertTrial(subscription.id);
    } catch {
      const guestSubs = getGuestSubs().map((s) =>
        s.id === subscription.id ? { ...s, isFreeTrial: false } : s,
      );
      saveGuestSubs(guestSubs);
    }
    refresh();
    window.dispatchEvent(new CustomEvent("subspens:reminders-refresh"));
  }

  async function handleConfirmPayment(paymentData) {
    if (!payingSub) return;
    const subToPay = payingSub;
    setPayingSub(null);

    // Optimistic update
    setSubscriptions((prev) =>
      prev.map((s) => {
        if (s.id === subToPay.id) {
          const nextDateStr = formatDateIso(
            addCycleToDate(s.nextRenewalDate, s.billingCycle || "monthly"),
          );
          return { ...s, nextRenewalDate: nextDateStr };
        }
        return s;
      }),
    );

    try {
      await api.confirmPayment(subToPay.id, paymentData);
    } catch {
      const guestSubs = getGuestSubs().map((s) => {
        if (s.id === subToPay.id) {
          const nextDateStr = formatDateIso(
            addCycleToDate(s.nextRenewalDate, s.billingCycle || "monthly"),
          );
          return { ...s, nextRenewalDate: nextDateStr };
        }
        return s;
      });
      saveGuestSubs(guestSubs);
    }
    refresh();
    window.dispatchEvent(new CustomEvent("subspens:reminders-refresh"));
  }

  async function handleStatusChange(subscription, newStatus) {
    // Optimistic update
    setSubscriptions((prev) =>
      prev.map((s) =>
        s.id === subscription.id ? { ...s, status: newStatus } : s,
      ),
    );

    try {
      await api.updateSubscription(subscription.id, {
        name: subscription.name,
        category: subscription.category || "other",
        amount: Number(subscription.amount),
        currency: subscription.currency || "INR",
        billingCycle: subscription.billingCycle || "monthly",
        nextRenewalDate: String(subscription.nextRenewalDate).slice(0, 10),
        status: newStatus,
        notes: subscription.notes || "",
        reminderDaysBefore: subscription.reminderDaysBefore || 2,
        isFreeTrial: Boolean(subscription.isFreeTrial),
        trialEndDate: subscription.trialEndDate
          ? String(subscription.trialEndDate).slice(0, 10)
          : null,
        cancellationDeadline: subscription.cancellationDeadline
          ? String(subscription.cancellationDeadline).slice(0, 10)
          : null,
        postTrialAmount:
          subscription.postTrialAmount !== null &&
          subscription.postTrialAmount !== undefined
            ? Number(subscription.postTrialAmount)
            : null,
        postTrialCurrency:
          subscription.postTrialCurrency || subscription.currency,
      });
    } catch {
      const guestSubs = getGuestSubs().map((s) =>
        s.id === subscription.id ? { ...s, status: newStatus } : s,
      );
      saveGuestSubs(guestSubs);
    }
    refresh();
    window.dispatchEvent(new CustomEvent("subspens:reminders-refresh"));
  }

  async function handleDelete(subscription) {
    if (!confirm(`Delete ${subscription.name}?`)) return;

    // Optimistic removal: remove immediately from UI so there's 0 delay
    setSubscriptions((prev) => prev.filter((s) => s.id !== subscription.id));

    try {
      await api.deleteSubscription(subscription.id);
    } catch {
      const guestSubs = getGuestSubs().filter((s) => s.id !== subscription.id);
      saveGuestSubs(guestSubs);
    }
    refresh();
    window.dispatchEvent(new CustomEvent("subspens:reminders-refresh"));
  }

  // Extract unique categories from actual data
  const availableCategories = useMemo(() => {
    const set = new Set(subscriptions.map((s) => s.category).filter(Boolean));
    return Array.from(set).sort();
  }, [subscriptions]);

  // Legend items with live counts
  const legendItems = useMemo(() => {
    const counts = {};
    for (const s of subscriptions) {
      const cat = normalizeCategory(s.category).toLowerCase();
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return CATEGORY_LEGEND.map((item) => ({
      ...item,
      count: counts[item.key.toLowerCase()] || 0,
    }));
  }, [subscriptions]);

  // Counts by status
  const counts = useMemo(
    () => ({
      all: subscriptions.length,
      active: subscriptions.filter(
        (s) => s.status === "active" && !s.isFreeTrial,
      ).length,
      trials: subscriptions.filter(
        (s) => s.isFreeTrial && s.status === "active",
      ).length,
      cancelled: subscriptions.filter((s) => s.status === "cancelled").length,
    }),
    [subscriptions],
  );

  // Filtered and sorted subscriptions
  const filteredSubscriptions = useMemo(() => {
    return subscriptions
      .filter((s) => {
        if (statusFilter === "trials") {
          if (!s.isFreeTrial || s.status !== "active") return false;
        } else if (statusFilter !== "all" && s.status !== statusFilter) {
          return false;
        }
        if (
          categoryFilter !== "all" &&
          s.category.toLowerCase() !== categoryFilter.toLowerCase()
        )
          return false;
        if (cycleFilter !== "all" && s.billingCycle !== cycleFilter)
          return false;
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchName = s.name.toLowerCase().includes(q);
          const matchCat = s.category.toLowerCase().includes(q);
          const matchNotes = (s.notes || "").toLowerCase().includes(q);
          if (!matchName && !matchCat && !matchNotes) return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Cancelled subscriptions always go to the bottom of the list
        const aCancelled = a.status === "cancelled";
        const bCancelled = b.status === "cancelled";
        if (aCancelled !== bCancelled) {
          return aCancelled ? 1 : -1;
        }

        const getRenewalDate = (sub) =>
          sub.isFreeTrial && sub.cancellationDeadline
            ? sub.cancellationDeadline
            : sub.nextRenewalDate;

        if (sortBy === "default" || sortBy === "renewal_asc") {
          return new Date(getRenewalDate(a)) - new Date(getRenewalDate(b));
        }
        if (sortBy === "renewal_desc") {
          return new Date(getRenewalDate(b)) - new Date(getRenewalDate(a));
        }
        if (sortBy === "cost_desc")
          return monthlyEquivalent(b) - monthlyEquivalent(a);
        if (sortBy === "cost_asc")
          return monthlyEquivalent(a) - monthlyEquivalent(b);
        if (sortBy === "name_asc") return a.name.localeCompare(b.name);
        if (sortBy === "name_desc") return b.name.localeCompare(a.name);
        if (sortBy === "created_desc") {
          return (
            getSubscriptionCreationTime(b) - getSubscriptionCreationTime(a)
          );
        }
        return 0;
      });
  }, [
    subscriptions,
    statusFilter,
    categoryFilter,
    cycleFilter,
    searchTerm,
    sortBy,
  ]);

  const filteredMonthlySpend = useMemo(
    () =>
      filteredSubscriptions
        .filter((s) => s.status === "active")
        .reduce((sum, s) => sum + monthlyEquivalent(s), 0),
    [filteredSubscriptions],
  );

  const hasActiveFilters =
    searchTerm !== "" ||
    statusFilter !== "all" ||
    categoryFilter !== "all" ||
    cycleFilter !== "all" ||
    sortBy !== "default";

  function resetFilters() {
    setSearchTerm("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setCycleFilter("all");
    setSortBy("default");
  }

  const currentSortLabel =
    SORT_OPTIONS.find((o) => o.id === sortBy)?.label ?? "Sort";

  return (
    <>
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">
            Subscriptions
          </h1>
          <p className="mt-1 text-sm text-ink/80">
            Everything you&apos;re paying for or trialing, in one searchable
            ledger.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <RadialFillButton
            onClick={() => setShowReceiptParser(true)}
            fillClassName="bg-ledger-light"
            contentClassName="gap-2"
            className="rounded-xl squircle border border-line bg-white px-3.5 py-2 text-sm font-medium text-ink shadow-2xs transition-colors duration-300 hover:border-ledger/40 hover:text-ledger-dark cursor-pointer active:scale-[0.98]"
            title="Upload invoice, document, screenshot, or paste text to auto-create subscriptions with Gemini"
          >
            <svg
              className="h-4 w-4 text-ink/70"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span>Upload Receipt</span>
          </RadialFillButton>
          {subscriptions.length > 0 && (
            <RadialFillButton
              onClick={() => setShowForm(true)}
              fillClassName="bg-ledger-dark"
              className="rounded-xl squircle bg-ledger px-4 py-2 text-sm font-medium text-white shadow-2xs cursor-pointer active:scale-[0.98]"
            >
              + Add subscription
            </RadialFillButton>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-rust">{error}</p>}

      {/* ── Filter & Search Card ────────────────────────────────────── */}
      <div className="space-y-3 rounded-2xl squircle border border-line bg-paper p-3 sm:p-4 shadow-2xs">
        {/* Row 1: Status tabs + Search */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Status Tabs */}
          {(() => {
            const tabs = [
              { id: "all", label: "All", count: counts.all },
              { id: "active", label: "Active", count: counts.active },
              { id: "trials", label: "Trials", count: counts.trials },
              { id: "cancelled", label: "Cancelled", count: counts.cancelled },
            ];
            return (
              <div className="w-full overflow-x-auto">
                <div className="relative inline-flex min-w-max rounded-xl squircle bg-paper p-0.5 text-xs font-medium border border-line">
                  {/* Sliding pill — sized and positioned from real button measurements */}
                  {pillStyle.width > 0 && (
                    <div
                      className="absolute top-0.5 bottom-0.5 rounded-lg squircle bg-ledger-light shadow-2xs transition-all duration-300 ease-in-out pointer-events-none"
                      style={{ left: pillStyle.left, width: pillStyle.width }}
                    />
                  )}
                  {tabs.map((tab, i) => (
                    <button
                      key={tab.id}
                      ref={(el) => (tabRefs.current[i] = el)}
                      onClick={() => setStatusFilter(tab.id)}
                      className={`relative flex items-center gap-1.5 rounded-lg squircle px-3 py-1.5 transition-colors duration-300 cursor-pointer whitespace-nowrap ${
                        statusFilter === tab.id
                          ? "text-ledger-dark font-semibold"
                          : "text-ink/80 hover:text-ink"
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] transition-colors duration-300 ${
                          statusFilter === tab.id
                            ? tab.id === "trials"
                              ? "bg-amber text-white"
                              : "bg-ledger text-white"
                            : "bg-line/60 text-ink/75"
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Search */}
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search by name, category, notes…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl squircle border border-line bg-line/15 hover:bg-line/25 px-3 py-1.5 pl-8 text-xs text-ink outline-none transition-all placeholder:text-ink/65 focus:border-line focus:bg-line/60 focus:outline-none focus:ring-0"
            />
            <svg
              className="absolute left-2.5 top-2 h-3.5 w-3.5 text-ink/65"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1.5 text-xs text-ink/40 hover:text-ink cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Filters button + Sort dropdown + summary */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-line/60">
          <div className="flex items-center gap-2">
            {/* ── Filters button + panel ─────────────────────────── */}
            <div className="relative" ref={filterPanelRef}>
              <button
                onClick={() =>
                  filterPanelOpen ? closeFilterPanel() : openFilterPanel()
                }
                className={`flex items-center gap-2 rounded-xl squircle border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  filterPanelOpen || activeFilterCount > 0
                    ? "border-ledger bg-ledger/5 text-ledger"
                    : "border-line bg-paper/30 text-ink/80 hover:border-ink/30 hover:text-ink"
                }`}
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"
                  />
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
                <div className="absolute left-0 top-full z-40 mt-1.5 w-[300px] overflow-hidden rounded-2xl squircle border border-line bg-white shadow-lg">
                  {/* Header */}
                  <div className="border-b border-line/60 px-4 py-2.5">
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-ink/40">
                      Filters
                    </span>
                  </div>

                  {/* Two-column body */}
                  <div className="flex" style={{ minHeight: "200px" }}>
                    {/* Left: filter sections */}
                    <div className="w-[110px] shrink-0 border-r border-line/60 py-1">
                      {[
                        { id: "categories", label: "Categories" },
                        { id: "cycles", label: "Cycles" },
                      ].map((sec) => (
                        <button
                          key={sec.id}
                          onClick={() => setFilterSection(sec.id)}
                          className={`w-full px-4 py-2.5 text-left text-xs font-medium transition-colors cursor-pointer ${
                            filterSection === sec.id
                              ? "bg-ink text-white"
                              : "text-ink/60 hover:bg-paper hover:text-ink"
                          }`}
                        >
                          {sec.label}
                          {/* Active indicator */}
                          {((sec.id === "categories" &&
                            pendingCategory !== "all") ||
                            (sec.id === "cycles" &&
                              pendingCycle !== "all")) && (
                            <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-ledger align-middle" />
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Right: options for selected section */}
                    <div className="flex-1 overflow-y-auto py-1 max-h-64">
                      {filterSection === "categories" && (
                        <>
                          <button
                            onClick={() => setPendingCategory("all")}
                            className={`flex w-full items-center justify-between px-4 py-2.5 text-xs transition-colors cursor-pointer ${
                              pendingCategory === "all"
                                ? "bg-ledger-light/50 font-semibold text-ledger-dark"
                                : "text-ink/60 hover:bg-paper hover:text-ink"
                            }`}
                          >
                            <span>All Categories</span>
                            {pendingCategory === "all" && (
                              <svg
                                className="h-3.5 w-3.5 text-ledger"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2.5"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </button>
                          {availableCategories.length === 0 && (
                            <p className="px-4 py-3 text-xs text-ink/40 italic">
                              No categories yet
                            </p>
                          )}
                          {availableCategories.map((cat) => (
                            <button
                              key={cat}
                              onClick={() => setPendingCategory(cat)}
                              className={`flex w-full items-center justify-between px-4 py-2.5 text-xs transition-colors cursor-pointer ${
                                pendingCategory === cat
                                  ? "bg-ledger-light/50 font-semibold text-ledger-dark"
                                  : "text-ink/60 hover:bg-paper hover:text-ink"
                              }`}
                            >
                              <span>{formatCategoryLabel(cat)}</span>
                              {pendingCategory === cat && (
                                <svg
                                  className="h-3.5 w-3.5 text-ledger"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2.5"
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              )}
                            </button>
                          ))}
                        </>
                      )}

                      {filterSection === "cycles" && (
                        <>
                          <button
                            onClick={() => setPendingCycle("all")}
                            className={`flex w-full items-center justify-between px-4 py-2.5 text-xs transition-colors cursor-pointer ${
                              pendingCycle === "all"
                                ? "bg-ledger-light/50 font-semibold text-ledger-dark"
                                : "text-ink/60 hover:bg-paper hover:text-ink"
                            }`}
                          >
                            <span>All Cycles</span>
                            {pendingCycle === "all" && (
                              <svg
                                className="h-3.5 w-3.5 text-ledger"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2.5"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </button>
                          {CYCLES.map((cyc) => (
                            <button
                              key={cyc.id}
                              onClick={() => setPendingCycle(cyc.id)}
                              className={`flex w-full items-center justify-between px-4 py-2.5 text-xs transition-colors cursor-pointer ${
                                pendingCycle === cyc.id
                                  ? "bg-ledger-light/50 font-semibold text-ledger-dark"
                                  : "text-ink/60 hover:bg-paper hover:text-ink"
                              }`}
                            >
                              <span>{cyc.label}</span>
                              {pendingCycle === cyc.id && (
                                <svg
                                  className="h-3.5 w-3.5 text-ledger"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2.5"
                                    d="M5 13l4 4L19 7"
                                  />
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
                onClick={() => {
                  setFilterPanelOpen(false);
                  setLegendOpen(false);
                  setSortOpen((o) => !o);
                }}
                className={`flex items-center gap-2 rounded-xl squircle border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  sortOpen || sortBy !== "default"
                    ? "border-ledger bg-ledger/5 text-ledger"
                    : "border-line bg-paper/30 text-ink/80 hover:border-ink/30 hover:text-ink"
                }`}
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                  />
                </svg>
                <span className="sm:hidden">Sort</span>
                <span className="hidden sm:inline">Sort:</span>
                <span className="hidden sm:inline max-w-[120px] truncate">
                  {currentSortLabel}
                </span>
                <svg
                  className={`h-3 w-3 transition-transform ${sortOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {sortOpen && (
                <div className="absolute left-0 top-full z-40 mt-1.5 w-56 overflow-hidden rounded-2xl squircle border border-line bg-white shadow-lg py-1">
                  <div className="border-b border-line/60 px-4 py-2">
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-ink/40">
                      Sort by
                    </span>
                  </div>
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setSortBy(opt.id);
                        setSortOpen(false);
                      }}
                      className={`flex w-full items-center justify-between px-4 py-2.5 text-xs transition-colors cursor-pointer ${
                        sortBy === opt.id
                          ? "bg-ledger-light/50 font-semibold text-ledger-dark"
                          : "text-ink/60 hover:bg-paper hover:text-ink"
                      }`}
                    >
                      <span>{opt.label}</span>
                      {sortBy === opt.id && (
                        <svg
                          className="h-3.5 w-3.5 text-ledger"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2.5"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Category Color Legend "i" Info Button ────────────── */}
            <div className="relative" ref={legendRef}>
              <button
                type="button"
                onClick={() => {
                  setFilterPanelOpen(false);
                  setSortOpen(false);
                  setLegendOpen((o) => !o);
                }}
                className={`flex items-center justify-center h-6 w-6 rounded-full border text-[11px] font-bold transition-all cursor-pointer ${
                  legendOpen
                    ? "border-ledger bg-ledger/10 text-ledger"
                    : "border-line bg-paper/30 text-ink/80 hover:border-ink/30 hover:text-ink"
                }`}
                title="Category color legend"
                aria-label="Category color legend"
                aria-expanded={legendOpen}
              >
                i
              </button>

              {legendOpen && (
                <div className="absolute left-1/2 -translate-x-[60%] sm:left-0 sm:translate-x-0 sm:right-auto top-full z-40 mt-1.5 w-60 sm:w-64 max-w-[calc(100vw-32px)] rounded-2xl squircle border border-line bg-white p-3 shadow-lg animate-in fade-in duration-100">
                  <div className="flex items-center justify-between border-b border-line/60 pb-2 mb-2">
                    <span className="text-xs font-semibold text-ink">
                      Category Colors
                    </span>
                    <button
                      onClick={() => setLegendOpen(false)}
                      className="text-ink/40 hover:text-ink text-xs cursor-pointer p-0.5"
                      aria-label="Close color legend"
                    >
                      ✕
                    </button>
                  </div>

                  <p className="text-[11px] text-ink/50 mb-2 leading-relaxed">
                    Color dots identify the category of each subscription.
                  </p>

                  <div className="space-y-1">
                    {legendItems.map((item) => (
                      <button
                        key={item.key}
                        onClick={() => {
                          setCategoryFilter((prev) =>
                            prev.toLowerCase() === item.key.toLowerCase()
                              ? "all"
                              : item.key,
                          );
                          setLegendOpen(false);
                        }}
                        className={`flex w-full items-center justify-between px-2 py-1.5 rounded-lg squircle text-xs transition-colors cursor-pointer ${
                          categoryFilter.toLowerCase() ===
                          item.key.toLowerCase()
                            ? "bg-ledger-light/60 font-semibold text-ledger-dark"
                            : "hover:bg-paper text-ink/80 hover:text-ink"
                        }`}
                        title={`Click to filter by ${item.label}`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs ring-1 ring-black/10"
                            style={{ backgroundColor: item.color }}
                          />
                          <span>{item.label}</span>
                        </div>
                        <span className="text-[11px] text-ink/40 tabular">
                          {item.count} {item.count === 1 ? "sub" : "subs"}
                        </span>
                      </button>
                    ))}
                  </div>

                  {categoryFilter !== "all" && (
                    <div className="mt-2.5 pt-2 border-t border-line/50 text-center">
                      <button
                        onClick={() => {
                          setCategoryFilter("all");
                          setLegendOpen(false);
                        }}
                        className="text-[11px] text-rust hover:underline cursor-pointer"
                      >
                        Clear category filter
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Active filter chips */}
            {categoryFilter !== "all" && (
              <span className="flex items-center gap-1 rounded-full border border-ledger/30 bg-ledger/5 px-2.5 py-1 text-[11px] font-medium text-ledger">
                {formatCategoryLabel(categoryFilter)}
                <button
                  onClick={() => setCategoryFilter("all")}
                  className="ml-0.5 text-ledger/60 hover:text-ledger cursor-pointer"
                >
                  ✕
                </button>
              </span>
            )}
            {cycleFilter !== "all" && (
              <span className="flex items-center gap-1 rounded-full border border-ledger/30 bg-ledger/5 px-2.5 py-1 text-[11px] font-medium text-ledger">
                {CYCLES.find((c) => c.id === cycleFilter)?.label}
                <button
                  onClick={() => setCycleFilter("all")}
                  className="ml-0.5 text-ledger/60 hover:text-ledger cursor-pointer"
                >
                  ✕
                </button>
              </span>
            )}
          </div>

          {/* Summary + reset */}
          <div className="flex items-center gap-3 text-xs">
            <span className="text-ink/80">
              Showing{" "}
              <strong className="text-ink">
                {filteredSubscriptions.length}
              </strong>{" "}
              of {subscriptions.length} (
              <span className="tabular font-medium text-ledger-dark">
                {formatMoney(filteredMonthlySpend, baseCurrency)}/mo
              </span>
              )
            </span>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="font-medium text-rust hover:underline cursor-pointer"
              >
                Reset all
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Subscription List */}
      <div className="overflow-hidden rounded-2xl squircle border border-line bg-paper px-2 sm:px-4">
        {filteredSubscriptions.length === 0 && (
          <div className="py-14 text-center flex flex-col items-center justify-center">
            {subscriptions.length === 0 && (
              <RadialFillButton
                onClick={() => setShowForm(true)}
                fillClassName="bg-ledger-dark"
                contentClassName="gap-2"
                className="mb-4 rounded-xl squircle bg-ledger px-5 py-2.5 text-sm font-medium text-white shadow-sm cursor-pointer active:scale-[0.98]"
              >
                + Add subscription
              </RadialFillButton>
            )}
            <p className="text-sm font-medium text-ink/85">
              No subscriptions found
            </p>
            <p className="mt-1 text-xs text-ink/70">
              {hasActiveFilters
                ? "Try tweaking or resetting your search and filter criteria."
                : "Add your first subscription or free trial to get started."}
            </p>
            {hasActiveFilters && (
              <RadialFillButton
                onClick={resetFilters}
                fillClassName="bg-ledger-light"
                className="mt-3 rounded-xl squircle border border-line bg-paper px-3 py-1.5 text-xs text-ink transition-colors duration-300 hover:border-ledger/40 hover:text-ledger-dark cursor-pointer"
              >
                Clear all filters
              </RadialFillButton>
            )}
          </div>
        )}
        {filteredSubscriptions.map((s) => (
          <SubscriptionCard
            key={s.id}
            subscription={s}
            baseCurrency={baseCurrency}
            priceIncrease={priceIncreases.find(
              (p) => p.subscriptionId === s.id,
            )}
            onEdit={(sub) => {
              setShowForm(false);
              setEditing(sub);
            }}
            onConvertTrial={handleConvertTrial}
            onConfirmPayment={(sub) => setPayingSub(sub)}
            onCancelGuide={(sub) => setGuideSub(sub)}
            onViewPayments={(sub) => setHistorySub(sub)}
            onDelete={handleDelete}
          />
        ))}
      </div>

    </div>

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
          notes: editing.notes || "",
          reminderDaysBefore: editing.reminderDaysBefore || 2,
          isFreeTrial: Boolean(editing.isFreeTrial),
          trialEndDate: editing.trialEndDate
            ? String(editing.trialEndDate).slice(0, 10)
            : "",
          cancellationDeadline: editing.cancellationDeadline
            ? String(editing.cancellationDeadline).slice(0, 10)
            : "",
          postTrialAmount: editing.postTrialAmount,
          postTrialCurrency: editing.postTrialCurrency || editing.currency,
        }}
        onSubmit={handleUpdate}
        onCancel={() => setEditing(null)}
      />
    )}
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
    </>
  );
}
