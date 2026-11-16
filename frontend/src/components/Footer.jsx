import Link from 'next/link';

const PRODUCT_LINKS = [
  { label: 'Subscriptions', href: '/subscriptions' },
  { label: 'Overview', href: '/dashboard' },
  { label: 'Track for Free', href: '/subscriptions' },
];

const LEGAL_LINKS = [
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Terms of Service', href: '/terms-of-service' },
];

export default function Footer() {
  return (
    <footer className="w-full bg-ledger-dark border-t border-white/10 overflow-hidden">
      {/* Main footer body */}
      <div className="mx-auto max-w-[1440px] w-full px-6 sm:px-10 lg:px-14 pt-12 sm:pt-14 pb-8 sm:pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8">

          {/* Brand column */}
          <div className="lg:col-span-5 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2 sm:gap-2.5 transition-opacity hover:opacity-90">
              {/* Invert logos so they show white on the dark green bg */}
              <img
                src="/logo/logo.svg"
                alt="Subspens - Free Online Subscription Tracker"
                className="h-7 w-auto object-contain brightness-0 invert opacity-90"
              />
              <img
                src="/logo/logo-t.svg"
                alt="Subspens"
                className="h-7 w-auto object-contain brightness-0 invert opacity-90"
              />
            </Link>
            <p className="text-sm text-white/60 leading-relaxed max-w-sm">
              <strong>Subspens</strong> — Track subscriptions for free online. The high-clarity subscription tracker to monitor recurring services, catch trial expirations, and eliminate wasted spend.
            </p>
          </div>

          {/* Nav columns */}
          <div className="lg:col-span-7 grid grid-cols-2 gap-8">
            {/* Product column */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white/90 mb-5">
                Product
              </h4>
              <ul className="space-y-3">
                {PRODUCT_LINKS.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm text-white/55 hover:text-white transition-colors duration-150"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal column */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white/90 mb-5">
                Legal & Trust
              </h4>
              <ul className="space-y-3">
                {LEGAL_LINKS.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm text-white/55 hover:text-white transition-colors duration-150"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-[1440px] w-full px-6 sm:px-10 lg:px-14 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-left">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} Subspens. All rights reserved.
          </p>
          <p className="text-xs text-white/40">
            Track subscriptions for free online. Privacy-first, zero bank linking.
          </p>
        </div>
      </div>
    </footer>
  );
}
