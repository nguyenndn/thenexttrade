
// Email Queue - Serverless Compatible
// Note: BullMQ requires persistent Redis TCP connection, which doesn't work
// on Vercel serverless. Using direct email sending instead.
// If you need background jobs, consider Vercel Cron + API routes or Upstash QStash.

export const EMAIL_JOB_TYPES = {
    WELCOME: "WELCOME",
    NOTIFICATION: "NOTIFICATION",
    RESET_PASSWORD: "RESET_PASSWORD",
} as const;

// Direct email sending (no queue) for serverless environments
export async function enqueueEmail(type: string, data: Record<string, any>) {
    // In serverless, we send immediately instead of queuing
    // For high-volume: migrate to Upstash QStash or Vercel Cron
    const { emailService } = await import("@/lib/services/email.service");
    
    try {
        await emailService.sendEmail(data as any);
        return { success: true };
    } catch (error) {
        console.error(`Failed to send ${type} email:`, error);
        return { success: false, error };
    }
}
