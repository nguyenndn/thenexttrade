import { describe, it, expect } from "vitest";
import { normalizeSyncSource, getSyncSourceLabel } from "@/lib/sync/sync-source";
import { computeCapitalBreakdown } from "./capital.server";
import { accountFreshness, resolveLifecycleStage } from "./pipeline.server";
import { buildProductSummaries } from "./product-usage.server";

describe("Admin IB Monitor — Data Safety & Logic Tests", () => {
    it("normalizes sync sources strictly according to spec", () => {
        expect(normalizeSyncSource("EA")).toBe("EA_SYNC");
        expect(normalizeSyncSource("EA_SYNC")).toBe("EA_SYNC");
        expect(normalizeSyncSource("WINDOWS_IMPORT")).toBe("WINDOWS_IMPORT");
        expect(normalizeSyncSource("VPS_SYNC")).toBe("WINDOWS_IMPORT");
        expect(normalizeSyncSource("MANUAL")).toBe("MANUAL");
        expect(normalizeSyncSource(null)).toBe("UNKNOWN");

        expect(getSyncSourceLabel("EA_SYNC")).toBe("Trade Manager");
        expect(getSyncSourceLabel("WINDOWS_IMPORT")).toBe("Trade Manager");
    });

    it("calculates capital breakdown and warns on mixed currency", () => {
        const singleCurrencyAccounts = [
            { balance: 1000, equity: 1100, currency: "USD", lastHeartbeat: new Date(), lastSync: null, status: "CONNECTED" },
            { balance: 2500, equity: 2400, currency: "USD", lastHeartbeat: new Date(), lastSync: null, status: "CONNECTED" },
        ];

        const singleBreakdown = computeCapitalBreakdown(singleCurrencyAccounts);
        expect(singleBreakdown.isMixedCurrency).toBe(false);
        expect(singleBreakdown.usdBalanceTotal).toBe(3500);

        const mixedCurrencyAccounts = [
            { balance: 1000, equity: 1100, currency: "USD", lastHeartbeat: new Date(), lastSync: null, status: "CONNECTED" },
            { balance: 500000, equity: 510000, currency: "JPY", lastHeartbeat: new Date(), lastSync: null, status: "CONNECTED" },
        ];

        const mixedBreakdown = computeCapitalBreakdown(mixedCurrencyAccounts);
        expect(mixedBreakdown.isMixedCurrency).toBe(true);
        expect(mixedBreakdown.usdBalanceTotal).toBe(4350);
        expect(mixedBreakdown.byCurrency["USD"]).toBe(1000);
        expect(mixedBreakdown.byCurrency["JPY"]).toBe(500000);
    });

    it("does not invent USD when a live account has no currency", () => {
        const breakdown = computeCapitalBreakdown([
            {
                balance: 2500,
                equity: 2400,
                currency: null,
                accountType: "REAL",
                lastHeartbeat: new Date(),
                lastSync: null,
                status: "CONNECTED",
            },
        ]);

        expect(breakdown.byCurrency).toEqual({ UNKNOWN: 2500 });
        expect(breakdown.usdBalanceTotal).toBe(0);
    });

    it("excludes demo accounts from live capital totals", () => {
        const breakdown = computeCapitalBreakdown([
            {
                balance: 100000,
                equity: 100000,
                currency: "USD",
                accountType: "DEMO",
                lastHeartbeat: new Date(),
                lastSync: null,
                status: "CONNECTED",
            },
        ]);

        expect(breakdown.byCurrency).toEqual({});
        expect(breakdown.usdBalanceTotal).toBe(0);
    });

    it("excludes personal accounts connected to a demo server", () => {
        const breakdown = computeCapitalBreakdown([
            {
                balance: 927600.57,
                equity: 929369.09,
                currency: "USD",
                accountType: "PERSONAL",
                server: "JustMarkets-Demo",
                lastHeartbeat: new Date(),
                lastSync: new Date(),
                status: "CONNECTED",
            },
            {
                balance: 2990.88,
                equity: 2990.88,
                currency: "USD",
                accountType: "PERSONAL",
                server: "VantageInternational-Live",
                lastHeartbeat: new Date(),
                lastSync: new Date(),
                status: "CONNECTED",
            },
        ]);

        expect(breakdown.usdBalanceTotal).toBe(2990.88);
        expect(breakdown.usdEquityTotal).toBe(2990.88);
    });

    it("resolves evidence-backed lifecycle stages accurately", () => {
        expect(
            resolveLifecycleStage({
                hasUser: true,
                hasProfile: true,
                hasTradingAccount: true,
                totalTrades: 5,
                hasVipRequest: true,
                vipStatus: "APPROVED",
                hasProductAccess: true,
                hasProductUsage: true,
                isStale: false,
            })
        ).toBe("TOOL_ACTIVE");

        expect(
            resolveLifecycleStage({
                hasUser: true,
                hasProfile: true,
                hasTradingAccount: true,
                totalTrades: 0,
                hasVipRequest: true,
                vipStatus: "PENDING",
                hasProductAccess: false,
                hasProductUsage: false,
                isStale: false,
            })
        ).toBe("VIP_REQUESTED");

        expect(
            resolveLifecycleStage({
                hasUser: true,
                hasProfile: true,
                hasTradingAccount: true,
                totalTrades: 1,
                hasFirstSync: true,
                hasVipRequest: true,
                vipStatus: "APPROVED",
                hasProductAccess: false,
                hasProductUsage: false,
                isStale: false,
            })
        ).toBe("VIP_APPROVED");
    });

    it("requires a current Trade Manager heartbeat or sync to be connected", () => {
        const now = new Date("2026-07-31T12:00:00.000Z");
        expect(
            accountFreshness(
                {
                    lastHeartbeat: new Date("2026-07-20T12:00:00.000Z"),
                    lastSync: new Date("2026-07-20T12:00:00.000Z"),
                },
                now
            )
        ).toBe("DISCONNECTED");
    });

    it("does not mark a download-only product as recently used", () => {
        const summaries = buildProductSummaries({
            accesses: [],
            downloads: [],
            usageEvents: [
                {
                    productId: "goldscalperninja",
                    eventType: "DOWNLOAD",
                    occurredAt: new Date(),
                },
            ],
            hasActiveProEntitlement: false,
        });

        expect(summaries.find((item) => item.productSlug === "goldscalperninja")).toMatchObject({
            usageState: "DOWNLOADED",
            lastUsedAt: null,
        });
    });
});
