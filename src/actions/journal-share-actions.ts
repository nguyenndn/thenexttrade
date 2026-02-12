"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateShareSettings(
    entryId: string, 
    data: { description?: string; mode?: "basic" | "full" }
) {
    try {
        await prisma.journalEntry.update({
            where: { id: entryId },
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
