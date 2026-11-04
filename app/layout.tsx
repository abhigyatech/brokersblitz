import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "../components/ThemeProvider";
import { LanguageProvider } from "../components/LanguageProvider";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#DF6400",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.brokersblitz.in"),
  title: {
    default: "BrokersBlitz | Turn Listings Into Closings",
    template: "%s | BrokersBlitz",
  },
  description:
    "The AI-powered real estate platform for brokers to showcase properties, match buyers directly, and connect on WhatsApp across India. Self-reported RERA registrations.",
  keywords: [
    "BrokersBlitz",
    "real estate platform India",
    "property listing portal",
    "RERA registered properties",
    "buy flat Mumbai",
    "villas in Bangalore",
    "commercial office space Gurugram",
    "broker network India",
    "plots in Pune",
    "independent house Delhi NCR",
  ],
  authors: [{ name: "BrokersBlitz Team", url: "https://www.brokersblitz.in" }],
  creator: "BrokersBlitz",
  publisher: "BrokersBlitz",
  applicationName: "BrokersBlitz",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/logo.svg",
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://www.brokersblitz.in",
    siteName: "BrokersBlitz",
    title: "BrokersBlitz | Turn Listings Into Closings",
    description:
      "India's premier real estate listing and matchmaking platform. Direct broker listings, declared RERA registrations, predictive buyer matching, automated WhatsApp alerts, and zero spam privacy protection.",
    images: [
      {
        url: "/logo.svg",
        width: 1200,
        height: 630,
        alt: "BrokersBlitz - Real Estate Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BrokersBlitz | Turn Listings Into Closings",
    description:
      "Intelligent property matchmaking platform for real estate brokers and buyers across India.",
    images: ["/logo.svg"],
    creator: "@BrokersBlitz",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://www.brokersblitz.in",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://www.brokersblitz.in/#organization",
        name: "BrokersBlitz",
        url: "https://www.brokersblitz.in",
        logo: {
          "@type": "ImageObject",
          url: "https://www.brokersblitz.in/logo.svg",
          caption: "BrokersBlitz Logo",
        },
        sameAs: [
          "https://twitter.com/BrokersBlitz",
          "https://www.linkedin.com/company/brokersblitz",
        ],
        contactPoint: {
          "@type": "ContactPoint",
          telephone: "+91-98000-00001",
          contactType: "Customer Support",
          areaServed: "IN",
          availableLanguage: ["English", "Hindi"],
        },
      },
      {
        "@type": "WebSite",
        "@id": "https://www.brokersblitz.in/#website",
        url: "https://www.brokersblitz.in",
        name: "BrokersBlitz",
        description:
          "AI-powered property listing and matchmaking platform for real estate brokers and buyers across India.",
        publisher: {
          "@id": "https://www.brokersblitz.in/#organization",
        },
        potentialAction: {
          "@type": "SearchAction",
          target: "https://www.brokersblitz.in/properties?q={search_term_string}",
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen flex flex-col font-sans relative antialiased bg-grid-pattern selection:bg-brandOrange selection:text-white">
        <ThemeProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </ThemeProvider>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}