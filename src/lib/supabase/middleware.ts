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
        // Optional: Add ?next= param to redirect back
        return NextResponse.redirect(loginUrl)
    }

    // 2. Auth Routes (Login/Register) - If logged in, redirect to Academy (User Hub)
    if (user && (path.startsWith('/auth/login') || path.startsWith('/auth/signup'))) {
        return NextResponse.redirect(new URL('/academy', request.url))
    }

    // 3. User Role Check (Future Scope: Admin only for /admin)

    return response
}
