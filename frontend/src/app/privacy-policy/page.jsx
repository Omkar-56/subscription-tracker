import Link from "next/link";

export const metadata = {
  title: "Privacy Policy",
  description:
    "Learn how Subspens protects your privacy. We never link your bank accounts or sell personal data.",
  robots: {
    index: false,
    follow: true,
    googleBot: {
      index: false,
      follow: true,
    },
  },
};

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12 sm:py-16 text-ink space-y-8">
      <div className="space-y-3">
        <Link
          href="/"
          className="text-xs font-semibold text-ledger hover:underline flex items-center gap-1"
        >
          ← Back to Subspens Home
        </Link>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-xs text-ink/50">Last updated: November 16, 2026</p>
      </div>

      <div className="prose prose-stone max-w-none space-y-6 text-sm sm:text-base text-ink/80 leading-relaxed">
        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-ink">
            1. Our Privacy First Commitment
          </h2>
          <p>
            At <strong>Subspens</strong>, we believe financial clarity should
            never come at the cost of personal privacy. Unlike traditional
            personal finance applications,{" "}
            <strong>Subspens never connects to your bank accounts</strong> (we
            do not use Plaid, Yodlee, or financial scraping tools) and we never
            require your credit card numbers to track subscriptions.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-ink">
            2. Information We Collect
          </h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Account Information:</strong> If you create an account, we
              store your email address and encrypted password hash (or Google
              OAuth profile identifier).
            </li>
            <li>
              <strong>Subscription Ledger Data:</strong> Information you choose
              to record, including service names, billing cycles, cost amounts,
              currency preferences, and renewal dates.
            </li>
            <li>
              <strong>Guest Mode:</strong> If you use Subspens without creating
              an account, your subscription data is stored locally on your
              device in your browser's localStorage and is never transmitted to
              our database.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-ink">
            3. How Your Information is Used
          </h2>
          <p>
            Your information is used strictly to provide you with subscription
            tracking, renewal date calculations, automated reminder
            notifications, and currency normalization calculations. We do not
            sell, rent, or monetize user data with third-party advertisers.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-ink">
            4. Security
          </h2>
          <p>
            We implement industry-standard encryption protocols (HTTPS/TLS) and
            secure database storage. Passwords are cryptographically hashed
            using bcrypt.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-ink">
            5. Contact
          </h2>
          <p>
            If you have questions about our privacy practices, please contact us
            at{" "}
            <code className="text-xs bg-paper/60 px-1.5 py-0.5 rounded border border-line">
              support@subspens.com
            </code>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
