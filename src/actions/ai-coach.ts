"use server";

import { getAuthUser } from "@/lib/auth-cache";
import { getIntelligenceData } from "@/lib/smart-analytics";
import { parseLocalStartOfDay, parseLocalEndOfDay } from "@/lib/utils";
import { getUserProAccess } from "@/lib/pro-access";
import { prisma } from "@/lib/prisma";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

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

 try {
 return JSON.parse(clean);
 } catch (parseError) {
 console.warn("[JSON Clean Parse Failed - Attempting Fallback Parsing]:", parseError);

 // Fallback: Use Regex to extract keys
 let assessment = "Your trading patterns are generally consistent, but continue focusing on risk-reward control.";
 const assessMatch = clean.match(/"assessment"\s*:\s*"([\s\S]*?)"(?=\s*,\s*"|\s*\})/i);
 if (assessMatch && assessMatch[1]) {
 assessment = assessMatch[1].replace(/\\"/g, '"').trim();
 }

 let pattern = "Review your session statistics to identify minor discipline variances.";
 const patternMatch = clean.match(/"pattern"\s*:\s*"([\s\S]*?)"(?=\s*,\s*"|\s*\})/i);
 if (patternMatch && patternMatch[1]) {
 pattern = patternMatch[1].replace(/\\"/g, '"').trim();
 }

 let actionPlan = "Maintain a strict 1% risk target and set hard stop-losses before entry.";
 const actionMatch = clean.match(/"actionPlan"\s*:\s*"([\s\S]*?)"(?=\s*\})/i);
 if (actionMatch && actionMatch[1]) {
 actionPlan = actionMatch[1].replace(/\\"/g, '"').trim();
 }

 return {
 assessment,
 pattern,
 actionPlan
 };
 }
}

export async function generateDeepSeekInsights(
 accountId?: string,
 timezone?: string,
 dateFrom?: string,
 dateTo?: string
) {
 const user = await getAuthUser();
 if (!user) return { error: "Unauthorized" };

 // Pro access check
 const pro = await getUserProAccess(user.id);
 if (!pro.isPro) {
 return { error: "AI Coach is a Pro feature. Unlock Pro for free by verifying as a VIP trader." };
 }

 if (!DEEPSEEK_API_KEY) {
 return { error: "DEEPSEEK_API_KEY is not configured" };
 }

 try {
 const startDate = parseLocalStartOfDay(dateFrom, timezone);
 const endDate = parseLocalEndOfDay(dateTo, timezone);

 // Check cache in User settings to avoid redundant DeepSeek calls
 const dbUser = await prisma.user.findUnique({
 where: { id: user.id },
 select: { settings: true }
 });

 const existingSettings = (dbUser?.settings as Record<string, any>) || {};

 // Construct cache key based on closed trades count and last trade timestamp
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
 const currentCacheKey = `coach_${totalClosedCount}_${lastTradeTime}_${accountId || 'all'}_${dateFrom || 'all'}_${dateTo || 'all'}_${timezone || 'UTC'}`;

 const cachedData = existingSettings.cachedCoachInsights as {
 cacheKey: string;
 insight: {
 assessment: string;
 pattern: string;
 actionPlan: string;
 generatedAt: string;
 };
 } | undefined;

 if (cachedData && cachedData.cacheKey === currentCacheKey) {
 console.log("[AI Coach Insights] - Serving cached insights for key:", currentCacheKey);
 return {
 success: true,
 insight: cachedData.insight,
 isCached: true
 };
 }

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

CRITICAL: Inside the "assessment", "pattern", and "actionPlan" text strings, NEVER use raw double quotes ("). If you need to mention a term or put something in quotes, use single quotes (') instead. This is vital to keep the JSON output perfectly valid and prevent parsing errors.

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

 const parsedContent = cleanAndParseAIResponse(content);

 const finalInsight = {
 assessment: parsedContent.assessment,
 pattern: parsedContent.pattern,
 actionPlan: parsedContent.actionPlan,
 generatedAt: new Date().toISOString()
 };

 const finalCachedInsights = {
 cacheKey: currentCacheKey,
 insight: finalInsight
 };

 await prisma.user.update({
 where: { id: user.id },
 data: {
 settings: {
 ...existingSettings,
 cachedCoachInsights: finalCachedInsights
 }
 }
 });

 return {
 success: true,
 insight: finalInsight
 };

 } catch (error: any) {
 console.error("[DeepSeek Insight Error]:", error);
 return { error: "Failed to generate AI insights. Please try again." };
 }
}
