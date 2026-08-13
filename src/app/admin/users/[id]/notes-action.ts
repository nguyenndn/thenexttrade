"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function saveAdminNotes(userId: string, notes: string) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { role: true },
    });
    if (profile?.role !== "ADMIN")
        return { success: false, error: "Unauthorized" };

    // user.settings is the shared store for onboarding state, milestones,
    // activation-reminder logs and notification preferences. Writing only
    // { adminNotes } here would REPLACE the whole column and silently wipe all
    // of that state — merge into the existing object instead.
    const existing = (await prisma.user.findUnique({
        where: { id: userId },
        select: { settings: true },
    }))?.settings as Record<string, unknown> | null;

    await prisma.user.update({
        where: { id: userId },
        data: {
            settings: {
                ...(existing ?? {}),
                adminNotes: notes,
            },
        },
    });

    revalidatePath(`/admin/users/${userId}`);
    return { success: true };
}
