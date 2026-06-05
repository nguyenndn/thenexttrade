import { describe, it, expect, vi, beforeEach } from "vitest";
import { getWeeklyReviewEligibility } from "./weekly-review-eligibility";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => {
  return {
    prisma: {
      journalEntry: {
        findMany: vi.fn(),
      },
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
    vi.mocked(prisma.journalEntry.findMany).mockResolvedValue([]);
    vi.mocked(prisma.tradingReport.count).mockResolvedValue(0);
    vi.mocked(prisma.tradingReport.findFirst).mockResolvedValue(null);

    const result = await getWeeklyReviewEligibility({ userId: "user-1" });
    expect(result.ready).toBe(false);
    expect(result.reason).toBe("NO_TRADES");
    expect(result.closedTradeCount).toBe(0);
  });

  it("should return NOT_ENOUGH_DATA for new user with < 5 trades and no calendar week trades", async () => {
    const mockTrades = [
      { id: "1", entryDate: new Date("2026-06-05T10:00:00Z"), exitDate: new Date("2026-06-05T11:00:00Z") },
    ];
    vi.mocked(prisma.journalEntry.findMany).mockResolvedValue(mockTrades as any);
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
    const mockTrades = Array.from({ length: 5 }, (_, i) => ({
      id: String(i),
      entryDate: new Date(`2026-06-05T10:00:00Z`),
      exitDate: new Date(`2026-06-05T11:00:00Z`),
    }));
    vi.mocked(prisma.journalEntry.findMany).mockResolvedValue(mockTrades as any);
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
    // Current date is Friday 2026-06-05.
    // Previous completed week starts Monday 2026-05-25 to Sunday 2026-05-31.
    const mockTrades = [
      { id: "1", entryDate: new Date("2026-05-27T10:00:00Z"), exitDate: new Date("2026-05-27T11:00:00Z") },
    ];
    vi.mocked(prisma.journalEntry.findMany).mockResolvedValue(mockTrades as any);
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
    const mockTrades = [
      { id: "1", entryDate: new Date("2026-05-18T10:00:00Z"), exitDate: new Date("2026-05-18T11:00:00Z") },
      { id: "2", entryDate: newTradeDate, exitDate: newTradeDate },
    ];
    vi.mocked(prisma.journalEntry.findMany).mockResolvedValue(mockTrades as any);
    vi.mocked(prisma.tradingReport.count).mockResolvedValue(1);
    vi.mocked(prisma.tradingReport.findFirst).mockResolvedValue({ periodEnd: lastReportEnd } as any);

    const result = await getWeeklyReviewEligibility({
      userId: "user-1",
      now: new Date("2026-05-28T12:00:00Z"), // 8 days after lastReportEnd
    });
    expect(result.ready).toBe(true);
    expect(result.reason).toBe("READY_RETURNING_REVIEW");
  });

  it("should return NO_NEW_TRADES_AFTER_LAST_REPORT for returning user with no trades after last report", async () => {
    const lastReportEnd = new Date("2026-05-20T23:59:59Z");
    const mockTrades = [
      { id: "1", entryDate: new Date("2026-05-18T10:00:00Z"), exitDate: new Date("2026-05-18T11:00:00Z") },
    ];
    vi.mocked(prisma.journalEntry.findMany).mockResolvedValue(mockTrades as any);
    vi.mocked(prisma.tradingReport.count).mockResolvedValue(1);
    vi.mocked(prisma.tradingReport.findFirst).mockResolvedValue({ periodEnd: lastReportEnd } as any);

    const result = await getWeeklyReviewEligibility({
      userId: "user-1",
      now: new Date("2026-05-28T12:00:00Z"),
    });
    expect(result.ready).toBe(false);
    expect(result.reason).toBe("NO_NEW_TRADES_AFTER_LAST_REPORT");
  });
});
