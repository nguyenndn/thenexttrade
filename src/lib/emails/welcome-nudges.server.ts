import { prisma } from "@/lib/prisma";

/**
 * Welcome Notification Sequence — In-App Re-engagement
 *
 * Sends scheduled in-app notifications to nudge new users who haven't
 * connected their trading account or logged any trades yet.
 *
 * Sequence:
 * - D0: Created by completeOnboarding() (already exists)
 * - D1: 24h after registration — "Your dashboard is waiting"
 * - D3: 72h after registration — "Here's what you're missing"
 *
 * Called by cron job: /api/cron/welcome-nudges
 */

interface WelcomeNudgeResult {
    d1Sent: number;
    d3Sent: number;
    skipped: number;
}

/**
 * Process pending welcome nudges for all eligible users.
 * Should be called by a cron job every few hours.
 */
export async function processWelcomeNudges(): Promise<WelcomeNudgeResult> {
    const now = new Date();
    const result: WelcomeNudgeResult = { d1Sent: 0, d3Sent: 0, skipped: 0 };

    // Find users created in the last 5 days who might need nudges
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

    const eligibleUsers = await prisma.user.findMany({
        where: {
            createdAt: { gte: fiveDaysAgo },
        },
        select: {
            id: true,
            createdAt: true,
            settings: true,
            _count: {
                select: {
                    journalEntries: true,
                    tradingAccounts: true,
                },
            },
        },
    });

    for (const user of eligibleUsers) {
        const settings = (user.settings as Record<string, any>) || {};
        const welcomeNudges: Record<string, boolean> =
            settings.welcomeNudges || {};
        const hoursSinceCreation =
            (now.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60);

        // Skip users who already have trades (they're activated)
        if (user._count.journalEntries > 0) {
            result.skipped++;
            continue;
        }

        // D1: 24h+ after registration, no trades, not yet sent
        if (hoursSinceCreation >= 24 && !welcomeNudges.d1Sent) {
            await prisma.notification.create({
                data: {
                    userId: user.id,
                    type: "FEATURE_UPDATE",
                    title: "Your dashboard is waiting 📊",
                    message:
                        user._count.tradingAccounts === 0
                            ? "Connect your MT5 account to start tracking trades automatically. It only takes 60 seconds."
                            : "Your account is connected! Sync your first trades to unlock Performance Charts, Trade Score, and AI insights.",
                    link:
                        user._count.tradingAccounts === 0
                            ? "/dashboard/accounts"
                            : "/dashboard",
                    icon: "BarChart3",
                    priority: "NORMAL",
                },
            });

            await updateWelcomeNudgeFlag(user.id, settings, "d1Sent");
            result.d1Sent++;
        }

        // D3: 72h+ after registration, still no trades, not yet sent
        if (hoursSinceCreation >= 72 && !welcomeNudges.d3Sent) {
            await prisma.notification.create({
                data: {
                    userId: user.id,
                    type: "FEATURE_UPDATE",
                    title: "Here's what you're missing 👀",
                    message:
                        "After just one trade, your dashboard unlocks: Performance Charts, AI Trade Score, Psychology Tracker, Session Analytics, and Weekly Reports.",
                    link: "/dashboard/accounts?setup=sync",
                    icon: "Brain",
                    priority: "NORMAL",
                },
            });

            await updateWelcomeNudgeFlag(user.id, settings, "d3Sent");
            result.d3Sent++;
        }
    }

    return result;
}

/**
 * Update a welcome nudge flag in user settings
 */
async function updateWelcomeNudgeFlag(
    userId: string,
    currentSettings: Record<string, any>,
    flag: string
): Promise<void> {
    await prisma.user.update({
        where: { id: userId },
        data: {
            settings: {
                ...currentSettings,
                welcomeNudges: {
                    ...(currentSettings.welcomeNudges || {}),
                    [flag]: true,
                },
            },
        },
    });
}
