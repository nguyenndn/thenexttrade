import { describe, expect, it } from "vitest";
import { buildOperationalAccountCounts } from "./operational-account-counts";

const NOW = new Date("2026-10-21T12:00:00Z").getTime();
const ONE_HOUR_MS = 60 * 60 * 1000;

describe("buildOperationalAccountCounts", () => {
    it("excludes demo markers in any identity field from live counts", () => {
        const counts = buildOperationalAccountCounts(
            [
                {
                    accountType: "STANDARD",
                    server: "Exness-Demo",
                    broker: "Exness",
                    status: "CONNECTED",
                    lastHeartbeat: new Date(NOW - ONE_HOUR_MS),
                    lastSync: null,
                },
                {
                    accountType: "REAL",
                    server: "Vantage-Live",
                    broker: "Vantage",
                    status: "CONNECTED",
                    lastHeartbeat: new Date(NOW - ONE_HOUR_MS),
                    lastSync: null,
                },
                {
                    accountType: "STANDARD",
                    server: "Vantage-Evaluation",
                    broker: "Vantage",
                    status: "CONNECTED",
                    lastHeartbeat: new Date(NOW - ONE_HOUR_MS),
                    lastSync: null,
                },
            ],
            NOW
        );

        expect(counts.allAccounts).toBe(3);
        expect(counts.demoAccounts).toBe(2);
        expect(counts.liveAccounts).toBe(1);
        expect(counts.connectedLiveAccounts24h).toBe(1);
    });

    it("counts only live accounts connected within the 24h window", () => {
        const counts = buildOperationalAccountCounts(
            [
                {
                    accountType: "REAL",
                    server: "Exness-MT5Real",
                    broker: "Exness",
                    status: "CONNECTED",
                    lastHeartbeat: null,
                    lastSync: new Date(NOW - 2 * 24 * 60 * 60 * 1000),
                },
                {
                    accountType: "REAL",
                    server: "Vantage-Live",
                    broker: "Vantage",
                    status: "CONNECTED",
                    lastHeartbeat: new Date(NOW - ONE_HOUR_MS),
                    lastSync: null,
                },
                {
                    accountType: "PERSONAL",
                    server: "Vantage-Live",
                    broker: "Vantage",
                    status: "PENDING",
                    lastHeartbeat: new Date(NOW - ONE_HOUR_MS),
                    lastSync: null,
                },
            ],
            NOW
        );

        expect(counts.allAccounts).toBe(3);
        expect(counts.demoAccounts).toBe(0);
        expect(counts.liveAccounts).toBe(2);
        expect(counts.connectedLiveAccounts24h).toBe(1);
    });
});
