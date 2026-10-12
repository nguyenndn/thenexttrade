"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import {
    sendEmailWithDetails,
    buildUnifiedEmailHtml,
    EMAIL_GOLD_COLORS,
} from "@/lib/services/email.service";

const contactSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    subject: z.string().min(5, "Subject must be at least 5 characters"),
    message: z.string().min(10, "Message must be at least 10 characters"),
});

export type ContactFormData = z.infer<typeof contactSchema>;

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
        .replace(/\n/g, "<br/>");
}

export async function submitContactForm(data: ContactFormData) {
    try {
        // Validate input
        const validData = contactSchema.parse(data);

        // 1. Insert message into PostgreSQL database using type-safe Prisma Client
        await prisma.contactMessage.create({
            data: {
                name: validData.name,
                email: validData.email,
                subject: validData.subject,
                message: validData.message,
                status: "new",
            },
        });

        // 2. Dispatch notification email to administrator / support
        const adminEmail =
            process.env.ADMIN_EMAIL ||
            process.env.SUPPORT_EMAIL ||
            process.env.SMTP_FROM_EMAIL ||
            "thenexttrade@gmail.com";

        const escapedName = escapeHtml(validData.name);
        const escapedEmail = escapeHtml(validData.email);
        const escapedSubject = escapeHtml(validData.subject);
        const escapedMessage = escapeHtml(validData.message);

        const adminBodyHtml = `
            <div style="margin-bottom: 24px;">
                <h3 style="margin: 0 0 8px 0; color: #0f172a; font-size: 18px; font-weight: 700;">
                    New Contact Message Received
                </h3>
                <p style="margin: 0; color: #64748b; font-size: 14px;">
                    A trader or visitor has submitted a message via the public contact form.
                </p>
            </div>

            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;">
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <tr>
                        <td style="padding: 6px 0; color: #64748b; font-weight: 600; width: 90px;">From:</td>
                        <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${escapedName}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Email:</td>
                        <td style="padding: 6px 0; color: #0f172a;"><a href="mailto:${escapedEmail}" style="color: ${EMAIL_GOLD_COLORS.brandGold}; text-decoration: none; font-weight: 600;">${escapedEmail}</a></td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Subject:</td>
                        <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${escapedSubject}</td>
                    </tr>
                </table>
            </div>

            <div style="margin-bottom: 24px;">
                <h4 style="margin: 0 0 8px 0; color: #0f172a; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                    Message Content
                </h4>
                <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-left: 4px solid ${EMAIL_GOLD_COLORS.brandGold}; border-radius: 8px; padding: 16px; font-size: 14px; color: #334155; line-height: 1.6;">
                    ${escapedMessage}
                </div>
            </div>

            <div style="text-align: center; margin-top: 28px;">
                <a href="mailto:${escapedEmail}?subject=Re: ${encodeURIComponent(validData.subject)}" style="display: inline-block; background: ${EMAIL_GOLD_COLORS.brandGold}; color: #ffffff !important; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-size: 14px; font-weight: 700;">
                    Reply to ${escapedName}
                </a>
            </div>
        `;

        try {
            await sendEmailWithDetails({
                to: adminEmail,
                subject: `[Contact Form] ${validData.subject} (from ${validData.name})`,
                html: buildUnifiedEmailHtml({
                    subject: `[Contact Form] ${validData.subject}`,
                    preheader: `New message from ${validData.name}: ${validData.message.slice(0, 80)}...`,
                    bodyHtml: adminBodyHtml,
                }),
                text: `New contact form submission\nFrom: ${validData.name} <${validData.email}>\nSubject: ${validData.subject}\n\nMessage:\n${validData.message}`,
            });
        } catch (emailErr) {
            console.error("[CONTACT_FORM] Failed to send admin email notification:", emailErr);
            // Non-blocking: DB insert already succeeded
        }

        // 3. Send friendly acknowledgment receipt to the sender
        try {
            const senderReceiptHtml = `
                <div style="margin-bottom: 24px;">
                    <h3 style="margin: 0 0 8px 0; color: #0f172a; font-size: 18px; font-weight: 700;">
                        We received your message
                    </h3>
                    <p style="margin: 0; color: #64748b; font-size: 14px;">
                        Hi ${escapedName}, thank you for contacting TheNextTrade. Our support team has received your message and will review it shortly.
                    </p>
                </div>

                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;">
                    <div style="font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 8px;">
                        Your Submitted Request
                    </div>
                    <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 6px;">
                        ${escapedSubject}
                    </div>
                    <div style="font-size: 13px; color: #475569; line-height: 1.5;">
                        ${escapedMessage}
                    </div>
                </div>

                <p style="font-size: 13px; color: #64748b; margin: 0;">
                    If your inquiry is urgent regarding an active MT5 trade or sync issue, you can also reach us via our Telegram community.
                </p>
            `;

            await sendEmailWithDetails({
                to: validData.email,
                subject: `We received your inquiry: ${validData.subject} | TheNextTrade`,
                html: buildUnifiedEmailHtml({
                    subject: `Message Received: ${validData.subject}`,
                    preheader: "Thank you for contacting TheNextTrade. We have received your inquiry.",
                    bodyHtml: senderReceiptHtml,
                }),
                text: `Hi ${validData.name},\n\nThank you for contacting TheNextTrade. We have received your inquiry regarding "${validData.subject}" and will get back to you shortly.\n\nBest regards,\nTheNextTrade Support Team`,
            });
        } catch (receiptErr) {
            console.warn("[CONTACT_FORM] Failed to send sender receipt email:", receiptErr);
            // Non-blocking: DB insert already succeeded
        }

        return { success: true };
    } catch (e: any) {
        if (e instanceof z.ZodError) {
            const zodErr = e as any;
            return {
                success: false,
                error: zodErr.errors?.[0]?.message || "Validation failed",
            };
        }
        console.error("[CONTACT_FORM] Unexpected error in submitContactForm:", e);
        return {
            success: false,
            error: "Failed to send message. Please try again or reach out directly via support.",
        };
    }
}
