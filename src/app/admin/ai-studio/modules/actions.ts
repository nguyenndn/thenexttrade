"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateModule(moduleId: string, data: { title: string; description?: string }) {
    try {
        const updatedModule = await prisma.module.update({
            where: { id: moduleId },
            data: {
                title: data.title,
                description: data.description,
            },
            include: { level: true } // to get update level info if needed
        });

        // Revalidate the module detail page
        revalidatePath(`/admin/ai-studio/modules/${moduleId}`);
        // Revalidate the level page where this module is listed
        revalidatePath(`/admin/ai-studio/levels/${updatedModule.levelId}`);

        return { success: true, data: updatedModule };
    } catch (error) {
        console.error("Failed to update module:", error);
        return { success: false, error: "Failed to update module" };
    }
}

export async function deleteModule(moduleId: string) {
    try {
        // Get module first to know where to revalidate
        const moduleToDelete = await prisma.module.findUnique({
            where: { id: moduleId },
            select: { levelId: true }
        });

        if (!moduleToDelete) {
            return { success: false, error: "Module not found" };
        }

        await prisma.module.delete({
            where: { id: moduleId },
        });

        // Revalidate the level page where this module was listed
        revalidatePath(`/admin/ai-studio/levels/${moduleToDelete.levelId}`);

        return { success: true };
    } catch (error) {
        console.error("Failed to delete module:", error);
        return { success: false, error: "Failed to delete module" };
    }
}
