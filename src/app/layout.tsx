import type { Metadata, Viewport } from "next";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";

import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { JsonLd } from "@/components/seo/JsonLd";
import { Lexend, Source_Sans_3 } from "next/font/google";
import { Toaster } from "sonner";
import dynamic from "next/dynamic";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { CookieConsentBanner } from "@/components/layout/CookieConsentBanner";
import { getBaseUrl, absoluteUrl } from "@/lib/url";
import { TELEGRAM_CHANNEL_URL } from "@/config/telegram";

const SystemAnnouncementBanner = dynamic(
    () =>
        import("@/components/layout/SystemAnnouncementBanner").then(
            (m) => m.SystemAnnouncementBanner
        )
);

const sourceSans = Source_Sans_3({
    subsets: ["latin"],
    variable: "--font-source-sans",
    display: "swap",
    preload: true,
    adjustFontFallback: true,
    weight: ["400", "500", "600", "700"],
});

const lexend = Lexend({
    subsets: ["latin"],
    variable: "--font-lexend",
    display: "swap",
    preload: true,
    adjustFontFallback: true,
    weight: ["600", "700"],
});

export const metadata: Metadata = {
    title: {
        default: "TheNextTrade — The Discipline OS for MT5 Traders",
        template: "%s | TheNextTrade",
    },
    description:
        "Sync Demo & Live MT5 trades via EA with zero password sharing. Spot revenge sizing, enforce hard stop-loss rules, and access 17 free risk calculators.",
    keywords: [
        "TheNextTrade",
        "MT5 Trading Journal",
        "MT5 Auto Sync",
        "Forex Position Size Calculator",
        "Forex Risk Management",
        "Trading Discipline",
    ],
    authors: [{ name: "TheNextTrade Team", url: "https://thenexttrade.app/about" }],
    creator: "TheNextTrade",
    publisher: "TheNextTrade",
    category: "finance",
    manifest: "/manifest.json",
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
    ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
        ? {
              verification: {
                  google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
              },
          }
        : {}),
    openGraph: {
        type: "website",
        locale: "en_US",
        url: "/",
        title: "TheNextTrade — The Discipline OS for MT5 Traders",
        description:
            "Sync Demo & Live MT5 trades via EA with zero password sharing. Spot revenge sizing, enforce hard stop-loss rules, and access 17 free risk calculators.",
        siteName: "TheNextTrade",
        images: [
            {
                url: "/og-image.jpg?v=2",
                width: 1200,
                height: 630,
                type: "image/jpeg",
                alt: "TheNextTrade — The Discipline OS for MT5 Traders",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "TheNextTrade — The Discipline OS for MT5 Traders",
        description:
            "Sync Demo & Live MT5 trades via EA with zero password sharing. Spot revenge sizing, enforce hard stop-loss rules, and access 17 free risk calculators.",
        images: ["/og-image.jpg?v=2"],
        creator: "@thenexttrade",
    },
    icons: {
        icon: [
            { url: "/favicon.ico", sizes: "any" },
            { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
            { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        ],
        shortcut: "/favicon.ico",
        apple: "/apple-touch-icon.png",
    },
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "TheNextTrade",
    },
    alternates: {
        types: {
            "application/rss+xml": "/feed.xml",
        },
    },
    metadataBase: new URL(getBaseUrl()),
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    viewportFit: "cover",
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#ffffff" },
        { media: "(prefers-color-scheme: dark)", color: "#090d16" },
    ],
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link
                    rel="dns-prefetch"
                    href="https://sdugjioikugfomjitfwg.supabase.co"
                />
                {gaMeasurementId && (
                    <>
                        <link
                            rel="preconnect"
                            href="https://www.googletagmanager.com"
                        />
                        <link
                            rel="preconnect"
                            href="https://www.google-analytics.com"
                        />
                    </>
                )}
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
 (function(){
 try {
 var t = localStorage.getItem('theme');
 if (!t) t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
 if (t === 'dark') {
 document.documentElement.classList.add('dark');
 document.documentElement.style.colorScheme = 'dark';
 }
 } catch(e) {}
 })();
 `,
                    }}
                />
                {process.env.NODE_ENV === "production" ? (
                    <script
                        dangerouslySetInnerHTML={{
                            __html: `
(function() {
  function reloadOnceOnStaleChunk() {
    try {
      var last = Number(sessionStorage.getItem('tnt_chunk_reload_at') || '0');
      if (Date.now() - last > 15000) {
        sessionStorage.setItem('tnt_chunk_reload_at', String(Date.now()));
        window.location.reload();
      }
    } catch (e) {}
  }
  window.addEventListener('error', function(ev) {
    var t = ev && ev.target;
    if (t && t.tagName === 'SCRIPT' && t.src && t.src.indexOf('/_next/static/') !== -1) {
      reloadOnceOnStaleChunk();
      return;
    }
    var msg = (ev && ev.message) || '';
    if (/ChunkLoadError|Loading chunk [\\w-]+ failed|Failed to fetch dynamically imported module|Importing a module script failed/i.test(msg)) {
      reloadOnceOnStaleChunk();
    }
  }, true);
  window.addEventListener('unhandledrejection', function(ev) {
    var r = ev && ev.reason;
    var msg = (r && (r.name + ' ' + r.message)) || String(r || '');
    if (/ChunkLoadError|Loading chunk [\\w-]+ failed|Failed to fetch dynamically imported module|Importing a module script failed/i.test(msg)) {
      reloadOnceOnStaleChunk();
    }
  });
  if ('serviceWorker' in navigator && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
    (window.requestIdleCallback || function(cb){setTimeout(cb,1)})(function() {
      navigator.serviceWorker.register('/sw.js').then(function(reg) { reg.update(); }).catch(function() {});
    });
  }
})();
`,
                        }}
                    />
                ) : (
                    <script
                        dangerouslySetInnerHTML={{
                            __html: `
if ('serviceWorker' in navigator) {
navigator.serviceWorker.getRegistrations().then(function(registrations) {
for (var r of registrations) { r.unregister(); }
});
}
`,
                        }}
                    />
                )}
            </head>
            <body
                className={`${sourceSans.variable} ${lexend.variable} font-sans bg-white dark:bg-transparent`}
            >
                <NextTopLoader
                    color="#F59E0B"
                    height={3}
                    showSpinner={false}
                    shadow="0 0 10px #F59E0B,0 0 5px #F59E0B"
                />
                <ThemeProvider>
                    <JsonLd
                        type="WebSite"
                        data={{
                            name: "TheNextTrade",
                            url: getBaseUrl(),
                            potentialAction: {
                                "@type": "SearchAction",
                                target: absoluteUrl("/search?q={search_term_string}"),
                                "query-input":
                                    "required name=search_term_string",
                            },
                        }}
                    />
                    <JsonLd
                        type="Organization"
                        data={{
                            name: "TheNextTrade",
                            alternateName: "TheNextTrade Discipline OS",
                            url: getBaseUrl(),
                            logo: {
                                "@type": "ImageObject",
                                url: absoluteUrl("/android-chrome-512x512.png"),
                                width: 512,
                                height: 512,
                            },
                            image: absoluteUrl("/og-image.jpg?v=2"),
                            description:
                                "The Discipline OS for MT5 Traders — automated MT5 trade telemetry via EA, behavioral leak radar, and 17 free forex risk calculators.",
                            foundingDate: "2024",
                            sameAs: [
                                "https://x.com/thenexttrade",
                                "https://twitter.com/thenexttrade",
                                TELEGRAM_CHANNEL_URL,
                            ],
                            contactPoint: {
                                "@type": "ContactPoint",
                                contactType: "customer support",
                                email: "support@thenexttrade.app",
                                url: absoluteUrl("/contact"),
                            },
                        }}
                    />
                    <SystemAnnouncementBanner />
                    {children}
                    <CookieConsentBanner />
                    <Toaster richColors position="top-right" closeButton />
                </ThemeProvider>
                <GoogleAnalytics measurementId={gaMeasurementId} />
            </body>
        </html>
    );
}
// Force rebuild
