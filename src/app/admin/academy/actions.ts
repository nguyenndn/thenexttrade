"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteLevel(levelId: string) {
    try {
        await prisma.level.delete({
            where: { id: levelId },
        });
        revalidatePath("/admin/academy");
        return { success: true };
    } catch (error: any) {
        console.error("[DELETE_LEVEL]", error);
        return { success: false, error: error.message || "Failed to delete level" };
    }
}

export async function updateLevel(levelId: string, data: { title: string; description?: string }) {
    try {
        await prisma.level.update({
            where: { id: levelId },
            data,
        });
        revalidatePath("/admin/academy");
        return { success: true };
    } catch (error: any) {
        console.error("[UPDATE_LEVEL]", error);
        return { success: false, error: error.message || "Failed to update level" };
    }
}
