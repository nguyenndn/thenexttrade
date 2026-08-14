import cron from "node-cron";
import { runJournalAutopilotSweep } from "@/lib/journal/autopilot.server";

// How often to sweep EA-synced CLOSED trades and write their psychology fields.
// Override with env JOURNAL_AUTOPILOT_CRON (standard 5-field cron syntax).
// Default: every 15 minutes. Each run processes at most
// JOURNAL_AUTOPILOT_MAX_PER_USER (20) trades per user, so cost stays bounded.
const AUTOPILOT_CRON = process.env.JOURNAL_AUTOPILOT_CRON || "*/15 * * * *";

/**
 * Journal Autopilot scheduler — registered from src/instrumentation.ts so it
 * starts together with the server (dev and self-hosted production). It calls
 * the sweep function directly (no HTTP round-trip, no CRON_SECRET needed).
 *
 * Skipped automatically on Vercel: serverless has no persistent process, so
 * node-cron cannot run there — use a Vercel Cron Job hitting
 * /api/cron/journal-autopilot instead.
 */
export class JournalAutopilotSchedulerService {
    private static isRunning = false;

    static init() {
        if (this.isRunning) return;

        console.log("Initializing Journal Autopilot Scheduler...");

        cron.schedule(AUTOPILOT_CRON, async () => {
            try {
                const summary = await runJournalAutopilotSweep();
                console.log(
                    `[Journal Autopilot] ${JSON.stringify(summary)}`
                );
            } catch (error) {
                console.error(
                    "[Journal Autopilot] sweep failed:",
                    error instanceof Error ? error.message : error
                );
            }
        });

        console.log(
            `Journal Autopilot Scheduler started (${AUTOPILOT_CRON}).`
        );
        this.isRunning = true;
    }
}
