import { cache } from "react";
import { cookies, headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { AuthUser } from "@/lib/auth-types";

/**
 * Internal request header stamped by the proxy
 * (`src/lib/supabase/middleware.ts`) after it verified the Supabase session.
 * Empty string = verified anonymous request.
 * Keep both copies of this constant in sync.
 */
const AUTH_USER_ID_HEADER = "x-auth-user-id";

export const getAuthUser = cache(async (): Promise<AuthUser | null> => {
    let forwardedUserId: string | null = null;
    let impersonatedId: string | undefined;

    try {
        const [headerStore, cookieStore] = await Promise.all([
            headers(),
            cookies(),
        ]);
        forwardedUserId = headerStore.get(AUTH_USER_ID_HEADER);
        impersonatedId = cookieStore.get("impersonate_user_id")?.value;
    } catch {
        // Outside a request scope (e.g. build-time render) — fall back below.
    }

    let userId: string;
    if (forwardedUserId !== null && !impersonatedId) {
        // The proxy already called Supabase for this request; trust its result
        // instead of paying a second network round-trip here.
        if (!forwardedUserId) return null;
        userId = forwardedUserId;
    } else {
        // No proxy proof (unrouted context), or impersonation is active and we
        // need the real admin identity: verify the session ourselves.
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) return null;
        userId = user.id;
    }

    let effectiveUserId = userId;
    let isImpersonated = false;

    try {
        if (impersonatedId && impersonatedId !== userId) {
            const adminCheck = await prisma.profile.findUnique({
                where: { userId },
                select: { role: true },
            });
            if (adminCheck?.role === "ADMIN") {
                const targetExists = await prisma.user.findUnique({
                    where: { id: impersonatedId },
                    select: { id: true },
                });
                if (targetExists) {
                    effectiveUserId = impersonatedId;
                    isImpersonated = true;
                }
            }
        }
    } catch {
        // Safe fallback if cookies() is inaccessible
    }

    // Additional user data from Prisma (Optimized fetch)
    const userData = await prisma.user.findUnique({
        where: { id: effectiveUserId },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            createdAt: true, // Useful for new user checks
            streak: true,
            level: true,
            xp: true,
            profile: {
                select: {
                    role: true,
                    bio: true,
                    username: true,
                },
            },
            _count: {
                select: {
                    progress: { where: { isCompleted: true } },
                },
            },
        },
    });

    if (!userData) return null;

    // Transform to match AuthUser interface
    // spread userData but override profile to include flattened fields
    return {
        ...userData,
        isImpersonated,
        originalAdminId: isImpersonated ? userId : undefined,
        profile: userData.profile
            ? {
                  ...userData.profile,
                  streak: userData.streak,
                  level: userData.level,
                  xp: userData.xp,
              }
            : null,
    };
});

export const getUserProfile = cache(async (userId: string) => {
    if (!userId) return null;
    return await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
    });
});

export const requireAdminAuth = cache(async () => {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Enforce MFA (AAL2) if the user has 2FA enabled
    const { data: aal, error: aalError } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (
        aalError ||
        (aal && aal.currentLevel === "aal1" && aal.nextLevel === "aal2")
    ) {
        throw new Error("MFA Required");
    }

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { role: true },
    });

    if (profile?.role !== "ADMIN") {
        throw new Error("Forbidden");
    }

    return user;
});
