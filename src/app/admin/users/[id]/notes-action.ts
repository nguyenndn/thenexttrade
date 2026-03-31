"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function saveAdminNotes(userId: string, notes: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { role: true },
    });
    if (profile?.role !== "ADMIN") return { success: false, error: "Unauthorized" };

    await prisma.user.update({
        where: { id: userId },
        data: { settings: { adminNotes: notes } },
    });

    revalidatePath(`/admin/users/${userId}`);
    return { success: true };
}
