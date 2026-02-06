
import nodemailer from "nodemailer";

interface SendEmailProps {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function sendEmail({ to, subject, html, text }: SendEmailProps) {
    if (!process.env.SMTP_USER) {
        console.warn("SMTP_USER not provided, skipping email send", { to, subject });
        return;
    }

    try {
        const info = await transporter.sendMail({
            from: `"${process.env.SMTP_FROM_NAME || 'The Next Trade'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
            to,
            subject,
            text: text || "Please view this email in a HTML capable client.",
            html,
        });
        console.log("Message sent: %s", info.messageId);
        return info;
    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
}
