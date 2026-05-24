"use server";

import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { getUserProAccess } from "@/lib/pro-access";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

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

function cleanAndParseAIResponse(content: string) {
    let clean = content.trim();

    // Strip markdown code fences if present
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

    let parsed: any = null;
    try {
        parsed = JSON.parse(clean);
    } catch (parseError) {
        console.warn("[JSON Clean Parse Failed - Attempting Fallback Parsing]:", parseError);

        // Fallback: Use Regex to extract keys
        let dominantBias = "LOSS_AVERSION";
        const domMatch = clean.match(/"dominantBias"\s*:\s*"([^"]+)"/i);
        if (domMatch && domMatch[1]) {
            const val = domMatch[1].toUpperCase();
            if (["LOSS_AVERSION", "FOMO", "OVERCONFIDENCE", "EMOTIONAL_CONTAGION"].includes(val)) {
                dominantBias = val;
            }
        }

        const biases = {
            lossAversion: 50,
            fomo: 50,
            overconfidence: 50,
            emotionalContagion: 50
        };

        const laMatch = clean.match(/"lossAversion"\s*:\s*(\d+)/i);
        if (laMatch) biases.lossAversion = Math.min(100, Math.max(0, parseInt(laMatch[1])));

        const fomoMatch = clean.match(/"fomo"\s*:\s*(\d+)/i);
        if (fomoMatch) biases.fomo = Math.min(100, Math.max(0, parseInt(fomoMatch[1])));

        const ocMatch = clean.match(/"overconfidence"\s*:\s*(\d+)/i);
        if (ocMatch) biases.overconfidence = Math.min(100, Math.max(0, parseInt(ocMatch[1])));

        const ecMatch = clean.match(/"emotionalContagion"\s*:\s*(\d+)/i);
        if (ecMatch) biases.emotionalContagion = Math.min(100, Math.max(0, parseInt(ecMatch[1])));

        let assessment = "You are exhibiting moderate behavioral biases that are impacting your trading plan consistency. Focus on following your predefined rules strictly.";
        const assessMatch = clean.match(/"assessment"\s*:\s*"([\s\S]*?)"(?=\s*,\s*"|\s*\})/i);
        if (assessMatch && assessMatch[1]) {
            assessment = assessMatch[1].replace(/\\"/g, '"').trim();
        }

        let actionPlan = "Enforce a mandatory cooldown after any trade outcome and stick to a 1% risk limit per trade.";
        const actionMatch = clean.match(/"actionPlan"\s*:\s*"([\s\S]*?)"(?=\s*\})/i);
        if (actionMatch && actionMatch[1]) {
            actionPlan = actionMatch[1].replace(/\\"/g, '"').trim();
        }

        parsed = {
            biases,
            dominantBias,
            assessment,
            actionPlan
        };
    }

    // --- Strict Normalization Layer ---
    if (!parsed || typeof parsed !== "object") {
        parsed = {};
    }

    if (!parsed.biases || typeof parsed.biases !== "object") {
        parsed.biases = {
            lossAversion: parsed.lossAversion ?? parsed.loss_aversion ?? 50,
            fomo: parsed.fomo ?? 50,
            overconfidence: parsed.overconfidence ?? parsed.over_confidence ?? 50,
            emotionalContagion: parsed.emotionalContagion ?? parsed.emotional_contagion ?? 50
        };
    } else {
        parsed.biases = {
            lossAversion: parsed.biases.lossAversion ?? parsed.biases.loss_aversion ?? parsed.biases.lossAversionLevel ?? 50,
            fomo: parsed.biases.fomo ?? parsed.biases.fomoLevel ?? 50,
            overconfidence: parsed.biases.overconfidence ?? parsed.biases.over_confidence ?? parsed.biases.overconfidenceLevel ?? 50,
            emotionalContagion: parsed.biases.emotionalContagion ?? parsed.biases.emotional_contagion ?? parsed.biases.emotionalContagionLevel ?? 50
        };
    }

    // Clamp values between 0 and 100
    parsed.biases.lossAversion = Math.min(100, Math.max(0, parseInt(parsed.biases.lossAversion) || 50));
    parsed.biases.fomo = Math.min(100, Math.max(0, parseInt(parsed.biases.fomo) || 50));
    parsed.biases.overconfidence = Math.min(100, Math.max(0, parseInt(parsed.biases.overconfidence) || 50));
    parsed.biases.emotionalContagion = Math.min(100, Math.max(0, parseInt(parsed.biases.emotionalContagion) || 50));

    // Normalize assessment
    parsed.assessment = parsed.assessment ?? parsed.coaching_feedback ?? parsed.coaching ?? "You are exhibiting moderate behavioral biases that are impacting your trading plan consistency. Focus on following your predefined rules strictly.";
    
    // Normalize actionPlan
    parsed.actionPlan = parsed.actionPlan ?? parsed.action_plan ?? "Enforce a mandatory cooldown after any trade outcome and stick to a 1% risk limit per trade.";

    // Normalize dominantBias
    let dominantBias = (parsed.dominantBias ?? parsed.dominant_bias ?? "LOSS_AVERSION").toUpperCase();
    if (!["LOSS_AVERSION", "FOMO", "OVERCONFIDENCE", "EMOTIONAL_CONTAGION"].includes(dominantBias)) {
        dominantBias = "LOSS_AVERSION";
    }
    parsed.dominantBias = dominantBias;

    return parsed;
}

export async function analyzeCognitiveBiases(accountId?: string) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    // Pro access check
    const pro = await getUserProAccess(user.id);
    if (!pro.isPro) {
        return { 
            error: "Cognitive Bias Profiler is a Pro feature.",
            isProUpgradeCTA: true
        };
    }

    if (!DEEPSEEK_API_KEY) {
        return { error: "DEEPSEEK_API_KEY is not configured" };
    }

    // Check cache in User settings to avoid redundant DeepSeek calls
    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { settings: true }
    });

    const existingSettings = (dbUser?.settings as Record<string, any>) || {};

    // Construct cache key based on trades count and last trade timestamp
    const cacheCheck = await prisma.journalEntry.findFirst({
        where: {
            userId: user.id,
            status: "CLOSED",
            ...(accountId ? { accountId } : {}),
        },
        orderBy: { entryDate: "desc" },
        select: { id: true, entryDate: true }
    });

    const totalClosedCount = await prisma.journalEntry.count({
        where: {
            userId: user.id,
            status: "CLOSED",
            ...(accountId ? { accountId } : {}),
        }
    });

    const lastTradeTime = cacheCheck?.entryDate ? new Date(cacheCheck.entryDate).getTime() : 0;
    const currentCacheKey = `bias_${totalClosedCount}_${lastTradeTime}_${accountId || 'all'}`;

    const cachedData = existingSettings.cachedBiasProfile as {
        cacheKey: string;
        biases: any;
        dominantBias: string;
        assessment: string;
        actionPlan: string;
        recommendedLesson: any;
        generatedAt: string;
    } | undefined;

    if (cachedData && cachedData.cacheKey === currentCacheKey) {
        console.log("[AI Cognitive Bias Profiler] - Serving cached profile for key:", currentCacheKey);
        return {
            success: true,
            biases: cachedData.biases,
            dominantBias: cachedData.dominantBias,
            assessment: cachedData.assessment,
            actionPlan: cachedData.actionPlan,
            recommendedLesson: cachedData.recommendedLesson,
            generatedAt: cachedData.generatedAt,
            isCached: true
        };
    }

    try {
        // Fetch closed trades with emotional tags
        const trades = await prisma.journalEntry.findMany({
            where: {
                userId: user.id,
                status: "CLOSED",
                ...(accountId ? { accountId } : {}),
            },
            orderBy: { entryDate: "desc" },
            take: 50, // Analyze recent 50 trades for high relevancy
            select: {
                id: true,
                pnl: true,
                result: true,
                entryDate: true,
                exitDate: true,
                lotSize: true,
                emotionBefore: true,
                emotionAfter: true,
                confidenceLevel: true,
                followedPlan: true,
                symbol: true,
            },
        });

        // We need at least some records to build a meaningful bias profile
        const minRequired = 5;
        if (trades.length < minRequired) {
            return { 
                error: `Not enough data to analyze. Please add or sync at least ${minRequired} closed trades in your journal first.`,
                hasEnoughData: false 
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

        const sortedTrades = [...trades].sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());

        for (let i = 0; i < sortedTrades.length; i++) {
            const t = sortedTrades[i];
            totalPnL += t.pnl || 0;
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
                emotionBeforeMap[t.emotionBefore] = (emotionBeforeMap[t.emotionBefore] || 0) + 1;
                if (t.emotionBefore.toLowerCase() === "fomo" || t.emotionBefore.toLowerCase() === "revenge") {
                    revengeTriggers++;
                }
            }
            if (t.emotionAfter) {
                emotionAfterMap[t.emotionAfter] = (emotionAfterMap[t.emotionAfter] || 0) + 1;
            }

            // Streak calculation
            if (t.result === "LOSS") {
                consecutiveLosses++;
                maxConsecutiveLosses = Math.max(maxConsecutiveLosses, consecutiveLosses);
            } else {
                consecutiveLosses = 0;
            }

            // Martingale detection (sizing up after loss)
            if (i > 0) {
                const prev = sortedTrades[i - 1];
                if (prev.result === "LOSS" && t.lotSize > prev.lotSize * 1.3) {
                    sizeUpAfterLoss++;
                }
            }
        }

        const avgConfidence = confidenceCount > 0 ? (totalConfidence / confidenceCount).toFixed(1) : "N/A";
        const planCompliance = totalPlanAnswered > 0 ? ((followedPlanCount / totalPlanAnswered) * 100).toFixed(1) + "%" : "N/A";
        const winRate = trades.length > 0 ? ((wins / trades.length) * 100).toFixed(1) + "%" : "0%";

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

        const res = await fetch("https://api.deepseek.com/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
            },
            body: JSON.stringify({
                model: "deepseek-v4-flash",
                messages: [
                    { role: "system", content: "You are a JSON-only API. You must return valid JSON." },
                    { role: "user", content: systemPrompt }
                ],
                response_format: { type: "json_object" },
                temperature: 0.5,
                max_tokens: 600
            }),
            signal: AbortSignal.timeout(30000), // Protect against latency spikes, standard 30s timeout
        });

        if (!res.ok) {
            const errBody = await res.text();
            console.error("DeepSeek Bias Profiler Error:", errBody);
            throw new Error(`DeepSeek API failed (${res.status})`);
        }

        const aiData = await res.json();
        const content = aiData.choices[0]?.message?.content;
        if (!content) {
            throw new Error("No content returned from DeepSeek");
        }

        const parsed = cleanAndParseAIResponse(content);
        const dominant: keyof typeof BIAS_LESSON_MAP = parsed.dominantBias || "LOSS_AVERSION";
        const lessonMeta = BIAS_LESSON_MAP[dominant] || BIAS_LESSON_MAP.LOSS_AVERSION;

        // Query actual lesson from database to supply precise ID & path
        const actualLesson = await prisma.lesson.findUnique({
            where: { slug: lessonMeta.slug },
            select: { id: true, title: true, slug: true }
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
            generatedAt: new Date().toISOString()
        };

        await prisma.user.update({
            where: { id: user.id },
            data: {
                settings: {
                    ...existingSettings,
                    aiRecommendedLessonId: finalLesson.id,
                    aiRecommendedLessonSlug: finalLesson.slug,
                    cachedBiasProfile: finalCachedProfile
                }
            }
        });

        return {
            success: true,
            biases: parsed.biases,
            dominantBias: dominant,
            assessment: parsed.assessment,
            actionPlan: parsed.actionPlan,
            recommendedLesson: finalLesson,
            generatedAt: finalCachedProfile.generatedAt
        };

    } catch (error: any) {
        console.error("[AI Cognitive Bias Error]:", error);
        return { error: `Failed to generate AI Bias Profile: ${error.message || error}. Please try again.` };
    }
}
