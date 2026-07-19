import { prisma } from "@/lib/prisma";
import type { ActivationReminderSend } from "./activation-reminder-state";

export interface ReminderCandidate {
    userId: string;
    email: string | null;
    name: string | null;
    type:
        | "NO_ACCOUNT_24H"
        | "NO_FIRST_DATA_24H"
        | "STILL_NO_FIRST_VALUE_72H"
        | "MOBILE_SYNC_FALLBACK";
    preferredSyncMethod: "EA_SYNC" | "MANUAL";
    channels: Array<"in_app" | "email">;
}

/**
 * Computes list of users eligible for onboarding activation reminders
 */
export async function getActivationReminderCandidates(): Promise<
    ReminderCandidate[]
> {
    const now = new Date();

    // We scan users registered within the last 10 days
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

    const users = await prisma.user.findMany({
        where: {
            createdAt: { gte: tenDaysAgo },
        },
        include: {
            tradingAccounts: {
                select: {
                    id: true,
                    totalTrades: true,
                },
            },
            _count: {
                select: {
                    journalEntries: true,
                    tradingAccounts: true,
                },
            },
        },
    });

    const candidates: ReminderCandidate[] = [];

    for (const user of users) {
        const settings = (user.settings as Record<string, any>) || {};
        const onboarding = (settings.onboarding as Record<string, any>) || {};
        const activationReminders =
            (onboarding.activationReminders as Record<string, any>) || {};
        const mobileSyncFallback =
            (onboarding.mobileSyncFallback as Record<string, any>) || {};
        const preferredSyncMethod = onboarding.preferredSyncMethod || "EA_SYNC";

        // 1. Check if user already reached first value
        const hasAccounts = user.tradingAccounts.length > 0;
        const hasTrades =
            user._count.journalEntries > 0 ||
            user.tradingAccounts.some((acc) => acc.totalTrades > 0);

        if (hasTrades) {
            continue; // Skip already active users
        }

        // 2. Check if user snoozed/dismissed reminders recently
        if (activationReminders.dismissedUntil) {
            const dismissedUntilDate = new Date(
                activationReminders.dismissedUntil
            );
            if (dismissedUntilDate > now) {
                continue; // Skip snoozed users
            }
        }

        const sentList: ActivationReminderSend[] =
            activationReminders.sent || [];
        const hoursSinceCreation =
            (now.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60);

        // 3. Email sending cap: Max 2 activation emails in the first 7 days
        const emailsInLast7Days = sentList.filter((s) => {
            const sentDate = new Date(s.sentAt);
            return (
                s.channel === "email" &&
                now.getTime() - sentDate.getTime() <= 7 * 24 * 60 * 60 * 1000
            );
        });

        const isEmailPrefsEnabled =
            !settings.emailPreferences ||
            (settings.emailPreferences.marketing !== false &&
                settings.emailPreferences.activation !== false);

        const canSendEmail =
            isEmailPrefsEnabled && emailsInLast7Days.length < 2;
        const channels: Array<"in_app" | "email"> = ["in_app"];
        if (canSendEmail) {
            channels.push("email");
        }

        // 4. Check eligibility for each state in order of specificity

        // Type A: MOBILE_SYNC_FALLBACK
        if (mobileSyncFallback.firstSeenAt && !hasTrades) {
            const fallbackSeenDate = new Date(mobileSyncFallback.firstSeenAt);
            const hoursSinceFallback =
                (now.getTime() - fallbackSeenDate.getTime()) / (1000 * 60 * 60);

            const alreadySent = sentList.some(
                (s) => s.type === "MOBILE_SYNC_FALLBACK"
            );
            if (hoursSinceFallback >= 24 && !alreadySent) {
                candidates.push({
                    userId: user.id,
                    email: user.email,
                    name: user.name,
                    type: "MOBILE_SYNC_FALLBACK",
                    preferredSyncMethod,
                    channels,
                });
                continue;
            }
        }

        // Type B: STILL_NO_FIRST_VALUE_72H (Registration over 72 hours ago)
        if (hoursSinceCreation >= 72) {
            const alreadySent = sentList.some(
                (s) => s.type === "STILL_NO_FIRST_VALUE_72H"
            );
            if (!alreadySent) {
                candidates.push({
                    userId: user.id,
                    email: user.email,
                    name: user.name,
                    type: "STILL_NO_FIRST_VALUE_72H",
                    preferredSyncMethod,
                    channels,
                });
                continue;
            }
        }

        // Type C: NO_FIRST_DATA_24H (Has account, no trades, over 24 hours ago)
        if (hoursSinceCreation >= 24 && hasAccounts) {
            const alreadySent = sentList.some(
                (s) => s.type === "NO_FIRST_DATA_24H"
            );
            if (!alreadySent) {
                candidates.push({
                    userId: user.id,
                    email: user.email,
                    name: user.name,
                    type: "NO_FIRST_DATA_24H",
                    preferredSyncMethod,
                    channels,
                });
                continue;
            }
        }

        // Type D: NO_ACCOUNT_24H (No account, over 24 hours ago)
        if (hoursSinceCreation >= 24 && !hasAccounts) {
            const alreadySent = sentList.some(
                (s) => s.type === "NO_ACCOUNT_24H"
            );
            if (!alreadySent) {
                candidates.push({
                    userId: user.id,
                    email: user.email,
                    name: user.name,
                    type: "NO_ACCOUNT_24H",
                    preferredSyncMethod,
                    channels,
                });
                continue;
            }
        }
    }

    return candidates;
}
