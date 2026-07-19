import "server-only";
import { prisma } from "@/lib/prisma";
import type {
    DateRange,
    UserLifecycleReport,
    LifecycleStage,
    LifecycleStageStat,
    LifecycleDropoff,
} from "./types";
import { pct } from "./date-range";

export async function getUserLifecycleReport(
    range: DateRange
): Promise<UserLifecycleReport> {
    const { since } = range;
    const users = await prisma.user.findMany({
        where: { createdAt: { gte: since } },
        select: {
            id: true,
            settings: true,
            profile: { select: { id: true } },
            tradingAccounts: {
                select: {
                    id: true,
                    totalTrades: true,
                    lastSync: true,
                    balance: true,
                    status: true,
                },
            },
            journalEntries: { select: { id: true }, take: 1 },
            tradingReports: {
                select: { id: true, type: true },
                where: { type: "WEEKLY" },
                take: 1,
            },
            vipRequests: { select: { id: true, status: true }, take: 1 },
            proEntitlements: { select: { id: true, status: true }, take: 1 },
        },
        take: 5000,
    });

    const stageCounts: Record<LifecycleStage, number> = {
        "Signed Up": 0,
        "Profile Ready": 0,
        "Account Connected": 0,
        "First Trade": 0,
        "First Insight Viewed": 0,
        "Weekly Review": 0,
        "Pro Candidate": 0,
        "Pro User": 0,
        "At Risk": 0,
        Churned: 0,
    };

    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    for (const user of users) {
        const hasPro = user.proEntitlements.some(
            (p) => p.status === "ACTIVE" || p.status === "GRACE"
        );
        const hasAccount = user.tradingAccounts.length > 0;
        const hasTrades =
            user.journalEntries.length > 0 ||
            user.tradingAccounts.some((a) => a.totalTrades > 0);
        const hasWeeklyReport = user.tradingReports.length > 0;
        const hasProfile = !!user.profile;
        const hasRealAccount = user.tradingAccounts.some(
            (a) => a.balance > 0 || a.totalTrades > 5
        );
        const latestSync = user.tradingAccounts.reduce<Date | null>(
            (max, a) => {
                if (!a.lastSync) return max;
                return max && max > a.lastSync ? max : a.lastSync;
            },
            null
        );

        // Resolve onboarding settings
        const settings = (user.settings as Record<string, any>) || {};
        const onboarding = (settings.onboarding || {}) as Record<string, any>;
        const firstSession = (onboarding.firstSession || {}) as Record<
            string,
            any
        >;
        const hasViewedFirstInsight = !!(
            firstSession.firstInsightViewedAt ||
            firstSession.firstSyncCelebratedAt
        );

        let stage: LifecycleStage = "Signed Up";
        if (hasPro) stage = "Pro User";
        else if (hasTrades && hasRealAccount) stage = "Pro Candidate";
        else if (hasWeeklyReport) stage = "Weekly Review";
        else if (hasTrades && hasViewedFirstInsight)
            stage = "First Insight Viewed";
        else if (hasTrades) stage = "First Trade";
        else if (hasAccount) stage = "Account Connected";
        else if (hasProfile) stage = "Profile Ready";

        if (stage !== "Signed Up" && stage !== "Pro User") {
            if (latestSync && latestSync < thirtyDaysAgo) stage = "Churned";
            else if (latestSync && latestSync < fourteenDaysAgo)
                stage = "At Risk";
        }
        stageCounts[stage]++;
    }

    const totalUsers = users.length;
    const stageOrder: LifecycleStage[] = [
        "Signed Up",
        "Profile Ready",
        "Account Connected",
        "First Trade",
        "First Insight Viewed",
        "Weekly Review",
        "Pro Candidate",
        "Pro User",
        "At Risk",
        "Churned",
    ];
    const stages: LifecycleStageStat[] = stageOrder.map((stage) => ({
        stage,
        count: stageCounts[stage],
        percent: pct(stageCounts[stage], totalUsers),
    }));

    const funnelStages: LifecycleStage[] = [
        "Signed Up",
        "Profile Ready",
        "Account Connected",
        "First Trade",
        "First Insight Viewed",
        "Weekly Review",
        "Pro Candidate",
        "Pro User",
    ];
    const dropoffActions: Record<string, string> = {
        "Signed Up→Profile Ready": "Improve onboarding profile capture",
        "Profile Ready→Account Connected": "Improve account connect CTA",
        "Account Connected→First Trade": "Improve sync setup flow",
        "First Trade→First Insight Viewed":
            "Encourage dashboard check-in for insights",
        "First Insight Viewed→Weekly Review": "Surface weekly reports more",
        "Weekly Review→Pro Candidate": "Show Pro value proposition",
        "Pro Candidate→Pro User": "Streamline Pro request flow",
    };

    const cumulatives: number[] = [];
    let cum = 0;
    for (let i = funnelStages.length - 1; i >= 0; i--) {
        cum += stageCounts[funnelStages[i]];
        cumulatives[i] = cum;
    }

    const dropoffs: LifecycleDropoff[] = [];
    for (let i = 0; i < funnelStages.length - 1; i++) {
        const from = cumulatives[i];
        const to = cumulatives[i + 1];
        const drop = from - to;
        if (from > 0)
            dropoffs.push({
                fromStage: funnelStages[i],
                toStage: funnelStages[i + 1],
                dropCount: drop,
                dropRate: pct(drop, from),
                suggestedAction:
                    dropoffActions[
                        `${funnelStages[i]}→${funnelStages[i + 1]}`
                    ] || "Investigate",
            });
    }

    return { stages, dropoffs, totalUsers };
}
