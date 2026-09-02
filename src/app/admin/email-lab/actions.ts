"use server";

import { z } from "zod";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import {
    sendEmailWithDetails,
    buildReportEmailHtml,
    buildNudgeEmailHtml,
    buildUnifiedEmailHtml,
    buildEALicenseEmailHtml,
    buildEAUpdateEmailHtml,
    buildAcademyCertificateEmailHtml,
    buildMilestoneAchievementEmailHtml,
    buildSignupOtpEmailHtml,
    buildResendOtpEmailHtml,
    buildMagicLinkEmailHtml,
    buildForgotPasswordEmailHtml,
    buildAdminResetPasswordEmailHtml,
    buildVipTrialEndingSoonEmailHtml,
    buildVipTrialEndedEmailHtml,
    buildVipInactivityWarningEmailHtml,
    buildVipPolicyPausedEmailHtml,
    buildVipFundingGraceEmailHtml,
    buildVipSupportSyncResultEmailHtml,
} from "@/lib/services/email.service";
import {
    buildActivationEmailHtml,
    buildActivationEmailSubject,
} from "@/lib/emails/activation-reminders";
import {
    getSampleReportEmailData,
    getSampleActivationLink,
    renderWelcomePreviewEmail,
    getSampleEALicenseData,
    getSampleEAUpdateData,
    getSampleAcademyCertificateData,
    getSampleMilestoneData,
    getSampleSignupOtpData,
    getSampleResendOtpData,
    getSampleMagicLinkData,
    getSampleForgotPasswordData,
    getSampleAdminResetData,
    getSampleVipTrialEndingSoonData,
    getSampleVipTrialEndedData,
    getSampleVipInactivityWarningData,
    getSampleVipPolicyPausedData,
    getSampleVipFundingGraceData,
    getSampleVipSupportSyncSuccessData,
    getSampleVipSupportSyncFailedData,
} from "@/lib/email-lab/sample-data";

export type EmailLabTemplateId =
    | "smtp_smoke"
    | "weekly_report_ready"
    | "monthly_report_ready"
    | "weekly_no_trades"
    | "monthly_no_trades"
    | "activation_no_account_24h"
    | "activation_no_first_data_24h"
    | "activation_still_no_first_value_72h"
    | "mobile_sync_fallback_tnt"
    | "mobile_sync_fallback_ea"
    | "welcome_d0_preview"
    | "welcome_d1_preview"
    | "welcome_d3_preview"
    | "ea_license_delivery"
    | "ea_update_release"
    | "academy_certificate_issued"
    | "milestone_achievement"
    | "signup_otp"
    | "resend_otp"
    | "magic_link"
    | "forgot_password"
    | "admin_reset"
    | "vip_trial_ending_soon"
    | "vip_trial_ended"
    | "vip_inactivity_warning"
    | "vip_policy_paused"
    | "vip_funding_grace"
    | "vip_support_sync_success"
    | "vip_support_sync_failed";

interface SendEmailLabResult {
    success: boolean;
    message: string;
    subject?: string;
}

interface RenderPreviewResult {
    success: boolean;
    message?: string;
    subject?: string;
    html?: string;
    text?: string;
}

// ─── Template Resolution Helper ─────────────────────────────────────────────

function resolveTemplateContent(templateId: EmailLabTemplateId): {
    subject: string;
    html: string;
    text?: string;
} {
    switch (templateId) {
        case "smtp_smoke": {
            const subject = "SMTP Smoke Test 🔥";
            const smokeBodyHtml = `
  <div style="text-align: center; padding: 12px 0;">
    <h2 style="color: #F59E0B; margin-top: 0; font-size: 22px; font-weight: 800; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">SMTP Connection Check</h2>
    <p style="color: #475569; line-height: 1.6; font-size: 15px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; margin-top: 16px;">This is a test email sent from the <strong>Email Lab</strong> at ${new Date().toLocaleString()}.</p>
    <p style="color: #475569; line-height: 1.6; font-size: 15px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">If you are seeing this email, your SMTP relay host and credentials are configured correctly and active.</p>
  </div>
  `;
            const html = buildUnifiedEmailHtml({
                subject: "SMTP Connection Check",
                bodyHtml: smokeBodyHtml,
            });
            const text = `SMTP Connection Check\n\nThis is a test email sent from the Email Lab at ${new Date().toLocaleString()}.`;
            return { subject, html, text };
        }

        case "weekly_report_ready":
            return {
                subject: "Weekly Trading Report Ready 📈",
                html: buildReportEmailHtml(getSampleReportEmailData("WEEKLY")),
            };

        case "monthly_report_ready":
            return {
                subject: "Monthly Trading Report Ready 📈",
                html: buildReportEmailHtml(getSampleReportEmailData("MONTHLY")),
            };

        case "weekly_no_trades":
            return {
                subject: "No Trades This Week 📊",
                html: buildNudgeEmailHtml("Email Lab Trader", "WEEKLY"),
            };

        case "monthly_no_trades":
            return {
                subject: "No Trades This Month 📊",
                html: buildNudgeEmailHtml("Email Lab Trader", "MONTHLY"),
            };

        case "activation_no_account_24h":
            return {
                subject: buildActivationEmailSubject("NO_ACCOUNT_24H"),
                html: buildActivationEmailHtml(
                    "NO_ACCOUNT_24H",
                    "Email Lab Trader",
                    "MANUAL",
                    getSampleActivationLink("NO_ACCOUNT_24H", "MANUAL")
                ),
            };

        case "activation_no_first_data_24h":
            return {
                subject: buildActivationEmailSubject("NO_FIRST_DATA_24H"),
                html: buildActivationEmailHtml(
                    "NO_FIRST_DATA_24H",
                    "Email Lab Trader",
                    "EA_SYNC",
                    getSampleActivationLink("NO_FIRST_DATA_24H", "EA_SYNC")
                ),
            };

        case "activation_still_no_first_value_72h":
            return {
                subject: buildActivationEmailSubject("STILL_NO_FIRST_VALUE_72H"),
                html: buildActivationEmailHtml(
                    "STILL_NO_FIRST_VALUE_72H",
                    "Email Lab Trader",
                    "EA_SYNC",
                    getSampleActivationLink("STILL_NO_FIRST_VALUE_72H", "EA_SYNC")
                ),
            };

        case "mobile_sync_fallback_tnt":
        case "mobile_sync_fallback_ea":
            return {
                subject: buildActivationEmailSubject("MOBILE_SYNC_FALLBACK"),
                html: buildActivationEmailHtml(
                    "MOBILE_SYNC_FALLBACK",
                    "Email Lab Trader",
                    "EA_SYNC",
                    getSampleActivationLink("MOBILE_SYNC_FALLBACK", "EA_SYNC")
                ),
            };

        case "welcome_d0_preview": {
            const d0 = renderWelcomePreviewEmail("d0");
            return { subject: d0.subject, html: d0.html };
        }

        case "welcome_d1_preview": {
            const d1 = renderWelcomePreviewEmail("d1");
            return { subject: d1.subject, html: d1.html };
        }

        case "welcome_d3_preview": {
            const d3 = renderWelcomePreviewEmail("d3");
            return { subject: d3.subject, html: d3.html };
        }

        case "ea_license_delivery":
            return {
                subject: "Your GoldScalperNinja Pro MT5 Lifetime License Key 🔑",
                html: buildEALicenseEmailHtml(getSampleEALicenseData()),
            };

        case "ea_update_release":
            return {
                subject: "Update Available: GoldScalperNinja Pro v2.5.0 🚀",
                html: buildEAUpdateEmailHtml(getSampleEAUpdateData()),
            };

        case "academy_certificate_issued":
            return {
                subject: "Your Academy Graduation Certificate is Ready! 🎓",
                html: buildAcademyCertificateEmailHtml(
                    getSampleAcademyCertificateData()
                ),
            };

        case "milestone_achievement":
            return {
                subject: "🏆 Milestone Unlocked: 100-Trade Discipline Club!",
                html: buildMilestoneAchievementEmailHtml(
                    getSampleMilestoneData()
                ),
            };

        case "signup_otp": {
            const data = getSampleSignupOtpData();
            return {
                subject: `Verify your email for TheNextTrade (${data.otpCode}) ✉️`,
                html: buildSignupOtpEmailHtml(data),
            };
        }

        case "resend_otp": {
            const data = getSampleResendOtpData();
            return {
                subject: `Your new verification code (${data.otpCode}) 🔄`,
                html: buildResendOtpEmailHtml(data),
            };
        }

        case "magic_link":
            return {
                subject: "🪄 Your 1-Click Login Link for TheNextTrade",
                html: buildMagicLinkEmailHtml(getSampleMagicLinkData()),
            };

        case "forgot_password":
            return {
                subject: "Reset your TheNextTrade password 🔑",
                html: buildForgotPasswordEmailHtml(getSampleForgotPasswordData()),
            };

        case "admin_reset": {
            const data = getSampleAdminResetData();
            return {
                subject: "🛡️ Password Recovery Link from TheNextTrade Admin",
                html: buildAdminResetPasswordEmailHtml(data),
            };
        }
        case "vip_trial_ending_soon": {
            const data = getSampleVipTrialEndingSoonData();
            return {
                subject: "Your 7-day VIP trial ends soon — connect a funded MT5 account to keep it free",
                html: buildVipTrialEndingSoonEmailHtml(data),
            };
        }
        case "vip_trial_ended": {
            const data = getSampleVipTrialEndedData();
            return {
                subject: "Your VIP trial has ended — connect MT5 to restore Pro access",
                html: buildVipTrialEndedEmailHtml(data),
            };
        }
        case "vip_inactivity_warning": {
            const data = getSampleVipInactivityWarningData();
            return {
                subject: "No trades in 7+ days — trade to keep your VIP status active",
                html: buildVipInactivityWarningEmailHtml(data),
            };
        }
        case "vip_policy_paused": {
            const data = getSampleVipPolicyPausedData();
            return {
                subject: "VIP access paused — trade 2.0 lots in 30 days to restore instantly",
                html: buildVipPolicyPausedEmailHtml(data),
            };
        }
        case "vip_funding_grace": {
            const data = getSampleVipFundingGraceData();
            return {
                subject: "Action required: Top up to $300 within 7 days to maintain VIP",
                html: buildVipFundingGraceEmailHtml(data),
            };
        }
        case "vip_support_sync_success": {
            const data = getSampleVipSupportSyncSuccessData();
            return {
                subject: `Support-Sync Batch Completed — ${data.syncedTradesCount} Trades Synced`,
                html: buildVipSupportSyncResultEmailHtml(data),
            };
        }
        case "vip_support_sync_failed": {
            const data = getSampleVipSupportSyncFailedData();
            return {
                subject: "Support-Sync Update: Action required for your MT5 account",
                html: buildVipSupportSyncResultEmailHtml(data),
            };
        }
        default:
            throw new Error(`Unknown template ID: ${templateId}`);
    }
}

// ─── Render Live Preview Action ─────────────────────────────────────────────

export async function renderEmailLabPreview(input: {
    templateId: EmailLabTemplateId;
}): Promise<RenderPreviewResult> {
    try {
        const user = await getAuthUser();
        if (!user) {
            return { success: false, message: "Unauthorized" };
        }

        const profile = await prisma.profile.findUnique({
            where: { userId: user.id },
            select: { role: true },
        });

        if (profile?.role !== "ADMIN") {
            return {
                success: false,
                message: "Forbidden: Admin role required",
            };
        }

        if (process.env.ENABLE_EMAIL_TEST_PAGE !== "true") {
            return {
                success: false,
                message: "Email test page is disabled in configuration",
            };
        }

        const content = resolveTemplateContent(input.templateId);
        return {
            success: true,
            subject: content.subject,
            html: content.html,
            text: content.text,
        };
    } catch (error: any) {
        console.error("[EMAIL_LAB_PREVIEW_ERROR]", error);
        return {
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Failed to render preview",
        };
    }
}

// ─── Send Test Email Action ─────────────────────────────────────────────────

export async function sendEmailLabTest(input: {
    templateId: EmailLabTemplateId;
    to?: string;
}): Promise<SendEmailLabResult> {
    try {
        // 1. Authorize admin
        const user = await getAuthUser();
        if (!user) {
            return { success: false, message: "Unauthorized" };
        }

        const profile = await prisma.profile.findUnique({
            where: { userId: user.id },
            select: { role: true },
        });

        if (profile?.role !== "ADMIN") {
            return {
                success: false,
                message: "Forbidden: Admin role required",
            };
        }

        // 2. Check test page enabled
        if (process.env.ENABLE_EMAIL_TEST_PAGE !== "true") {
            return {
                success: false,
                message: "Email test page is disabled in configuration",
            };
        }

        // Hard safety: never dispatch real SMTP in production unless the
        // operator explicitly opts in.
        if (
            process.env.NODE_ENV === "production" &&
            process.env.EMAIL_TEST_ALLOW_PRODUCTION !== "true"
        ) {
            return {
                success: false,
                message: "Email dispatch is disabled in production",
            };
        }

        // 3. Resolve recipient
        let recipient = process.env.EMAIL_TEST_TO || "";
        const allowCustom = process.env.EMAIL_TEST_ALLOW_CUSTOM_TO === "true";

        if (allowCustom && input.to) {
            const emailValidation = z.string().email().safeParse(input.to);
            if (!emailValidation.success) {
                return {
                    success: false,
                    message: "Invalid custom recipient email address",
                };
            }
            recipient = emailValidation.data;
        }

        if (!recipient) {
            return {
                success: false,
                message: "No recipient email address configured",
            };
        }

        // 4. Render template
        const { subject, html, text } = resolveTemplateContent(input.templateId);

        // 5. Send via SMTP
        const { success, error } = await sendEmailWithDetails({
            to: recipient,
            subject,
            html,
            text,
        });

        // 6. Mask and audit log
        const emailParts = recipient.split("@");
        const maskedEmail =
            emailParts[0].length > 2
                ? `${emailParts[0].substring(0, 2)}***@${emailParts[1]}`
                : `***@${emailParts[1]}`;

        await prisma.auditLog.create({
            data: {
                adminId: user.id,
                action: "EMAIL_TEST_SEND",
                targetType: "EMAIL_TEMPLATE",
                targetId: input.templateId,
                details: {
                    recipient: maskedEmail,
                    success,
                    message: success
                        ? "Sent successfully"
                        : `SMTP Delivery Failed: ${error || "Unknown error"}`,
                },
            },
        });

        if (success) {
            return {
                success: true,
                message: `Email sent successfully to ${maskedEmail}`,
                subject,
            };
        } else {
            return {
                success: false,
                message: error
                    ? `SMTP Delivery Failed: ${error}`
                    : "SMTP Delivery Failed. Check server logs.",
            };
        }
    } catch (error: any) {
        console.error("[EMAIL_LAB_ERROR]", error);
        return {
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "An unexpected error occurred",
        };
    }
}
