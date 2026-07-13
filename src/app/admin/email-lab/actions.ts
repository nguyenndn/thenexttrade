"use server";

import { z } from "zod";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { sendEmail, buildReportEmailHtml, buildNudgeEmailHtml, buildUnifiedEmailHtml } from "@/lib/services/email.service";
import { buildActivationEmailHtml, buildActivationEmailSubject } from "@/lib/emails/activation-reminders";
import {
 getSampleReportEmailData,
 getSampleActivationLink,
 renderWelcomePreviewEmail
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
 | "welcome_d3_preview";

interface SendEmailLabResult {
 success: boolean;
 message: string;
 subject?: string;
}

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
 select: { role: true }
 });

 if (profile?.role !== "ADMIN") {
 return { success: false, message: "Forbidden: Admin role required" };
 }

 // 2. Check test page enabled
 if (process.env.ENABLE_EMAIL_TEST_PAGE !== "true") {
 return { success: false, message: "Email test page is disabled in configuration" };
 }

 // 3. Resolve recipient
 let recipient = process.env.EMAIL_TEST_TO || "";
 const allowCustom = process.env.EMAIL_TEST_ALLOW_CUSTOM_TO === "true";

 if (allowCustom && input.to) {
 const emailValidation = z.string().email().safeParse(input.to);
 if (!emailValidation.success) {
 return { success: false, message: "Invalid custom recipient email address" };
 }
 recipient = emailValidation.data;
 }

 if (!recipient) {
 return { success: false, message: "No recipient email address configured" };
 }

 // 4. Render template
 let subject = "";
 let html = "";
 let text: string | undefined;

 switch (input.templateId) {
 case "smtp_smoke":
 subject = "SMTP Smoke Test 🔥";
 const smokeBodyHtml = `
 <div style="text-align: center; padding: 12px 0;">
 <h2 style="color: #00C888; margin-top: 0; font-size: 22px; font-weight: 800; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">SMTP Connection Check</h2>
 <p style="color: #475569; line-height: 1.6; font-size: 15px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; margin-top: 16px;">This is a test email sent from the <strong>Email Lab</strong> at ${new Date().toLocaleString()}.</p>
 <p style="color: #475569; line-height: 1.6; font-size: 15px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">If you are seeing this email, your SMTP relay host and credentials are configured correctly and active.</p>
 </div>
 `;
 html = buildUnifiedEmailHtml({
 subject: "SMTP Connection Check",
 bodyHtml: smokeBodyHtml
 });
 text = `SMTP Connection Check\n\nThis is a test email sent from the Email Lab at ${new Date().toLocaleString()}.`;
 break;

 case "weekly_report_ready":
 subject = "Weekly Trading Report Ready 📈";
 html = buildReportEmailHtml(getSampleReportEmailData("WEEKLY"));
 break;

 case "monthly_report_ready":
 subject = "Monthly Trading Report Ready 📈";
 html = buildReportEmailHtml(getSampleReportEmailData("MONTHLY"));
 break;

 case "weekly_no_trades":
 subject = "No Trades This Week 📊";
 html = buildNudgeEmailHtml("Email Lab Trader", "WEEKLY");
 break;

 case "monthly_no_trades":
 subject = "No Trades This Month 📊";
 html = buildNudgeEmailHtml("Email Lab Trader", "MONTHLY");
 break;

 case "activation_no_account_24h":
 subject = buildActivationEmailSubject("NO_ACCOUNT_24H");
 html = buildActivationEmailHtml(
 "NO_ACCOUNT_24H",
 "Email Lab Trader",
 "MANUAL",
 getSampleActivationLink("NO_ACCOUNT_24H", "MANUAL")
 );
 break;

 case "activation_no_first_data_24h":
 subject = buildActivationEmailSubject("NO_FIRST_DATA_24H");
 html = buildActivationEmailHtml(
 "NO_FIRST_DATA_24H",
 "Email Lab Trader",
 "EA_SYNC",
 getSampleActivationLink("NO_FIRST_DATA_24H", "EA_SYNC")
 );
 break;

 case "activation_still_no_first_value_72h":
 subject = buildActivationEmailSubject("STILL_NO_FIRST_VALUE_72H");
 html = buildActivationEmailHtml(
 "STILL_NO_FIRST_VALUE_72H",
 "Email Lab Trader",
 "EA_SYNC",
 getSampleActivationLink("STILL_NO_FIRST_VALUE_72H", "EA_SYNC")
 );
 break;

 case "mobile_sync_fallback_tnt":
 subject = buildActivationEmailSubject("MOBILE_SYNC_FALLBACK");
 html = buildActivationEmailHtml(
 "MOBILE_SYNC_FALLBACK",
 "Email Lab Trader",
 "EA_SYNC",
 getSampleActivationLink("MOBILE_SYNC_FALLBACK", "EA_SYNC")
 );
 break;

 case "mobile_sync_fallback_ea":
 subject = buildActivationEmailSubject("MOBILE_SYNC_FALLBACK");
 html = buildActivationEmailHtml(
 "MOBILE_SYNC_FALLBACK",
 "Email Lab Trader",
 "EA_SYNC",
 getSampleActivationLink("MOBILE_SYNC_FALLBACK", "EA_SYNC")
 );
 break;

 case "welcome_d0_preview":
 const d0 = renderWelcomePreviewEmail("d0");
 subject = d0.subject;
 html = d0.html;
 break;

 case "welcome_d1_preview":
 const d1 = renderWelcomePreviewEmail("d1");
 subject = d1.subject;
 html = d1.html;
 break;

 case "welcome_d3_preview":
 const d3 = renderWelcomePreviewEmail("d3");
 subject = d3.subject;
 html = d3.html;
 break;

 default:
 return { success: false, message: "Template ID not implemented yet" };
 }

 // 5. Send via SMTP
 const success = await sendEmail({
 to: recipient,
 subject,
 html,
 text
 });

 // 6. Mask and audit log
 const emailParts = recipient.split("@");
 const maskedEmail = emailParts[0].length > 2
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
 message: success ? "Sent successfully" : "SMTP Delivery Failed"
 }
 }
 });

 if (success) {
 return {
 success: true,
 message: `Email sent successfully to ${maskedEmail}`,
 subject
 };
 } else {
 return {
 success: false,
 message: "SMTP Delivery Failed. Check server logs."
 };
 }

 } catch (error: any) {
 console.error("[EMAIL_LAB_ERROR]", error);
 return {
 success: false,
 message: error instanceof Error ? error.message : "An unexpected error occurred"
 };
 }
}
