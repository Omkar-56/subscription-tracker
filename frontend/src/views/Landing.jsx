"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import RadialFillButton from "../components/RadialFillButton";
import BrandLogo from "../components/BrandLogo";
import {
  LuShieldCheck,
  LuBellRing,
  LuRefreshCw,
  LuChartPie,
  LuScissors,
  LuTrendingDown,
} from "react-icons/lu";

function Reveal({ children, delay = 0, className = "" }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.05, rootMargin: "0px" },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        transitionDelay: `${delay}s`,
        transitionDuration: "0.8s",
        transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
      }}
      className={`transition-all ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      } ${className}`}
    >
      {children}
    </div>
  );
}

const HERO_SUBS = [
  {
    name: "Netflix",
    cat: "Streaming",
    price: "₹649",
    due: "in 2 days",
    tone: "rust",
  },
  {
    name: "ChatGPT Plus",
    cat: "AI",
    price: "$20.00",
    due: "in 6 days",
    tone: "amber",
  },
  {
    name: "Figma",
    cat: "Software",
    price: "€15.00",
    due: "Trial ends in 3 days",
    tone: "rust",
  },
  {
    name: "Spotify",
    cat: "Streaming",
    price: "₹119",
    due: "in 12 days",
    tone: "ledger",
  },
];

const BAR_HEIGHTS = [40, 55, 48, 70, 62, 80, 66, 74, 58, 90, 72, 64];

function Hero() {
  const [barsLoaded, setBarsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setBarsLoaded(true), 250);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative min-h-[100svh] lg:h-[100svh] w-full overflow-hidden flex flex-col justify-start md:justify-center">
      {/* Background video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover pointer-events-none"
        style={{ zIndex: 0 }}
      >
        <source src="/Images/hero-bg.mp4" type="video/mp4" />
      </video>

      <div
        className="relative z-10 w-full flex-1 flex flex-col justify-start md:justify-center items-center pt-24 sm:pt-28 md:pt-24 pb-8 sm:pb-10 px-4 sm:px-6 lg:px-10"
      >
        <div className="mx-auto max-w-[1440px] w-full flex flex-col justify-center">
          {/* Hero text */}
          <div className="relative mx-auto max-w-3xl text-center">
            <Reveal>
              <h1 className="font-display font-normal text-3xl sm:text-5xl lg:text-[54px] xl:text-6xl leading-[1.05] sm:leading-[1.02] tracking-tight text-ink">
                <span className="mr-2 inline-block">Track</span>
                <span className="mr-2 inline-block">subscriptions</span>
                <br />
                <span className="inline-block font-medium text-ledger">
                  for free online.
                </span>
              </h1>
            </Reveal>

            <Reveal delay={0.2}>
              <p className="mx-auto mt-2.5 sm:mt-4 max-w-xl font-secondary text-xs sm:text-base leading-relaxed text-ink/85">
                Take complete control of recurring expenses, get alerted before
                free trials expire, normalize multi-currency spending, and
                cancel unwanted bills with 1-click guides.
              </p>
            </Reveal>

            <Reveal
              delay={0.3}
              className="mt-4 sm:mt-6 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3"
            >
              <RadialFillButton
                href="/subscriptions"
                fillClassName="bg-ledger-dark"
                className="rounded-2xl squircle bg-ledger px-6 py-2.5 sm:py-3 text-sm font-medium text-paper shadow-lg shadow-ledger/20 active:scale-[0.97]"
              >
                Track subscriptions free
              </RadialFillButton>
              <RadialFillButton
                href="#how"
                fillClassName="bg-ledger-light"
                className="rounded-2xl squircle border border-line bg-card px-6 py-2.5 sm:py-3 text-sm font-medium text-ink transition-colors duration-300 hover:border-ledger/40 hover:text-ledger-dark active:scale-[0.97]"
              >
                See how it works
              </RadialFillButton>
            </Reveal>

            <Reveal delay={0.4}>
              <p className="mt-2.5 sm:mt-3.5 flex flex-wrap justify-center gap-x-4 sm:gap-x-5 gap-y-1 text-xs text-ink/75">
                <span>No credit card required</span>
                <span>·</span>
                <span>Zero bank account access</span>
                <span>·</span>
                <span>Instant guest access</span>
              </p>
            </Reveal>
          </div>

          {/* Floating Mockup Card - scaled to fit viewport gracefully */}
          <Reveal delay={0.3} className="relative mx-auto mt-4 sm:mt-6 lg:mt-7 max-w-3xl w-full">
            <div className="rounded-3xl squircle border border-white/15 bg-white/10 backdrop-blur-md p-2 sm:p-2.5 shadow-2xl shadow-black/30">
              <div className="grid gap-2.5 rounded-2xl squircle bg-paper/95 p-3.5 sm:p-4 md:grid-cols-[1fr_1.35fr] md:p-4.5">
                {/* Left Ledger Card */}
                <div className="rounded-2xl squircle bg-ledger p-3.5 sm:p-4 text-paper flex flex-col justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-paper/60">
                      Monthly spend · INR
                    </p>
                    <p className="mt-1.5 font-display font-medium tracking-tight text-2xl sm:text-3xl">
                      ₹4,862
                    </p>
                    <p className="mt-0.5 text-xs text-paper/70">
                      12-month forecast ₹58,344
                    </p>
                  </div>

                  {/* 12-month forecast bars */}
                  <div className="mt-3 sm:mt-4 flex h-12 sm:h-14 md:h-16 items-end gap-1">
                    {BAR_HEIGHTS.map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t bg-paper/25 transition-all duration-700"
                        style={{
                          height: barsLoaded ? `${h}%` : "6%",
                          transitionDelay: `${i * 40}ms`,
                        }}
                        title={`Month ${i + 1}`}
                      />
                    ))}
                  </div>

                  <div className="mt-2.5 sm:mt-3 flex items-center justify-between rounded-xl squircle bg-paper/10 px-3 py-1.5 sm:py-2 text-xs">
                    <span className="text-paper/70">Saved this year</span>
                    <span className="font-medium text-amber-light">₹7,420</span>
                  </div>
                </div>

                {/* Right Upcoming Renewals */}
                <div className="space-y-1 sm:space-y-1.5">
                  <p className="px-1 pb-0.5 text-xs uppercase tracking-[0.14em] text-ink/70">
                    Upcoming renewals
                  </p>
                  {HERO_SUBS.map((s, idx) => (
                    <div
                      key={s.name}
                      className={`flex items-center justify-between rounded-xl squircle border border-line bg-card px-3 py-1.5 sm:py-2 hover:border-ledger/20 transition-colors ${
                        idx === 3 ? "hidden sm:flex" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <BrandLogo name={s.name} category={s.cat.toLowerCase()} size="md" bare />
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-ink">
                            {s.name}
                          </p>
                          <p className="text-[11px] sm:text-xs text-ink/70">{s.cat}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs sm:text-sm font-medium text-ink">
                          {s.price}
                        </p>
                        <p
                          className={`text-[11px] sm:text-xs ${
                            s.tone === "rust"
                              ? "text-rust"
                              : s.tone === "amber"
                                ? "text-amber"
                                : "text-ledger"
                          }`}
                        >
                          {s.due}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

const BRANDS = [
  "Netflix",
  "ChatGPT",
  "Spotify",
  "GitHub",
  "Disney+",
  "Figma",
  "Notion",
  "Apple",
  "Adobe",
  "Slack",
  "YouTube",
  "Discord",
];

function Logos() {
  return (
    <section className="border-y border-line py-10">
      <div className="mx-auto max-w-[1440px] w-full px-6 sm:px-10 lg:px-14">
        <p className="text-center text-xs uppercase tracking-[0.18em] text-ink/75">
          Works with all your favorite tools, media & platforms
        </p>
        <div className="relative mt-6 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_15%,black_85%,transparent)]">
          <div className="marquee flex w-max gap-14 py-1">
            {[...BRANDS, ...BRANDS].map((b, i) => (
              <span
                key={i}
                className="font-display font-medium tracking-tight text-3xl text-ink/40 select-none"
              >
                {b}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const PILLARS = [
  {
    t: "100% free to use",
    d: "No credit cards, subscription fees, or hidden trial paywalls.",
  },
  {
    t: "Zero bank linking",
    d: "Complete financial privacy without Plaid, Yodlee, or account scraping.",
  },
  {
    t: "Auto-renewal intelligence",
    d: "Calculates billing cycles, records payment history, prevents surprises.",
  },
];

function About() {
  return (
    <section className="py-24 sm:py-28">
      <div className="mx-auto max-w-[1440px] w-full px-6 sm:px-10 lg:px-14">
        <div className="grid gap-16 md:grid-cols-2">
          <Reveal>
            <h2 className="font-display font-normal tracking-tight text-5xl leading-[1.05] text-ink md:text-6xl">
              The{" "}
              <em className="text-ledger not-italic font-medium">
                intentional
              </em>{" "}
              subscription tracker.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="font-secondary text-lg leading-relaxed text-ink/85">
              Built for individuals and teams seeking clarity over recurring
              overhead. Unlike complex budgeting software that demands bank
              credentials, Subspens lets you track subscriptions, set renewal
              reminders, catch free-trial deadlines and normalize multi-currency
              bills into your home currency - completely free.
            </p>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-px overflow-hidden rounded-3xl squircle border border-line bg-line md:grid-cols-3">
          {PILLARS.map((p, i) => (
            <Reveal key={p.t} delay={i * 0.1} className="bg-card p-8">
              <span className="font-display font-medium tracking-tight text-4xl text-amber">
                0{i + 1}
              </span>
              <h3 className="mt-6 text-lg font-medium text-ink">{p.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/80">{p.d}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  {
    t: "Add subscriptions or scan invoices",
    d: "Log Netflix, Spotify, ChatGPT or AWS manually - or upload PDF receipts for instant parsing with built-in Google Gemini AI.",
  },
  {
    t: "Set renewal alerts & trial cutoffs",
    d: "Configure notification windows (default 2 days before) and trial cutoff dates. The Free-Trial Sentinel counts down so you cancel in time.",
  },
  {
    t: "Audit spend & stop leaks",
    d: "Review 12-month projected spend, inspect category charts, and cancel unused subscriptions with 1-click guides while tracking savings.",
  },
];

function Steps() {
  return (
    <section id="how" className="bg-ledger py-24 sm:py-28 text-paper">
      <div className="mx-auto max-w-[1440px] w-full px-6 sm:px-10 lg:px-14">
        <Reveal className="max-w-2xl">
          <span className="text-xs uppercase tracking-[0.18em] text-amber-light font-semibold">
            Simple 3-step setup
          </span>
          <h2 className="mt-5 font-display font-normal tracking-tight text-5xl leading-[1.05] md:text-6xl">
            Set up in under{" "}
            <em className="text-amber-light not-italic font-medium">
              60 seconds.
            </em>
          </h2>
          <p className="mt-5 text-paper/70 text-base">
            No complex bank configurations. Just clarity.
          </p>
        </Reveal>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.t} delay={i * 0.12}>
              <div className="h-full rounded-3xl squircle border border-paper/15 bg-ledger-dark p-8 transition-transform duration-300 hover:-translate-y-1.5">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-amber-light font-display font-medium tracking-tight text-xl text-ledger-dark">
                  {i + 1}
                </span>
                <h3 className="mt-8 text-xl font-medium text-paper">{s.t}</h3>
                <p className="mt-3 text-sm leading-relaxed text-paper/65">
                  {s.d}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const FEATURES = [
  {
    icon: LuShieldCheck,
    t: "Free-Trial Expiry Sentinel",
    d: "Set exact cancellation deadlines and countdown alerts, then cancel with direct links before your card is billed.",
  },
  {
    icon: LuBellRing,
    t: "Smart renewal reminders",
    d: "Proactive alerts before bills hit. Billing cycles roll over cleanly and log full payment histories.",
  },
  {
    icon: LuRefreshCw,
    t: "Real-time currency normalization",
    d: "INR, USD, EUR, CAD, AED, JPY, SGD or AUD - unified with live European Central Bank rates.",
  },
  {
    icon: LuChartPie,
    t: "Category breakdown & forecast",
    d: "Donut charts and 12-month projections across AI, Cloud, Streaming, Software and Apps.",
  },
  {
    icon: LuScissors,
    t: "1-click cancellation guides",
    d: "Skip obscure account settings. Direct links and step-by-step instructions for any provider.",
  },
  {
    icon: LuTrendingDown,
    t: "Waste & savings meter",
    d: "Track monthly and annual money saved from cancellations as your leaks close in real time.",
  },
];

function Features() {
  return (
    <section id="features" className="py-24 sm:py-28">
      <div className="mx-auto max-w-[1440px] w-full px-6 sm:px-10 lg:px-14">
        <Reveal className="text-center">
          <h2 className="mx-auto max-w-3xl font-display font-normal tracking-tight text-5xl leading-[1.05] text-ink md:text-6xl">
            Engineered for complete{" "}
            <em className="text-ledger not-italic font-medium">
              subscription clarity.
            </em>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-ink/80">
            Everything you need to audit, organize, and stop unintended
            recurring leakage.
          </p>
        </Reveal>

        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <Reveal key={f.t} delay={(i % 3) * 0.08}>
                <div className="group h-full rounded-3xl squircle border border-line bg-card p-8 transition-all duration-300 hover:shadow-xl hover:shadow-ink/5 hover:-translate-y-1">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl squircle bg-ledger-light text-ledger transition-transform duration-300 group-hover:rotate-6 group-hover:scale-105">
                    <Icon className="h-6 w-6 text-ledger" />
                  </span>
                  <h3 className="mt-6 text-lg font-medium text-ink">{f.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink/80">
                    {f.d}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const ROWS = [
  ["Cost", "100% free forever", "$4.99–$9.99/month", "Free (manual)"],
  [
    "Bank login / Plaid required",
    "No - 100% private",
    "Yes (security risk)",
    "No",
  ],
  [
    "Free-Trial Expiry Sentinel",
    "Included with cutoff alerts",
    "Rare / paid",
    "None",
  ],
  [
    "Live multi-currency",
    "8 currencies, live ECB rates",
    "Single currency",
    "Manual formulas",
  ],
  ["1-click cancellation guides", "Direct links & guides", "None", "None"],
  [
    "Automatic cycle rollovers",
    "Calculated live",
    "Bank sync required",
    "Manual updates",
  ],
  [
    "AI receipt & invoice parser",
    "Google Gemini powered",
    "Paid tier only",
    "None",
  ],
];

function Compare() {
  return (
    <section id="compare" className="pb-24 sm:pb-28">
      <div className="mx-auto max-w-[1440px] w-full px-6 sm:px-10 lg:px-14">
        <Reveal className="text-center">
          <h2 className="font-display font-normal tracking-tight text-5xl leading-[1.05] text-ink md:text-6xl">
            Why Subspens is{" "}
            <em className="text-ledger not-italic font-medium">#1.</em>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-ink/80">
            How we compare to expensive budgeting apps and tedious spreadsheets.
          </p>
        </Reveal>

        <Reveal
          delay={0.1}
          className="mt-14 overflow-x-auto rounded-3xl squircle border border-line bg-card shadow-2xs"
        >
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-ink/75">
                <th className="p-5 font-medium">Feature</th>
                <th className="bg-ledger-light p-5 font-medium text-ledger">
                  Subspens
                </th>
                <th className="p-5 font-medium">Paid budgeting apps</th>
                <th className="p-5 font-medium">Excel / Sheets</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr
                  key={r[0]}
                  className="border-b border-line last:border-0 hover:bg-paper/30 transition-colors"
                >
                  <td className="p-5 font-medium text-ink">{r[0]}</td>
                  <td className="bg-ledger-light/60 p-5 font-medium text-ledger">
                    <span className="mr-2 font-bold">✓</span>
                    {r[1]}
                  </td>
                  <td className="p-5 text-ink/75">{r[2]}</td>
                  <td className="p-5 text-ink/75">{r[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>
      </div>
    </section>
  );
}

const FAQS = [
  [
    "What is Subspens and why is it the best subscription tracker online?",
    "Subspens is a privacy-first, free subscription tracker. It combines renewal reminders, free-trial deadlines, multi-currency normalization and cancellation guides - without ever asking for bank access.",
  ],
  [
    "How do I track subscriptions for free online with Subspens?",
    "Add your services manually or upload a PDF receipt, set your alert windows, and Subspens handles billing cycles and spend forecasts for you.",
  ],
  [
    "Do I need to connect my bank account or enter credit card details?",
    "No. Subspens never requires bank linking, Plaid, or card details. Your financial data stays private.",
  ],
  [
    "How does the Free-Trial Expiry Sentinel prevent surprise charges?",
    "You set the trial cutoff date and Subspens counts down with alerts, giving you a direct cancel link before the trial converts to paid.",
  ],
  [
    "Can I track subscriptions in multiple global currencies?",
    "Yes - INR, USD, EUR, CAD, AED, JPY, SGD and AUD, converted to your home currency using live European Central Bank rates.",
  ],
  [
    "How does Subspens compare to an Excel or Google Sheets tracker?",
    "Spreadsheets need manual formulas and updates. Subspens rolls cycles over automatically, converts currencies live and alerts you before renewals.",
  ],
  [
    "Is Subspens really 100% free to use?",
    "Yes. No subscription fees, no credit card, no hidden paywalls.",
  ],
];

function FAQ() {
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" className="border-t border-line py-24 sm:py-28">
      <div className="mx-auto max-w-[1440px] w-full px-6 sm:px-10 lg:px-14">
        <div className="grid gap-14 md:grid-cols-[1fr_1.5fr]">
          <Reveal>
            <h2 className="font-display font-normal tracking-tight text-5xl leading-[1.05] text-ink">
              Common{" "}
              <em className="text-ledger not-italic font-medium">
                questions.
              </em>
            </h2>
            <p className="mt-5 text-ink/80">
              Everything about our free tracker and privacy standards.
            </p>
          </Reveal>

          <div className="divide-y divide-line border-y border-line">
            {FAQS.map(([q, a], i) => {
              const isOpen = open === i;
              return (
                <div key={q}>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-6 py-6 text-left text-base font-medium text-ink hover:text-ledger transition-colors cursor-pointer"
                    aria-expanded={isOpen}
                  >
                    <span>{q}</span>
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line text-lg text-ledger transition-transform duration-300 ${
                        isOpen ? "rotate-45" : ""
                      }`}
                    >
                      +
                    </span>
                  </button>
                  <div
                    className={`grid transition-all duration-300 ease-in-out overflow-hidden ${
                      isOpen
                        ? "grid-rows-[1fr] opacity-100 pb-6"
                        : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden pr-12 text-sm leading-relaxed text-ink/80">
                      {a}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  const { user, openRegister } = useAuth();

  return (
    <section className="pb-20 sm:pb-24">
      <div className="mx-auto max-w-[1440px] w-full px-6 sm:px-10 lg:px-14">
        <Reveal className="relative mx-auto w-full overflow-hidden rounded-[2.5rem] squircle bg-ledger-dark px-8 py-20 sm:py-24 text-center text-paper shadow-2xl">
          {/* Glowing floating decorative blobs */}
          <div
            aria-hidden
            className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-amber/25 blur-3xl animate-float-slow"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-ledger/80 blur-3xl animate-pulse-slow"
          />

          <div className="relative z-10">
            <h2 className="mx-auto max-w-3xl font-display font-normal tracking-tight text-5xl leading-[1.05] md:text-7xl">
              Ready to close your{" "}
              <em className="text-amber-light not-italic font-medium">
                financial leaks?
              </em>
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-paper/70 text-base leading-relaxed">
              Stop surprise renewals and audit every trial. Set up in less than
              60 seconds - no credit card required.
            </p>

            <div className="mt-10 flex justify-center">
              {user ? (
                <RadialFillButton
                  href="/subscriptions"
                  fillClassName="bg-ledger-light"
                  className="rounded-2xl squircle bg-paper px-7 py-4 text-sm font-medium text-ledger-dark shadow-md active:scale-[0.98]"
                >
                  Track subscriptions free
                </RadialFillButton>
              ) : (
                <RadialFillButton
                  onClick={openRegister}
                  fillClassName="bg-ledger-light"
                  className="rounded-2xl squircle bg-paper px-7 py-4 text-sm font-medium text-ledger-dark shadow-md cursor-pointer active:scale-[0.98]"
                >
                  Track subscriptions free
                </RadialFillButton>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-line py-12 sm:py-14">
      <div className="mx-auto max-w-[1440px] w-full px-6 sm:px-10 lg:px-14">
        <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr]">
          <div>
            <Link
              href="/"
              className="flex items-center gap-2 w-fit transition-opacity hover:opacity-80"
            >
              <img
                src="/logo/logo.svg"
                alt="Subspens"
                className="h-8 w-auto object-contain shrink-0"
                style={{ display: "block" }}
              />
              <img
                src="/logo/logo-t.svg"
                alt="Subspens"
                className="h-8 w-auto object-contain shrink-0"
                style={{ display: "block" }}
              />
            </Link>
            <p className="mt-3 max-w-sm text-sm text-ink/80 leading-relaxed">
              The high-clarity subscription tracker to monitor recurring
              services, catch trial expirations, and eliminate wasted spend.
            </p>
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-xs uppercase tracking-[0.14em] text-ink/70 font-semibold">
              Product
            </p>
            <Link
              href="/subscriptions"
              className="block text-ink/85 hover:text-ink transition-colors"
            >
              Subscriptions
            </Link>
            <Link
              href="/dashboard"
              className="block text-ink/85 hover:text-ink transition-colors"
            >
              Overview
            </Link>
            <Link
              href="/subscriptions"
              className="block text-ink/85 hover:text-ink transition-colors"
            >
              Track for free
            </Link>
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-xs uppercase tracking-[0.14em] text-ink/70 font-semibold">
              Legal & trust
            </p>
            <Link
              href="/privacy-policy"
              className="block text-ink/85 hover:text-ink transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms-of-service"
              className="block text-ink/85 hover:text-ink transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
        <div className="mt-12 flex flex-wrap justify-between gap-2 border-t border-line pt-6 text-xs text-ink/75">
          <span>
            © {new Date().getFullYear()} Subspens. All rights reserved.
          </span>
          <span>Privacy-first, zero bank linking.</span>
        </div>
      </div>
    </footer>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-paper text-ink selection:bg-ledger selection:text-white w-full overflow-x-clip">
      <main>
        <Hero />
        <Logos />
        <About />
        <Steps />
        <Features />
        <Compare />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
