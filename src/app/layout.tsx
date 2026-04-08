import type { Metadata, Viewport } from "next";
import NextTopLoader from 'nextjs-toploader';
import "./globals.css";

import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { JsonLd } from "@/components/seo/JsonLd";
import { Lexend, Source_Sans_3 } from "next/font/google";
import { Toaster } from "sonner";
import { SystemAnnouncementBanner } from "@/components/layout/SystemAnnouncementBanner";

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
  weight: ["300", "400", "500", "600"]
});
const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend",
  display: 'swap',
  preload: true,
  weight: ["400", "500", "600", "700", "800", "900"]
});

export const metadata: Metadata = {
  title: {
    default: "TheNextTrade - Professional Forex Trading Tools & Academy",
    template: "%s | TheNextTrade"
  },
  description: "Master the markets with TheNextTrade. Advanced Position Size Calculator, Trading Journal, and premium Forex Academy materials.",
  keywords: ["Forex", "Trading Journal", "Position Calculator", "Trading Education", "CRM", "Risk Management"],
  authors: [{ name: "TheNextTrade Team" }],
  creator: "TheNextTrade Team",
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://thenexttrade.com",
    title: "TheNextTrade - Professional Forex Trading Tools",
    description: "Master the markets with advanced tools and education.",
    siteName: "TheNextTrade",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "TheNextTrade Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TheNextTrade",
    description: "Professional Forex Trading Tools & Academy",
    creator: "@thenexttrade",
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TheNextTrade",
  },
  alternates: {
    types: {
      'application/rss+xml': '/feed.xml',
    },
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <script dangerouslySetInnerHTML={{ __html: `history.scrollRestoration = "manual"` }} />
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js');
            });
          }
        `}} />
      </head>
      <body className={`${sourceSans.variable} ${lexend.variable} font-sans bg-white dark:bg-[#0F1117]`}>
        <NextTopLoader
          color="hsl(var(--primary))"
          height={3}
          showSpinner={false}
          shadow="0 0 10px hsl(var(--primary)),0 0 5px hsl(var(--primary))"
        />
        <ThemeProvider>
          <JsonLd
            type="WebSite"
            data={{
              name: "TheNextTrade",
              url: process.env.NEXT_PUBLIC_APP_URL || "https://thenexttrade.com",
              potentialAction: {
                "@type": "SearchAction",
                "target": `${process.env.NEXT_PUBLIC_APP_URL || "https://thenexttrade.com"}/search?q={search_term_string}`,
                "query-input": "required name=search_term_string"
              }
            }}
          />
          <JsonLd
            type="Organization"
            data={{
              name: "TheNextTrade",
              url: process.env.NEXT_PUBLIC_APP_URL || "https://thenexttrade.com",
              logo: `${process.env.NEXT_PUBLIC_APP_URL || "https://thenexttrade.com"}/logo.png`,
              description: "Professional Forex Trading Tools & Academy. Master the markets with structured education, trading tools, and market analysis.",
              foundingDate: "2024",
              sameAs: [
                "https://twitter.com/thenexttrade"
              ],
              contactPoint: {
                "@type": "ContactPoint",
                "contactType": "customer support",
                "url": `${process.env.NEXT_PUBLIC_APP_URL || "https://thenexttrade.com"}/contact`
              }
            }}
          />
          <SystemAnnouncementBanner />
          {/* Spacer for fixed announcement banner — reads CSS var set by banner */}
          <div style={{ height: 'var(--banner-h, 0px)', transition: 'height 0.3s ease' }} />
          {children}
          <Toaster richColors position="top-right" closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
// Force rebuild


