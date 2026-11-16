"use server";

import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { getUserProAccess } from "@/lib/pro-access";
import { executeAiGateway } from "@/lib/ai-gateway/provider-router";
import { reserveAiRequest } from "@/lib/ai-gateway/quota-service";
import { randomUUID } from "node:crypto";
import {
    convertToUsdEquivalent,
    normalizeLotSize,
} from "@/lib/utils/cent-account";
import { toPublicErrorMessage } from "@/lib/errors/public-error";

// Map biases to lessons in the academy (fallback default values)
const BIAS_LESSON_MAP = {
    LOSS_AVERSION: {
        slug: "stop-loss-your-trading-insurance-policy",
        fallbackId: "cmnj448mv0019pjyx9hh0pedg",
        title: "Stop Loss — Your Trading Insurance Policy",
    },
    FOMO: {
        slug: "fomo-why-i-missed-it-leads-to-blowing-your-account",
        fallbackId: "cmnj448nz003ppjyxbd7xayvn",
        title: "FOMO — Why I Missed It Leads to Blowing Your Account",
    },
    OVERCONFIDENCE: {
        slug: "discipline-how-to-follow-your-plan-when-everything-screams-dont",
        fallbackId: "cmnj448nx003lpjyxmve8lp9m",
        title: "Discipline — How to Follow Your Plan When Everything Screams Don't",
    },
    EMOTIONAL_CONTAGION: {
        slug: "revenge-trading-you-lost-now-you-want-it-back-dont",
        fallbackId: "cmnj448nz003rpjyxo1wir7sx",
        title: "Revenge Trading — You Lost, Now You Want It Back (Don't)",
    },
};

interface BiasScores {
    lossAversion: number;
    fomo: number;
    overconfidence: number;
    emotionalContagion: number;
}

type DominantBiasKey =
    | "LOSS_AVERSION"
    | "FOMO"
    | "OVERCONFIDENCE"
    | "EMOTIONAL_CONTAGION";

interface ParsedBiasResponse {
    biases: BiasScores;
    dominantBias: DominantBiasKey;
    assessment: string;
    actionPlan: string;
}

function stripMarkdownBold(text: string): string {
    return text.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*\*/g, "").trim();
}

function toClampedScore(val: unknown): number {
    const num =
        typeof val === "number"
            ? Math.round(val)
            : typeof val === "string"
              ? parseInt(val, 10)
              : NaN;
    if (Number.isNaN(num)) return 50;
    return Math.min(100, Math.max(0, num));
}

function cleanAndParseAIResponse(content: string): ParsedBiasResponse {
    let clean = content.trim();

    if (clean.startsWith("```")) {
        const firstNewline = clean.indexOf("\n");
        if (firstNewline !== -1) {
            clean = clean.substring(firstNewline + 1);
        }
        if (clean.endsWith("```")) {
            clean = clean.substring(0, clean.length - 3);
        }
        clean = clean.trim();
    }

    let rawObj: Record<string, unknown> | null = null;
    try {
        const candidate = JSON.parse(clean);
        if (candidate && typeof candidate === "object") {
            rawObj = candidate as Record<string, unknown>;
        }
    } catch (parseError) {
        console.warn(
            "[JSON Clean Parse Failed - Attempting Fallback Parsing]:",
            parseError
        );

        let dominantBias = "LOSS_AVERSION";
        const domMatch = clean.match(/"dominantBias"\s*:\s*"([^"]+)"/i);
        if (domMatch && domMatch[1]) {
            const val = domMatch[1].toUpperCase();
            if (
                [
                    "LOSS_AVERSION",
                    "FOMO",
                    "OVERCONFIDENCE",
                    "EMOTIONAL_CONTAGION",
                ].includes(val)
            ) {
                dominantBias = val;
            }
        }

        const biases: BiasScores = {
            lossAversion: 50,
            fomo: 50,
            overconfidence: 50,
            emotionalContagion: 50,
        };

        const laMatch = clean.match(/"lossAversion"\s*:\s*(\d+)/i);
        if (laMatch) biases.lossAversion = toClampedScore(laMatch[1]);

        const fomoMatch = clean.match(/"fomo"\s*:\s*(\d+)/i);
        if (fomoMatch) biases.fomo = toClampedScore(fomoMatch[1]);

        const ocMatch = clean.match(/"overconfidence"\s*:\s*(\d+)/i);
        if (ocMatch) biases.overconfidence = toClampedScore(ocMatch[1]);

        const ecMatch = clean.match(/"emotionalContagion"\s*:\s*(\d+)/i);
        if (ecMatch) biases.emotionalContagion = toClampedScore(ecMatch[1]);

        let assessment =
            "You are exhibiting moderate behavioral biases that are impacting your trading plan consistency. Focus on following your predefined rules strictly.";
        const assessMatch = clean.match(
            /"assessment"\s*:\s*"([\s\S]*?)"(?=\s*,\s*"|\s*\})/i
        );
        if (assessMatch && assessMatch[1]) {
            assessment = assessMatch[1].replace(/\\"/g, '"').trim();
        }

        let actionPlan =
            "Enforce a mandatory cooldown after any trade outcome and stick to a 1% risk limit per trade.";
        const actionMatch = clean.match(
            /"actionPlan"\s*:\s*"([\s\S]*?)"(?=\s*\})/i
        );
        if (actionMatch && actionMatch[1]) {
            actionPlan = actionMatch[1].replace(/\\"/g, '"').trim();
        }

        rawObj = {
            biases,
            dominantBias,
            assessment,
            actionPlan,
        };
    }

    const parsed = rawObj || {};
    const nestedBiases =
        parsed.biases && typeof parsed.biases === "object"
            ? (parsed.biases as Record<string, unknown>)
            : null;

    const biases: BiasScores = nestedBiases
        ? {
              lossAversion: toClampedScore(
                  nestedBiases.lossAversion ??
                      nestedBiases.loss_aversion ??
                      nestedBiases.lossAversionLevel
              ),
              fomo: toClampedScore(
                  nestedBiases.fomo ?? nestedBiases.fomoLevel
              ),
              overconfidence: toClampedScore(
                  nestedBiases.overconfidence ??
                      nestedBiases.over_confidence ??
                      nestedBiases.overconfidenceLevel
              ),
              emotionalContagion: toClampedScore(
                  nestedBiases.emotionalContagion ??
                      nestedBiases.emotional_contagion ??
                      nestedBiases.emotionalContagionLevel
              ),
          }
        : {
              lossAversion: toClampedScore(
                  parsed.lossAversion ?? parsed.loss_aversion
              ),
              fomo: toClampedScore(parsed.fomo),
              overconfidence: toClampedScore(
                  parsed.overconfidence ?? parsed.over_confidence
              ),
              emotionalContagion: toClampedScore(
                  parsed.emotionalContagion ?? parsed.emotional_contagion
              ),
          };

    const rawAssessment =
        (typeof parsed.assessment === "string" && parsed.assessment) ||
        (typeof parsed.coaching_feedback === "string" &&
            parsed.coaching_feedback) ||
        (typeof parsed.coaching === "string" && parsed.coaching) ||
        "You are exhibiting moderate behavioral biases that are impacting your trading plan consistency. Focus on following your predefined rules strictly.";

    const rawActionPlan =
        (typeof parsed.actionPlan === "string" && parsed.actionPlan) ||
        (typeof parsed.action_plan === "string" && parsed.action_plan) ||
        "Enforce a mandatory cooldown after any trade outcome and stick to a 1% risk limit per trade.";

    const rawDominant = String(
        parsed.dominantBias ?? parsed.dominant_bias ?? "LOSS_AVERSION"
    ).toUpperCase();
    const dominantBias: DominantBiasKey = (
        [
            "LOSS_AVERSION",
            "FOMO",
            "OVERCONFIDENCE",
            "EMOTIONAL_CONTAGION",
        ] as const
    ).includes(rawDominant as DominantBiasKey)
        ? (rawDominant as DominantBiasKey)
        : "LOSS_AVERSION";

    return {
        biases,
        dominantBias,
        assessment: stripMarkdownBold(rawAssessment),
        actionPlan: stripMarkdownBold(rawActionPlan),
    };
}

export async function analyzeCognitiveBiases(accountId?: string) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    // Pro access check
    const pro = await getUserProAccess(user.id);
    if (!pro.isPro) {
        return {
            error: "Cognitive Bias Profiler is a Pro feature.",
            isProUpgradeCTA: true,
        };
    }

    const normalizedAccountId =
        accountId && accountId !== "all" ? accountId : undefined;

    // Check cache in User settings to avoid redundant AI calls
    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { settings: true },
    });

    const existingSettings =
        (dbUser?.settings as Record<string, unknown>) || {};

    // Construct cache key based on trades count and last trade timestamp
    const cacheCheck = await prisma.journalEntry.findFirst({
        where: {
            userId: user.id,
            status: "CLOSED",
            ...(normalizedAccountId ? { accountId: normalizedAccountId } : {}),
        },
        orderBy: { entryDate: "desc" },
        select: { id: true, entryDate: true },
    });

    const totalClosedCount = await prisma.journalEntry.count({
        where: {
            userId: user.id,
            status: "CLOSED",
            ...(normalizedAccountId ? { accountId: normalizedAccountId } : {}),
        },
    });

    const lastTradeTime = cacheCheck?.entryDate
        ? new Date(cacheCheck.entryDate).getTime()
        : 0;
    const currentCacheKey = `bias_${totalClosedCount}_${lastTradeTime}_${normalizedAccountId || "all"}`;

    const cachedData = existingSettings.cachedBiasProfile as
        | {
              cacheKey: string;
              biases: BiasScores;
              dominantBias: DominantBiasKey;
              assessment: string;
              actionPlan: string;
              recommendedLesson: {
                  id: string;
                  title: string;
                  slug: string;
                  path: string;
              };
              generatedAt: string;
          }
        | undefined;

    if (cachedData && cachedData.cacheKey === currentCacheKey) {
        return {
            success: true,
            biases: cachedData.biases,
            dominantBias: cachedData.dominantBias,
            assessment: stripMarkdownBold(cachedData.assessment || ""),
            actionPlan: stripMarkdownBold(cachedData.actionPlan || ""),
            recommendedLesson: cachedData.recommendedLesson,
            generatedAt: cachedData.generatedAt,
            isCached: true,
        };
    }

    try {
        // Fetch closed trades with emotional tags
        const trades = await prisma.journalEntry.findMany({
            where: {
                userId: user.id,
                status: "CLOSED",
                ...(normalizedAccountId
                    ? { accountId: normalizedAccountId }
                    : {}),
            },
            orderBy: { entryDate: "desc" },
            take: 50,
            select: {
                id: true,
                pnl: true,
                commission: true,
                swap: true,
                result: true,
                entryDate: true,
                exitDate: true,
                lotSize: true,
                emotionBefore: true,
                emotionAfter: true,
                confidenceLevel: true,
                followedPlan: true,
                symbol: true,
                account: {
                    select: {
                        currency: true,
                        server: true,
                    },
                },
            },
        });

        // We need at least some records to build a meaningful bias profile
        const minRequired = 5;
        if (trades.length < minRequired) {
            return {
                error: `Not enough data to analyze. Please add or sync at least ${minRequired} closed trades in your journal first.`,
                hasEnoughData: false,
            };
        }

        // Aggregate statistics to send to DeepSeek
        let totalPnL = 0;
        let wins = 0;
        let losses = 0;
        let followedPlanCount = 0;
        let totalPlanAnswered = 0;
        let totalConfidence = 0;
        let confidenceCount = 0;

        const emotionBeforeMap: Record<string, number> = {};
        const emotionAfterMap: Record<string, number> = {};
        let revengeTriggers = 0;
        let consecutiveLosses = 0;
        let maxConsecutiveLosses = 0;
        let sizeUpAfterLoss = 0;

        const sortedTrades = [...trades].sort(
            (a, b) =>
                new Date(a.entryDate).getTime() -
                new Date(b.entryDate).getTime()
        );

        const isMultiAccount = !normalizedAccountId;
        const getEffectiveLotSize = (t: (typeof sortedTrades)[number]) =>
            isMultiAccount
                ? normalizeLotSize(t.lotSize || 0, {
                      symbol: t.symbol,
                      currency: t.account?.currency,
                      server: t.account?.server,
                  })
                : t.lotSize || 0;

        for (let i = 0; i < sortedTrades.length; i++) {
            const t = sortedTrades[i];
            const rawNetPnl =
                (t.pnl || 0) + (t.commission || 0) + (t.swap || 0);
            const netTradePnl = isMultiAccount
                ? convertToUsdEquivalent(
                      rawNetPnl,
                      t.account?.currency,
                      t.account?.server
                  )
                : rawNetPnl;
            totalPnL += netTradePnl;
            if (t.result === "WIN") wins++;
            if (t.result === "LOSS") losses++;

            if (t.followedPlan !== null) {
                totalPlanAnswered++;
                if (t.followedPlan) followedPlanCount++;
            }

            if (t.confidenceLevel !== null) {
                totalConfidence += t.confidenceLevel;
                confidenceCount++;
            }

            if (t.emotionBefore) {
                emotionBeforeMap[t.emotionBefore] =
                    (emotionBeforeMap[t.emotionBefore] || 0) + 1;
                if (
                    t.emotionBefore.toLowerCase() === "fomo" ||
                    t.emotionBefore.toLowerCase() === "revenge"
                ) {
                    revengeTriggers++;
                }
            }
            if (t.emotionAfter) {
                emotionAfterMap[t.emotionAfter] =
                    (emotionAfterMap[t.emotionAfter] || 0) + 1;
            }

            // Streak calculation
            if (t.result === "LOSS") {
                consecutiveLosses++;
                maxConsecutiveLosses = Math.max(
                    maxConsecutiveLosses,
                    consecutiveLosses
                );
            } else {
                consecutiveLosses = 0;
            }

            // Martingale detection (sizing up after loss)
            if (i > 0) {
                const prev = sortedTrades[i - 1];
                const prevLots = getEffectiveLotSize(prev);
                const curLots = getEffectiveLotSize(t);
                if (prev.result === "LOSS" && prevLots > 0 && curLots > prevLots * 1.3) {
                    sizeUpAfterLoss++;
                }
            }
        }

        const avgConfidence =
            confidenceCount > 0
                ? (totalConfidence / confidenceCount).toFixed(1)
                : "N/A";
        const planCompliance =
            totalPlanAnswered > 0
                ? ((followedPlanCount / totalPlanAnswered) * 100).toFixed(1) +
                  "%"
                : "N/A";
        const winRate =
            trades.length > 0
                ? ((wins / trades.length) * 100).toFixed(1) + "%"
                : "0%";

        const prepData = {
            totalTrades: trades.length,
            winRate,
            totalPnL,
            avgConfidence,
            planCompliance,
            emotionsLoggedBefore: emotionBeforeMap,
            emotionsLoggedAfter: emotionAfterMap,
            revengeOrFomoTriggers: revengeTriggers,
            maxConsecutiveLosses,
            sizeUpAfterLossCount: sizeUpAfterLoss,
        };

        const systemPrompt = `You are a world-class Trading Psychologist and Performance Coach specializing in behavioral biases.
Analyze the following trading journal psychology aggregate data and determine the exact cognitive bias profiles for the trader.

Trading Data:
${JSON.stringify(prepData, null, 2)}

Evaluate four specific biases:
1. Loss Aversion: Fearing losses more than seeking gains (e.g. holding onto losing trades too long, hoping for a trend reversal, or cutting winning trades too early out of anxiety).
2. FOMO: Fear of Missing Out (entering trades due to impatience, chasing prices, or logging 'fomo' emotions).
3. Overconfidence: Sizing up inappropriately, taking trades without plans, ignoring rules after wins.
4. Emotional Contagion: Let emotional states (e.g., anxiety, greed, stress) directly rule entry or exit quality.

Return a JSON object containing exactly these fields:
- "biases": An object containing percentage levels (integers 0 to 100) for: "lossAversion", "fomo", "overconfidence", "emotionalContagion".
- "dominantBias": The string name of the dominant bias (MUST be exactly one of: "LOSS_AVERSION", "FOMO", "OVERCONFIDENCE", "EMOTIONAL_CONTAGION").
- "assessment": A short, direct, 2-3 sentence coaching feedback about their mental errors.
- "actionPlan": A specific, tactical rule they must follow this week to improve their mindset.

CRITICAL: Inside the "assessment" and "actionPlan" text strings, NEVER use raw double quotes ("). If you need to mention a term or put something in quotes, use single quotes (') instead. This is vital to keep the JSON output perfectly valid and prevent parsing errors.

Example JSON output format:
{
 "biases": {
 "lossAversion": 75,
 "fomo": 40,
 "overconfidence": 20,
 "emotionalContagion": 65
 },
 "dominantBias": "LOSS_AVERSION",
 "assessment": "You have a strong tendency to choke on losing trades, holding them in hope of a reversal while cutting your winners too early to lock in safety. This behavior is bleeding your account slowly despite a healthy win rate.",
 "actionPlan": "Set an absolute max loss per trade and step away from the desk immediately once it hits. No exception."
}

Ensure your response is valid raw JSON, with no markdown code blocks (\`\`\`json).`;

        const requestId = `bias_${randomUUID()}`;
        const reservation = await reserveAiRequest({
            requestId,
            userId: user.id,
            symbol: normalizedAccountId || "MULTI",
            timeframe: "ANALYSIS",
            analysisMode: "COGNITIVE_BIAS",
            promptVersion: "cognitive-bias-v1",
            taskKey: "COGNITIVE_BIAS",
        });

        if (reservation.status === "QUOTA_EXCEEDED") {
            return {
                error: "Daily AI Cognitive Bias quota reached for your plan. Please try again tomorrow.",
            };
        }
        if (reservation.status !== "RESERVED") {
            return { error: "This AI Cognitive Bias request could not be started." };
        }

        const gatewayResult = await executeAiGateway({
            requestId,
            userId: user.id,
            snapshot: prepData,
            systemPrompt,
            taskKey: "COGNITIVE_BIAS",
            skipTradingSchemaValidation: true,
        });

        if (!gatewayResult.ok || !gatewayResult.rawResult) {
            console.error("Cognitive Bias Gateway Error:", gatewayResult.message);
            throw new Error(gatewayResult.message || "AI Gateway execution failed.");
        }

        const rawContent = gatewayResult.rawResult;
        const content = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);

        const parsed = cleanAndParseAIResponse(content);
        const dominant: keyof typeof BIAS_LESSON_MAP =
            parsed.dominantBias || "LOSS_AVERSION";
        const lessonMeta =
            BIAS_LESSON_MAP[dominant] || BIAS_LESSON_MAP.LOSS_AVERSION;

        // Query actual lesson from database to supply precise ID & path
        const actualLesson = await prisma.lesson.findUnique({
            where: { slug: lessonMeta.slug },
            select: { id: true, title: true, slug: true },
        });

        const finalLesson = {
            id: actualLesson?.id || lessonMeta.fallbackId,
            title: actualLesson?.title || lessonMeta.title,
            slug: actualLesson?.slug || lessonMeta.slug,
            path: `/dashboard/academy/lessons/${actualLesson?.slug || lessonMeta.slug}`,
        };

        // Save recommendation and cached profile to user settings to avoid redundant API calls
        const finalCachedProfile = {
            cacheKey: currentCacheKey,
            biases: parsed.biases,
            dominantBias: dominant,
            assessment: parsed.assessment,
            actionPlan: parsed.actionPlan,
            recommendedLesson: finalLesson,
            generatedAt: new Date().toISOString(),
        };

        await prisma.user.update({
            where: { id: user.id },
            data: {
                settings: JSON.parse(
                    JSON.stringify({
                        ...existingSettings,
                        aiRecommendedLessonId: finalLesson.id,
                        aiRecommendedLessonSlug: finalLesson.slug,
                        cachedBiasProfile: finalCachedProfile,
                    })
                ),
            },
        });

        return {
            success: true,
            biases: parsed.biases,
            dominantBias: dominant,
            assessment: parsed.assessment,
            actionPlan: parsed.actionPlan,
            recommendedLesson: finalLesson,
            generatedAt: finalCachedProfile.generatedAt,
        };
    } catch (error: unknown) {
        console.error("[AI Cognitive Bias Error]:", error);
        return {
            error: toPublicErrorMessage(
                error,
                "Failed to generate AI Bias Profile. Please try again."
            ),
        };
    }
}
