
import { sendEmail } from '../src/lib/email';

async function main() {
    console.log("Testing Email Sending...");
    // Check if env vars are loaded
    if (!process.env.SMTP_HOST) {
        console.error("❌ Error: Environment variables not loaded. Run with 'npx dotenv -e .env -- ...'");
    }
    console.log(`Host: ${process.env.SMTP_HOST}`);
    console.log(`User: ${process.env.SMTP_USER}`);

    if (!process.env.SMTP_USER || process.env.SMTP_USER === "YOUR_MAILTRAP_USER") {
        console.error("❌ ERROR: Please configure SMTP_USER and SMTP_PASS in .env first.");
        return;
    }

    try {
        await sendEmail({
            to: "test@example.com",
            subject: "Test Email from The Next Trade",
            html: "<h1>It Works!</h1><p>This is a test email sent from the local development environment.</p>",
            text: "It Works! This is a test email sent from the local development environment."
        });
        console.log("✅ Email sent successfully!");
    } catch (error) {
        console.error("❌ Failed to send email:", error);
    }
}

main().catch(console.error);
