"use server";

import { createClient as createStatelessSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getActiveSessions, revokeSession } from "@/lib/session";
import { passwordSchema } from "@/lib/validations/auth";
import { checkAuthRateLimit } from "@/lib/security/auth-rate-limit";
import { AUTH_ERRORS } from "@/lib/security/auth-errors";

async function getClientIP(): Promise<string> {
    const h = await headers();
    const realIp = h.get("x-real-ip")?.trim();
    if (realIp) return realIp;
    const vercelIp = h.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
    if (vercelIp) return vercelIp;
    return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";
}

// ==========================================
// PASSWORD MANAGEMENT
// ==========================================

export async function updatePassword(formData: FormData) {
    const supabase = await createClient();

    // 1. Check Auth
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.email) {
        return { error: "Unauthorized" };
    }

    const ip = await getClientIP();
    if (await checkAuthRateLimit("update_password", ip, user.email)) {
        return { error: AUTH_ERRORS.RATE_LIMIT_GENERIC };
    }

    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!currentPassword || !newPassword || !confirmPassword) {
        return { error: "All fields are required" };
    }

    if (newPassword !== confirmPassword) {
        return { error: "New passwords do not match" };
    }

    const parsedPassword = passwordSchema.safeParse(newPassword);
    if (!parsedPassword.success) {
        return {
            error:
                parsedPassword.error.issues[0]?.message ||
                "Password does not meet security requirements",
        };
    }

    // 2. Verify Current Password using a non-persisting client so aal2 session cookies are untouched
    const verifyClient = createStatelessSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false,
            },
        }
    );

    const { error: signInError } = await verifyClient.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
    });

    if (signInError) {
        return { error: "Current password is incorrect" };
    }

    // 3. Update Password on the authenticated SSR client (preserving aal2 session)
    const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
    });

    if (updateError) {
        return { error: updateError.message };
    }

    return { success: true, message: "Password updated successfully!" };
}

// ==========================================
// SESSION MANAGEMENT
// ==========================================

export async function fetchUserSessions() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    return await getActiveSessions(user.id);
}

export async function deleteSession(sessionId: string) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    await revokeSession(sessionId, user.id);
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/settings/security");
    return { success: true, message: "Session revoked" };
}

// ==========================================
// 2FA MANAGEMENT
// ==========================================

export async function getTwoFactorStatus() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { isEnabled: false };

    const factors = user.factors || [];
    const totp = factors.find(
        (f) => f.factor_type === "totp" && f.status === "verified"
    );

    return { isEnabled: !!totp };
}

export async function startTwoFactorSetup() {
    const supabase = await createClient();
    const { data: factorsData, error: factorsError } =
        await supabase.auth.mfa.listFactors();
    if (factorsError) return { error: factorsError.message };

    const factors = factorsData?.all || [];
    const verifiedTotp = factors.find(
        (f) => f.factor_type === "totp" && f.status === "verified"
    );
    if (verifiedTotp) return { error: "2FA is already enabled" };

    const staleTotpFactors = factors.filter(
        (f) => f.factor_type === "totp" && f.status !== "verified"
    );
    for (const factor of staleTotpFactors) {
        await supabase.auth.mfa.unenroll({ factorId: factor.id });
    }

    const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "TheNextTrade",
    });

    if (error) return { error: error.message };

    return {
        success: true,
        data: {
            id: data.id,
            secret: data.totp.secret,
            qr: data.totp.qr_code,
        },
    };
}

export async function verifyTwoFactorSetup(factorId: string, code: string) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const ip = await getClientIP();
    if (await checkAuthRateLimit("verify_2fa", ip, user.email)) {
        return { error: AUTH_ERRORS.RATE_LIMIT_GENERIC };
    }

    const { data: challenge, error: challengeErr } =
        await supabase.auth.mfa.challenge({ factorId });
    if (challengeErr) return { error: challengeErr.message };

    const { error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code,
    });

    if (error) return { error: error.message };

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/settings/security");
    return { success: true };
}

export async function disableTwoFactor(code?: string) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const ip = await getClientIP();
    if (await checkAuthRateLimit("disable_2fa", ip, user.email)) {
        return { error: AUTH_ERRORS.RATE_LIMIT_GENERIC };
    }

    const factors = user.factors || [];
    const totpFactor = factors.find(
        (f) => f.factor_type === "totp" && f.status === "verified"
    );

    if (!totpFactor) return { error: "2FA is not enabled" };

    if (!code) return { error: "Verification code required" };

    // Verify code before disabling
    const { data: challenge, error: challengeErr } =
        await supabase.auth.mfa.challenge({ factorId: totpFactor.id });
    if (challengeErr) return { error: challengeErr.message };

    const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challenge.id,
        code,
    });

    if (verifyErr) return { error: "Invalid code" };

    await supabase.auth.mfa.unenroll({ factorId: totpFactor.id });

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/settings/security");
    return { success: true };
}
