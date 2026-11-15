"use server";

import { z } from "zod";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import {
    computeArchetype,
    computeDimensionScores,
} from "@/lib/trading-style/scoring";
import {
    ARCHETYPES,
    QUESTIONS,
    type ArchetypeId,
} from "@/config/trading-style-data";

export interface SaveTradingStyleResultInput {
    answers: Record<string, string>;
}

const VALID_QUESTION_OPTIONS = new Map(
    QUESTIONS.map((q) => [q.id, new Set(q.options.map((o) => o.id))])
);

const saveTradingStyleSchema = z.object({
    answers: z
        .record(z.string().max(20), z.string().max(20))
        .refine(
            (obj) => {
                const entries = Object.entries(obj);
                if (entries.length === 0 || entries.length > 30) return false;
                return entries.every(([qId, optId]) => {
                    const allowed = VALID_QUESTION_OPTIONS.get(qId);
                    return allowed ? allowed.has(optId) : false;
                });
            },
            { message: "Invalid assessment answers submitted." }
        ),
});

export async function saveTradingStyleResult(
    input: SaveTradingStyleResultInput,
): Promise<{ success: true; archetype: ArchetypeId } | { error: string }> {
    try {
        const user = await getAuthUser();
        if (!user) return { error: "Unauthorized" };

        const parsed = saveTradingStyleSchema.safeParse(input);
        if (!parsed.success) {
            return {
                error:
                    parsed.error.issues[0]?.message ||
                    "Invalid assessment answers. Please retake the quiz.",
            };
        }

        const answers = parsed.data.answers;

        // Recompute server-side — never trust the client payload.
        const archetype = computeArchetype(answers);
        const dimensions = computeDimensionScores(answers);

        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { settings: true },
        });
        const existingSettings =
            dbUser?.settings &&
            typeof dbUser.settings === "object" &&
            !Array.isArray(dbUser.settings)
                ? (dbUser.settings as Record<string, Prisma.InputJsonValue>)
                : {};

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
    } catch (error: unknown) {
        console.error("[Trading Style Save Error]:", error);
        return {
            error: "Failed to save your trading style. Please try again.",
        };
    }
}
