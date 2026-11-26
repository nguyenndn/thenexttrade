import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
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
import { getServerBuildId } from "@/lib/deployment/build-id.server";

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
            { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
            { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
            { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
            { url: "/favicon.ico", sizes: "any" },
            { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
            { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
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
            "text/plain": "/llms.txt",
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

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    // CSP nonce set by src/proxy.ts on the forwarded request. Reading request
    // headers makes this layout dynamic, which a per-request nonce requires.
    const nonce = (await headers()).get("x-nonce") ?? undefined;
    const buildId = getServerBuildId();

    return (
        <html lang="en" data-tnt-build={buildId} suppressHydrationWarning>
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
                    nonce={nonce}
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
                        nonce={nonce}
                        dangerouslySetInnerHTML={{
                            __html: `
(function() {
  var RELOAD_KEY = 'tnt_chunk_reload_at';
  var COOLDOWN_MS = 20000;
  var CHECK_THROTTLE_MS = 15000;
  var STALE_RE = /ChunkLoadError|UnrecognizedActionError|Loading (?:CSS )?chunk [\\w-]+ failed|CSS_CHUNK_LOAD_FAILED|Unable to preload CSS|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Failed to find Server Action|was not found on the server|Expected RSC navigation response to have a body/i;
  var bootBuildId = document.documentElement.getAttribute('data-tnt-build') || '';
  var lastSkewCheckAt = Date.now();
  var checkInFlight = false;
  var skewPendingReload = false;

  function isEditingField() {
    var el = document.activeElement;
    if (!el) return false;
    var tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable === true;
  }

  function reloadOnceOnStaleChunk() {
    try {
      if (navigator.onLine === false) return;
      var last = Number(sessionStorage.getItem(RELOAD_KEY) || '0');
      if (Date.now() - last > COOLDOWN_MS) {
        sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
        window.location.reload();
      }
    } catch (e) {}
  }

  function checkBuildSkew(force) {
    if (!bootBuildId || checkInFlight || navigator.onLine === false) return;
    var now = Date.now();
    if (!force && now - lastSkewCheckAt < CHECK_THROTTLE_MS) return;
    lastSkewCheckAt = now;
    checkInFlight = true;
    fetch('/api/build-id?t=' + now, { cache: 'no-store', credentials: 'same-origin' })
      .then(function(res) { return res.ok ? res.json() : null; })
      .then(function(data) {
        if (data && data.buildId && data.buildId !== bootBuildId) {
          if (!isEditingField()) {
            reloadOnceOnStaleChunk();
          } else {
            skewPendingReload = true;
          }
        }
      })
      .catch(function() {})
      .finally(function() { checkInFlight = false; });
  }

  document.addEventListener('focusout', function() {
    if (skewPendingReload && !isEditingField()) {
      reloadOnceOnStaleChunk();
    }
  });
  document.addEventListener('click', function(ev) {
    if (!skewPendingReload) return;
    var link = ev.target && ev.target.closest ? ev.target.closest('a[href]') : null;
    if (link && link.href && link.origin === location.origin && !link.target) {
      ev.preventDefault();
      window.location.href = link.href;
    }
  }, true);

  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') checkBuildSkew(false);
  });
  window.addEventListener('pageshow', function(ev) {
    if (ev && ev.persisted) checkBuildSkew(true);
  });
  window.addEventListener('focus', function() {
    checkBuildSkew(false);
  });

  if (typeof MutationObserver !== 'undefined') {
    var rootObserver = new MutationObserver(function() {
      if (document.documentElement.id === '__next_error__') {
        reloadOnceOnStaleChunk();
      }
    });
    rootObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['id'] });
  }

  window.addEventListener('error', function(ev) {
    var t = ev && ev.target;
    if (t && (t.tagName === 'SCRIPT' || t.tagName === 'LINK')) {
      var url = t.src || t.href || '';
      if (url.indexOf('/_next/static/') !== -1) {
        reloadOnceOnStaleChunk();
        return;
      }
    }
    var msg = (ev && ev.message) || '';
    if (STALE_RE.test(msg)) {
      reloadOnceOnStaleChunk();
    }
  }, true);

  window.addEventListener('unhandledrejection', function(ev) {
    var r = ev && ev.reason;
    var msg = (r && ((r.name || '') + ' ' + (r.message || ''))) || String(r || '');
    if (STALE_RE.test(msg)) {
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
                        nonce={nonce}
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
