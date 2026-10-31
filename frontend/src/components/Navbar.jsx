'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import ReminderBell from './ReminderBell';
import PaymentConfirmModal from './PaymentConfirmModal';
import CancellationGuideModal from './CancellationGuideModal';
import { api } from '../api/client';

const CURRENCIES = [
  { code: 'USD', label: '$ USD' },
  { code: 'EUR', label: '€ EUR' },
  { code: 'GBP', label: '£ GBP' },
  { code: 'INR', label: '₹ INR' },
  { code: 'CAD', label: 'CA$ CAD' },
  { code: 'AUD', label: 'A$ AUD' },
  { code: 'JPY', label: '¥ JPY' },
  { code: 'CHF', label: 'CHF' },
  { code: 'SGD', label: 'SG$ SGD' },
  { code: 'BRL', label: 'R$ BRL' },
];

export default function Navbar() {
  const { user, baseCurrency, setBaseCurrency, logout, openLogin, openRegister } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [payingSub, setPayingSub] = useState(null);
  const [guideSub, setGuideSub] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef(null);

  const getLinkClass = (path, exact = false) => {
    const isActive = exact ? pathname === path : pathname === path || (pathname && pathname.startsWith(path + '/'));
    return `px-1 pb-1 border-b-2 text-sm transition-colors ${
      isActive ? 'border-ledger text-ink font-medium' : 'border-transparent text-ink/50 hover:text-ink'
    }`;
  };

  const getMobileLinkClass = (path, exact = false) => {
    const isActive = exact ? pathname === path : pathname === path || (pathname && pathname.startsWith(path + '/'));
    return `block w-full py-3 text-base font-medium border-b border-line/30 transition-colors ${
      isActive ? 'text-ledger' : 'text-ink/70 hover:text-ink'
    }`;
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Close mobile menu on outside click
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleClickOutside = (e) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen]);

  const isLandingPage = !user && pathname === '/';

  async function handleConfirmPayment(paymentData) {
    if (!payingSub) return;
    await api.confirmPayment(payingSub.id, paymentData);
    setPayingSub(null);
    window.dispatchEvent(new CustomEvent('subtrack:refresh'));
  }

  async function handleConvertTrial(sub) {
    try {
      await api.convertTrial(sub.id);
      window.dispatchEvent(new CustomEvent('subtrack:refresh'));
    } catch (err) {
      alert(err.message);
    }
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
      });
      window.dispatchEvent(new CustomEvent('subtrack:refresh'));
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <>
      <header
        ref={mobileMenuRef}
        className={`sticky top-0 z-40 transition-colors duration-200 ${
          mobileMenuOpen
            ? 'bg-paper border-b border-line/50'
            : isScrolled
            ? 'bg-paper/90 backdrop-blur-xs border-b border-line/70'
            : 'bg-paper/90 backdrop-blur-xs border-b border-transparent'
        }`}
      >
        <div className="relative mx-auto flex items-center justify-between px-6 sm:px-10 lg:px-14 py-5 sm:py-6 max-w-[1440px] w-full">
          {/* Logo */}
          <div className="flex items-center">
            <Link href={user ? '/subscriptions' : '/'} className="flex items-center gap-2 sm:gap-2.5 transition-opacity hover:opacity-90">
              <img
                src="/logo/logo.svg"
                alt="SubTrack"
                className="h-7 w-auto object-contain"
              />
              <img
                src="/logo/logo-t.svg"
                alt="SubTrack"
                className="h-7 w-auto object-contain"
              />
            </Link>
          </div>

          {/* Centered Navigation — desktop only */}
          <nav className="hidden md:flex items-center gap-6 sm:gap-8 absolute left-1/2 -translate-x-1/2">
            <Link href="/" className={getLinkClass('/', true)}>Home</Link>
            <Link href="/subscriptions" className={getLinkClass('/subscriptions')}>Subscriptions</Link>
            <Link href="/dashboard" className={getLinkClass('/dashboard')}>Overview</Link>
          </nav>

          {/* Right side — desktop only */}
          <div className="hidden md:flex">
            {user ? (
              <div className="flex items-center gap-3 sm:gap-4">
                {/* Due Date Reminders Bell & Trial Sentinel */}
                <ReminderBell
                  onConfirmPayment={(sub) => setPayingSub(sub)}
                  onCancelGuide={(sub) => setGuideSub(sub)}
                  onConvertTrial={(sub) => handleConvertTrial(sub)}
                />

                {/* Currency Selector */}
                <div className="relative flex items-center">
                  <select
                    value={user.baseCurrency || baseCurrency || 'USD'}
                    onChange={(e) => setBaseCurrency(e.target.value)}
                    className="appearance-none rounded border border-line/80 bg-paper/50 pl-2 pr-5 py-0.5 text-[11px] font-medium text-ink/80 outline-none hover:border-ink/20 focus:border-ink/25 text-center [text-align-last:center] cursor-pointer transition-colors"
                    title="Change default display currency for totals and analytics"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code} className="text-left bg-white text-ink">
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <svg
                    className="pointer-events-none absolute right-1.5 h-3 w-3 text-ink/40"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                <span className="hidden md:inline text-xs text-ink/40">|</span>

                {/* Show user's name (with email as tooltip fallback) */}
                <span className="hidden md:inline text-xs font-medium text-ink/80 max-w-[160px] truncate" title={user.email}>
                  {user.name || user.email}
                </span>
                <button
                  onClick={() => {
                    logout();
                    router.push('/');
                  }}
                  className="text-xs text-ink/60 hover:text-rust transition-colors cursor-pointer"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                {/* Currency Selector for guest/unlogged users */}
                <div className="relative flex items-center">
                  <select
                    value={baseCurrency || 'USD'}
                    onChange={(e) => setBaseCurrency(e.target.value)}
                    className="appearance-none rounded border border-line/80 bg-paper/50 pl-2 pr-5 py-0.5 text-[11px] font-medium text-ink/80 outline-none hover:border-ink/20 focus:border-ink/25 text-center [text-align-last:center] cursor-pointer transition-colors"
                    title="Change default display currency for totals and analytics"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code} className="text-left bg-white text-ink">
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <svg
                    className="pointer-events-none absolute right-1.5 h-3 w-3 text-ink/40"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                <button
                  type="button"
                  onClick={openLogin}
                  className="text-xs font-semibold text-ink/70 hover:text-ink transition-colors cursor-pointer"
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={openRegister}
                  className="rounded-sm bg-ledger px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-ledger-dark transition-colors cursor-pointer"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>

          {/* Hamburger button — mobile only */}
          <button
            type="button"
            className="md:hidden flex items-center justify-center h-7 w-7 -mr-0.5 text-ink/80 hover:text-ink transition-colors cursor-pointer bg-transparent hover:bg-transparent active:bg-transparent focus:outline-none [-webkit-tap-highlight-color:transparent]"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              /* X icon */
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              /* Hamburger icon */
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile dropdown menu — overlays page content with solid color */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 w-full bg-paper border-b border-line/70 shadow-xl px-6 py-5 flex flex-col gap-1 max-h-[calc(100vh-80px)] overflow-y-auto">
            {/* Nav links */}
            <Link href="/" className={getMobileLinkClass('/', true)}>
              Home
            </Link>
            <Link href="/subscriptions" className={getMobileLinkClass('/subscriptions')}>
              Subscriptions
            </Link>
            <Link href="/dashboard" className={getMobileLinkClass('/dashboard')}>
              Overview
            </Link>

            {/* Currency Selector */}
            <div className="flex items-center justify-between py-3 border-b border-line/30">
              <span className="text-xs font-medium text-ink/50 uppercase tracking-wider">Currency</span>
              <div className="relative flex items-center">
                <select
                  value={user?.baseCurrency || baseCurrency || 'USD'}
                  onChange={(e) => setBaseCurrency(e.target.value)}
                  className="appearance-none rounded border border-line/80 bg-paper/60 pl-2.5 pr-6 py-1 text-xs font-medium text-ink/80 outline-none hover:border-ink/20 focus:border-ink/25 cursor-pointer transition-colors"
                  title="Change default display currency for totals and analytics"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code} className="bg-white text-ink">
                      {c.label}
                    </option>
                  ))}
                </select>
                <svg
                  className="pointer-events-none absolute right-1.5 h-3 w-3 text-ink/40"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Auth buttons at the bottom */}
            <div className="pt-4 mt-1 flex flex-col gap-3">
              {user ? (
                <>
                  <span className="text-xs text-ink/50 truncate">{user.name || user.email}</span>
                  <button
                    onClick={() => {
                      logout();
                      router.push('/');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full rounded-sm border border-line/60 px-4 py-2.5 text-sm font-semibold text-ink/70 hover:text-rust hover:border-rust/40 transition-colors cursor-pointer text-left"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => { openLogin(); setMobileMenuOpen(false); }}
                    className="w-full rounded-sm border border-line/60 px-4 py-2.5 text-sm font-semibold text-ink/70 hover:text-ink hover:border-ink/30 transition-colors cursor-pointer"
                  >
                    Log In
                  </button>
                  <button
                    type="button"
                    onClick={() => { openRegister(); setMobileMenuOpen(false); }}
                    className="w-full rounded-sm bg-ledger px-4 py-2.5 text-sm font-semibold text-white shadow-2xs hover:bg-ledger-dark transition-colors cursor-pointer"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Mobile background blur backdrop covering the rest of the website */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-ink/20 backdrop-blur-sm md:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
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
    </>
  );
}
