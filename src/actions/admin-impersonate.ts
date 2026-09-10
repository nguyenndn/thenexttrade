"use server";

import { cookies } from "next/headers";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function impersonateUserAction(targetUserId: string) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    // Verify real user is admin
    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { role: true },
    });
    if (profile?.role !== "ADMIN") {
        return { error: "Forbidden: Administrator privilege required" };
    }

    if (user.id === targetUserId) {
        return { error: "Cannot impersonate yourself" };
    }

    const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, name: true, email: true },
    });
    if (!targetUser) {
        return { error: "Target trader account not found" };
    }

    const cookieStore = await cookies();
    cookieStore.set("impersonate_user_id", targetUserId, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 2, // 2 hours
    });

    try {
        await prisma.auditLog.create({
            data: {
                adminId: user.id,
                action: "IMPERSONATE_USER_START",
                targetType: "USER",
                targetId: targetUserId,
                details: { targetEmail: targetUser.email, targetName: targetUser.name },
            },
        });
    } catch {
        // Audit failure should not block session start
    }

    revalidatePath("/", "layout");
    return { success: true, targetName: targetUser.name || targetUser.email };
}

export async function stopImpersonatingAction() {
    const cookieStore = await cookies();
    const impersonatedId = cookieStore.get("impersonate_user_id")?.value;

    cookieStore.delete("impersonate_user_id");

    const user = await getAuthUser();
    if (user && impersonatedId) {
        try {
            await prisma.auditLog.create({
                data: {
                    adminId: user.id,
                    action: "IMPERSONATE_USER_STOP",
                    targetType: "USER",
                    targetId: impersonatedId,
                },
            });
        } catch {
            // Non-critical
        }
    }

    revalidatePath("/", "layout");
    return { success: true };
}
