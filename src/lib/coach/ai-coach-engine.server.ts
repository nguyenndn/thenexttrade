import { executeCoachGateway } from "@/lib/ai-gateway/provider-router";

export interface WeeklyAIReviewResult {
  keepDoing: string;
  fixNext: string;
  nextActions: Array<{ label: string; detail: string }>;
}

export async function generateWeeklyAIReview(metrics: {
  totalTrades: number;
  netPnL: number;
  winRate: number;
  profitFactor: number;
  totalChecks: number;
  complianceRate: number | null;
  mostFollowedRule: { title: string; count: number } | null;
  mostBrokenRule: { title: string; count: number } | null;
  topWeaknessTitle: string | null;
}): Promise<WeeklyAIReviewResult | null> {
  // If no trades, we can't generate a meaningful review
  if (metrics.totalTrades === 0) {
    return null;
  }

  const prompt = `You are a professional forex trading coach. Review the following weekly performance metrics for a trader and provide a brief, actionable coaching plan.

## Weekly Metrics:
- Total Trades: ${metrics.totalTrades}
- Net P/L: $${metrics.netPnL.toFixed(2)}
- Win Rate: ${(metrics.winRate * 100).toFixed(1)}%
- Profit Factor: ${metrics.profitFactor.toFixed(2)}
- Rule Compliance Rate: ${metrics.complianceRate !== null ? metrics.complianceRate + '%' : 'N/A'}
- Most Broken Rule: ${metrics.mostBrokenRule ? `"${metrics.mostBrokenRule.title}" (${metrics.mostBrokenRule.count} times)` : 'None'}
- Top System Weakness: ${metrics.topWeaknessTitle || 'None detected'}

## Task:
Generate a structured JSON response containing:
1. "keepDoing": One specific strength or positive behavior they should maintain (1 short sentence). If there is no clear strength in the metrics, return an empty string or "Keep logging trades to unlock a reliable strength signal." Do not invent unproven strengths.
2. "fixNext": One specific leak, weakness, or rule break they must fix next week (1 short sentence). Must be based strictly on the metrics above.
3. "nextActions": An array of at most 2 actionable items (label and detail) to improve their trading.

## Constraints:
- Do not invent numbers or metrics not provided above.
- Do not assert Stop Loss hits, loss streaks, or rule non-compliance unless explicitly shown in the metrics.

## Output Format (JSON ONLY):
{
  "keepDoing": "String",
  "fixNext": "String",
  "nextActions": [
    {
      "label": "Short action title",
      "detail": "Brief explanation of how to execute this action"
    }
  ]
}

Respond ONLY with valid JSON. Keep the tone professional, encouraging, and direct.`;

  try {
    const gatewayResult = await executeCoachGateway({
      requestId: `coach_weekly_${Date.now()}`,
      systemPrompt: "You are a professional forex trading coach. Always respond in valid JSON format matching the instructions exactly.",
      snapshot: { prompt }, // Pass as snapshot or just combine in systemPrompt. Actually, executeCoachGateway expects snapshot to be stringified by the adapter if it's an object, but we can just use systemPrompt and snapshot as needed.
    });

    if (!gatewayResult.ok || !gatewayResult.result) {
      console.error(`[AI Coach] Gateway failed: ${gatewayResult.error_code} - ${gatewayResult.message}`);
      return null;
    }

    const responseText = gatewayResult.result;

    let parsed: WeeklyAIReviewResult;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      const cleaned = responseText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      parsed = JSON.parse(cleaned);
    }

    if (typeof parsed.keepDoing !== 'string' || typeof parsed.fixNext !== 'string' || !Array.isArray(parsed.nextActions)) {
      throw new Error("Invalid response format from AI");
    }

    parsed.nextActions = parsed.nextActions.filter((action) =>
      action &&
      typeof action.label === "string" &&
      action.label.trim().length > 0 &&
      typeof action.detail === "string" &&
      action.detail.trim().length > 0
    );

    // Limit to 2 actions to prevent UI bloat
    if (parsed.nextActions.length > 2) {
      parsed.nextActions = parsed.nextActions.slice(0, 2);
    }

    return parsed;
  } catch (error: any) {
    console.error("[AI Coach] Error generating weekly review", error);
    return null;
  }
}
