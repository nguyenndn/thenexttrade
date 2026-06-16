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

  // 1. Rule compliance stats
  const totalUserRulesCount = await prisma.tradingRule.count({
    where: { userId },
  });

  const allPeriodChecks = await prisma.tradeRuleCheck.findMany({
    where: {
      userId,
      checkedAt: {
        gte: report.periodStart,
        lte: report.periodEnd,
      },
    },
    include: {
      tradingRule: true,
    },
  });

  const totalChecks = allPeriodChecks.length;
  const followedCount = allPeriodChecks.filter(c => c.status === "FOLLOWED").length;
  const brokenCount = allPeriodChecks.filter(c => c.status === "BROKEN").length;
  const complianceRate = (followedCount + brokenCount) > 0 
    ? Math.round((followedCount / (followedCount + brokenCount)) * 100) 
    : null;

  const followedMap: Record<string, { title: string; count: number }> = {};
  const brokenMap: Record<string, { title: string; count: number }> = {};

  allPeriodChecks.forEach((c) => {
    const title = c.tradingRule?.title || "Unknown Rule";
    if (c.status === "FOLLOWED") {
      if (!followedMap[title]) followedMap[title] = { title, count: 0 };
      followedMap[title].count++;
    } else if (c.status === "BROKEN") {
      if (!brokenMap[title]) brokenMap[title] = { title, count: 0 };
      brokenMap[title].count++;
    }
  });

  const mostFollowedRule = Object.values(followedMap).sort((a, b) => b.count - a.count)[0] || null;
  const mostBrokenRule = Object.values(brokenMap).sort((a, b) => b.count - a.count)[0] || null;

  // 2. Trade Planning stats
  const periodPlans = await prisma.tradePlan.findMany({
    where: {
      userId,
      createdAt: {
        gte: report.periodStart,
        lte: report.periodEnd,
      },
    },
  });
  const reviewedPlansCount = periodPlans.filter(p => p.status === "REVIEWED" || p.reviewedAt !== null).length;
  
  const actualTradesCount = await prisma.journalEntry.count({
    where: {
      userId,
      createdAt: {
        gte: report.periodStart,
        lte: report.periodEnd,
      },
    },
  });

  const actualTradesWithPlanCount = await prisma.journalEntry.count({
    where: {
      userId,
      createdAt: {
        gte: report.periodStart,
        lte: report.periodEnd,
      },
      tradePlan: { isNot: null },
    },
  });
  const actualTradesWithoutPlanCount = Math.max(0, actualTradesCount - actualTradesWithPlanCount);

  // Build plan details
  let title = "Execute your Consistency Checklist";
  let summary = `You completed ${report.totalTrades} trades this week with a net P/L of $${report.netPnL.toFixed(2)}. Let's refine your execution for next week.`;
  let keepDoing = "You logged your trades consistently and tracked key psychology tags.";
  let fixNext = "Maintain strict capital preservation limits.";
  
  const nextActions: Array<{ label: string; detail: string; ctaHref?: string }> = [];

  // Add rule compliance details to keepDoing / fixNext and add nextAction
  if (totalUserRulesCount === 0) {
    nextActions.push({
      label: "Create your first trading rule",
      detail: "Add starter rules or custom parameters to establish discipline and track compliance.",
      ctaHref: "/dashboard/rules"
    });
  } else if (totalChecks > 0) {
    if (complianceRate !== null) {
      keepDoing = `Your rule compliance rate was ${complianceRate}%.`;
      if (mostFollowedRule) {
        keepDoing += ` You were highly consistent with: "${mostFollowedRule.title}" (${mostFollowedRule.count} times).`;
      }
    }
    if (mostBrokenRule) {
      fixNext = `Your biggest leak came from breaking: "${mostBrokenRule.title}" (${mostBrokenRule.count} times).`;
      nextActions.push({
        label: `Enforce "${mostBrokenRule.title}"`,
        detail: `You broke this rule ${mostBrokenRule.count} times this week. Make it your primary focus to follow it next week.`,
        ctaHref: "/dashboard/rules"
      });
    }
  } else {
    keepDoing = "You have trading rules set up. Make sure to check them off inside your journal to track compliance.";
    nextActions.push({
      label: "Check rules on your trades",
      detail: "Log rule compliance checklist on each trade in your journal to build discipline data.",
      ctaHref: "/dashboard/journal"
    });
  }

  // Add trade planning details to nextActions
  if (periodPlans.length > 0 || actualTradesCount > 0) {
    const plansCount = periodPlans.length;
    const planningDetail = `You planned ${plansCount} trades and reviewed ${reviewedPlansCount}. ${actualTradesWithoutPlanCount} actual trades had no plan. Next week, plan before entry for your first 3 trades.`;
    nextActions.push({
      label: "Link and review trade plans",
      detail: planningDetail,
      ctaHref: "/dashboard/journal"
    });
  } else {
    nextActions.push({
      label: "Plan a trade before execution",
      detail: "Use the trade planning tool to outline entry, stop loss, and take profit parameters beforehand.",
      ctaHref: "/dashboard/journal"
    });
  }

  // Process dynamic signals for weaknesses if we don't have a broken rule nextAction
  if (!mostBrokenRule) {
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
      if (report.winRate > 0.50) {
        title = "Weekly Action Plan: Scale your Edge";
        summary = `Excellent consistency! Win rate at ${Math.round(report.winRate * 100)}% with profit factor of ${report.profitFactor.toFixed(2)}.`;
        keepDoing = "Fantastic plan compliance and execution quality.";
      }
    }
  } else {
    title = `Action Plan: Fix Rule Leak`;
    summary = `Your biggest leak this week came from breaking the rule: "${mostBrokenRule.title}" (${mostBrokenRule.count} times).`;
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
