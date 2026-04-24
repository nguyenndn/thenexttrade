import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// =============================================================================
// API AUTH HELPERS — Reusable guards for API routes
// =============================================================================

interface AuthResult {
    user: {
        id: string;
        email: string;
        role: string;
    };
}

/**
 * Require authenticated user. Returns user or 401 response.
 * Usage:
 * ```ts
 * const auth = await requireAuth();
 * if (auth instanceof NextResponse) return auth;
 * const { user } = auth;
 * ```
 */
export async function requireAuth(): Promise<AuthResult | NextResponse> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }

    // Role is stored in Supabase auth metadata, not in DB
    const role = user.app_metadata?.role || user.user_metadata?.role || 'USER';

    return {
        user: {
            id: user.id,
            email: user.email || '',
            role: role as string,
        },
    };
}

/**
 * Require admin/editor role. Returns user or 401/403 response.
 * Checks role from DB profile (matching admin layout pattern).
 */
export async function requireAdmin(): Promise<AuthResult | NextResponse> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }

    // Check role from DB profile (same as admin/layout.tsx)
    const { prisma } = await import('@/lib/prisma');
    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { role: true },
    });

    const role = profile?.role || 'USER';

    if (role !== 'ADMIN' && role !== 'EDITOR') {
        return NextResponse.json(
            { error: 'Forbidden — admin access required' },
            { status: 403 }
        );
    }

    return {
        user: {
            id: user.id,
            email: user.email || '',
            role,
        },
    };
}

/**
 * Validate CRON_SECRET from Authorization header.
 * Usage in CRON routes:
 * ```ts
 * const cronAuth = requireCronSecret(request);
 * if (cronAuth instanceof NextResponse) return cronAuth;
 * ```
 */
export function requireCronSecret(request: Request): true | NextResponse {
    const cronSecret = process.env.CRON_SECRET;

    // If CRON_SECRET not configured, allow in dev, block in prod
    if (!cronSecret) {
        if (process.env.NODE_ENV === 'production') {
            return NextResponse.json(
                { error: 'CRON_SECRET not configured' },
                { status: 500 }
            );
        }
        return true;
    }

    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
            { error: 'Unauthorized — invalid CRON_SECRET' },
            { status: 401 }
        );
    }

    return true;
}
