import { prisma } from "@/lib/prisma";
import { computeTraderSignals } from "./signal-engine.server";
import { getLearningRecommendations } from "./lesson-recommendations.server";

export async function generateWeeklyActionPlan(
 userId: string,
 reportId: string
) {
 const report = await prisma.tradingReport.findUnique({
 where: { id: reportId }
 });

 if (!report || report.type !== "WEEKLY") {
 throw new Error("Weekly action plan requires a valid weekly report.");
 }

 // Compute dynamic signals
 const signals = await computeTraderSignals(userId, { persist: true });
 
 // Resolve uncompleted academy lesson & article recommendations
 const recommendations = await getLearningRecommendations(userId, signals);

 // Build plan details
 let title = "Execute your Consistency Checklist";
 let summary = `You completed ${report.totalTrades} trades this week with a net P/L of $${report.netPnL.toFixed(2)}. Let's refine your execution for next week.`;
 let keepDoing = "You logged your trades consistently and tracked key psychology tags.";
 let fixNext = "Maintain strict capital preservation limits.";
 
 const nextActions: Array<{ label: string; detail: string; ctaHref?: string }> = [
 {
 label: "Check trade plans",
 detail: "Create and review a pre-trade checklist for every new entry next week.",
 ctaHref: "/dashboard/academy"
 }
 ];

 const activeWeaknesses = signals.filter(s => [
 "LOSS_STREAK",
 "SL_CLUSTER",
 "REVENGE_SIZE_UP",
 "LOW_PLAN_COMPLIANCE",
 "BE_HEAVY",
 "WEAK_SYMBOL"
 ].includes(s.signalType));

 if (activeWeaknesses.length > 0) {
 const topWeak = activeWeaknesses[0];
 title = `Action Plan: Resolve ${topWeak.title}`;
 summary = `Your biggest leak this week came from: ${topWeak.title}. Let's address this immediately.`;
 fixNext = topWeak.summary;
 
 if (topWeak.signalType === "REVENGE_SIZE_UP") {
 keepDoing = "Keep logging your emotions on every entry.";
 nextActions.unshift({
 label: "Impose maximum loss limit",
 detail: "Set a hard daily loss limit on your MT5 or account settings to stop revenge sizing.",
 ctaHref: "/dashboard/accounts"
 });
 } else if (topWeak.signalType === "LOSS_STREAK" || topWeak.signalType === "SL_CLUSTER") {
 nextActions.unshift({
 label: "Stop after 2 losses",
 detail: "Force a mandatory 4-hour pause after any two consecutive losses to avoid tilt.",
 ctaHref: "/dashboard/journal"
 });
 }
 } else {
 // Positive/Consistent report
 if (report.winRate > 0.50) {
 title = "Weekly Action Plan: Scale your Edge";
 summary = `Excellent consistency! Win rate at ${Math.round(report.winRate * 100)}% with profit factor of ${report.profitFactor.toFixed(2)}.`;
 keepDoing = "Fantastic plan compliance and execution quality.";
 }
 }

 // Add study action if uncompleted recommendations exist
 if (recommendations.length > 0) {
 const topRec = recommendations[0];
 nextActions.push({
 label: `Study recommended ${topRec.type === "ACADEMY_LESSON" ? "lesson" : "post"}`,
 detail: `Read "${topRec.title}" to target trading leaks.`,
 ctaHref: topRec.url
 });
 }

 const lessonSlugs = recommendations.map(r => r.slug);

 // Persist CoachActionPlan
 const plan = await prisma.coachActionPlan.upsert({
 where: {
 id: `plan-${report.id}`
 },
 update: {
 title,
 summary,
 keepDoing,
 fixNext,
 nextActions: nextActions as any,
 lessonSlugs,
 status: "ACTIVE",
 periodStart: report.periodStart,
 periodEnd: report.periodEnd
 },
 create: {
 id: `plan-${report.id}`,
 userId,
 title,
 summary,
 keepDoing,
 fixNext,
 nextActions: nextActions as any,
 lessonSlugs,
 status: "ACTIVE",
 periodStart: report.periodStart,
 periodEnd: report.periodEnd
 }
 });

 return plan;
}
