import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service | Subspens — Free Online Subscription Tracker',
  description: 'Terms and conditions for using Subspens to track subscriptions online.',
};

export default function TermsOfServicePage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12 sm:py-16 text-ink space-y-8">
      <div className="space-y-3">
        <Link href="/" className="text-xs font-semibold text-ledger hover:underline flex items-center gap-1">
          ← Back to Subspens Home
        </Link>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
          Terms of Service
        </h1>
        <p className="text-xs text-ink/50">
          Last updated: November 16, 2026
        </p>
      </div>

      <div className="prose prose-stone max-w-none space-y-6 text-sm sm:text-base text-ink/80 leading-relaxed">
        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-ink">1. Acceptance of Terms</h2>
          <p>
            By accessing or using <strong>Subspens</strong> (accessible online at our website), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-ink">2. Description of Service</h2>
          <p>
            Subspens provides users with an online software application for tracking subscriptions, organizing recurring expenses, receiving renewal notifications, tracking free-trial deadlines, and viewing spending forecasts.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-ink">3. User Responsibilities</h2>
          <p>
            Users are responsible for maintaining the confidentiality of their account credentials and ensuring the accuracy of subscription details entered into the platform.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-ink">4. Third-Party Services & Cancellation Guides</h2>
          <p>
            Subspens provides guides and direct links to assist users in cancelling third-party subscription services. Subspens does not directly process subscription cancellations on behalf of third-party vendors and is not responsible for policy changes by third-party providers.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-ink">5. Disclaimer & Limitation of Liability</h2>
          <p>
            Subspens is provided on an "as is" and "as available" basis without warranties of any kind. Subspens does not provide formal tax, investment, or legal financial advice.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-ink">6. Contact</h2>
          <p>
            For any inquiries regarding these Terms, please contact <code className="text-xs bg-paper/60 px-1.5 py-0.5 rounded border border-line">support@subspens.com</code>.
          </p>
        </section>
      </div>
    </main>
  );
}
