// =============================================================================
// ANALYTICS UTILITIES — Cookieless tracking helpers
// =============================================================================

/**
 * Parse user-agent string into device/browser/os categories.
 * Lightweight — no external dependency needed.
 */
export function parseUserAgent(ua: string | null): {
    device: string;
    browser: string;
    os: string;
} {
    if (!ua) return { device: 'unknown', browser: 'unknown', os: 'unknown' };

    // Device
    const device = /mobile|android|iphone|ipad|ipod/i.test(ua)
        ? (/ipad|tablet/i.test(ua) ? 'tablet' : 'mobile')
        : 'desktop';

    // Browser (order matters — check specific first)
    let browser = 'other';
    if (/edg\//i.test(ua)) browser = 'Edge';
    else if (/opr\//i.test(ua) || /opera/i.test(ua)) browser = 'Opera';
    else if (/brave/i.test(ua)) browser = 'Brave';
    else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
    else if (/crios/i.test(ua) || (/chrome/i.test(ua) && !/edg/i.test(ua))) browser = 'Chrome';
    else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';

    // OS
    let os = 'other';
    if (/windows/i.test(ua)) os = 'Windows';
    else if (/macintosh|mac os/i.test(ua)) os = 'macOS';
    else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
    else if (/android/i.test(ua)) os = 'Android';
    else if (/linux/i.test(ua)) os = 'Linux';

    return { device, browser, os };
}

/**
 * Generate a deterministic session ID from IP + UA.
 * Cookieless — same visitor on same browser = same session within a day.
 * Uses simple hash (not crypto) for performance in edge runtime.
 */
export function generateSessionId(ip: string, ua: string): string {
    const date = new Date().toISOString().split('T')[0]; // Daily rotation
    const input = `${ip}:${ua}:${date}`;

    // Simple FNV-1a hash
    let hash = 2166136261;
    for (let i = 0; i < input.length; i++) {
        hash ^= input.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }

    return Math.abs(hash).toString(36).padStart(8, '0');
}

/**
 * Determine if a pathname should be tracked.
 * Skip: API routes, static assets, admin pages, Next.js internals.
 */
export function isTrackablePath(pathname: string): boolean {
    // Skip patterns
    if (pathname.startsWith('/api/')) return false;
    if (pathname.startsWith('/_next/')) return false;
    if (pathname.startsWith('/admin')) return false;
    if (pathname.startsWith('/auth/')) return false;
    if (pathname === '/favicon.ico') return false;
    if (pathname === '/robots.txt') return false;
    if (pathname === '/sitemap.xml') return false;
    if (/\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf)$/i.test(pathname)) return false;

    return true;
}

/**
 * Extract country from request headers.
 * Supports Vercel, Cloudflare, and standard headers — platform agnostic.
 */
export function getGeoFromHeaders(headers: Headers): {
    country: string | null;
    city: string | null;
    region: string | null;
} {
    return {
        // Vercel
        country: headers.get('x-vercel-ip-country')
            // Cloudflare
            || headers.get('cf-ipcountry')
            // Standard
            || headers.get('x-country-code')
            || null,
        city: headers.get('x-vercel-ip-city')
            || headers.get('cf-ipcity')
            || null,
        region: headers.get('x-vercel-ip-country-region')
            || headers.get('cf-region')
            || null,
    };
}
