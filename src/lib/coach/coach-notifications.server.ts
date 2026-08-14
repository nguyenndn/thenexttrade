import { prisma } from "@/lib/prisma";

export async function triggerCoachNotifications(userId: string): Promise<number> {
    let triggeredCount = 0;
    const now = new Date();

    // 1. Process Active Trader Signals (Leak Alerts & Activation Signals)
    const activeSignals = await prisma.traderSignal.findMany({
        where: {
            userId,
            status: "ACTIVE",
        },
    });

    for (const signal of activeSignals) {
        const metadata = (signal.metadata as Record<string, any>) || {};
        const dedupeKey = `SIGNAL:${signal.signalType}:${signal.id}`;

        let cooldownDays = 3; // Default 72h cooldown for leak signals
        if (signal.signalType === "SYNC_STALE") {
            cooldownDays = 1; // Sync issues need fast attention
        } else if (signal.signalType === "NO_LESSON_STARTED") {
            cooldownDays = 14; // Slow long-term nudge
        } else if (signal.signalType === "NO_WEEKLY_REVIEW") {
            cooldownDays = 7; // Align with the weekly review cadence
        }

        const lastSentStr = metadata.notificationSentAt;
        if (lastSentStr) {
            const lastSent = new Date(lastSentStr);
            const cooldownMs = cooldownDays * 24 * 60 * 60 * 1000;
            if (now.getTime() - lastSent.getTime() < cooldownMs) {
                continue;
            }
        }

        const formattedTitle = signal.title.startsWith("Coach")
            ? signal.title
            : `Coach Alert: ${signal.title}`;

        try {
            await prisma.notification.upsert({
                where: {
                    userId_dedupeKey: {
                        userId,
                        dedupeKey,
                    },
                },
                create: {
                    userId,
                    type: "FEATURE_UPDATE",
                    title: formattedTitle,
                    message: signal.summary,
                    link: signal.actionHref || "/dashboard?action=coach-plan",
                    icon: "Zap",
                    priority: signal.severity === "HIGH" ? "HIGH" : "NORMAL",
                    dedupeKey,
                    metadata: {
                        signalId: signal.id,
                        signalType: signal.signalType,
                        actionType: "OPEN_COACH_PLAN",
                    },
                },
                update: {}, // Atomic no-op if already exists
            });

            await prisma.traderSignal.update({
                where: { id: signal.id },
                data: {
                    metadata: {
                        ...metadata,
                        notificationSentAt: now.toISOString(),
                    },
                },
            });

            triggeredCount++;
        } catch {
            /* Duplicate notification write blocked atomically by DB constraint */
        }
    }

    // 2. Process First Insight & Actionable Patterns (TraderInsightSnapshot)
    try {
        const activeInsight = await prisma.traderInsightSnapshot.findFirst({
            where: {
                userId,
                status: "ACTIVE",
            },
            orderBy: { updatedAt: "desc" },
        });

        if (activeInsight) {
            const dedupeKey = `COACH_INSIGHT:${userId}:${activeInsight.fingerprint}`;
            const formattedTitle = activeInsight.title.startsWith("Coach")
                ? activeInsight.title
                : `Coach Plan: ${activeInsight.title}`;

            await prisma.notification.upsert({
                where: {
                    userId_dedupeKey: {
                        userId,
                        dedupeKey,
                    },
                },
                create: {
                    userId,
                    type: "FEATURE_UPDATE",
                    title: formattedTitle,
                    message: activeInsight.summary,
                    link: "/dashboard?action=coach-plan",
                    icon: "Zap",
                    priority: "NORMAL",
                    dedupeKey,
                    metadata: {
                        insightId: activeInsight.id,
                        fingerprint: activeInsight.fingerprint,
                        actionType: "OPEN_COACH_PLAN",
                    },
                },
                update: {}, // Keep existing unread state
            });

            triggeredCount++;
        }
    } catch {
        /* Duplicate notification write blocked atomically by DB constraint */
    }

    // 3. Process Improvement Experiments Ready for Review
    try {
        const reviewReadyExperiments = await prisma.improvementExperiment.findMany({
            where: {
                userId,
                status: "READY_FOR_REVIEW",
            },
        });

        for (const exp of reviewReadyExperiments) {
            const dedupeKey = `COACH_EXPERIMENT:${userId}:${exp.id}`;
            const formattedTitle = `Coach Plan: Review your "${exp.title}" results`;
            const formattedMessage = `Your experiment reached its target of ${exp.targetTradeCount} trades. Check your before & after results now.`;

            await prisma.notification.upsert({
                where: {
                    userId_dedupeKey: {
                        userId,
                        dedupeKey,
                    },
                },
                create: {
                    userId,
                    type: "FEATURE_UPDATE",
                    title: formattedTitle,
                    message: formattedMessage,
                    link: "/dashboard/reports?type=experiments",
                    icon: "Zap",
                    priority: "NORMAL",
                    dedupeKey,
                    metadata: {
                        experimentId: exp.id,
                        actionType: "NAVIGATE",
                    },
                },
                update: {},
            });

            triggeredCount++;
        }
    } catch {
        /* Duplicate notification write blocked atomically by DB constraint */
    }

    return triggeredCount;
}
