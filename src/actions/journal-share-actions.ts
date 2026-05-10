"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateShareSettings(
    entryId: string, 
    data: { description?: string; mode?: "basic" | "full" }
) {
    // Auth check: require logged-in user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        // Owner check: only the entry owner can update share settings
        await prisma.journalEntry.update({
            where: { id: entryId, userId: user.id },
            data: {
                shareDescription: data.description,
                shareMode: data.mode
            }
        });
        
        revalidatePath(`/share/${entryId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to update share settings:", error);
        return { success: false, error: "Failed to save settings" };
    }
}
