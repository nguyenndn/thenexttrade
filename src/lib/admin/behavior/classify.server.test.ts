import { describe, it, expect } from "vitest";
import { classifyUser, buildNarrative, buildChips } from "./classify.server";

describe("Behavior Engine Classification & Narrative (Doc #2 & Doc #4)", () => {
    it("classifies user with no account as ATTENTION / NO_ACCOUNT", () => {
        const now = new Date();
        const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

        const classification = classifyUser({
            user: {
                id: "user-1",
                name: "Test User",
                email: "test@example.com",
                createdAt: tenDaysAgo,
            },
            tradingAccounts: [],
            journalEntries: [],
            totalJournalCount: 0,
        });

        expect(classification.severity).toBe("ATTENTION");
        expect(classification.dotColor).toBe("YELLOW");
        expect(classification.primarySignal).toBe("NO_ACCOUNT");
        expect(classification.metrics.accountsCount).toBe(0);

        const narrative = buildNarrative(classification);
        expect(narrative.length).toBeGreaterThan(0);
        expect(narrative[0]).toContain("has not connected a trading account yet");

        const chips = buildChips(classification);
        expect(chips.some((c) => c.label === "No Account Connected")).toBe(true);
    });

    it("classifies user with linked account but 0 trades as REGISTERED_NEVER_TRADED", () => {
        const now = new Date();
        const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

        const classification = classifyUser({
            user: {
                id: "user-2",
                name: "Never Traded",
                email: "never@example.com",
                createdAt: fiveDaysAgo,
            },
            tradingAccounts: [
                { id: "acc-1", status: "CONNECTED", broker: "VTMarkets", accountType: "REAL" },
            ],
            journalEntries: [],
            totalJournalCount: 0,
        });

        expect(classification.group).toBe("REGISTERED_NEVER_TRADED");
        expect(classification.dotColor).toBe("YELLOW");
        expect(classification.primarySignal).toBe("ACCOUNT_NEVER_SYNCED");

        const narrative = buildNarrative(classification);
        expect(narrative[0]).toContain("no trades have synced yet");

        const chips = buildChips(classification);
        expect(chips.some((c) => c.label === "Never Synced Trades")).toBe(true);
    });

    it("marks under 5 trades in 30d as INSUFFICIENT_DATA", () => {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const classification = classifyUser({
            user: {
                id: "user-3",
                name: "Low Activity",
                email: "low@example.com",
                createdAt: thirtyDaysAgo,
            },
            tradingAccounts: [
                { id: "acc-1", status: "CONNECTED", broker: "Vantage", accountType: "REAL" },
            ],
            journalEntries: [
                {
                    id: "j-1",
                    status: "CLOSED",
                    result: "WIN",
                    pnl: 50,
                    entryDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
                    createdAt: new Date(),
                },
            ],
            totalJournalCount: 1,
        });

        expect(classification.severity).toBe("INSUFFICIENT_DATA");
        expect(classification.dotColor).toBe("GRAY");

        const narrative = buildNarrative(classification);
        expect(narrative[0]).toContain("Not enough history to describe a behavioral pattern yet");
    });

    it("verifies narrative respects Banned AI Cliché rules", () => {
        const now = new Date();
        const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

        const classification = classifyUser({
            user: {
                id: "user-4",
                name: "Pro Trader",
                email: "pro@example.com",
                createdAt: tenDaysAgo,
            },
            tradingAccounts: [
                { id: "acc-1", status: "CONNECTED", broker: "VTMarkets", accountType: "REAL" },
            ],
            journalEntries: Array.from({ length: 15 }, (_, i) => ({
                id: `trade-${i}`,
                status: "CLOSED",
                result: i % 3 === 0 ? "LOSS" : "WIN",
                pnl: i % 3 === 0 ? -30 : 50,
                entryDate: new Date(now.getTime() - i * 24 * 60 * 60 * 1000),
                createdAt: new Date(),
            })),
            totalJournalCount: 15,
        });

        const narrative = buildNarrative(classification).join(" ");

        // Check banned AI clichés
        const lower = narrative.toLowerCase();
        expect(lower).not.toContain("unlock your potential");
        expect(lower).not.toContain("elevate your trading");
        expect(lower).not.toContain("seamlessly");
        expect(lower).not.toContain("deep dive");
        expect(lower).not.toContain("game-changing");
        expect(lower).not.toContain("revolutionize");
        expect(lower).not.toContain("supercharge");
    });
});
