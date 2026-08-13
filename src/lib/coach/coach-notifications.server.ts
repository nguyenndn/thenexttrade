import { prisma } from "@/lib/prisma";

export async function triggerCoachNotifications(userId: string): Promise<number> {
    const activeSignals = await prisma.traderSignal.findMany({
        where: {
            userId,
            status: "ACTIVE",
        },
    });

    if (activeSignals.length === 0) return 0;

    let triggeredCount = 0;
    const now = new Date();

    for (const signal of activeSignals) {
        const metadata = (signal.metadata as Record<string, any>) || {};
        const dedupeKey = `SIGNAL:${signal.signalType}:${signal.id}`;

        let cooldownDays = 7;
        if (signal.signalType === "SYNC_STALE") {
            cooldownDays = 1;
        } else if (signal.signalType === "NO_LESSON_STARTED") {
            cooldownDays = 14;
        }

        const lastSentStr = metadata.notificationSentAt;
        if (lastSentStr) {
            const lastSent = new Date(lastSentStr);
            const cooldownMs = cooldownDays * 24 * 60 * 60 * 1000;
            if (now.getTime() - lastSent.getTime() < cooldownMs) {
                continue;
            }
        }

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
                    title: signal.title,
                    message: signal.summary,
                    link: signal.actionHref || null,
                    icon: "Zap",
                    priority: signal.severity === "HIGH" ? "HIGH" : "NORMAL",
                    dedupeKey,
                    metadata: { signalId: signal.id, signalType: signal.signalType },
                },
                update: {}, // Atomic no-op if already created
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

    return triggeredCount;
}
