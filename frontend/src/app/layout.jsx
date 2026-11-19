import "../index.css";
import Providers from "./providers";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://subspens.com";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#064e3b",
};

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:
      "Track Subscriptions for Free Online | Subspens - Subscription Tracker",
    template: "%s | Subspens",
  },
  description:
    "Track subscriptions for free online with Subspens. The fast, privacy-first online subscription tracker to monitor recurring expenses, catch free trial deadlines, get renewal reminders, and save money.",
  keywords: [
    "Subscription Tracker online",
    "subscription tracker",
    "track subscriptions",
    "track subscriptions for free online",
    "free subscription tracker",
    "best subscription tracker online",
    "track recurring expenses",
    "manage subscriptions online",
    "subspens",
    "subspens tracker",
    "free trial tracker",
    "cancel subscriptions",
    "subscription management software",
    "recurring bill tracker",
  ],
  authors: [{ name: "Subspens" }],
  creator: "Subspens",
  publisher: "Subspens",
  applicationName: "Subspens",
  category: "Finance",
  classification: "Subscription Tracker and Personal Finance Management Tool",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Subspens",
    title:
      "Track Subscriptions for Free Online | Subspens - Subscription Tracker",
    description:
      "Track subscriptions for free online with Subspens. Monitor recurring bills, avoid surprise free-trial renewals, and take complete control of your subscription expenses with zero banking logins required.",
    images: [
      {
        url: "/Images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Subspens - Free Online Subscription Tracker Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Track Subscriptions for Free Online | Subspens - Subscription Tracker",
    description:
      "Track subscriptions for free online with Subspens. Monitor recurring bills, stop trial auto-conversions & save money.",
    images: ["/Images/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Google Tag (gtag.js) */}
        <script
          async
          src="https://www.googletagmanager.com/gtm.js?id=GTM-KDGBV5WX"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());`,
          }}
        />
      </head>
      <body className="bg-paper text-ink font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
