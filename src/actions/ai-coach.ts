"use server";

import { getAuthUser } from "@/lib/auth-cache";
import { getIntelligenceData } from "@/lib/smart-analytics";
import { parseLocalStartOfDay, parseLocalEndOfDay } from "@/lib/utils";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

export async function generateDeepSeekInsights(
    accountId?: string,
    timezone?: string,
    dateFrom?: string,
    dateTo?: string
) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    if (!DEEPSEEK_API_KEY) {
        return { error: "DEEPSEEK_API_KEY is not configured" };
    }

    try {
        const startDate = parseLocalStartOfDay(dateFrom, timezone);
        const endDate = parseLocalEndOfDay(dateTo, timezone);

        // Fetch Intelligence Data
        const data = await getIntelligenceData(
            user.id,
            accountId,
            startDate,
            endDate,
            timezone
        );

        if (!data.hasEnoughData) {
            return { error: "Not enough data to analyze. Minimum 30 closed trades required." };
        }

        // Format data for DeepSeek prompt
        const promptData = {
            totalTrades: data.totalAnalyzed,
            tradeFrequency: data.periodDays > 0 ? (data.totalAnalyzed / data.periodDays).toFixed(1) + " trades/day" : "N/A",
            winRate: data.quickStats.winRate.toFixed(1) + "%",
            riskRewardRatio: data.quickStats.avgRR.toFixed(2),
            tradeScore: data.tradeScore.score + "/100 (" + data.tradeScore.label + ")",
            bestSession: data.quickStats.bestSession || "N/A",
            revengeTrades: data.quickStats.revengeCount,
            stopLossDiscipline: data.quickStats.slUsageRate.toFixed(1) + "%",
            planCompliance: data.quickStats.planComplianceRate >= 0 ? data.quickStats.planComplianceRate.toFixed(1) + "%" : "N/A",
            issues: data.issues.map(i => `${i.title}: ${i.description}`),
            strengths: data.strengths.map(s => `${s.title}: ${s.description}`),
        };

        const systemPrompt = `You are an elite, no-nonsense Prop Firm Risk Manager and Trading Psychologist.
Your job is to review a trader's performance metrics and provide a blunt, highly actionable coaching brief.

Analyze the following trading data for the user:
${JSON.stringify(promptData, null, 2)}

Respond with a JSON object containing exactly these fields:
- "assessment": A short, blunt, 2-3 sentence overall assessment of their performance.
- "pattern": A 1-2 sentence description of their most dangerous weakness or strongest edge based on the data.
- "actionPlan": A specific, measurable rule they must follow for the next 7 days to improve their score.

Use a professional but strict "tough love" tone. Do not use markdown backticks in the response values.

Example JSON output format:
{
  "assessment": "Your win rate is decent, but your risk management is terrible. A 40/100 trade score indicates you are bleeding capital unnecessarily.",
  "pattern": "You have a severe revenge trading problem, with 5 trades opened immediately after a loss.",
  "actionPlan": "Implement a mandatory 30-minute walk-away rule after every losing trade."
}`;

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
                temperature: 0.7,
                max_tokens: 500
            }),
        });

        if (!res.ok) {
            const errBody = await res.text();
            console.error("DeepSeek Error:", errBody);
            throw new Error(`DeepSeek API failed (${res.status})`);
        }

        const aiData = await res.json();
        const content = aiData.choices[0]?.message?.content;
        if (!content) {
            throw new Error("No content returned from DeepSeek");
        }

        const parsedContent = JSON.parse(content);

        return {
            success: true,
            insight: {
                assessment: parsedContent.assessment,
                pattern: parsedContent.pattern,
                actionPlan: parsedContent.actionPlan,
                generatedAt: new Date().toISOString()
            }
        };

    } catch (error: any) {
        console.error("[DeepSeek Insight Error]:", error);
        return { error: "Failed to generate AI insights. Please try again." };
    }
}
