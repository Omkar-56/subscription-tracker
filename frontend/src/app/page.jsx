import Landing from "../views/Landing";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://subspens.com";

export const metadata = {
  title:
    "Track Subscriptions for Free Online | Subspens - Best Subscription Tracker",
  description:
    "Track subscriptions for free online with Subspens. The best free online subscription tracker to monitor recurring expenses, prevent surprise trial charges, and save money.",
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title:
      "Track Subscriptions for Free Online | Subspens - Best Subscription Tracker",
    description:
      "Track subscriptions for free online with Subspens. The 100% free online subscription tracker to manage recurring expenses, monitor free trials, get renewal reminders, and save money.",
    url: SITE_URL,
    siteName: "Subspens",
    images: [
      {
        url: "/Images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Subspens - Track Subscriptions for Free Online",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Track Subscriptions for Free Online | Subspens - Best Subscription Tracker",
    description:
      "Track subscriptions for free online with Subspens. The 100% free online subscription tracker to manage recurring expenses, monitor free trials, get renewal reminders, and save money.",
    images: ["/Images/og-image.png"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Subspens",
      alternateName: ["Subspens Subscription Tracker", "Subspens Online"],
      description:
        "Track subscriptions for free online with Subspens. Manage recurring bills and avoid unwanted charges.",
      inLanguage: "en-US",
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#software`,
      name: "Subspens",
      alternateName: ["Subspens Subscription Tracker Online"],
      applicationCategory: "FinanceApplication",
      operatingSystem:
        "All web browsers (Chrome, Safari, Firefox, Edge), Desktop, Mobile",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        description:
          "100% Free Online Subscription Tracker with no credit card required",
      },
      featureList: [
        "Track subscriptions for free online",
        "Free-trial expiry sentinel countdown and alerts",
        "Smart automatic renewal date rollover and reminder alerts",
        "Real-time multi-currency conversion across 8 global currencies",
        "Interactive 12-month recurring spend forecasting and category charts",
        "1-click direct provider cancellation guides and instructions",
        "AI receipt & invoice parser with Google Gemini",
      ],
      description:
        "Subspens is the ultimate free online subscription tracker. Track subscriptions, free trials, renewal dates, and cancel unwanted bills without linking bank accounts.",
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/#faq`,
      mainEntity: [
        {
          "@type": "Question",
          name: "How do I track subscriptions for free online?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "You can track subscriptions for free online using Subspens. Simply visit Subspens, add your recurring services (such as Netflix, Spotify, ChatGPT, or gym memberships) along with their billing cycle and renewal date. Subspens calculates your total monthly commitment, alerts you before payment dates, and tracks your savings automatically.",
          },
        },
        {
          "@type": "Question",
          name: "Is Subspens really a 100% free subscription tracker online?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes! Subspens is 100% free to use. There are no paywalls, hidden tiers, or credit card requirements to track subscriptions and set up renewal reminders online.",
          },
        },
        {
          "@type": "Question",
          name: "Do I have to link my bank account or credit card to use Subspens?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. Subspens is privacy-first. You never have to connect your bank account via Plaid or share card numbers. You can quickly add subscriptions manually, use guest mode, or scan invoices with the built-in AI parser.",
          },
        },
        {
          "@type": "Question",
          name: "How does the Free-Trial Expiry Sentinel prevent surprise renewal charges?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "When entering a free trial in Subspens, you set the exact cancellation deadline. Subspens displays active countdown indicators on your overview and sends you alert notifications before the cutoff, giving you direct 1-click links to cancel before your credit card is charged.",
          },
        },
        {
          "@type": "Question",
          name: "Can I track subscriptions in different global currencies?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Subspens supports real-time multi-currency normalization across INR, USD, EUR, CAD, AED, JPY, SGD, and AUD using live exchange rates, giving you a consolidated view of your true recurring spend.",
          },
        },
      ],
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="w-full">
        <Landing />
      </main>
    </>
  );
}
