"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdminAuth } from "@/lib/auth-cache";

export async function isAcademyEnabled(): Promise<boolean> {
    try {
        const setting = await prisma.systemSetting.findUnique({
            where: { key: "feature_academy" },
        });
        if (!setting) return false;
        const val = setting.value as { enabled?: boolean } | null;
        return val?.enabled ?? false;
    } catch {
        return false;
    }
}

export async function toggleAcademyFeature(enabled: boolean): Promise<{
    success: boolean;
    enabled?: boolean;
    error?: string;
}> {
    try {
        await requireAdminAuth();

        await prisma.systemSetting.upsert({
            where: { key: "feature_academy" },
            create: { key: "feature_academy", value: { enabled } },
            update: { value: { enabled } },
        });

        revalidatePath("/admin/academy");
        revalidatePath("/academy", "layout");
        revalidatePath("/dashboard", "layout");
        revalidatePath("/dashboard/academy", "layout");
        revalidatePath("/dashboard/learning");
        revalidatePath("/sitemap.xml");
        revalidatePath("/feed.xml");
        revalidatePath("/llms.txt");

        return { success: true, enabled };
    } catch (error: unknown) {
        console.error("[TOGGLE_ACADEMY_FEATURE]", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to toggle Academy feature",
        };
    }
}

export async function deleteLevel(levelId: string) {
    try {
        await requireAdminAuth();
        await prisma.$transaction(async (tx) => {
            await tx.comment.updateMany({
                where: { lesson: { module: { levelId } } },
                data: { parentId: null },
            });
            await tx.comment.deleteMany({
                where: { lesson: { module: { levelId } } },
            });
            await tx.quiz.deleteMany({
                where: { module: { levelId } },
            });
            await tx.level.delete({
                where: { id: levelId },
            });
        });
        revalidatePath("/admin/academy");
        return { success: true };
    } catch (error: any) {
        console.error("[DELETE_LEVEL]", error);
        return {
            success: false,
            error: error.message || "Failed to delete level",
        };
    }
}

export async function updateLevel(
    levelId: string,
    data: { title: string; description?: string }
) {
    try {
        await requireAdminAuth();
        await prisma.level.update({
            where: { id: levelId },
            data,
        });
        revalidatePath("/admin/academy");
        return { success: true };
    } catch (error: any) {
        console.error("[UPDATE_LEVEL]", error);
        return {
            success: false,
            error: error.message || "Failed to update level",
        };
    }
}
