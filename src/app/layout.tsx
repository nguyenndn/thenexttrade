import type { Metadata, Viewport } from "next";
import NextTopLoader from 'nextjs-toploader';
import "./globals.css";

import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { JsonLd } from "@/components/seo/JsonLd";
import { Inter, Outfit } from "next/font/google";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap',
  preload: true,
  adjustFontFallback: true
});
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: 'swap',
  preload: false
});

export const metadata: Metadata = {
  title: {
    default: "GSN CRM - Professional Forex Trading Tools & Academy",
    template: "%s | GSN CRM"
  },
  description: "Master the markets with GSN CRM. Advanced Position Size Calculator, Trading Journal, and premium Forex Academy materials.",
  keywords: ["Forex", "Trading Journal", "Position Calculator", "Trading Education", "CRM", "Risk Management"],
  authors: [{ name: "GSN Team" }],
  creator: "GSN Team",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://crm.gsn.com", // Placeholder
    title: "GSN CRM - Professional Forex Trading Tools",
    description: "Master the markets with advanced tools and education.",
    siteName: "GSN CRM",
    images: [
      {
        url: "/og-image.jpg", // We should create this asset later
        width: 1200,
        height: 630,
        alt: "GSN CRM Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GSN CRM",
    description: "Professional Forex Trading Tools & Academy",
    creator: "@gsncrm",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
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
      <body className={`${inter.variable} ${outfit.variable} font-sans`}>
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
              name: "GSN CRM",
              url: process.env.NEXT_PUBLIC_APP_URL || "https://crm.gsn.com",
              potentialAction: {
                "@type": "SearchAction",
                "target": `${process.env.NEXT_PUBLIC_APP_URL || "https://crm.gsn.com"}/search?q={search_term_string}`,
                "query-input": "required name=search_term_string"
              }
            }}
          />
          {children}
          <Toaster richColors position="top-right" closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
// Force rebuild


