export const SUPPORT_SYNC_DAY = 6; // Saturday (UTC)
export const SUPPORT_SYNC_HOUR_UTC = 10;

/**
 * Returns the next Saturday at 10:00 UTC. A request made before Saturday
 * 10:00 UTC is scheduled for the same week; otherwise it waits for next week.
 */
export function getNextSupportSyncAt(now: Date = new Date()): Date {
    const result = new Date(
        Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
            SUPPORT_SYNC_HOUR_UTC,
            0,
            0,
            0
        )
    );

    let daysUntilSaturday = (SUPPORT_SYNC_DAY - result.getUTCDay() + 7) % 7;
    if (daysUntilSaturday === 0 && now >= result) {
        daysUntilSaturday = 7;
    }
    result.setUTCDate(result.getUTCDate() + daysUntilSaturday);
    return result;
}
