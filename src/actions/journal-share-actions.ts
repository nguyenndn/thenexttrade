"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const shareSettingsSchema = z.object({
    description: z.string().max(1000).optional(),
    mode: z.enum(["private", "basic", "full"]).optional(),
});

export type ShareMode = "private" | "basic" | "full";

export async function updateShareSettings(
    entryId: string,
    data: { description?: string; mode?: ShareMode }
) {
    if (!entryId || typeof entryId !== "string") {
        return { success: false, error: "Invalid trade ID" };
    }

    const parsed = shareSettingsSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: "Invalid share settings" };
    }

    // Auth check: require logged-in user
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        // Owner check: only the entry owner can update share settings
        await prisma.journalEntry.update({
            where: { id: entryId, userId: user.id },
            data: {
                ...(parsed.data.description !== undefined
                    ? { shareDescription: parsed.data.description }
                    : {}),
                ...(parsed.data.mode !== undefined
                    ? { shareMode: parsed.data.mode }
                    : {}),
            },
        });

        revalidatePath(`/share/${entryId}`);
        revalidatePath("/dashboard/journal");
        return { success: true };
    } catch (error) {
        console.error("Failed to update share settings:", error);
        return { success: false, error: "Failed to save settings" };
    }
}
