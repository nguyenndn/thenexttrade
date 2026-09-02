import { describe, it, expect } from "vitest";
import {
    buildEALicenseEmailHtml,
    buildEAUpdateEmailHtml,
    buildAcademyCertificateEmailHtml,
    buildMilestoneAchievementEmailHtml,
    buildUnifiedEmailHtml,
    buildReportEmailHtml,
    buildNudgeEmailHtml,
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
} from "./email.service";
import {
    getSampleEALicenseData,
    getSampleEAUpdateData,
    getSampleAcademyCertificateData,
    getSampleMilestoneData,
    getSampleReportEmailData,
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
} from "../email-lab/sample-data";

describe("Email Templates & Builder Service", () => {
    it("renders EA Lifetime License email with key and MT5 account", () => {
        const data = getSampleEALicenseData();
        const html = buildEALicenseEmailHtml(data);

        expect(html).toContain("TheNextTrade");
        expect(html).toContain(data.licenseKey);
        expect(html).toContain(data.mt5Account);
        expect(html).toContain(data.downloadUrl);
        expect(html).toContain("Lifetime License Key");
    });

    it("renders EA Version Update email with release highlights", () => {
        const data = getSampleEAUpdateData();
        const html = buildEAUpdateEmailHtml(data);

        expect(html).toContain("TheNextTrade");
        expect(html).toContain(data.version);
        expect(html).toContain(data.eaName);
        expect(html).toContain("What's New");
        expect(html).toContain(data.downloadUrl);
    });

    it("renders Academy Certificate email with graduate name and cert ID", () => {
        const data = getSampleAcademyCertificateData();
        const html = buildAcademyCertificateEmailHtml(data);

        expect(html).toContain("TheNextTrade");
        expect(html).toContain(data.userName);
        expect(html).toContain(data.certificateId);
        expect(html).toContain(data.pathwayName);
        expect(html).toContain("Congratulations, Graduate!");
    });

    it("renders Milestone Achievement email with badge details", () => {
        const data = getSampleMilestoneData();
        const html = buildMilestoneAchievementEmailHtml(data);

        expect(html).toContain("TheNextTrade");
        expect(html).toContain(data.userName);
        expect(html).toContain(data.milestoneTitle);
        expect(html).toContain(data.badgeName);
        expect(html).toContain("New Milestone Unlocked!");
    });

    it("renders Weekly Report email with performance metrics", () => {
        const data = getSampleReportEmailData("WEEKLY");
        const html = buildReportEmailHtml(data);

        expect(html).toContain("TheNextTrade");
        expect(html).toContain(data.userName);
        expect(html).toContain(data.periodLabel);
        expect(html).toContain("Win Rate");
    });

    it("renders No-Trades Nudge email with discipline reminder", () => {
        const html = buildNudgeEmailHtml("Alex Trader", "WEEKLY");

        expect(html).toContain("TheNextTrade");
        expect(html).toContain("Alex Trader");
        expect(html).toContain("No Trades This Week");
        expect(html).toContain("Open Trading Journal");
    });

    it("renders Signup OTP email with 6-digit verification code", () => {
        const data = getSampleSignupOtpData();
        const html = buildSignupOtpEmailHtml(data);

        expect(html).toContain("TheNextTrade");
        expect(html).toContain(data.otpCode);
        expect(html).toContain("Verify Your Email Address");
        expect(html).toContain(data.confirmUrl);
    });

    it("renders Resend OTP email with replacement code", () => {
        const data = getSampleResendOtpData();
        const html = buildResendOtpEmailHtml(data);

        expect(html).toContain("TheNextTrade");
        expect(html).toContain(data.otpCode);
        expect(html).toContain("Your New Verification Code");
    });

    it("renders Magic Link email with 1-click action link", () => {
        const data = getSampleMagicLinkData();
        const html = buildMagicLinkEmailHtml(data);

        expect(html).toContain("TheNextTrade");
        expect(html).toContain("Your Magic Sign-In Link");
        expect(html).toContain(data.magicLinkUrl);
    });

    it("renders Forgot Password email with security token link", () => {
        const data = getSampleForgotPasswordData();
        const html = buildForgotPasswordEmailHtml(data);

        expect(html).toContain("TheNextTrade");
        expect(html).toContain("Reset Your Password");
        expect(html).toContain(data.resetUrl);
    });

    it("renders Admin Reset Password email with admin signature", () => {
        const data = getSampleAdminResetData();
        const html = buildAdminResetPasswordEmailHtml(data);

        expect(html).toContain("TheNextTrade");
        expect(html).toContain(data.adminName);
        expect(html).toContain("Password Recovery from Admin");
        expect(html).toContain(data.resetUrl);
    });

    it("builds Unified Email wrapper with preheader and responsive container", () => {
        const html = buildUnifiedEmailHtml({
            subject: "Test Subject",
            preheader: "Test Preheader",
            bodyHtml: "<p>Hello World</p>",
        });

        expect(html).toContain("<!DOCTYPE html>");
        expect(html).toContain("Test Preheader");
        expect(html).toContain("TheNextTrade");
        expect(html).toContain("<p>Hello World</p>");
        expect(html).toContain("Manage Preferences");
    });

    // ─── VIP Lifecycle Email Template Tests ──────────────────────────────────

    it("renders VIP Trial Ending Soon email with countdown and benefit highlights", () => {
        const data = getSampleVipTrialEndingSoonData();
        const html = buildVipTrialEndingSoonEmailHtml(data);

        expect(html).toContain("Your 7-Day VIP Trial Ends Soon");
        expect(html).toContain(data.userName);
        expect(html).toContain(data.trialEndsAt);
        expect(html).toContain("50 AI requests/day");
        expect(html).toContain("Vantage, Exness, VTMarkets, or Ultima Markets");
        expect(html).toContain("Connect Funded Account");
    });

    it("renders VIP Trial Ended email with free plan summary & restore CTA", () => {
        const data = getSampleVipTrialEndedData();
        const html = buildVipTrialEndedEmailHtml(data);

        expect(html).toContain("Your VIP Trial Has Ended");
        expect(html).toContain(data.userName);
        expect(html).toContain("Free Plan");
        expect(html).toContain("Restore VIP Pro Access");
    });

    it("renders VIP Inactivity Warning email with days inactive & warning badge", () => {
        const data = getSampleVipInactivityWarningData();
        const html = buildVipInactivityWarningEmailHtml(data);

        expect(html).toContain(`No Trades Recorded in ${data.daysInactive} Days`);
        expect(html).toContain(data.userName);
        expect(html).toContain(`${data.daysRemainingBeforePause} days`);
        expect(html).toContain("Open Trading Dashboard");
    });

    it("renders VIP Policy Paused email with explanation and 0s auto-restore guide", () => {
        const data = getSampleVipPolicyPausedData();
        const html = buildVipPolicyPausedEmailHtml(data);

        expect(html).toContain("Your VIP Access is Temporarily Paused");
        expect(html).toContain(data.userName);
        expect(html).toContain(data.reason);
        expect(html).toContain("Instant 0-Second Auto-Restore");
        expect(html).toContain("View Account Status");
    });

    it("renders VIP Funding Grace email with $300 balance reminder & deadline", () => {
        const data = getSampleVipFundingGraceData();
        const html = buildVipFundingGraceEmailHtml(data);

        expect(html).toContain("Action Required: Top Up to Maintain VIP");
        expect(html).toContain(data.userName);
        expect(html).toContain(data.accountNumber);
        expect(html).toContain(data.broker);
        expect(html).toContain(data.graceDeadline);
        expect(html).toContain("Manage Trading Accounts");
    });

    it("renders VIP Support-Sync batch result email for both Success and Failed", () => {
        // Success case
        const successData = getSampleVipSupportSyncSuccessData();
        const successHtml = buildVipSupportSyncResultEmailHtml(successData);
        expect(successHtml).toContain("Support-Sync Batch Completed Successfully");
        expect(successHtml).toContain(`${successData.syncedTradesCount} new closed trades`);
        expect(successHtml).toContain("View Updated Journal");

        // Failed case
        const failedData = getSampleVipSupportSyncFailedData();
        const failedHtml = buildVipSupportSyncResultEmailHtml(failedData);
        expect(failedHtml).toContain("Support-Sync Verification Update");
        expect(failedHtml).toContain(failedData.failureReason);
        expect(failedHtml).toContain("Update Investor Password");
    });
});

