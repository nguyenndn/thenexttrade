"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

declare global {
    interface Window {
        dataLayer?: unknown[];
        gtag?: (...args: unknown[]) => void;
    }
}

interface GoogleAnalyticsProps {
    measurementId?: string;
}

function isAnalyticsEnabled(measurementId?: string) {
    return (
        Boolean(measurementId) &&
        process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== "false"
    );
}

export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
    const pathname = usePathname();
    const [ready, setReady] = useState(false);
    const enabled = isAnalyticsEnabled(measurementId);

    useEffect(() => {
        if (
            !enabled ||
            !ready ||
            !measurementId ||
            typeof window.gtag !== "function"
        )
            return;

        window.gtag("event", "page_view", {
            page_path: pathname,
            page_location: `${window.location.origin}${pathname}`,
            page_title: document.title,
        });
    }, [enabled, measurementId, pathname, ready]);

    if (!enabled || !measurementId) return null;

    return (
        <>
            <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
                strategy="lazyOnload"
            />
            <Script
                id="ga4-init"
                strategy="lazyOnload"
                onReady={() => setReady(true)}
            >
                {`
 window.dataLayer = window.dataLayer || [];
 function gtag(){dataLayer.push(arguments);}
 window.gtag = gtag;
 gtag('js', new Date());
 gtag('config', '${measurementId}', {
 send_page_view: false,
 anonymize_ip: true
 });
 `}
            </Script>
        </>
    );
}
