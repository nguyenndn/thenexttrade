import { computeTraderSignals } from "./signal-engine.server";

import { InsightEvidence } from "@/lib/insights/types";

export interface NextBestAction {
 id: string;
 title: string;
 description: string;
 ctaLabel: string;
 ctaHref: string;
 priority: number;
 reason: string;
 sourceSignalType?: string;
 evidence?: InsightEvidence[];
}

const PRIORITY_ORDER: Record<string, number> = {
 NO_ACCOUNT: 1,
 ACCOUNT_NEVER_SYNCED: 2,
 SYNC_STALE: 3,
 NO_FIRST_TRADE: 4,
 NO_WEEKLY_REVIEW: 5,
 NO_LESSON_STARTED: 6,
 REVENGE_SIZE_UP: 7,
 LOW_PLAN_COMPLIANCE: 8,
 LOSS_STREAK: 9,
 SL_CLUSTER: 10,
 BE_HEAVY: 11,
 WEAK_SYMBOL: 12,
 WEAK_SESSION: 13,
 RECURRING_MISTAKE: 14,
 INSUFFICIENT_DATA: 15,
};

export async function getNextBestAction(userId: string, tradingGoal?: string | null): Promise<NextBestAction> {
 // Dynamically compute the latest signals
 const signals = await computeTraderSignals(userId, { persist: true });
 const activeSignals = signals.filter(s => s.status !== "RESOLVED");

 if (activeSignals.length === 0) {
 return {
 id: "maintenance",
 title: "Consistency is your edge",
 description: "You have connected accounts, synced your trades, and are actively studying. Review your journal to find minor trade optimizations today.",
 ctaLabel: "Open Journal",
 ctaHref: "/dashboard/journal",
 priority: 99,
 reason: "All core onboarding and activation tasks are completed, and no critical trade weaknesses were detected in the last 30 days."
 };
 }

 // Sort active signals by priority order (lowest priority value is highest priority action)
 const sorted = activeSignals.sort((a, b) => {
 const pA = PRIORITY_ORDER[a.signalType] ?? 999;
 const pB = PRIORITY_ORDER[b.signalType] ?? 999;
 return pA - pB;
 });

 const top = sorted[0];

 // Apply goal-specific nudge overrides when available
 let title = top.title;
 let description = top.summary;

 if (tradingGoal) {
 const { GOAL_NUDGE_OVERRIDES } = await import("./goal-content-map");
 const goalOverrides = GOAL_NUDGE_OVERRIDES[tradingGoal];
 if (goalOverrides && goalOverrides[top.signalType]) {
 title = goalOverrides[top.signalType].title;
 description = goalOverrides[top.signalType].summary;
 }
 }

 return {
 id: top.signalType,
 title,
 description,
 ctaLabel: top.actionLabel || "Take Action",
 ctaHref: top.actionHref || "/dashboard",
 priority: PRIORITY_ORDER[top.signalType] ?? 99,
 reason: `Generated automatically from high-priority active signal: ${top.signalType}`,
 sourceSignalType: top.signalType,
 evidence: top.metadata?.evidence || top.evidence || [],
 };
}
