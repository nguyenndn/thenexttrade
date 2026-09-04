import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// =============================================================================
// MAINTENANCE CONFIG CACHE (module-level, per process, 30s TTL)
// Avoids hitting /api/system/config on every single middleware invocation.
// Maintenance mode toggles may take up to 30s to propagate — acceptable tradeoff.
// =============================================================================
type MaintenanceConfigCache = {
    maintenanceMode: boolean;
    checkedAt: number;
};

let maintenanceConfigCache: MaintenanceConfigCache | null = null;
const MAINTENANCE_CONFIG_TTL_MS = 30_000;

async function getMaintenanceConfig(
    request: NextRequest
): Promise<MaintenanceConfigCache> {
    const now = Date.now();
    if (
        maintenanceConfigCache &&
        now - maintenanceConfigCache.checkedAt < MAINTENANCE_CONFIG_TTL_MS
    ) {
        return maintenanceConfigCache;
    }

    try {
        const configUrl = new URL("/api/system/config", request.url);
        const configRes = await fetch(configUrl.toString(), {
            cache: "no-store",
            headers: { "x-internal": "1" },
        });

        if (configRes.ok) {
            const config = await configRes.json();
            maintenanceConfigCache = {
                maintenanceMode: config.maintenanceMode === true,
                checkedAt: now,
            };
        } else {
            // Fetch succeeded but non-ok — fail open, cache the "off" state briefly
            maintenanceConfigCache = maintenanceConfigCache ?? {
                maintenanceMode: false,
                checkedAt: now,
            };
        }
    } catch {
        // Network error — fail open, don't block users
        maintenanceConfigCache = maintenanceConfigCache ?? {
            maintenanceMode: false,
            checkedAt: now,
        };
    }

    return maintenanceConfigCache;
}

// =============================================================================
// SESSION + ROUTE PROTECTION
// =============================================================================
export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    // Create client to check session
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const path = request.nextUrl.pathname;

    // 1. Protected Routes (Dashboard, Admin — except admin login page)
    if (
        !user &&
        (path.startsWith("/dashboard") ||
            (path.startsWith("/admin") && !path.startsWith("/admin/login")))
    ) {
        const loginUrl = new URL("/auth/login", request.url);
        return NextResponse.redirect(loginUrl);
    }

    if (
        user &&
        (path.startsWith("/dashboard") ||
            (path.startsWith("/admin") && !path.startsWith("/admin/login")))
    ) {
        const { data: aal, error } =
            await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (
            !error &&
            aal &&
            aal.currentLevel === "aal1" &&
            aal.nextLevel === "aal2"
        ) {
            const verifyUrl = new URL("/auth/verify-2fa", request.url);
            verifyUrl.searchParams.set("next", path);
            return NextResponse.redirect(verifyUrl);
        }
    }

    // 2. Admin Login — already authenticated users go to admin dashboard
    if (user && path.startsWith("/admin/login")) {
        return NextResponse.redirect(new URL("/admin", request.url));
    }

    // 3. Auth Routes (Login/Register) - If logged in, redirect to Academy (User Hub)
    if (
        user &&
        (path.startsWith("/auth/login") || path.startsWith("/auth/signup"))
    ) {
        return NextResponse.redirect(new URL("/academy", request.url));
    }

    // 4. Maintenance Mode Check (uses 30s TTL cache to avoid repeated /api/system/config calls)
    const needsMaintenanceCheck =
        path === "/maintenance" ||
        (!path.startsWith("/admin") &&
            !path.startsWith("/api") &&
            !path.startsWith("/auth") &&
            !path.startsWith("/_next"));

    if (needsMaintenanceCheck) {
        const config = await getMaintenanceConfig(request);
        const isMaintenanceOn = config.maintenanceMode;

        if (isMaintenanceOn && path !== "/maintenance") {
            // Maintenance ON → redirect non-admin users to /maintenance
            const userRole = user?.app_metadata?.role;
            const isAdmin = userRole === "ADMIN";
            if (!isAdmin) {
                return NextResponse.redirect(
                    new URL("/maintenance", request.url)
                );
            }
        } else if (!isMaintenanceOn && path === "/maintenance") {
            // Maintenance OFF → redirect away from /maintenance
            return NextResponse.redirect(new URL("/", request.url));
        }
    }

    return response;
}
