import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { AuthUser } from "@/lib/auth-types";

export const getAuthUser = cache(async (): Promise<AuthUser | null> => {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    let effectiveUserId = user.id;
    let isImpersonated = false;

    try {
        const cookieStore = await cookies();
        const impersonatedId = cookieStore.get("impersonate_user_id")?.value;
        if (impersonatedId && impersonatedId !== user.id) {
            const adminCheck = await prisma.profile.findUnique({
                where: { userId: user.id },
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
        originalAdminId: isImpersonated ? user.id : undefined,
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
