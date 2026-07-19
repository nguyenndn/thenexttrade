import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActivationReminderCandidates } from "@/lib/onboarding/activation-reminders.server";
import { appendActivationReminderSend } from "@/lib/onboarding/activation-reminder-state";
import {
    buildActivationEmailHtml,
    buildActivationEmailSubject,
} from "@/lib/emails/activation-reminders";
import { sendEmail } from "@/lib/services/email.service";
import { requireCronSecret } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/activation-reminders
 *
 * Cron job that calculates eligible stuck users and triggers
 * in-app notifications and transactional emails for activation.
 *
 * Schedule: Every 12 hours (or daily)
 * Auth: Bearer CRON_SECRET
 */
export async function GET(request: NextRequest) {
    const cronAuth = requireCronSecret(request);
    if (cronAuth instanceof NextResponse) return cronAuth;

    try {
        const candidates = await getActivationReminderCandidates();
        const nowStr = new Date().toISOString();
        const appUrl =
            process.env.NEXT_PUBLIC_APP_URL || "https://thenexttrade.com";

        let inAppCount = 0;
        let emailCount = 0;
        let dryRunCount = 0;

        const isDryRun =
            process.env.NODE_ENV === "development" &&
            (!process.env.SMTP_USER || !process.env.SMTP_PASS);

        for (const c of candidates) {
            // 1. Send In-App Notification (always eligible)
            let title = "";
            let message = "";
            let link = "";
            let icon = "Sparkles";

            if (c.type === "NO_ACCOUNT_24H") {
                title = "Complete your setup 🚀";
                message =
                    "Connect your trading account to start tracking trades and unlocking professional metrics.";
                link =
                    "/dashboard/accounts?action=add&source=activation-reminder";
                icon = "PlusCircle";
            } else if (c.type === "NO_FIRST_DATA_24H") {
                title = "Sync your first trade 📊";
                message =
                    c.preferredSyncMethod === "MANUAL"
                        ? "Log your first trade manually to unlock performance charts and AI insights."
                        : "Sync your first trade from MetaTrader to unlock performance charts and AI insights.";
                link =
                    c.preferredSyncMethod === "MANUAL"
                        ? "/dashboard/journal?action=log-trade"
                        : "/dashboard/accounts?setup=sync";
                icon = "BarChart3";
            } else if (c.type === "STILL_NO_FIRST_VALUE_72H") {
                title = "Unlock your AI Dashboard ✨";
                message =
                    "You're missing out on AI Trade Score, Psychology Trackers, and Weekly Performance reviews.";
                link = "/dashboard/accounts?setup=sync";
                icon = "Sparkles";
            } else if (c.type === "MOBILE_SYNC_FALLBACK") {
                title = "Finish MT5 setup on desktop 💻";
                message =
                    "Auto-syncing requires local desktop setup. Open the desktop setup link or log manually for now.";
                link =
                    "/dashboard/journal?action=log-trade&source=mobile-fallback";
                icon = "Laptop";
            }

            // Create Notification record in DB
            await prisma.notification.create({
                data: {
                    userId: c.userId,
                    type: "FEATURE_UPDATE",
                    title,
                    message,
                    link,
                    icon,
                    priority: "HIGH",
                },
            });

            inAppCount++;

            // Log the In-App Send State
            await appendActivationReminderSend(c.userId, {
                type: c.type,
                sentAt: nowStr,
                channel: "in_app",
                idempotencyKey: `${c.type}_in_app_${nowStr.split("T")[0]}`,
            });

            // 2. Send Email (if channel exists & user has email)
            if (c.channels.includes("email") && c.email) {
                const subject = buildActivationEmailSubject(c.type);

                let ctaLink = `${appUrl}${link}`;
                if (c.type === "MOBILE_SYNC_FALLBACK") {
                    const methodParam =
                        c.preferredSyncMethod === "EA_SYNC" ? "ea" : "tnt";
                    ctaLink = `${appUrl}/dashboard/accounts?setup=sync&method=${methodParam}&source=desktop-link`;
                }

                const html = buildActivationEmailHtml(
                    c.type,
                    c.name,
                    c.preferredSyncMethod,
                    ctaLink
                );

                let emailSent = false;
                if (isDryRun) {
                    console.log(
                        `[DryRun Email] To: ${c.email} | Subject: ${subject}`
                    );
                    emailSent = true;
                    dryRunCount++;
                } else {
                    emailSent = await sendEmail({
                        to: c.email,
                        subject,
                        html,
                    });
                }

                if (emailSent) {
                    emailCount++;
                    // Log the Email Send State
                    await appendActivationReminderSend(c.userId, {
                        type: c.type,
                        sentAt: nowStr,
                        channel: "email",
                        idempotencyKey: `${c.type}_email_${nowStr.split("T")[0]}`,
                    });
                }
            }
        }

        return NextResponse.json({
            success: true,
            processedCount: candidates.length,
            inAppCount,
            emailCount,
            dryRunCount,
            isDryRun,
        });
    } catch (error) {
        console.error("[Cron] Activation Reminders Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
