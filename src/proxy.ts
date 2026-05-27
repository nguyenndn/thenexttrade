import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { parseUserAgent, generateSessionId, isTrackablePath, getGeoFromHeaders, shouldTrackPageviewRequest } from '@/lib/analytics';

// =============================================================================
// RATE LIMITER (In-memory, sliding window)
// Resets on cold start — acceptable for Vercel Serverless/Edge
// =============================================================================

const RATE_LIMITS = {
    api: { max: 100, windowMs: 60_000 },        // 100 req/min for API
    auth: { max: 10, windowMs: 60_000 },         // 10 req/min for auth (strict)
    search: { max: 30, windowMs: 60_000 },       // 30 req/min for search
    page: { max: 200, windowMs: 60_000 },        // 200 req/min for pages
} as const;

type RateLimitKey = keyof typeof RATE_LIMITS;

interface RateLimitEntry {
    count: number;
    windowStart: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// =============================================================================
// BLOCKED IP LIST (In-memory, synced from DB periodically)
// =============================================================================

const blockedIPSet = new Set<string>();
let blockedIPLastSync = 0;
const BLOCKED_IP_SYNC_INTERVAL = 60_000; // Sync every 60s

async function syncBlockedIPs(baseUrl: string): Promise<void> {
    const now = Date.now();
    if (now - blockedIPLastSync < BLOCKED_IP_SYNC_INTERVAL) return;
    blockedIPLastSync = now;

    try {
        const headers: Record<string, string> = { 'x-internal-security': '1' };
        if (process.env.INTERNAL_SECURITY_SECRET) {
            headers['Authorization'] = `Bearer ${process.env.INTERNAL_SECURITY_SECRET}`;
        }
        
        const res = await fetch(`${baseUrl}/api/internal/security-log?action=blocked-ips`, {
            headers,
        });
        if (res.ok) {
            const data = await res.json();
            blockedIPSet.clear();
            (data.ips || []).forEach((ip: string) => blockedIPSet.add(ip));
        }
    } catch { /* silent */ }
}

// =============================================================================
// PAGEVIEW DEDUPE GUARD (prevents double-tracking within 5s window)
// =============================================================================
const pageviewDedupeMap = new Map<string, number>();
const PAGEVIEW_DEDUPE_TTL_MS = 5_000;

function shouldDedupePageview(sessionId: string, pathname: string): boolean {
    const now = Date.now();
    const key = `${sessionId}:${pathname}`;
    const lastSeen = pageviewDedupeMap.get(key);

    if (lastSeen && now - lastSeen < PAGEVIEW_DEDUPE_TTL_MS) {
        return true; // duplicate — skip tracking
    }

    pageviewDedupeMap.set(key, now);
    return false;
}

// Cleanup stale entries every 5 minutes
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of rateLimitMap.entries()) {
            if (now - entry.windowStart > 120_000) {
                rateLimitMap.delete(key);
            }
        }
        // Also clean up old pageview dedupe entries
        for (const [key, timestamp] of pageviewDedupeMap.entries()) {
            if (now - timestamp > 60_000) {
                pageviewDedupeMap.delete(key);
            }
        }
    }, 300_000);
}

function checkRateLimit(ip: string, category: RateLimitKey): { allowed: boolean; remaining: number; retryAfter?: number } {
    const config = RATE_LIMITS[category];
    const now = Date.now();
    const key = `${category}:${ip}`;

    const entry = rateLimitMap.get(key);

    if (!entry || now - entry.windowStart > config.windowMs) {
        rateLimitMap.set(key, { count: 1, windowStart: now });
        return { allowed: true, remaining: config.max - 1 };
    }

    entry.count++;

    if (entry.count > config.max) {
        const retryAfter = Math.ceil((entry.windowStart + config.windowMs - now) / 1000);
        return { allowed: false, remaining: 0, retryAfter };
    }

    return { allowed: true, remaining: config.max - entry.count };
}

// =============================================================================
// BOT DETECTION (Block known malicious user agents)
// =============================================================================

const BLOCKED_UA_PATTERNS = [
    /python-requests/i,
    /go-http-client/i,
    /java\//i,
    /wget/i,
    /libwww-perl/i,
    /php\//i,
    /nikto/i,
    /sqlmap/i,
    /nmap/i,
    /masscan/i,
    /zgrab/i,
    /semrush/i,
    /ahref/i,
    /mj12bot/i,
    /dotbot/i,
    /bytespider/i,
];

function isMaliciousBot(userAgent: string | null): boolean {
    if (!userAgent) return false;
    return BLOCKED_UA_PATTERNS.some(pattern => pattern.test(userAgent));
}

// =============================================================================
// SECURITY HEADERS (Production only)
// =============================================================================

function addSecurityHeaders(response: NextResponse, isDev: boolean): void {
    if (isDev) {
        // Dev: clear HSTS to prevent browser caching issues
        response.headers.set('Strict-Transport-Security', 'max-age=0');
        return;
    }

    // HSTS — 2 years with preload
    response.headers.set(
        'Strict-Transport-Security',
        'max-age=63072000; includeSubDomains; preload'
    );

    // Prevent clickjacking
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');

    // Prevent MIME sniffing
    response.headers.set('X-Content-Type-Options', 'nosniff');

    // Referrer policy
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // DNS prefetch
    response.headers.set('X-DNS-Prefetch-Control', 'on');

    // Permissions Policy — disable unused browser features
    response.headers.set(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
    );

    // CSP — Content Security Policy
    const csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://*.supabase.co https://*.google.com https://*.googleapis.com https://*.googletagmanager.com https://challenges.cloudflare.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "img-src 'self' blob: data: https://*.supabase.co https://*.unsplash.com https://flagcdn.com https://images.unsplash.com https://cdn.jsdelivr.net",
        "font-src 'self' data: https://fonts.gstatic.com",
        "connect-src 'self' https://*.supabase.co https://*.google-analytics.com https://*.googleapis.com wss://*.supabase.co https://challenges.cloudflare.com",
        "frame-src https://challenges.cloudflare.com",
        "worker-src 'self' blob:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "upgrade-insecure-requests",
    ].join('; ');

    response.headers.set('Content-Security-Policy', csp);
}

// =============================================================================
// CRON PROTECTION
// =============================================================================

function isCronRoute(pathname: string): boolean {
    return pathname.startsWith('/api/cron/');
}

function validateCronSecret(request: NextRequest): boolean {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) return true; // If not configured, allow (dev mode)

    const authHeader = request.headers.get('authorization');
    return authHeader === `Bearer ${cronSecret}`;
}

// =============================================================================
// SECURITY LOG HELPER (fire-and-forget via internal API)
// =============================================================================

function logSecurityToAPI(baseUrl: string, data: {
    type: string;
    ip: string;
    userAgent?: string | null;
    path?: string | null;
    detail?: string | null;
}): void {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-internal-security': '1',
    };
    if (process.env.INTERNAL_SECURITY_SECRET) {
        headers['Authorization'] = `Bearer ${process.env.INTERNAL_SECURITY_SECRET}`;
    }

    fetch(`${baseUrl}/api/internal/security-log`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
    }).catch(() => { /* silent */ });
}

// =============================================================================
// MIDDLEWARE ENTRY POINT
// =============================================================================

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';
    const userAgent = request.headers.get('user-agent');
    const isDev = process.env.NODE_ENV !== 'production';

    // 0. Sync blocked IPs (non-blocking)
    const baseUrl = request.nextUrl.origin;
    syncBlockedIPs(baseUrl).catch(() => {});

    // 0.5 Check blocked IP
    if (blockedIPSet.has(ip)) {
        return new NextResponse('Forbidden', { status: 403 });
    }

    // 1. Bot Detection (production only)
    if (!isDev && isMaliciousBot(userAgent)) {
        logSecurityToAPI(baseUrl, {
            type: 'BOT_BLOCKED',
            ip,
            userAgent,
            path: pathname,
            detail: `Blocked UA: ${userAgent}`,
        });
        return new NextResponse('Forbidden', { status: 403 });
    }

    // 2. CRON Route Protection
    if (isCronRoute(pathname)) {
        if (!validateCronSecret(request)) {
            logSecurityToAPI(baseUrl, {
                type: 'CRON_FAILED',
                ip,
                userAgent,
                path: pathname,
                detail: 'Invalid CRON_SECRET',
            });
            return NextResponse.json(
                { error: 'Unauthorized — invalid CRON_SECRET' },
                { status: 401 }
            );
        }
    }

    // 3. Rate Limiting
    let rateLimitResult: { allowed: boolean; remaining: number; retryAfter?: number } | null = null;
    let rateLimitCategory: RateLimitKey | null = null;

    if (pathname.startsWith('/api/')) {
        // Skip rate limiting for internal/high-frequency routes (PRO-QA-001, PRO-QA-011)
        const skipRateLimit =
            pathname === '/api/pro-status' ||
            pathname.startsWith('/api/cron/') ||
            pathname.startsWith('/api/internal/');

        if (!skipRateLimit) {
        rateLimitCategory = 'api';

        if (pathname.startsWith('/api/auth/')) {
            rateLimitCategory = 'auth';
        } else if (pathname.startsWith('/api/search')) {
            rateLimitCategory = 'search';
        }

        rateLimitResult = checkRateLimit(ip, rateLimitCategory);

        if (!rateLimitResult.allowed) {
            logSecurityToAPI(baseUrl, {
                type: 'RATE_LIMIT',
                ip,
                userAgent,
                path: pathname,
                detail: `Category: ${rateLimitCategory}, limit: ${RATE_LIMITS[rateLimitCategory].max}/min`,
            });
            const response = new NextResponse(
                JSON.stringify({ error: 'Too Many Requests', retryAfter: rateLimitResult.retryAfter }),
                { status: 429, headers: { 'Content-Type': 'application/json' } }
            );
            if (rateLimitResult.retryAfter) {
                response.headers.set('Retry-After', String(rateLimitResult.retryAfter));
            }
            return response;
        }
        } // end skipRateLimit
    }

    // 4. Session Management (Supabase) + Route Protection
    const response = await updateSession(request);

    // 5. Security Headers
    addSecurityHeaders(response, isDev);

    // 6. Rate limit headers for API routes
    if (rateLimitResult && rateLimitCategory) {
        response.headers.set('X-RateLimit-Limit', String(RATE_LIMITS[rateLimitCategory].max));
        response.headers.set('X-RateLimit-Remaining', String(Math.max(0, rateLimitResult.remaining)));
    }

    // 7. Analytics — track real document pageviews only (non-blocking, fire-and-forget)
    const isRealPageview = shouldTrackPageviewRequest({
        pathname,
        searchParams: request.nextUrl.searchParams,
        headers: request.headers,
    });

    if (isRealPageview && !isMaliciousBot(userAgent)) {
        const geo = getGeoFromHeaders(request.headers);
        const ua = parseUserAgent(userAgent);
        const sessionId = generateSessionId(ip, userAgent ?? '');

        // Dedupe guard — skip if same session+path was tracked within 5s
        if (!shouldDedupePageview(sessionId, pathname)) {
            // Extract UTM parameters for campaign tracking
            const utmSource = request.nextUrl.searchParams.get('utm_source') || null;
            const utmMedium = request.nextUrl.searchParams.get('utm_medium') || null;
            const utmCampaign = request.nextUrl.searchParams.get('utm_campaign') || null;

            // Fire and forget — don't await, don't block response
            const collectUrl = new URL('/api/analytics/collect', request.url);
            fetch(collectUrl.toString(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-internal-analytics': '1',
                },
                body: JSON.stringify({
                    pathname,
                    referrer: request.headers.get('referer') || null,
                    country: geo.country,
                    city: geo.city,
                    region: geo.region,
                    device: ua.device,
                    browser: ua.browser,
                    os: ua.os,
                    sessionId,
                    utmSource,
                    utmMedium,
                    utmCampaign,
                }),
            }).catch(() => { /* silently fail — analytics should never break the app */ });
        }
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico
         * - Static assets (svg, png, jpg, etc.)
         * - robots.txt, sitemap.xml, feed.xml
         */
        '/((?!_next/static|_next/image|articles/|favicon.ico|images/|uploads/|robots\\.txt|sitemap\\.xml|feed\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)',
    ],
};
