"use server";

import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";

export async function markInsightViewed(insightId: string) {
    const user = await getAuthUser();
    if (!user) throw new Error("Unauthorized");

    const snapshot = await prisma.traderInsightSnapshot.findUnique({
        where: { id: insightId },
    });

    if (!snapshot || snapshot.userId !== user.id) {
        throw new Error("Insight not found or unauthorized");
    }

    if (!snapshot.viewedAt) {
        await prisma.traderInsightSnapshot.update({
            where: { id: insightId },
            data: { viewedAt: new Date() },
        });
    }

    return { success: true };
}

export async function dismissInsightSnapshot(insightId: string) {
    const user = await getAuthUser();
    if (!user) throw new Error("Unauthorized");

    const snapshot = await prisma.traderInsightSnapshot.findUnique({
        where: { id: insightId },
    });

    if (!snapshot || snapshot.userId !== user.id) {
        throw new Error("Insight not found or unauthorized");
    }

    await prisma.traderInsightSnapshot.update({
        where: { id: insightId },
        data: {
            status: "DISMISSED",
            dismissedAt: new Date(),
        },
    });

    return { success: true };
}
