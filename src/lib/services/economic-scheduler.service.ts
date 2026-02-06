import cron from 'node-cron';
import { syncEconomicEvents } from '@/lib/services/economic-calendar';

export class EconomicSchedulerService {
    private static isRunning = false;

    static init() {
        if (this.isRunning) return;

        console.log("Initializing Economic Calendar Scheduler...");

        // Run every Monday at 00:05 AM
        // Cron format: Minute Hour DayOfMonth Month DayOfWeek
        // 1 = Monday
        cron.schedule('5 0 * * 1', async () => {
            console.log("Running scheduled Economic Calendar Sync...");
            await syncEconomicEvents();
        });

        console.log("Economic Calendar Scheduler started (Every Mon at 00:05).");
        this.isRunning = true;
    }
}
