'use client';

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
        const payload = JSON.stringify({
            name,
            data: data || undefined,
            pathname: typeof window !== 'undefined' ? window.location.pathname : undefined,
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
    } catch {
        // Analytics should never throw
    }
}
