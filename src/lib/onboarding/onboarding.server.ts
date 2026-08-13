import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/services/email.service";
import { renderWelcomeEmailHtml } from "@/lib/email-lab/sample-data";
import { WELCOME_EMAIL_D0 } from "@/lib/emails/welcome-sequence";
import { canSendEmailCategory } from "@/lib/email/preferences";

/**
 * Onboarding state stored in User.settings.onboarding
 */
export interface OnboardingState {
    /** Which step the user has reached (1-4) */
    lastCompletedStep?: number;
    /** Trading goal chosen in step 2 */
    tradingGoal?: string;
    /** Preferred sync method chosen in step 3 */
    preferredSyncMethod?: "EA_SYNC" | "MANUAL";
    /** When onboarding was completed */
    completedAt?: string;
    /** When onboarding was skipped */
    skippedAt?: string;
}

/**
 * Read onboarding state from User.settings.onboarding
 */
export async function getOnboardingState(
    userId: string
): Promise<OnboardingState> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { settings: true },
    });

    const settings = (user?.settings as Record<string, unknown>) || {};
    return (settings.onboarding as OnboardingState) || {};
}

/**
 * Merge a patch into User.settings.onboarding
 * Preserves all existing settings (e.g. adminNotes)
 */
export async function updateOnboardingSettings(
    userId: string,
    patch: Partial<OnboardingState>
): Promise<void> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { settings: true },
    });

    const existingSettings = (user?.settings as Record<string, unknown>) || {};
    const existingOnboarding =
        (existingSettings.onboarding as OnboardingState) || {};

    await prisma.user.update({
        where: { id: userId },
        data: {
            settings: {
                ...existingSettings,
                onboarding: {
                    ...existingOnboarding,
                    ...patch,
                },
            },
        },
    });
}

/**
 * Mark onboarding as completed.
 *
 * Idempotent: re-completing onboarding (e.g. an interrupted save retried by the
 * client) must not fire a second welcome notification or a second welcome email.
 */
export async function completeOnboarding(userId: string): Promise<void> {
    const current = await getOnboardingState(userId);
    if (current.completedAt) return;

    await updateOnboardingSettings(userId, {
        completedAt: new Date().toISOString(),
        lastCompletedStep: 4,
    });

    // Create welcome notification so the bell is never empty for new users
    await prisma.notification.create({
        data: {
            userId,
            type: "FEATURE_UPDATE",
            title: "Welcome to TheNextTrade! 🎉",
            message:
                "Your trading command center is ready. Connect your MT5 account to start syncing trades automatically, or explore Academy to sharpen your edge.",
            link: "/dashboard/accounts",
            icon: "Rocket",
            priority: "NORMAL",
        },
    });

    // D0 welcome email (docs/EMAIL.md — "Welcome email after successful
    // verification"). Fire-and-forget: a transport failure must never break
    // onboarding. Respects the user's welcome email preference.
    await sendWelcomeEmailOnCompletion(userId);
}

/**
 * Send the D0 welcome email once after onboarding completes.
 * Swallows all failures — email is a bonus, not a blocker.
 */
async function sendWelcomeEmailOnCompletion(userId: string): Promise<void> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, name: true, settings: true },
        });
        if (!user?.email) return;
        if (!canSendEmailCategory(user.settings, "welcome")) return;

        await sendEmail({
            to: user.email,
            subject: WELCOME_EMAIL_D0.subject,
            html: renderWelcomeEmailHtml(
                WELCOME_EMAIL_D0,
                user.name || "Trader"
            ),
        });
    } catch {
        /* never break onboarding on email failure */
    }
}

/**
 * Mark onboarding as skipped
 */
export async function skipOnboarding(userId: string): Promise<void> {
    await updateOnboardingSettings(userId, {
        skippedAt: new Date().toISOString(),
    });
}

/**
 * Check if onboarding is completed or skipped
 */
export async function isOnboardingDone(userId: string): Promise<boolean> {
    const state = await getOnboardingState(userId);
    return !!(state.completedAt || state.skippedAt);
}
