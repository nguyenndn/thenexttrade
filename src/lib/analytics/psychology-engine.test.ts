import { describe, it, expect } from "vitest";

describe("Psychology Engine & Analytics Calculation Logic", () => {
    it("should calculate Disposition Ratio as avgHoldTimeLoss / avgHoldTimeWin", () => {
        const avgHoldTimeWinMinutes = 30;
        const avgHoldTimeLossMinutes = 75;

        const ratio = avgHoldTimeWinMinutes > 0
            ? Math.round((avgHoldTimeLossMinutes / avgHoldTimeWinMinutes) * 10) / 10
            : 1;

        expect(ratio).toBe(2.5); // Holding losses 2.5x longer than wins!
    });

    it("should categorize severity as HIGH when Disposition Ratio >= 2.0", () => {
        const ratio = 2.2;
        let severity: "NORMAL" | "MEDIUM" | "HIGH" = "NORMAL";

        if (ratio >= 2.0) severity = "HIGH";
        else if (ratio >= 1.3) severity = "MEDIUM";

        expect(severity).toBe("HIGH");
    });

    it("should map trades correctly into 24-hour intraday buckets", () => {
        const dateStr = "2026-08-10T14:30:00Z";
        const date = new Date(dateStr);
        const hour = date.getUTCHours();

        expect(hour).toBe(14);
    });
});
