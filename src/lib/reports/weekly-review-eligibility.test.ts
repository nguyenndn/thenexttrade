import { describe, it, expect, vi, beforeEach } from "vitest";
import { getWeeklyReviewEligibility } from "./weekly-review-eligibility";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => {
    return {
        prisma: {
            $queryRaw: vi.fn(),
            tradingReport: {
                findFirst: vi.fn(),
                count: vi.fn(),
            },
        },
    };
});

describe("getWeeklyReviewEligibility", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should return NO_TRADES when user has no trades", async () => {
        vi.mocked(prisma.$queryRaw).mockResolvedValue([
            {
                closedTradeCount: 0,
                firstTradeDate: null,
                latestTradeDate: null,
                prevWeekCount: 0,
                afterReportCount: 0,
            },
        ]);
        vi.mocked(prisma.tradingReport.count).mockResolvedValue(0);
        vi.mocked(prisma.tradingReport.findFirst).mockResolvedValue(null);

        const result = await getWeeklyReviewEligibility({ userId: "user-1" });
        expect(result.ready).toBe(false);
        expect(result.reason).toBe("NO_TRADES");
        expect(result.closedTradeCount).toBe(0);
    });

    it("should return NOT_ENOUGH_DATA for new user with < 5 trades and no calendar week trades", async () => {
        vi.mocked(prisma.$queryRaw).mockResolvedValue([
            {
                closedTradeCount: 1,
                firstTradeDate: new Date("2026-06-05T11:00:00Z"),
                latestTradeDate: new Date("2026-06-05T11:00:00Z"),
                prevWeekCount: 0,
                afterReportCount: 0,
            },
        ]);
        vi.mocked(prisma.tradingReport.count).mockResolvedValue(0);
        vi.mocked(prisma.tradingReport.findFirst).mockResolvedValue(null);

        const result = await getWeeklyReviewEligibility({
            userId: "user-1",
            now: new Date("2026-06-05T12:00:00Z"), // Friday
        });
        expect(result.ready).toBe(false);
        expect(result.reason).toBe("NOT_ENOUGH_DATA");
        expect(result.closedTradeCount).toBe(1);
    });

    it("should return READY_FIRST_REVIEW when new user has >= 5 trades", async () => {
        vi.mocked(prisma.$queryRaw).mockResolvedValue([
            {
                closedTradeCount: 5,
                firstTradeDate: new Date("2026-06-05T11:00:00Z"),
                latestTradeDate: new Date("2026-06-05T11:00:00Z"),
                prevWeekCount: 0,
                afterReportCount: 0,
            },
        ]);
        vi.mocked(prisma.tradingReport.count).mockResolvedValue(0);
        vi.mocked(prisma.tradingReport.findFirst).mockResolvedValue(null);

        const result = await getWeeklyReviewEligibility({
            userId: "user-1",
            now: new Date("2026-06-05T12:00:00Z"),
        });
        expect(result.ready).toBe(true);
        expect(result.reason).toBe("READY_FIRST_REVIEW");
        expect(result.closedTradeCount).toBe(5);
    });

    it("should return READY_FIRST_REVIEW when user has trade in previous completed calendar week", async () => {
        vi.mocked(prisma.$queryRaw).mockResolvedValue([
            {
                closedTradeCount: 1,
                firstTradeDate: new Date("2026-05-27T11:00:00Z"),
                latestTradeDate: new Date("2026-05-27T11:00:00Z"),
                prevWeekCount: 1,
                afterReportCount: 0,
            },
        ]);
        vi.mocked(prisma.tradingReport.count).mockResolvedValue(0);
        vi.mocked(prisma.tradingReport.findFirst).mockResolvedValue(null);

        const result = await getWeeklyReviewEligibility({
            userId: "user-1",
            now: new Date("2026-06-05T12:00:00Z"),
        });
        expect(result.ready).toBe(true);
        expect(result.reason).toBe("READY_FIRST_REVIEW");
    });

    it("should return READY_RETURNING_REVIEW for returning user with new trades after 7 days", async () => {
        const lastReportEnd = new Date("2026-05-20T23:59:59Z");
        const newTradeDate = new Date("2026-05-22T10:00:00Z");
        vi.mocked(prisma.$queryRaw).mockResolvedValue([
            {
                closedTradeCount: 2,
                firstTradeDate: new Date("2026-05-18T11:00:00Z"),
                latestTradeDate: newTradeDate,
                prevWeekCount: 0,
                afterReportCount: 1,
            },
        ]);
        vi.mocked(prisma.tradingReport.count).mockResolvedValue(1);
        vi.mocked(prisma.tradingReport.findFirst).mockResolvedValue({
            periodEnd: lastReportEnd,
        } as unknown as Awaited<ReturnType<typeof prisma.tradingReport.findFirst>>);

        const result = await getWeeklyReviewEligibility({
            userId: "user-1",
            now: new Date("2026-05-28T12:00:00Z"), // 8 days after lastReportEnd
        });
        expect(result.ready).toBe(true);
        expect(result.reason).toBe("READY_RETURNING_REVIEW");
    });

    it("should return NO_NEW_TRADES_AFTER_LAST_REPORT for returning user with no trades after last report", async () => {
        const lastReportEnd = new Date("2026-05-20T23:59:59Z");
        vi.mocked(prisma.$queryRaw).mockResolvedValue([
            {
                closedTradeCount: 1,
                firstTradeDate: new Date("2026-05-18T11:00:00Z"),
                latestTradeDate: new Date("2026-05-18T11:00:00Z"),
                prevWeekCount: 0,
                afterReportCount: 0,
            },
        ]);
        vi.mocked(prisma.tradingReport.count).mockResolvedValue(1);
        vi.mocked(prisma.tradingReport.findFirst).mockResolvedValue({
            periodEnd: lastReportEnd,
        } as unknown as Awaited<ReturnType<typeof prisma.tradingReport.findFirst>>);

        const result = await getWeeklyReviewEligibility({
            userId: "user-1",
            now: new Date("2026-05-28T12:00:00Z"),
        });
        expect(result.ready).toBe(false);
        expect(result.reason).toBe("NO_NEW_TRADES_AFTER_LAST_REPORT");
    });
});
