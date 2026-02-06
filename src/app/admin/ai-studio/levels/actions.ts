"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateLevel(levelId: string, data: { title: string; description?: string }) {
    try {
        await prisma.level.update({
            where: { id: levelId },
            data: {
                title: data.title,
                description: data.description,
            },
        });

        revalidatePath("/admin/ai-studio/levels");
        return { success: true };
    } catch (error: any) {
        console.error("[UPDATE_LEVEL_ERROR]", error);
        return { success: false, error: error.message };
    }
}

export async function deleteLevel(levelId: string) {
    try {
        await prisma.level.delete({
            where: { id: levelId },
        });

        revalidatePath("/admin/ai-studio/levels");
        return { success: true };
    } catch (error: any) {
        console.error("[DELETE_LEVEL_ERROR]", error);
        return { success: false, error: error.message };
    }
}
