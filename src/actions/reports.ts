"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { ReportType } from "@prisma/client";
import { recordEdgeEventOnce } from "@/lib/edge-awards";
import { generateWeeklyActionPlan } from "@/lib/coach/weekly-action-plan.server";

export async function getReports(type: ReportType, page = 1, limit = 10) {
    const user = await getAuthUser();
    if (!user) return { reports: [], total: 0 };

    const [reports, total] = await Promise.all([
        prisma.tradingReport.findMany({
            where: { userId: user.id, type },
            orderBy: { periodStart: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.tradingReport.count({
            where: { userId: user.id, type },
        }),
    ]);

    // Fetch corresponding coach plans
    const reportIds = reports.map(r => `plan-${r.id}`);
    const plans = await prisma.coachActionPlan.findMany({
        where: { id: { in: reportIds } }
    });
    
    const planMap = new Map(plans.map(p => [p.id, p]));
    const reportsWithPlans = [];

    for (const r of reports) {
        let coachPlan = planMap.get(`plan-${r.id}`) || null;
        if (!coachPlan && type === "WEEKLY") {
            try {
                coachPlan = await generateWeeklyActionPlan(user.id, r.id);
            } catch (err) {
                console.error(`Auto generate weekly action plan error [type=${type}, userId=${user.id}, reportId=${r.id}]:`, err);
                if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test" || process.env.USER_QA_EMAIL) {
                    throw err;
                }
            }
        }
        reportsWithPlans.push({
            ...r,
            periodStart: r.periodStart.toISOString(),
            periodEnd: r.periodEnd.toISOString(),
            emailSentAt: r.emailSentAt?.toISOString() || null,
            createdAt: r.createdAt.toISOString(),
            coachPlan: coachPlan ? {
                ...coachPlan,
                periodStart: coachPlan.periodStart?.toISOString() || null,
                periodEnd: coachPlan.periodEnd?.toISOString() || null,
                createdAt: coachPlan.createdAt.toISOString(),
                completedAt: coachPlan.completedAt?.toISOString() || null
            } : null
        });
    }

    return {
        reports: reportsWithPlans,
        total,
    };
}

export async function getLatestReport(type: ReportType) {
    const user = await getAuthUser();
    if (!user) return null;

    const report = await prisma.tradingReport.findFirst({
        where: { userId: user.id, type },
        orderBy: { periodStart: "desc" },
    });

    if (!report) return null;

    return {
        ...report,
        periodStart: report.periodStart.toISOString(),
        periodEnd: report.periodEnd.toISOString(),
        emailSentAt: report.emailSentAt?.toISOString() || null,
        createdAt: report.createdAt.toISOString(),
    };
}

export async function generateMyWeeklyReview(accountId?: string) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    const { generateWeeklyReportForUser } = await import(
        "@/lib/services/report-generator.service"
    );

    // Get account timezone if provided
    let timezone = "Etc/UTC";
    if (accountId) {
        const account = await prisma.tradingAccount.findFirst({
            where: { id: accountId, userId: user.id },
            select: { timezone: true },
        });
        if (account?.timezone) timezone = account.timezone;
    }

    try {
        const result = await generateWeeklyReportForUser(
            user.id,
            accountId,
            timezone,
            true // current week
        );

        if (result.skipped && result.empty) {
            return {
                error: "No trades found for this week yet.",
                code: "NO_TRADES_THIS_WEEK",
                ctaHref: "/dashboard/journal?action=log-trade",
                ctaLabel: "Log Trade",
            };
        }

        if (result.skipped) {
            // Check for claimable missions even on existing reports
            const { getUserMissions } = await import("@/lib/services/edge-missions.service");
            const missions = await getUserMissions(user.id);
            const claimable = missions.filter((m) =>
                ["FIRST_WEEKLY_REVIEW", "WEEKLY_REVIEW"].includes(m.missionId) && m.completed && !m.claimed
            );
            return {
                success: true,
                reportId: result.reportId,
                alreadyExists: true,
                message: "Report already exists for this period.",
                missionReward: claimable.length > 0
                    ? {
                        claimable: true,
                        missionIds: claimable.map((m) => m.missionId),
                        totalEdge: claimable.reduce((sum, m) => sum + m.def.xpReward, 0),
                        ctaHref: "/dashboard/missions",
                        ctaLabel: "Claim Edge",
                    }
                    : null,
            };
        }

        // Record mission event for weekly review generation
        if (result.reportId) {
            await recordEdgeEventOnce({
                userId: user.id,
                eventType: "WEEKLY_REVIEW_GENERATED",
                sourceType: "TradingReport",
                sourceId: result.reportId,
                xpAwarded: 0,
            }).catch(() => {}); // Non-blocking
        }

        // Detect claimable missions after event recording
        const { getUserMissions } = await import("@/lib/services/edge-missions.service");
        const missions = await getUserMissions(user.id);
        const claimable = missions.filter((m) =>
            ["FIRST_WEEKLY_REVIEW", "WEEKLY_REVIEW"].includes(m.missionId) && m.completed && !m.claimed
        );

        return {
            success: true,
            reportId: result.reportId,
            missionEventRecorded: true,
            missionReward: claimable.length > 0
                ? {
                    claimable: true,
                    missionIds: claimable.map((m) => m.missionId),
                    totalEdge: claimable.reduce((sum, m) => sum + m.def.xpReward, 0),
                    ctaHref: "/dashboard/missions",
                    ctaLabel: "Claim Edge",
                }
                : null,
        };
    } catch (error) {
        console.error("Generate weekly review error:", error);
        return { error: "Failed to generate report. Please try again." };
    }
}

export async function generateMyMonthlyReview(accountId?: string) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    const { generateMonthlyReportForUser } = await import(
        "@/lib/services/report-generator.service"
    );

    let timezone = "Etc/UTC";
    if (accountId) {
        const account = await prisma.tradingAccount.findFirst({
            where: { id: accountId, userId: user.id },
            select: { timezone: true },
        });
        if (account?.timezone) timezone = account.timezone;
    }

    try {
        const result = await generateMonthlyReportForUser(
            user.id,
            accountId,
            timezone,
            true // current month
        );

        if (result.skipped && result.empty) {
            return {
                error: "No trades found for this month yet.",
                code: "NO_TRADES_THIS_MONTH",
                ctaHref: "/dashboard/journal?action=log-trade",
                ctaLabel: "Log Trade",
            };
        }

        if (result.skipped) {
            return {
                success: true,
                reportId: result.reportId,
                message: "Report already exists for this period.",
            };
        }

        return { success: true, reportId: result.reportId };
    } catch (error) {
        console.error("Generate monthly review error:", error);
        return { error: "Failed to generate report. Please try again." };
    }
}
