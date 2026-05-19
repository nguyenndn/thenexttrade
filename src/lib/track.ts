"use client";

const GA_PARAM_BLOCKLIST = /(email|account|mt5|telegram|phone|password|fullName|userId|user_id)/i;

declare global {
    interface Window {
        gtag?: (...args: unknown[]) => void;
    }
}

function normalizeGaEventName(name: string) {
    return name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 40);
}

function sanitizeGaParams(data?: Record<string, string | number>) {
    const params: Record<string, string | number> = {};

    if (!data) return params;

    Object.entries(data).forEach(([key, value]) => {
        if (!key || GA_PARAM_BLOCKLIST.test(key)) return;
        if (typeof value !== "string" && typeof value !== "number") return;

        const safeKey = key
            .trim()
            .replace(/[^a-zA-Z0-9_]+/g, "_")
            .slice(0, 40);

        if (!safeKey) return;
        params[safeKey] = typeof value === "string" ? value.slice(0, 100) : value;
    });

    return params;
}

/**
 * Lightweight client-side event tracking (~1KB).
 * Uses navigator.sendBeacon for non-blocking fire-and-forget.
 *
 * Usage:
 * ```tsx
 * import { trackEvent } from '@/lib/track';
 * <button onClick={() => trackEvent('click_open_account', { brokerId: 'exness' })}>
 * ```
 */
export function trackEvent(name: string, data?: Record<string, string | number>) {
    try {
        const pathname = typeof window !== 'undefined' ? window.location.pathname : undefined;
        const payload = JSON.stringify({
            name,
            data: data || undefined,
            pathname,
        });

        // sendBeacon is non-blocking and survives page navigation
        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
            const blob = new Blob([payload], { type: 'application/json' });
            navigator.sendBeacon('/api/analytics/event', blob);
        } else {
            // Fallback for older browsers
            fetch('/api/analytics/event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payload,
                keepalive: true,
            }).catch(() => {});
        }

        if (
            typeof window !== "undefined" &&
            typeof window.gtag === "function" &&
            process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== "false"
        ) {
            const eventName = normalizeGaEventName(name);
            if (eventName) {
                window.gtag("event", eventName, {
                    ...sanitizeGaParams(data),
                    page_path: pathname,
                });
            }
        }
    } catch {
        // Analytics should never throw
    }
}
