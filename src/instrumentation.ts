export async function register() {
    // node-cron schedulers are disabled on Vercel serverless (no persistent process).
    // Use Vercel Cron Jobs (Pro plan) or external cron services instead.
    // These schedulers only run in self-hosted/long-running Node.js environments.

    // Journal Autopilot runs in dev AND self-hosted production so EA-synced
    // closed trades get their psychology fields written automatically.
    if (
        process.env.NEXT_RUNTIME === "nodejs" &&
        !process.env.VERCEL // Skip on Vercel — serverless has no persistent process
    ) {
        const { JournalAutopilotSchedulerService } =
            await import("@/lib/services/journal-autopilot-scheduler.service");
        JournalAutopilotSchedulerService.init();
    }

    if (
        process.env.NEXT_RUNTIME === "nodejs" &&
        process.env.NODE_ENV === "production" &&
        !process.env.VERCEL // Skip on Vercel — serverless has no persistent process
    ) {
        const { ArticleSchedulerService } =
            await import("@/lib/services/scheduler.service");
        ArticleSchedulerService.init();

        const { EconomicSchedulerService } =
            await import("@/lib/services/economic-scheduler.service");
        EconomicSchedulerService.init();
    }
}
