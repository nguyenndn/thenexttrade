"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { recordSession } from "@/lib/session";
import { verifyTurnstile } from "@/lib/turnstile";
import { logSecurityEvent, SECURITY_EVENT_TYPES } from "@/lib/security-logger";
import { headers } from "next/headers";

const adminLoginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

async function getClientIP(): Promise<string> {
    const h = await headers();
    return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";
}

export async function adminLogin(formData: FormData) {
    const supabase = await createClient();

    // 1. Verify Turnstile
    const turnstileToken = formData.get("cf-turnstile-response") as string;
    const turnstileResult = await verifyTurnstile(turnstileToken);
    if (!turnstileResult.success) {
        const ip = await getClientIP();
        logSecurityEvent({
            type: SECURITY_EVENT_TYPES.TURNSTILE_FAILED,
            ip,
            path: "/admin/login",
            detail: `Admin login attempt: ${formData.get("email")}`,
        }).catch(() => {});
        return { error: turnstileResult.error || "Verification failed" };
    }

    // 2. Validate input
    const raw = {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
    };

    const validated = adminLoginSchema.safeParse(raw);
    if (!validated.success) {
        return { error: "Invalid email or password" };
    }

    // 3. Authenticate with Supabase
    const { error } = await supabase.auth.signInWithPassword(validated.data);

    if (error) {
        const ip = await getClientIP();
        logSecurityEvent({
            type: SECURITY_EVENT_TYPES.LOGIN_FAILED,
            ip,
            path: "/admin/login",
            detail: `Admin login failed: ${validated.data.email}. Error: ${error.message}`,
        }).catch(() => {});
        return { error: "Invalid email or password" };
    }

    // 4. Verify admin/editor role
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Authentication failed" };
    }

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { role: true },
    });

    if (profile?.role !== "ADMIN") {
        // Sign out non-admin user immediately
        await supabase.auth.signOut();
        const ip = await getClientIP();
        logSecurityEvent({
            type: SECURITY_EVENT_TYPES.LOGIN_FAILED,
            ip,
            path: "/admin/login",
            detail: `Non-admin login attempt: ${validated.data.email}, role: ${profile?.role || "no profile"}`,
        }).catch(() => {});
        return { error: "Access denied. Admin privileges required." };
    }

    // 5. Record session and redirect to admin dashboard
    await recordSession(user.id);

    // Check for 2FA
    const {
        data: { user: freshUser },
    } = await supabase.auth.getUser();
    const factors = freshUser?.factors || [];
    const totpFactor = factors.find(
        (f) => f.factor_type === "totp" && f.status === "verified"
    );

    if (totpFactor) {
        return { requires2FA: true };
    }

    revalidatePath("/", "layout");
    redirect("/admin");
}
