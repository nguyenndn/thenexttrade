import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import {
    calculatePipValue,
    calculatePositionSize,
    calculateRiskReward,
    calculateMargin,
    calculateProfitLoss,
    getPairBaseAndQuote,
} from "@/lib/calculators";
import { GET as exportCsvGet } from "@/app/api/export/csv/route";
import { resolveSyncAuth } from "@/lib/sync-auth";
import { calculatePsychologyDiagnostic } from "@/lib/analytics/psychology-engine.server";
import { getJournalEntries } from "@/actions/journal";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";

vi.mock("next/cache", () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
}));

vi.mock("@/lib/experiments/progress.server", () => ({
    onUserTradesUpdated: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/auth-cache", () => ({
    getAuthUser: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
        },
        tradingAccount: {
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            findMany: vi.fn(),
        },
        journalEntry: {
            findMany: vi.fn(),
            count: vi.fn(),
            aggregate: vi.fn(),
            groupBy: vi.fn(),
        },
    },
}));

describe("User Features Audit — Forex Calculators & Financial Math", () => {
    it("parses base and quote currencies cleanly without substring collisions (e.g. GBPJPY vs EURGBP)", () => {
        expect(getPairBaseAndQuote("GBPJPY")).toEqual({
            base: "GBP",
            quote: "JPY",
            isIndex: false,
        });
        expect(getPairBaseAndQuote("EURGBP")).toEqual({
            base: "EUR",
            quote: "GBP",
            isIndex: false,
        });
        expect(getPairBaseAndQuote("US30")).toEqual({
            base: "US30",
            quote: "USD",
            isIndex: true,
        });
    });

    it("converts Pip Value and Position Size outputs into non-USD account currencies", () => {
        const usdPip = calculatePipValue({
            pair: "EURUSD",
            lotSize: 1,
            accountCurrency: "USD",
        });
        const eurPip = calculatePipValue({
            pair: "EURUSD",
            lotSize: 1,
            accountCurrency: "EUR",
        });
        const jpyPip = calculatePipValue({
            pair: "EURUSD",
            lotSize: 1,
            accountCurrency: "JPY",
        });

        expect(usdPip).toBe(10);
        expect(eurPip).toBeLessThan(usdPip); // 10 USD / 1.085 = ~9.2166 EUR
        expect(jpyPip).toBeCloseTo(1550, 0); // 10 USD * 155 = 1,550 JPY

        // Zero balance or zero SL returns 0 lots cleanly
        expect(
            calculatePositionSize({
                accountBalance: 0,
                riskPercent: 1,
                stopLossPips: 20,
                pair: "EURUSD",
                accountCurrency: "USD",
            }).lotSize
        ).toBe(0);
    });

    it("computes exact $100,000 USD notional for 1 lot on USD-base pairs (fixes 155x USDJPY notional inflation)", () => {
        const usdJpyMargin = calculateMargin({
            lotSize: 1,
            pair: "USDJPY",
            leverage: 100,
            currentPrice: 155.0,
            accountCurrency: "USD",
        });
        expect(usdJpyMargin.positionValue).toBe(100000);
        expect(usdJpyMargin.requiredMargin).toBe(1000);
    });

    it("validates directional SL/TP ordering in calculateRiskReward", () => {
        // Invalid LONG where SL >= Entry
        const invalidLong = calculateRiskReward({
            entryPrice: 1.085,
            stopLoss: 1.09,
            takeProfit: 1.095,
            direction: "LONG",
            pair: "EURUSD",
        });
        expect(invalidLong.isValid).toBe(false);
        expect(invalidLong.rrRatio).toBe(0);

        // Valid SHORT where TP < Entry < SL
        const validShort = calculateRiskReward({
            entryPrice: 2900,
            stopLoss: 2910,
            takeProfit: 2880,
            direction: "SHORT",
            pair: "XAUUSD",
        });
        expect(validShort.isValid).toBe(true);
        expect(validShort.rrRatio).toBe(2);
    });

    it("converts cross-pair Profit/Loss accurately into EUR/JPY account currencies", () => {
        const resUsd = calculateProfitLoss({
            entryPrice: 155.0,
            exitPrice: 156.0,
            lotSize: 1,
            direction: "LONG",
            pair: "USDJPY",
            accountCurrency: "USD",
        });
        // +100,000 JPY / 156.0 = +$641.03 USD
        expect(resUsd.pips).toBe(100);
        expect(resUsd.profitLoss).toBeCloseTo(641.03, 1);
    });
});

describe("User Features Audit — CSV Formula Injection & Realized Tax Export", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getAuthUser).mockResolvedValue({ id: "user-csv" } as never);
    });

    it("neutralizes arithmetic-suffix (-1+cmd) and leading-whitespace formula payloads while preserving plain negative numbers", async () => {
        vi.mocked(prisma.journalEntry.findMany).mockResolvedValue([
            {
                id: "t1",
                externalTicket: "1001",
                symbol: "XAUUSD",
                type: "BUY",
                entryDate: new Date("2026-05-01T10:00:00Z"),
                exitDate: new Date("2026-05-01T12:00:00Z"),
                entryPrice: 2900,
                exitPrice: 2890,
                lotSize: 0.1,
                pnl: -125.5,
                commission: -0.7,
                swap: 0,
                entryReason: "-1+cmd|' /C calc'!A0",
                mistakes: [" =SUM(A1:A2)"],
                status: "CLOSED",
            },
        ] as never);

        const req = new NextRequest(
            "http://localhost:3500/api/export/csv?type=tax"
        );
        const res = await exportCsvGet(req);
        expect(res.status).toBe(200);
        const csv = await res.text();

        // Tax export queries CLOSED trades with non-null exitDate
        expect(prisma.journalEntry.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    userId: "user-csv",
                    status: "CLOSED",
                    exitDate: { not: null },
                }),
            })
        );

        // Plain negative numbers (-125.50, -126.20) stay unprefixed numeric strings
        expect(csv).toContain('"-125.50"');
        expect(csv).toContain('"-126.20"');

        // Formula payloads with leading minus+operator or leading space are prefixed with single quote
        expect(csv).toContain(`"'-1+cmd|' /C calc'!A0"`);
        expect(csv).toContain(`"' =SUM(A1:A2)"`);
    });
});

describe("User Features Audit — Sync Auth Cross-Account IDOR Protection", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("rejects legacy account API key when payload targets a different accountId or accountNumber", async () => {
        vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
        vi.mocked(prisma.tradingAccount.findUnique).mockResolvedValue({
            id: "acc-owner",
            userId: "user-1",
            accountNumber: "888001",
            apiKey: "legacy-key-1234567890",
            autoSync: true,
            syncOpenTrades: true,
            platform: "MT5",
            broker: "Exness",
            server: "Exness-Real",
            currency: "USD",
            accountType: "REAL",
            status: "ACTIVE",
            ibAttribution: "UNVERIFIED",
        } as never);

        const mismatchIdReq = new NextRequest("http://localhost/api/mt5/sync", {
            method: "POST",
            headers: { "X-API-Key": "legacy-key-1234567890" },
        });

        const resWrongId = await resolveSyncAuth({
            request: mismatchIdReq,
            accountId: "acc-victim-other-tenant",
            requireAccount: true,
        });
        expect(resWrongId.success).toBe(false);
        if (!resWrongId.success) {
            expect(resWrongId.status).toBe(403);
        }

        const resWrongNumber = await resolveSyncAuth({
            request: mismatchIdReq,
            accountNumber: "999999",
            requireAccount: true,
        });
        expect(resWrongNumber.success).toBe(false);
        if (!resWrongNumber.success) {
            expect(resWrongNumber.status).toBe(403);
        }
    });
});

describe("User Features Audit — Real R-Multiple Psychology Optimizer", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns insufficientData when fewer than 5 closed trades have protective Stop Loss", async () => {
        vi.mocked(prisma.journalEntry.findMany).mockResolvedValue([
            {
                id: "1",
                symbol: "XAUUSD",
                type: "BUY",
                result: "LOSS",
                entryPrice: 2900,
                exitPrice: 2890,
                stopLoss: 2890,
                pnl: -100,
                commission: 0,
                swap: 0,
                entryDate: new Date("2026-05-01T10:00:00Z"),
                exitDate: new Date("2026-05-01T11:00:00Z"),
                lotSize: 0.1,
                syncSource: "EA_SYNC",
                tradingSession: "London",
                account: { currency: "USD", server: "Vantage-Live" },
            },
        ] as never);

        const report = await calculatePsychologyDiagnostic("user-1", "all");
        expect(report.insufficientData).toBe(true);
        expect(report.rrOptimizer).toEqual([]);
    });

    it("simulates real R-multiple caps across >= 5 protective-SL trades without magic multipliers", async () => {
        // 5 BUY trades risking 10 points ($100), each closing at +20 points (+2.0R = +$200) except 1 loss (-1.0R = -$100)
        const baseTrades = [1, 2, 3, 4].map((idx) => ({
            id: `w-${idx}`,
            symbol: "XAUUSD",
            type: "BUY",
            result: "WIN",
            entryPrice: 2900,
            exitPrice: 2920,
            stopLoss: 2890,
            pnl: 200,
            commission: 0,
            swap: 0,
            entryDate: new Date(`2026-05-0${idx}T10:00:00Z`),
            exitDate: new Date(`2026-05-0${idx}T11:00:00Z`),
            lotSize: 0.1,
            syncSource: "EA_SYNC",
            tradingSession: "London",
            account: { currency: "USD", server: "Vantage-Live" },
        }));
        baseTrades.push({
            id: "l-5",
            symbol: "XAUUSD",
            type: "BUY",
            result: "LOSS",
            entryPrice: 2900,
            exitPrice: 2890,
            stopLoss: 2890,
            pnl: -100,
            commission: 0,
            swap: 0,
            entryDate: new Date("2026-05-05T10:00:00Z"),
            exitDate: new Date("2026-05-05T11:00:00Z"),
            lotSize: 0.1,
            syncSource: "EA_SYNC",
            tradingSession: "London",
            account: { currency: "USD", server: "Vantage-Live" },
        });

        vi.mocked(prisma.journalEntry.findMany).mockResolvedValue(
            baseTrades as never
        );

        const report = await calculatePsychologyDiagnostic("user-1", "all");
        expect(report.insufficientData).toBe(false);
        expect(report.rrOptimizer).toHaveLength(5);

        const target2R = report.rrOptimizer.find((o) => o.targetRR === 2.0);
        const target1R = report.rrOptimizer.find((o) => o.targetRR === 1.0);
        expect(target2R?.simulatedNetPnL).toBe(700); // 4 * $200 - 1 * $100
        expect(target1R?.simulatedNetPnL).toBe(300); // 4 * $100 - 1 * $100
        expect(target2R?.isOptimal).toBe(true);
    });
});

describe("User Features Audit — Multi-Account Journal Summary Cent Scaling", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getAuthUser).mockResolvedValue({ id: "user-multi" } as never);
    });

    it("scales USC Cent account PnL by 0.01 and only divides manual Cent lots by 100 in All Accounts mode", async () => {
        vi.mocked(prisma.tradingAccount.findMany).mockResolvedValue([
            {
                id: "acc-usd",
                currency: "USD",
                server: "Vantage-Live",
                accountType: "REAL",
            },
            {
                id: "acc-cent",
                currency: "USC",
                server: "Exness-Cent",
                accountType: "REAL",
            },
        ] as never);

        vi.mocked(prisma.journalEntry.findMany).mockResolvedValue([] as never);
        vi.mocked(prisma.journalEntry.count).mockResolvedValue(3 as never);
        vi.mocked(prisma.journalEntry.groupBy).mockResolvedValue([
            { result: "WIN", _count: 3 },
        ] as never);

        vi.mocked(prisma.journalEntry.aggregate).mockImplementation(
            ((args: { where?: { AND?: Array<Record<string, unknown>> } }) => {
                const clauses = args?.where?.AND ?? [];
                const isManualFilter = clauses.some((c) => "OR" in c);
                const acctClause = clauses.find((c) => "accountId" in c);
                const acctId = acctClause?.accountId;

                if (acctId === "acc-usd") {
                    return Promise.resolve({
                        _sum: { pnl: 100, swap: 0, commission: -5, lotSize: 1.0 },
                    });
                }
                if (acctId === "acc-cent" && isManualFilter) {
                    return Promise.resolve({
                        _sum: { lotSize: 10 },
                    });
                }
                if (acctId === "acc-cent") {
                    return Promise.resolve({
                        _sum: {
                            pnl: 5000,
                            swap: 0,
                            commission: -100,
                            lotSize: 10.5,
                        },
                    });
                }
                return Promise.resolve({
                    _sum: { pnl: 0, swap: 0, commission: 0, lotSize: 0 },
                });
            }) as never
        );

        const res = await getJournalEntries(1, 20, { accountId: "all" });
        // USD net: 100 - 5 = $95.00; USC net: (5000 - 100) * 0.01 = $49.00 -> Total = $144.00
        expect(res.stats?.totalPnL).toBe(144);
        // Lots: 1.0 (USD) + 0.5 (synced Cent) + 10/100 (manual Cent) = 1.60
        expect(res.stats?.totalLots).toBe(1.6);
    });
});
