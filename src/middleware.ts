import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

import { NextResponse } from 'next/server'
import { rateLimit } from './lib/rate-limit'

const limiter = rateLimit({
  interval: 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 500, // Max 500 users per second
})

export async function middleware(request: NextRequest) {
  const response = await updateSession(request)

  // 1. Rate Limiting (API Routes Only)
  if (request.nextUrl.pathname.startsWith('/api')) {
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1'
    try {
      // Limit to 100 requests per minute per IP for APIs
      await limiter.check(100, ip)
    } catch {
      return new NextResponse('Too Many Requests', { status: 429 })
    }
  }

  // 2. CSP Headers
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')

  // Strict CSP Policy
  // Note: We need to allow 'unsafe-inline' for styles sometimes due to CSS-in-JS or Theme providers
  // We allow scripts from our domain, supabase, and trusted CDNs if needed.
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.supabase.co https://*.google.com https://*.googleapis.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: https://*.supabase.co https://*.unsplash.com https://flagcdn.com;
    font-src 'self' data: https://fonts.gstatic.com;
    worker-src 'self' blob:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    block-all-mixed-content;
    upgrade-insecure-requests;
  `
  // Replace newlines with spaces
  const contentSecurityPolicyHeaderValue = cspHeader
    .replace(/\s{2,}/g, ' ')
    .trim()

  response.headers.set(
    'Content-Security-Policy',
    contentSecurityPolicyHeaderValue
  )

  // 3. Other Security Headers
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')

  // 4. CSRF Protection (Mutation Requests)
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    const origin = request.headers.get('origin')
    const referer = request.headers.get('referer')
    const siteOrigin = request.nextUrl.origin

    if (origin && origin !== siteOrigin) {
      return new NextResponse('CSRF Validation Failed: Origin Mismatch', { status: 403 })
    }
    if (referer && !referer.startsWith(siteOrigin)) {
      return new NextResponse('CSRF Validation Failed: Referer Mismatch', { status: 403 })
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/ (public images)
     * - uploads/ (user uploaded files)
     * - robots.txt, sitemap.xml
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|images/|uploads/|robots\\.txt|sitemap\\.xml|feed\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)',
  ],
}
