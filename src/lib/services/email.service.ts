import nodemailer from 'nodemailer';

interface EmailOptions {
    to: string;
    subject: string;
    text?: string;
    html?: string;
}

export class EmailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        // Initialize with environment variables
        // For dev, we can use ethereal.email or just log if no creds
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || "smtp.example.com",
            port: parseInt(process.env.SMTP_PORT || "587"),
            secure: process.env.SMTP_SECURE === "true",
            auth: {
                user: process.env.SMTP_USER || "user",
                pass: process.env.SMTP_PASS || "pass",
            },
        });
    }

    async sendEmail({ to, subject, text, html }: EmailOptions) {
        if (!process.env.SMTP_HOST) {
            console.log("Mock Email Sent:", { to, subject, text });
            return;
        }

        try {
            const info = await this.transporter.sendMail({
                from: process.env.SMTP_FROM || '"TheNextTrade" <noreply@thenexttrade.com>',
                to,
                subject,
                text,
                html,
            });
            console.log("Message sent: %s", info.messageId);
            return info;
        } catch (error) {
            console.error("Error sending email:", error);
            throw error;
        }
    }
}

export const emailService = new EmailService();
