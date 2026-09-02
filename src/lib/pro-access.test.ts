import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    isVipEligibleBroker,
    normalizeBrokerKey,
    getTrialDaysRemaining,
    isTrialActive,
    TRIAL_DURATION_DAYS,
    MIN_30D_LOTS,
    INACTIVITY_WARNING_DAYS,
    INACTIVITY_PAUSE_DAYS,
    FUNDING_MIN_BALANCE,
    FUNDING_GRACE_DAYS,
    FUNDING_RECHECK_DAYS,
    VALID_SYNC_SOURCES,
    VIP_ELIGIBLE_BROKERS,
    getAccountProAccess,
    getUserProAccess,
    isCentAccount,
    normalizeUsdBalance,
    countTradingDaysBetween,
    subtractTradingDays,
} from "@/lib/pro-access";
import { prisma } from "@/lib/prisma";

// Mock Prisma client for integration test cases
vi.mock("@/lib/prisma", () => ({
    prisma: {
        tradingAccount: {
            findFirst: vi.fn(),
            findMany: vi.fn(),
            update: vi.fn(),
        },
        proEntitlement: {
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            findMany: vi.fn(),
            update: vi.fn(),
            updateMany: vi.fn(),
            upsert: vi.fn(),
        },
        journalEntry: {
            aggregate: vi.fn(),
            findFirst: vi.fn(),
        },
        user: {
            findUnique: vi.fn(),
        },
    },
}));

describe("TC-00: VIP & Trial Constants & Whitelists", () => {
    it("has exact parameters according to v1.4.0 specification", () => {
        expect(TRIAL_DURATION_DAYS).toBe(7);
        expect(MIN_30D_LOTS).toBe(2.0);
        expect(INACTIVITY_WARNING_DAYS).toBe(7);
        expect(INACTIVITY_PAUSE_DAYS).toBe(14);
        expect(FUNDING_MIN_BALANCE).toBe(300);
        expect(FUNDING_GRACE_DAYS).toBe(7);
        expect(FUNDING_RECHECK_DAYS).toBe(30);
        expect(VALID_SYNC_SOURCES).toEqual(["EA_SYNC", "EA_HISTORY", "SUPPORT_SYNC"]);
        expect(VIP_ELIGIBLE_BROKERS).toEqual(["VANTAGE", "EXNESS", "VTMARKETS", "ULTIMAMARKETS"]);
    });
});

describe("TC-01 & TC-02: 7-Day Free Trial Calculations", () => {
    const NOW = new Date("2026-09-02T12:00:00Z");

    it("TC-01.1: Day 0 of signup -> isTrialActive = true, 7 days remaining", () => {
        const createdAt = new Date(NOW.getTime() - 1000 * 60 * 60 * 2); // 2 hours ago
        expect(isTrialActive(createdAt, NOW)).toBe(true);
        expect(getTrialDaysRemaining(createdAt, NOW)).toBe(7);
    });

    it("TC-01.2: Day 3 of signup -> isTrialActive = true, 4 days remaining", () => {
        const createdAt = new Date(NOW.getTime() - 1000 * 60 * 60 * 24 * 3); // 3 days ago
        expect(isTrialActive(createdAt, NOW)).toBe(true);
        expect(getTrialDaysRemaining(createdAt, NOW)).toBe(4);
    });

    it("TC-01.3: Day 6 of signup -> isTrialActive = true, 1 day remaining", () => {
        const createdAt = new Date(NOW.getTime() - 1000 * 60 * 60 * 24 * 6); // 6 days ago
        expect(isTrialActive(createdAt, NOW)).toBe(true);
        expect(getTrialDaysRemaining(createdAt, NOW)).toBe(1);
    });

    it("TC-02.1: Day 7.1 (past 7 days) -> isTrialActive = false, 0 days remaining", () => {
        const createdAt = new Date(NOW.getTime() - 1000 * 60 * 60 * 24 * 7.1);
        expect(isTrialActive(createdAt, NOW)).toBe(false);
        expect(getTrialDaysRemaining(createdAt, NOW)).toBe(0);
    });

    it("TC-02.2: Day 30 -> isTrialActive = false, 0 days remaining", () => {
        const createdAt = new Date(NOW.getTime() - 1000 * 60 * 60 * 24 * 30);
        expect(isTrialActive(createdAt, NOW)).toBe(false);
        expect(getTrialDaysRemaining(createdAt, NOW)).toBe(0);
    });
});

describe("TC-03 & TC-04: Partner Broker Identification & Normalization", () => {
    it("TC-03: recognizes supported partner brokers regardless of case or suffix", () => {
        expect(isVipEligibleBroker("Vantage")).toBe(true);
        expect(isVipEligibleBroker("Vantage FX")).toBe(true);
        expect(isVipEligibleBroker("vantage-markets")).toBe(true);
        expect(isVipEligibleBroker("VANTAGE INTERNATIONAL")).toBe(true);
        expect(isVipEligibleBroker("Exness")).toBe(true);
        expect(isVipEligibleBroker("exness-real")).toBe(true);
        expect(isVipEligibleBroker("VTMarkets")).toBe(true);
        expect(isVipEligibleBroker("VT Markets Live")).toBe(true);
        expect(isVipEligibleBroker("Ultima Markets")).toBe(true);
        expect(isVipEligibleBroker("ULTIMA MARKETS PTY")).toBe(true);
    });

    it("TC-04: rejects unsupported brokers or invalid inputs", () => {
        expect(isVipEligibleBroker("IC Markets")).toBe(false);
        expect(isVipEligibleBroker("XM")).toBe(false);
        expect(isVipEligibleBroker("FTMO")).toBe(false);
        expect(isVipEligibleBroker("Forex.com")).toBe(false);
        expect(isVipEligibleBroker(null)).toBe(false);
        expect(isVipEligibleBroker(undefined)).toBe(false);
        expect(isVipEligibleBroker("")).toBe(false);
    });
});

describe("TC-05 to TC-14: Account Pro Access & Activity Policy Engine", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("TC-05: ACTIVE VIP trader with 2.5 lots and trade 2 days ago -> policyState = ACTIVE", async () => {
        const now = new Date();
        const twoDaysAgo = subtractTradingDays(now, 2);

        (prisma.tradingAccount.findFirst as any).mockResolvedValue({
            id: "acc-1",
            broker: "Vantage",
            balance: 500,
            fundingVerifiedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
            fundingAmount: 500,
            fundingLastVerifiedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
            fundingGraceUntil: null,
        });

        (prisma.proEntitlement.findUnique as any).mockResolvedValue({
            id: "ent-1",
            status: "ACTIVE",
            source: "IB_VERIFIED",
            expiresAt: null,
        });

        (prisma.journalEntry.aggregate as any).mockResolvedValue({
            _sum: { lotSize: 2.5 },
        });

        (prisma.journalEntry.findFirst as any).mockResolvedValue({
            exitDate: twoDaysAgo,
            entryDate: twoDaysAgo,
        });

        const result = await getAccountProAccess("user-1", "acc-1");

        expect(result.isPro).toBe(true);
        expect(result.status).toBe("ACTIVE");
        expect(result.policyState).toBe("ACTIVE");
        expect(result.activityInfo?.rolling30dLots).toBe(2.5);
        expect(result.activityInfo?.daysSinceLastTrade).toBe(2);
        expect(result.fundingInfo?.verified).toBe(true);
    });

    it("TC-06: Inactivity Warning when no trades for 8 trading days (7-14 trading days) -> policyState = WARNED", async () => {
        const now = new Date();
        const eightDaysAgo = subtractTradingDays(now, 8);

        (prisma.tradingAccount.findFirst as any).mockResolvedValue({
            id: "acc-1",
            broker: "Exness",
            balance: 400,
            fundingVerifiedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
            fundingAmount: 400,
            fundingLastVerifiedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
            fundingGraceUntil: null,
        });

        (prisma.proEntitlement.findUnique as any).mockResolvedValue({
            id: "ent-1",
            status: "ACTIVE",
            source: "IB_VERIFIED",
            expiresAt: null,
        });

        (prisma.journalEntry.aggregate as any).mockResolvedValue({
            _sum: { lotSize: 3.0 },
        });

        (prisma.journalEntry.findFirst as any).mockResolvedValue({
            exitDate: eightDaysAgo,
            entryDate: eightDaysAgo,
        });

        const result = await getAccountProAccess("user-1", "acc-1");

        expect(result.isPro).toBe(true); // Still Pro while in warned state
        expect(result.status).toBe("ACTIVE");
        expect(result.policyState).toBe("WARNED");
        expect(result.activityInfo?.daysSinceLastTrade).toBe(8);
    });

    it("TC-07: Inactivity Pause when no trades for 15 trading days (>14 trading days) -> policyState = PAUSED, isPro = false", async () => {
        const now = new Date();
        const fifteenDaysAgo = subtractTradingDays(now, 15);

        (prisma.tradingAccount.findFirst as any).mockResolvedValue({
            id: "acc-1",
            broker: "VTMarkets",
            balance: 600,
            fundingVerifiedAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
            fundingAmount: 600,
            fundingLastVerifiedAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
            fundingGraceUntil: null,
        });

        (prisma.proEntitlement.findUnique as any).mockResolvedValue({
            id: "ent-1",
            status: "ACTIVE",
            source: "IB_VERIFIED",
            expiresAt: null,
        });

        (prisma.journalEntry.aggregate as any).mockResolvedValue({
            _sum: { lotSize: 3.0 },
        });

        (prisma.journalEntry.findFirst as any).mockResolvedValue({
            exitDate: fifteenDaysAgo,
            entryDate: fifteenDaysAgo,
        });

        const result = await getAccountProAccess("user-1", "acc-1");

        expect(result.isPro).toBe(false); // PAUSED means effective Pro is false
        expect(result.policyState).toBe("PAUSED");
        expect(result.activityInfo?.daysSinceLastTrade).toBe(15);
    });

    it("TC-08: Volume Under Requirement (< 2.0 lots in 30 days) -> policyState = PAUSED, isPro = false", async () => {
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

        (prisma.tradingAccount.findFirst as any).mockResolvedValue({
            id: "acc-1",
            broker: "Ultima Markets",
            balance: 350,
            fundingVerifiedAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
            fundingAmount: 350,
            fundingLastVerifiedAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
            fundingGraceUntil: null,
        });

        (prisma.proEntitlement.findUnique as any).mockResolvedValue({
            id: "ent-1",
            status: "ACTIVE",
            source: "IB_VERIFIED",
            expiresAt: null,
        });

        (prisma.journalEntry.aggregate as any).mockResolvedValue({
            _sum: { lotSize: 1.2 }, // Only 1.2 lots < 2.0 lots
        });

        (prisma.journalEntry.findFirst as any).mockResolvedValue({
            exitDate: oneDayAgo,
            entryDate: oneDayAgo,
        });

        const result = await getAccountProAccess("user-1", "acc-1");

        expect(result.isPro).toBe(false);
        expect(result.policyState).toBe("PAUSED");
        expect(result.activityInfo?.rolling30dLots).toBe(1.2);
    });

    it("TC-09: Unsupported Non-Partner Broker -> policyState = PAUSED", async () => {
        const now = new Date();

        (prisma.tradingAccount.findFirst as any).mockResolvedValue({
            id: "acc-1",
            broker: "RandomBroker",
            balance: 1000,
            fundingVerifiedAt: null,
            fundingAmount: null,
            fundingLastVerifiedAt: null,
            fundingGraceUntil: null,
        });

        (prisma.proEntitlement.findUnique as any).mockResolvedValue({
            id: "ent-1",
            status: "ACTIVE",
            source: "MANUAL",
            expiresAt: null,
        });

        (prisma.journalEntry.aggregate as any).mockResolvedValue({
            _sum: { lotSize: 5.0 },
        });

        (prisma.journalEntry.findFirst as any).mockResolvedValue({
            exitDate: now,
            entryDate: now,
        });

        const result = await getAccountProAccess("user-1", "acc-1");

        expect(result.isPro).toBe(false);
        expect(result.policyState).toBe("PAUSED");
        expect(result.activityInfo?.rolling30dLots).toBe(0); // non-partner lots ignored
    });

    it("TC-10: 30-day Periodic Funding Check in Grace (balance < $300) -> policyState = WARNED", async () => {
        const now = new Date();
        const futureGrace = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000); // 4 days remaining

        (prisma.tradingAccount.findFirst as any).mockResolvedValue({
            id: "acc-1",
            broker: "Vantage",
            balance: 200,
            fundingVerifiedAt: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000),
            fundingAmount: 300,
            fundingLastVerifiedAt: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000),
            fundingGraceUntil: futureGrace,
        });

        (prisma.proEntitlement.findUnique as any).mockResolvedValue({
            id: "ent-1",
            status: "ACTIVE",
            source: "IB_VERIFIED",
            expiresAt: null,
        });

        (prisma.journalEntry.aggregate as any).mockResolvedValue({
            _sum: { lotSize: 3.5 },
        });

        (prisma.journalEntry.findFirst as any).mockResolvedValue({
            exitDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
            entryDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        });

        const result = await getAccountProAccess("user-1", "acc-1");

        expect(result.isPro).toBe(true);
        expect(result.policyState).toBe("WARNED");
        expect(result.fundingInfo?.inGrace).toBe(true);
        expect(result.fundingInfo?.expired).toBe(false);
    });

    it("TC-11: Funding Grace Expired -> policyState = PAUSED, isPro = false", async () => {
        const now = new Date();
        const pastGrace = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // Expired yesterday

        (prisma.tradingAccount.findFirst as any).mockResolvedValue({
            id: "acc-1",
            broker: "Vantage",
            balance: 200,
            fundingVerifiedAt: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000),
            fundingAmount: 300,
            fundingLastVerifiedAt: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000),
            fundingGraceUntil: pastGrace,
        });

        (prisma.proEntitlement.findUnique as any).mockResolvedValue({
            id: "ent-1",
            status: "ACTIVE",
            source: "IB_VERIFIED",
            expiresAt: null,
        });

        (prisma.journalEntry.aggregate as any).mockResolvedValue({
            _sum: { lotSize: 3.5 },
        });

        (prisma.journalEntry.findFirst as any).mockResolvedValue({
            exitDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
            entryDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        });

        const result = await getAccountProAccess("user-1", "acc-1");

        expect(result.isPro).toBe(false);
        expect(result.policyState).toBe("PAUSED");
        expect(result.fundingInfo?.expired).toBe(true);
    });
});

describe("TC-12 to TC-15: Anti-Bypass & Security Safeguards", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("TC-12: Anti-Bypass: Cent account balance normalization converts USC to USD", () => {
        expect(isCentAccount("USC", "Exness-Real1")).toBe(true);
        expect(isCentAccount("EU_CENT", "VTMarkets-Cent")).toBe(true);
        expect(isCentAccount("USD", "Vantage-Live")).toBe(false);

        // 300 USC ($3 USD) -> normalized to $3 (fails $300 threshold)
        expect(normalizeUsdBalance(300, "USC", "Exness-Cent")).toBe(3);

        // 30,000 USC ($300 USD) -> normalized to $300 (passes $300 threshold)
        expect(normalizeUsdBalance(30000, "USC", "Exness-Cent")).toBe(300);

        // Standard USD account -> unchanged
        expect(normalizeUsdBalance(500, "USD", "Vantage-Live")).toBe(500);
    });

    it("TC-13: Anti-Bypass: Historical trade dump (>30 days old) excluded by aggregate query filter", async () => {
        const now = new Date();

        (prisma.tradingAccount.findFirst as any).mockResolvedValue({
            id: "acc-1",
            broker: "Exness",
            balance: 1000,
            fundingVerifiedAt: new Date(),
            fundingAmount: 1000,
            fundingLastVerifiedAt: new Date(),
            fundingGraceUntil: null,
        });

        (prisma.proEntitlement.findUnique as any).mockResolvedValue({
            id: "ent-1",
            status: "ACTIVE",
            source: "IB_VERIFIED",
            expiresAt: null,
        });

        // 500 lots from last year filtered out by 30d window -> aggregate returns 0 lots
        (prisma.journalEntry.aggregate as any).mockResolvedValue({
            _sum: { lotSize: 0 },
        });

        (prisma.journalEntry.findFirst as any).mockResolvedValue(null);

        const result = await getAccountProAccess("user-1", "acc-1");

        expect(result.isPro).toBe(false);
        expect(result.policyState).toBe("PAUSED");
        expect(result.activityInfo?.rolling30dLots).toBe(0);
    });

    it("TC-14: Anti-Bypass: Manual web entries (syncSource: MANUAL) excluded from volume", async () => {
        const now = new Date();

        (prisma.tradingAccount.findFirst as any).mockResolvedValue({
            id: "acc-1",
            broker: "VTMarkets",
            balance: 500,
            fundingVerifiedAt: new Date(),
            fundingAmount: 500,
            fundingLastVerifiedAt: new Date(),
            fundingGraceUntil: null,
        });

        (prisma.proEntitlement.findUnique as any).mockResolvedValue({
            id: "ent-1",
            status: "ACTIVE",
            source: "IB_VERIFIED",
            expiresAt: null,
        });

        // Manual trades excluded by syncSource query filter -> returns 0 lots
        (prisma.journalEntry.aggregate as any).mockResolvedValue({
            _sum: { lotSize: 0 },
        });

        (prisma.journalEntry.findFirst as any).mockResolvedValue(null);

        const result = await getAccountProAccess("user-1", "acc-1");

        expect(result.isPro).toBe(false);
        expect(result.policyState).toBe("PAUSED");
    });
});

describe("Trading Days Calculation (skipping Saturday & Sunday)", () => {
    it("returns 0 when startDate >= endDate", () => {
        const now = new Date("2026-09-02T10:00:00Z");
        expect(countTradingDaysBetween(now, now)).toBe(0);
        expect(countTradingDaysBetween(new Date("2026-09-03T10:00:00Z"), now)).toBe(0);
    });

    it("skips Saturday and Sunday from Friday to Monday", () => {
        // Friday 2026-09-04 15:00 UTC
        const friday = new Date("2026-09-04T15:00:00Z");
        const saturday = new Date("2026-09-05T15:00:00Z");
        const sunday = new Date("2026-09-06T15:00:00Z");
        const monday = new Date("2026-09-07T15:00:00Z");

        expect(countTradingDaysBetween(friday, saturday)).toBe(0); // Sat skipped
        expect(countTradingDaysBetween(friday, sunday)).toBe(0);   // Sun skipped
        expect(countTradingDaysBetween(friday, monday)).toBe(1);   // Mon counted (+1)
    });

    it("counts exactly 5 trading days in a full calendar week", () => {
        // Monday 2026-09-07 10:00 UTC to next Monday 2026-09-14 10:00 UTC
        const startMonday = new Date("2026-09-07T10:00:00Z");
        const endMonday = new Date("2026-09-14T10:00:00Z");

        expect(countTradingDaysBetween(startMonday, endMonday)).toBe(5);
    });

    it("counts exactly 7 trading days across two weeks", () => {
        // Friday 2026-09-04 10:00 UTC
        const startFriday = new Date("2026-09-04T10:00:00Z");
        // Following Tuesday 2026-09-15 10:00 UTC (11 calendar days later)
        const tuesdayWeek2 = new Date("2026-09-15T10:00:00Z");

        expect(countTradingDaysBetween(startFriday, tuesdayWeek2)).toBe(7);
    });

    it("correctly roundtrips with subtractTradingDays", () => {
        const refDate = new Date("2026-09-02T12:00:00Z");
        for (const days of [1, 2, 5, 7, 8, 14, 15]) {
            const pastDate = subtractTradingDays(refDate, days);
            expect(countTradingDaysBetween(pastDate, refDate)).toBe(days);
        }
    });
});


