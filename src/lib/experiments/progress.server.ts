import { prisma } from "@/lib/prisma";

export async function syncExperimentProgress(experimentId: string): Promise<void> {
    const experiment = await prisma.improvementExperiment.findUnique({
        where: { id: experimentId },
    });

    if (!experiment || experiment.status !== "ACTIVE" || !experiment.acceptedAt) {
        return;
    }

    const whereAccount = experiment.accountId
        ? { accountId: experiment.accountId, userId: experiment.userId }
        : { userId: experiment.userId };

    const followUpTrades = await prisma.journalEntry.findMany({
        where: {
            ...whereAccount,
            status: "CLOSED",
            exitDate: {
                gte: experiment.acceptedAt,
            },
        },
        select: {
            id: true,
            result: true,
            pnl: true,
            exitDate: true,
            followedPlan: true,
        },
        orderBy: { exitDate: "asc" }, // Deterministic order
    });

    const currentTradeCount = followUpTrades.length;
    const wins = followUpTrades.filter((t) => t.result === "WIN").length;
    const losses = followUpTrades.filter((t) => t.result === "LOSS").length;
    const breakEvens = followUpTrades.filter((t) => t.result === "BREAK_EVEN" || t.result === "BE_PLUS").length;
    
    const decisiveCount = wins + losses;
    const winRate = decisiveCount > 0 ? Math.round((wins / decisiveCount) * 100) : null;
    const netPnL = followUpTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const avgPnL = currentTradeCount > 0 ? Math.round((netPnL / currentTradeCount) * 100) / 100 : 0;

    const followUpData = {
        sampleSize: currentTradeCount,
        wins,
        losses,
        breakEvens,
        winRate,
        netPnL: Math.round(netPnL * 100) / 100,
        avgPnL,
        latestTradeAt: followUpTrades[followUpTrades.length - 1]?.exitDate?.toISOString() || null,
    };

    const isReady = currentTradeCount >= experiment.targetTradeCount;

    await prisma.improvementExperiment.update({
        where: { id: experimentId },
        data: {
            followUp: followUpData,
            status: isReady ? "READY_FOR_REVIEW" : "ACTIVE",
            reviewReadyAt: isReady ? new Date() : experiment.reviewReadyAt,
        },
    });

    // Emits persisted review-ready notification idempotently if target trade count reached
    if (isReady) {
        const dedupeKey = `EXPERIMENT_REVIEW_READY:${experiment.id}`;
        await prisma.notification.upsert({
            where: {
                userId_dedupeKey: {
                    userId: experiment.userId,
                    dedupeKey,
                },
            },
            create: {
                userId: experiment.userId,
                type: "FEATURE_UPDATE",
                title: "Experiment Ready for Review!",
                message: `Your experiment "${experiment.title}" has reached its target of ${experiment.targetTradeCount} closed trades. Review your results now!`,
                link: "/dashboard/reports",
                icon: "Trophy",
                priority: "HIGH",
                dedupeKey,
                metadata: { experimentId: experiment.id },
            },
            update: {}, // idempotent no-op
        });
    }
}

export async function onUserTradesUpdated(userId: string, accountId?: string): Promise<void> {
    const activeExperiments = await prisma.improvementExperiment.findMany({
        where: {
            userId,
            ...(accountId ? { accountId } : {}),
            status: "ACTIVE",
        },
        select: { id: true },
    });

    for (const exp of activeExperiments) {
        await syncExperimentProgress(exp.id);
    }
}
