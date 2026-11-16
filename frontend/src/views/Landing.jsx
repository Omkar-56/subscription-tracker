'use client';

import { useState } from 'react';
import Link from 'next/link';
import BrandLogo from '../components/BrandLogo';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  {
    icon: '🛡️',
    title: 'Free-Trial Expiry Sentinel',
    desc: 'Never get hit by surprise trial conversions. Set exact cancellation deadlines, countdown alerts, and cancel with direct links before your card gets billed.',
  },
  {
    icon: '🔔',
    title: 'Smart Renewal Reminders',
    desc: 'Proactive alerts before bills hit your card. Automated billing cycle rollovers advance dates cleanly and log full payment histories.',
  },
  {
    icon: '💱',
    title: 'Real-Time Currency Normalization',
    desc: 'Pay across INR, USD, EUR, CAD, AED, JPY, SGD, or AUD. Subspens uses live European Central Bank exchange rates to give you a single unified view of your true global spend.',
  },
  {
    icon: '📊',
    title: 'Visual Category Breakdown & Forecast',
    desc: 'Interactive Donut charts and 12-month projections reveal exactly where your budget flows between AI, Cloud, Streaming, Software, and Apps.',
  },
  {
    icon: '✂️',
    title: '1-Click Direct Cancellation Guides',
    desc: 'Stop wasting time digging through obscure account settings. Get direct links and step-by-step instructions to cancel any provider in seconds.',
  },
  {
    icon: '📉',
    title: 'Waste & Savings Meter',
    desc: 'Track monthly and annual money saved from cancelled subscriptions. Watch your financial leaks close in real time as you optimize recurring charges.',
  },
];

const SAMPLE_COMPANIES = [
  'Netflix', 'ChatGPT', 'Spotify', 'GitHub', 'Disney+', 'Figma', 'Notion', 'Apple', 'Adobe', 'Slack', 'YouTube', 'Discord'
];

const FAQS = [
  {
    q: 'What is Subspens and why is it the best subscription tracker online?',
    a: 'Subspens is a lightweight, privacy-first subscription tracker online that lets you track subscriptions for free without linking bank accounts. It tracks active recurring services, alerts you before free trials expire, normalizes multi-currency spending in real time, and gives you 1-click guides to cancel unwanted charges.',
  },
  {
    q: 'How do I track subscriptions for free online with Subspens?',
    a: 'Simply visit Subspens and click "+ Add subscription" or upload an invoice/receipt using our AI parser. Enter your service name, amount, billing cycle (weekly, monthly, quarterly, yearly), and next renewal date. Subspens immediately calculates your total monthly commitment, upcoming renewal dates, and 12-month spend forecast.',
  },
  {
    q: 'Do I need to connect my bank account or enter credit card details?',
    a: 'No! Unlike intrusive budgeting apps that require bank logins via Plaid or Yodlee, Subspens is completely private. You never have to share your bank account or credit card numbers. You can start instantly in guest mode or create a free account with email or Google sign-in.',
  },
  {
    q: 'How does the Free-Trial Expiry Sentinel prevent surprise renewal charges?',
    a: 'When you sign up for a free trial (e.g., streaming service, SaaS software, or gym trial), enter the cancellation cutoff in Subspens. The Free-Trial Expiry Sentinel places live countdown indicators on your dashboard and sends reminder alerts before the deadline so you can cancel before full-price recurring charges hit your card.',
  },
  {
    q: 'Can I track subscriptions in multiple global currencies?',
    a: 'Yes. Subspens supports real-time multi-currency normalization across INR, USD, EUR, CAD, AED, JPY, SGD, and AUD. Live exchange rates from the European Central Bank automatically convert all your foreign subscriptions into your chosen home currency.',
  },
  {
    q: 'How does Subspens compare to using an Excel or Google Sheets subscription tracker?',
    a: 'Spreadsheets are static, error-prone, and require tedious manual calculations. Subspens automatically advances renewal dates when cycles complete, triggers proactive reminder notifications, updates currency exchange rates live, and provides 1-click cancellation guides tailored to each service.',
  },
  {
    q: 'Is Subspens really 100% free to use online?',
    a: 'Yes, Subspens is 100% free forever. All core subscription tracking features—including automated renewal alerts, trial sentinels, 12-month forecasting, and cancellation guides—are completely free with no hidden paywalls or subscription fees.',
  },
];

const COMPARISON_ROWS = [
  { feature: 'Cost', subspens: '100% Free Forever', others: '$4.99–$9.99/month', sheets: 'Free (Manual)' },
  { feature: 'Bank Login / Plaid Required?', subspens: 'No (100% Private)', others: 'Yes (Security Risk)', sheets: 'No' },
  { feature: 'Free-Trial Expiry Sentinel', subspens: 'Included with Cutoff Alerts', others: 'Rare / Paid Feature', sheets: 'None' },
  { feature: 'Live Multi-Currency Conversion', subspens: '8 Currencies (Live ECB Rates)', others: 'Single Currency Only', sheets: 'Manual formulas' },
  { feature: '1-Click Direct Cancellation Guides', subspens: 'Direct links & guides', others: 'None', sheets: 'None' },
  { feature: 'Automatic Cycle Rollovers', subspens: 'Yes (Calculated live)', others: 'Bank sync required', sheets: 'Manual updates' },
  { feature: 'AI Receipt & Invoice Parser', subspens: 'Google Gemini Powered', others: 'Paid tier only', sheets: 'None' },
];

export default function Landing() {
  const { user, openRegister } = useAuth();
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <div className="flex flex-col min-h-screen bg-paper text-ink selection:bg-ledger selection:text-white w-full overflow-x-hidden">
      {/* 
        HERO SECTION
        Optimized for high visual impact, rapid conversion, and target keywords:
        "Track subscriptions for free online" & "Subscription Tracker online"
      */}
      <section className="relative w-full bg-[#fcf7ed] overflow-hidden border-b border-line/60">
        <div className="relative mx-auto max-w-[1440px] w-full px-6 sm:px-10 lg:px-14 py-8 sm:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-10 lg:gap-8">
            {/* Left Side: Headline, Subtitle, CTA & Trust Points */}
            <div className="lg:col-span-6 space-y-6 text-left z-10">
              {/* Main Headline */}
              <h1 className="font-display text-4xl sm:text-5xl lg:text-[54px] font-semibold tracking-tight text-ink leading-[1.12]">
                Track subscriptions <br className="hidden sm:inline" />
                <span className="text-ledger">for free online.</span>
              </h1>

              {/* Subtitle */}
              <p className="max-w-xl text-base sm:text-lg text-ink/75 leading-relaxed">
                <strong>Subspens</strong> is the high-clarity <strong>subscription tracker online</strong>.
                Take complete control of recurring expenses, get alerted before free trials expire,
                normalize multi-currency spending, and cancel unwanted bills with 1-click direct guides.
              </p>

              {/* CTA Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <Link
                  href="/subscriptions"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-ledger px-6 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-ledger-dark transition-all transform hover:-translate-y-0.5 cursor-pointer"
                  title="Track subscriptions for free online"
                >
                  <span>Track Subscriptions Free</span>
                  <span>→</span>
                </Link>
              </div>

              {/* Trust points */}
              <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-ink/70 font-medium">
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4 text-ledger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  No credit card required
                </span>
                <span className="text-ink/30">•</span>
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4 text-ledger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Zero bank account access
                </span>
                <span className="text-ink/30">•</span>
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4 text-ledger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Instant guest access
                </span>
              </div>
            </div>

            {/* Right Side: Old Dashboard Preview Image */}
            <div className="lg:col-span-6 flex justify-center lg:justify-end items-center">
              <div className="relative w-full max-w-[640px] lg:max-w-none">
                <img
                  src="/Images/hero-bg.png"
                  alt="Subspens - Free online subscription tracker dashboard preview"
                  className="w-full h-auto object-contain select-none pointer-events-none drop-shadow-sm"
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Container for Below-Hero Sections — aligned with navbar from both sides */}
      <div className="mx-auto max-w-[1440px] w-full px-6 sm:px-10 lg:px-14 space-y-14 sm:space-y-18 py-10 sm:py-14">
        {/* Brand Compatibility Strip */}
        <section className="text-center">
          <p className="font-display text-xs font-semibold uppercase tracking-wider text-ink/40">
            Works seamlessly with all your favorite tools, media & platforms
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-4 opacity-90">
            {SAMPLE_COMPANIES.map((name) => (
              <div key={name} className="flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-1.5 shadow-2xs">
                <BrandLogo name={name} category="software" size="sm" />
                <span className="text-xs font-medium text-ink">{name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* AISO Highlight Section: Direct Answer / Entity Definition */}
        <section className="rounded-lg border border-ledger/25 bg-ledger/5 p-6 sm:p-8 shadow-2xs">
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="inline-block rounded bg-ledger px-2.5 py-0.5 text-[11px] font-bold text-white uppercase tracking-wider">
              AI & Search Overview
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink">
              What is Subspens? The intentional subscription tracker online
            </h2>
            <p className="text-sm sm:text-base text-ink/80 leading-relaxed">
              <strong>Subspens</strong> is an intentional, privacy-first <strong>subscription tracker online</strong> built for individuals and teams seeking clarity over their recurring overhead.
              Unlike complex budgeting software that demands sensitive bank credentials, Subspens lets you track recurring subscriptions, set proactive renewal reminders, catch free-trial expiry deadlines, and normalize multi-currency bills into your home currency—completely free.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-ledger/20 text-xs text-ink/75">
              <div>
                <strong className="block text-ink text-sm font-semibold">100% Free to Use</strong>
                No credit cards, subscription fees, or hidden trial paywalls.
              </div>
              <div>
                <strong className="block text-ink text-sm font-semibold">Zero Bank Linking</strong>
                Complete financial privacy without Plaid, Yodlee, or account scraping.
              </div>
              <div>
                <strong className="block text-ink text-sm font-semibold">Auto-Renewal Intelligence</strong>
                Calculates billing cycles, records payment histories, and prevents surprises.
              </div>
            </div>
          </div>
        </section>

        {/* 3-Step Walkthrough: How to Track Subscriptions for Free Online */}
        <section className="space-y-8 sm:space-y-10">
          <div className="text-center space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-ledger-dark">
              Simple 3-Step Setup
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink">
              How to track subscriptions for free online
            </h2>
            <p className="mx-auto max-w-xl text-sm text-ink/65">
              Take control of your recurring commitments in under 60 seconds with no complex bank configurations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-md border border-line bg-white p-6 shadow-2xs space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ledger text-white font-display font-bold text-sm">
                1
              </div>
              <h3 className="font-display text-base font-semibold text-ink">
                1. Add Subscriptions or Scan Invoices
              </h3>
              <p className="text-xs sm:text-sm text-ink/70 leading-relaxed">
                Log recurring services like Netflix, Spotify, ChatGPT, or AWS manually—or upload PDF receipts and invoices for instant parsing using built-in Google Gemini AI.
              </p>
            </div>

            <div className="rounded-md border border-line bg-white p-6 shadow-2xs space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ledger text-white font-display font-bold text-sm">
                2
              </div>
              <h3 className="font-display text-base font-semibold text-ink">
                2. Set Renewal Alerts & Trial Cutoffs
              </h3>
              <p className="text-xs sm:text-sm text-ink/70 leading-relaxed">
                Configure notification windows (default 2 days before) and specify trial cutoff dates. The Free-Trial Expiry Sentinel counts down to ensure you cancel before auto-conversion.
              </p>
            </div>

            <div className="rounded-md border border-line bg-white p-6 shadow-2xs space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ledger text-white font-display font-bold text-sm">
                3
              </div>
              <h3 className="font-display text-base font-semibold text-ink">
                3. Audit Spend & Stop Subscription Leaks
              </h3>
              <p className="text-xs sm:text-sm text-ink/70 leading-relaxed">
                Review your 12-month projected spend, inspect category charts, and use direct 1-click guides to cancel unused subscriptions while tracking your savings in real time.
              </p>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="space-y-8 sm:space-y-10">
          <div className="text-center space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-ledger-dark">
              Built for Purpose
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink">
              Engineered for complete subscription clarity
            </h2>
            <p className="mx-auto max-w-xl text-sm text-ink/65">
              Everything you need to audit, organize, and stop unintended recurring leakage online.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, idx) => (
              <div
                key={idx}
                className="rounded-md border border-line bg-white p-6 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-ledger-light text-xl">
                    {f.icon}
                  </div>
                  <h3 className="mt-4 font-display text-base font-semibold text-ink">{f.title}</h3>
                  <p className="mt-2 text-xs sm:text-sm text-ink/65 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Comparison Matrix: Why Choose Subspens? */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-ledger-dark">
              Feature Comparison
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink">
              Why Subspens is the #1 online subscription tracker
            </h2>
            <p className="mx-auto max-w-xl text-sm text-ink/65">
              See how Subspens outperforms expensive budgeting apps and tedious spreadsheet trackers.
            </p>
          </div>

          <div className="overflow-x-auto rounded-md border border-line bg-white shadow-2xs">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-line bg-paper/60">
                  <th className="py-3.5 px-4 font-semibold text-ink">Feature</th>
                  <th className="py-3.5 px-4 font-bold text-ledger-dark bg-ledger/10">Subspens</th>
                  <th className="py-3.5 px-4 font-medium text-ink/60">Paid Budgeting Apps</th>
                  <th className="py-3.5 px-4 font-medium text-ink/60">Excel / Google Sheets</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {COMPARISON_ROWS.map((row, i) => (
                  <tr key={i} className="hover:bg-paper/30 transition-colors">
                    <td className="py-3 px-4 font-medium text-ink">{row.feature}</td>
                    <td className="py-3 px-4 font-semibold text-ledger-dark bg-ledger/5">
                      ✓ {row.subspens}
                    </td>
                    <td className="py-3 px-4 text-ink/60">{row.others}</td>
                    <td className="py-3 px-4 text-ink/60">{row.sheets}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* SEO & AISO FAQ Section */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-ledger-dark">
              Frequently Asked Questions
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink">
              Common questions about tracking subscriptions online
            </h2>
            <p className="mx-auto max-w-xl text-sm text-ink/65">
              Everything you need to know about our free online subscription tracker and privacy standards.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-md border border-line bg-white shadow-2xs overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="flex w-full items-center justify-between p-4 sm:p-5 text-left text-sm sm:text-base font-semibold text-ink hover:bg-paper/40 transition-colors cursor-pointer gap-4"
                    aria-expanded={isOpen}
                  >
                    <span>{faq.q}</span>
                    <span className={`text-ledger font-bold text-lg shrink-0 transition-transform ${isOpen ? 'rotate-45' : ''}`}>
                      +
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs sm:text-sm text-ink/75 leading-relaxed border-t border-line/40 pt-3 bg-paper/20">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Call to Action Footer Card */}
        <section className="rounded-md border border-line bg-ink text-white p-6 sm:p-10 text-center shadow-lg relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-300">
              Free Online Subscription Tracker
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-white">
              Ready to track subscriptions for free online?
            </h2>
            <p className="text-sm sm:text-base text-white/75 leading-relaxed">
              Stop surprise recurring renewals, audit every trial, and close financial leaks today with Subspens. Set up in less than 60 seconds with no credit card required.
            </p>
            <div className="pt-4 flex flex-wrap justify-center gap-4">
              {user ? (
                <Link
                  href="/subscriptions"
                  className="inline-flex items-center justify-center rounded-sm bg-ledger px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-ledger-dark transition-all transform hover:-translate-y-0.5 max-w-full text-center"
                >
                  Go to My Subscriptions →
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={openRegister}
                  className="inline-flex items-center justify-center rounded-sm bg-ledger px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-ledger-dark transition-all transform hover:-translate-y-0.5 cursor-pointer max-w-full text-center"
                >
                  Track Subscriptions for Free Online →
                </button>
              )}
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
