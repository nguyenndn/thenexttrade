"use server";

import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
    computeArchetype,
    computeDimensionScores,
} from "@/lib/trading-style/scoring";
import { ARCHETYPES, type ArchetypeId } from "@/config/trading-style-data";

export interface SaveTradingStyleResultInput {
    answers: Record<string, string>;
}

export async function saveTradingStyleResult(
    input: SaveTradingStyleResultInput,
): Promise<{ success: true; archetype: ArchetypeId } | { error: string }> {
    try {
        const user = await getAuthUser();
        if (!user) return { error: "Unauthorized" };

        const answers = input?.answers ?? {};

        // Recompute server-side — never trust the client payload.
        const archetype = computeArchetype(answers);
        const dimensions = computeDimensionScores(answers);

        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { settings: true },
        });
        const existingSettings =
            (dbUser?.settings as Record<string, any>) || {};

        await prisma.user.update({
            where: { id: user.id },
            data: {
                settings: {
                    ...existingSettings,
                    tradingStyle: {
                        archetype,
                        archetypeTitle: ARCHETYPES[archetype].name,
                        dimensions,
                        answers,
                        completedAt: new Date().toISOString(),
                    },
                },
            },
        });

        revalidatePath("/dashboard/settings/trading-style");
        return { success: true, archetype };
    } catch (error: any) {
        console.error("[Trading Style Save Error]:", error);
        return {
            error: `Failed to save your trading style: ${
                error?.message || error
            }. Please try again.`,
        };
    }
}
