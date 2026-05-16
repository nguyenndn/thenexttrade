import "server-only";
import { prisma } from "@/lib/prisma";
import type { ActivationState, ActivationStep } from "./activation-types";

export async function getActivationState(userId: string): Promise<ActivationState> {
  const [
    accountCount,
    tradeCount,
    weeklyReportCount,
    completedLessonCount,
    checkinCount,
  ] = await Promise.all([
    prisma.tradingAccount.count({ where: { userId } }),
    prisma.journalEntry.count({ where: { userId } }),
    prisma.tradingReport.count({ where: { userId, type: "WEEKLY" } }),
    prisma.userProgress.count({ where: { userId, isCompleted: true } }),
    prisma.edgeEvent.count({ where: { userId, eventType: "CHECKIN" } }),
  ]);

  const steps: ActivationStep[] = [
    {
      id: "CONNECT_ACCOUNT",
      title: "Connect your first account",
      description: "Connect MT5 or add a manual account so your dashboard has a real source of truth.",
      ctaLabel: "Add Account",
      ctaHref: "/dashboard/accounts?action=add",
      completed: accountCount > 0,
      priority: 10,
    },
    {
      id: "LOG_FIRST_TRADE",
      title: "Log your first trade",
      description: "Your first trade unlocks performance stats, reports, and trading pattern analysis.",
      ctaLabel: "Log Trade",
      ctaHref: "/dashboard/journal?action=log-trade",
      completed: tradeCount > 0,
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
      title: "Do your first check-in",
      description: "Check-ins build consistency and feed your Edge Missions.",
      ctaLabel: "Check In",
      ctaHref: "/dashboard/settings/streak",
      completed: checkinCount > 0,
      priority: 50,
    },
  ];

  const sorted = steps.sort((a, b) => a.priority - b.priority);
  const nextStep = sorted.find((s) => !s.completed) ?? null;

  return {
    steps: sorted,
    nextStep,
    completedCount: sorted.filter((s) => s.completed).length,
    totalCount: sorted.length,
  };
}
