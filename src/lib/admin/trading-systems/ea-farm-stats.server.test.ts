import { describe, expect, it } from "vitest";
import { buildProductFarmData } from "./ea-farm-stats.server";
import { resolveCanonicalProductSlug } from "@/lib/ea/telemetry.server";

describe("resolveCanonicalProductSlug", () => {
    it("maps explicit and inferred EA names to canonical product slugs", () => {
        expect(
            resolveCanonicalProductSlug({
                productSlug: "trade-manager",
            })
        ).toBe("trade-manager");

        expect(
            resolveCanonicalProductSlug({
                eaName: "GoldScalperNinja - TradeManager",
                eaVersion: "3.92",
            })
        ).toBe("trade-manager");

        expect(
            resolveCanonicalProductSlug({
                eaName: "GSN - Apex Gold Sentinel",
            })
        ).toBe("gsn-phoenix-grid");

        expect(
            resolveCanonicalProductSlug({
                eaName: "GoldScalperNinja v2.4",
            })
        ).toBe("goldscalperninja");

        expect(
            resolveCanonicalProductSlug({
                eaName: "GOLD ARUM PRO V3.3.4",
            })
        ).toBe("goldscalperninja");

        expect(
            resolveCanonicalProductSlug({
                eaName: "GoldScalperNinja - Shadow Matrix",
            })
        ).toBe("goldscalperninja");

        expect(resolveCanonicalProductSlug({})).toBeNull();
    });
});

describe("buildProductFarmData", () => {
    it("separates Confirmed EA Farm Capital from User Pool Capital and excludes DEMO accounts from capital totals", () => {
        const now = new Date();
        const result = buildProductFarmData({
            id: "prod-1",
            name: "Trade Manager",
            slug: "trade-manager",
            version: "3.92",
            accessRecords: [
                {
                    id: "ar-1",
                    userId: "user-1",
                    tradingAccountId: "acc-real-1",
                    status: "GRANTED",
                    createdAt: now,
                    lastUsedAt: now,
                    lastHeartbeatAt: now,
                    user: {
                        id: "user-1",
                        name: "Alice Trader",
                        email: "alice@example.com",
                        image: null,
                        tradingAccounts: [
                            {
                                id: "acc-real-1",
                                accountNumber: "10001",
                                broker: "Exness",
                                server: "Exness-MT5Real",
                                platform: "MT5",
                                accountType: "REAL",
                                balance: 5000,
                                equity: 5250,
                                currency: null,
                                status: "CONNECTED",
                                lastHeartbeat: null,
                                lastSync: null,
                            },
                            {
                                id: "acc-real-2",
                                accountNumber: "10002",
                                broker: "Vantage",
                                server: "Vantage-Live",
                                platform: "MT5",
                                accountType: "REAL",
                                balance: 3000,
                                equity: 3100,
                                currency: "USD",
                                status: "CONNECTED",
                                lastHeartbeat: now,
                                lastSync: now,
                            },
                        ],
                    },
                    tradingAccount: {
                        id: "acc-real-1",
                        accountNumber: "10001",
                        broker: "Exness",
                        server: "Exness-MT5Real",
                        platform: "MT5",
                        accountType: "REAL",
                        balance: 5000,
                        equity: 5250,
                        currency: null,
                        status: "CONNECTED",
                        lastHeartbeat: null,
                        lastSync: null,
                    },
                },
                {
                    id: "ar-demo",
                    userId: "user-2",
                    tradingAccountId: "acc-demo-1",
                    status: "GRANTED",
                    createdAt: now,
                    lastUsedAt: now,
                    lastHeartbeatAt: now,
                    user: {
                        id: "user-2",
                        name: "Bob Demo",
                        email: "bob@example.com",
                        image: null,
                        tradingAccounts: [],
                    },
                    tradingAccount: {
                        id: "acc-demo-1",
                        accountNumber: "99999",
                        broker: "Exness",
                        server: "Exness-MT5Trial",
                        platform: "MT5",
                        accountType: "DEMO",
                        balance: 100000,
                        equity: 100000,
                        currency: "USD",
                        status: "CONNECTED",
                        lastHeartbeat: now,
                        lastSync: now,
                    },
                },
            ],
        });

        // Confirmed farm capital should ONLY include acc-real-1 ($5,000, defaulted to USD when currency is null), ignoring acc-demo-1 ($100,000) and unlinked acc-real-2 ($3,000)
        expect(result.farmStats.confirmedFarmBalanceUSD).toBe(5000);
        expect(result.farmStats.confirmedFarmEquityUSD).toBe(5250);

        // User Pool capital should include both acc-real-1 ($5,000) + acc-real-2 ($3,000) = $8,000 (still excluding demo)
        expect(result.farmStats.userPoolBalanceUSD).toBe(8000);
        expect(result.farmStats.userPoolEquityUSD).toBe(8350);

        expect(result.farmStats.confirmedAccountsCount).toBe(2);
        // All 3 accounts (acc-real-1 via accessRecord.lastHeartbeatAt, acc-real-2 via lastHeartbeat, acc-demo-1 via lastHeartbeat) are online
        expect(result.farmStats.onlineAccountsCount).toBe(3);
        expect(result.farmStats.uniqueTradersCount).toBe(2);
        // Operational counts stay separate from capital: demo is visible but
        // never counted as live.
        expect(result.farmStats.totalAccountsCount).toBe(3);
        expect(result.farmStats.liveAccountsCount).toBe(2);
        expect(result.farmStats.demoAccountsCount).toBe(1);
        expect(result.activeUsers).toHaveLength(2);
        expect(result.activeUsers[0].accountNumber).toBe("10001");
        expect(result.activeUsers[0].isConfirmedAccount).toBe(true);
        expect(result.activeUsers[0].isOnline).toBe(true);
    });
});
