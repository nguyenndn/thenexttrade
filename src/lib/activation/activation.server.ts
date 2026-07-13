import "server-only";
import { prisma } from "@/lib/prisma";
import type { ActivationState, ActivationStep } from "./activation-types";
import { getUserTradingDataState } from "@/lib/trading-data-state";
import { getWeeklyReviewEligibility } from "@/lib/reports/weekly-review-eligibility";

export async function getActivationState(userId: string): Promise<ActivationState> {
 // Read user settings for onboarding preferences
 const user = await prisma.user.findUnique({
 where: { id: userId },
 select: { settings: true },
 });
 const settings = (user?.settings as Record<string, unknown>) || {};
 const onboarding = (settings.onboarding as { preferredSyncMethod?: string }) || {};
 const syncMethod = onboarding.preferredSyncMethod || "EA_SYNC";

 const [
 tradingDataState,
 weeklyReportCount,
 completedLessonCount,
 checkinCount,
 weeklyReviewEligibility,
 ] = await Promise.all([
 getUserTradingDataState(userId),
 prisma.tradingReport.count({ where: { userId, type: "WEEKLY" } }),
 prisma.userProgress.count({ where: { userId, isCompleted: true } }),
 prisma.edgeEvent.count({ where: { userId, eventType: "CHECKIN" } }),
 getWeeklyReviewEligibility({ userId }),
 ]);

 const accountCount = tradingDataState.accountCount;
 const hasTradeData = tradingDataState.hasTradeData;

 // Build connect step CTA based on sync preference
 let connectTitle: string;
 let connectDescription: string;
 let connectCtaLabel: string;
 let connectCtaHref: string;

 switch (syncMethod) {
    case "EA_SYNC":
      connectTitle = "Set up Trade Manager";
      connectDescription = "Attach Trade Manager EA to your MT5 chart to start auto-syncing trades.";
      connectCtaLabel = "Set Up Trade Manager";
      connectCtaHref = "/dashboard/accounts?setup=sync&method=ea";
      break;
    case "MANUAL":
      connectTitle = "Add your first account";
      connectDescription = "Add an account to organize your manual trade entries.";
      connectCtaLabel = "Add Account";
      connectCtaHref = "/dashboard/accounts?action=add";
      break;
    default: // EA fallback
      connectTitle = "Set up Trade Manager";
      connectDescription = "Install Trade Manager EA to auto-sync trades from MT5 to your dashboard.";
      connectCtaLabel = "Set Up Trade Manager";
      connectCtaHref = "/dashboard/accounts?setup=sync&method=ea";
      break;
  }

 // Build log trade step CTA based on sync preference
 const logTradeTitle = syncMethod === "MANUAL"
 ? "Log your first trade"
 : "Sync or log your first trade";
 const logTradeDescription = syncMethod === "MANUAL"
 ? "Your first trade unlocks performance stats, reports, and pattern analysis."
 : "Once connected, trades sync automatically. Or log one manually to kick things off.";

 const steps: ActivationStep[] = [
 {
 id: "CONNECT_ACCOUNT",
 title: connectTitle,
 description: connectDescription,
 ctaLabel: connectCtaLabel,
 ctaHref: connectCtaHref,
 completed: accountCount > 0,
 priority: 10,
 },
 {
 id: "LOG_FIRST_TRADE",
 title: logTradeTitle,
 description: logTradeDescription,
 ctaLabel: "Log Trade",
 ctaHref: "/dashboard/journal?action=log-trade",
 completed: hasTradeData,
 priority: 20,
 },
 {
 id: "GENERATE_WEEKLY_REVIEW",
 title: "Generate your first weekly review",
 description: "Weekly reviews turn raw trades into one clear strength, one leak, and one focus.",
 ctaLabel: "Open Reports",
 ctaHref: "/dashboard/reports?type=weekly-review",
 completed: weeklyReportCount > 0,
 priority: 30,
 available: weeklyReviewEligibility.ready,
 disabledReason: "Sync more trades before your first weekly review is ready.",
 },
 {
 id: "START_ACADEMY",
 title: "Complete your first Academy lesson",
 description: "Lessons help turn trading activity into a repeatable playbook.",
 ctaLabel: "Start Learning",
 ctaHref: "/dashboard/academy",
 completed: completedLessonCount > 0,
 priority: 40,
 },
 {
 id: "CHECK_IN",
 title: "Daily check-in",
 description: "Check-ins build consistency and feed your Edge Missions.",
 ctaLabel: "Check In",
 ctaHref: "/dashboard/settings/streak",
 completed: checkinCount > 0,
 priority: 50,
 },
 ];

 const sorted = steps.sort((a, b) => a.priority - b.priority);
 const nextStep = sorted.find((s) => !s.completed && s.available !== false) ?? null;

 return {
 steps: sorted,
 nextStep,
 completedCount: sorted.filter((s) => s.completed).length,
 totalCount: sorted.length,
 };
}
