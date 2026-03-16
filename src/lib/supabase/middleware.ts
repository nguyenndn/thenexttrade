import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // Create client to check session
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    )
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const path = request.nextUrl.pathname;

    // 1. Protected Routes (Dashboard, Admin)
    if (!user && (path.startsWith('/dashboard') || path.startsWith('/admin'))) {
        const loginUrl = new URL('/auth/login', request.url)
        return NextResponse.redirect(loginUrl)
    }

    // 2. Auth Routes (Login/Register) - If logged in, redirect to Academy (User Hub)
    if (user && (path.startsWith('/auth/login') || path.startsWith('/auth/signup'))) {
        return NextResponse.redirect(new URL('/academy', request.url))
    }

    // 3. Maintenance Mode Check
    const needsMaintenanceCheck =
        path === '/maintenance' ||
        (!path.startsWith('/admin') &&
         !path.startsWith('/api') &&
         !path.startsWith('/auth') &&
         !path.startsWith('/_next'));

    if (needsMaintenanceCheck) {
        try {
            const configUrl = new URL('/api/system/config', request.url);
            const configRes = await fetch(configUrl, {
                headers: { 'x-internal': '1' },
            });
            if (configRes.ok) {
                const config = await configRes.json();
                const isMaintenanceOn = config.maintenanceMode === true;

                if (isMaintenanceOn && path !== '/maintenance') {
                    // Maintenance ON → redirect non-admin users to /maintenance
                    const userRole = user?.app_metadata?.role || user?.user_metadata?.role;
                    const isAdmin = userRole === 'ADMIN' || userRole === 'EDITOR';
                    if (!isAdmin) {
                        return NextResponse.redirect(new URL('/maintenance', request.url));
                    }
                } else if (!isMaintenanceOn && path === '/maintenance') {
                    // Maintenance OFF → redirect away from /maintenance
                    return NextResponse.redirect(new URL('/', request.url));
                }

                // 4. Email Verification Check
                if (config.requireEmailVerification && user) {
                    const emailConfirmed = user.email_confirmed_at || user.confirmed_at;
                    const isVerifyPage = path === '/auth/verify-email';
                    if (!emailConfirmed && !isVerifyPage) {
                        return NextResponse.redirect(new URL('/auth/verify-email', request.url));
                    }
                }
            }
        } catch {
            // If config fetch fails, don't block — allow access
        }
    }

    return response
}
