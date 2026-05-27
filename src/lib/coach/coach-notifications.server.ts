import { prisma } from "@/lib/prisma";

/**
 * Checks active TraderSignals for a user and triggers system notifications 
 * if they pass the strict anti-spam cooldown rules.
 */
export async function triggerCoachNotifications(userId: string): Promise<number> {
    // 1. Fetch active signals for the user
    const activeSignals = await prisma.traderSignal.findMany({
        where: {
            userId,
            status: "ACTIVE"
        }
    });

    if (activeSignals.length === 0) return 0;

    let triggeredCount = 0;
    const now = new Date();

    for (const signal of activeSignals) {
        // Retrieve metadata safely
        const metadata = (signal.metadata as Record<string, any>) || {};
        const lastSentStr = metadata.notificationSentAt;
        
        let cooldownDays = 7; // Default: 7 days
        
        if (signal.signalType === "SYNC_STALE") {
            cooldownDays = 1; // Sync stale cooldown: 24 hours
        } else if (signal.signalType === "NO_LESSON_STARTED") {
            cooldownDays = 14; // Lesson recommendation cooldown: 14 days
        }

        // 2. Cooldown Validation
        if (lastSentStr) {
            const lastSent = new Date(lastSentStr);
            const cooldownMs = cooldownDays * 24 * 60 * 60 * 1000;
            if (now.getTime() - lastSent.getTime() < cooldownMs) {
                // Within cooldown period, skip notifying
                continue;
            }
        }

        // 3. Trigger Notification
        // We use FEATURE_UPDATE enum type to avoid PostgreSQL enum migrations 
        // while perfectly maintaining database compatibility
        await prisma.notification.create({
            data: {
                userId,
                type: "FEATURE_UPDATE",
                title: signal.title,
                message: signal.summary,
                link: signal.actionHref || null,
                icon: "Zap", // Gold styling spark/lightning zap
                priority: signal.severity === "HIGH" ? "HIGH" : "NORMAL",
            }
        });

        // 4. Update Signal Metadata with lastSent timestamp
        const updatedMetadata = {
            ...metadata,
            notificationSentAt: now.toISOString()
        };

        await prisma.traderSignal.update({
            where: { id: signal.id },
            data: {
                metadata: updatedMetadata
            }
        });

        triggeredCount++;
    }

    return triggeredCount;
}
