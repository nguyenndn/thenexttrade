import { prisma } from "@/lib/prisma";
import { startOfWeek, subDays, subMilliseconds } from "date-fns";

export type WeeklyReviewEligibility = {
    isFirstWeeklyReview: boolean;
    firstReviewReady: boolean;
    returningReviewReady: boolean;
    ready: boolean;
    reason:
        | "NO_TRADES"
        | "NOT_ENOUGH_DATA"
        | "READY_FIRST_REVIEW"
        | "READY_RETURNING_REVIEW"
        | "NO_NEW_TRADES_AFTER_LAST_REPORT";
    closedTradeCount: number;
    firstClosedTradeDate: Date | null;
    latestClosedTradeDate: Date | null;
    tradeDateSpanDays: number;
    weeklyReportCount: number;
};

export async function getWeeklyReviewEligibility(params: {
    userId: string;
    accountId?: string;
    now?: Date;
}): Promise<WeeklyReviewEligibility> {
    const { userId, accountId, now = new Date() } = params;

    // 1. Fetch closed trades (status = CLOSED)
    const closedTrades = await prisma.journalEntry.findMany({
        where: {
            userId,
            ...(accountId ? { accountId } : {}),
            status: "CLOSED",
        },
        select: {
            id: true,
            entryDate: true,
            exitDate: true,
        },
        orderBy: [{ exitDate: "asc" }, { entryDate: "asc" }],
    });

    // 2. Fetch latest weekly report
    const latestWeeklyReport = await prisma.tradingReport.findFirst({
        where: { userId, type: "WEEKLY" },
        orderBy: { periodEnd: "desc" },
        select: { periodEnd: true },
    });

    const weeklyReportCount = await prisma.tradingReport.count({
        where: { userId, type: "WEEKLY" },
    });

    const closedTradeCount = closedTrades.length;
    const isFirstWeeklyReview = weeklyReportCount === 0;

    if (closedTradeCount === 0) {
        return {
            isFirstWeeklyReview,
            firstReviewReady: false,
            returningReviewReady: false,
            ready: false,
            reason: "NO_TRADES",
            closedTradeCount: 0,
            firstClosedTradeDate: null,
            latestClosedTradeDate: null,
            tradeDateSpanDays: 0,
            weeklyReportCount,
        };
    }

    // Helper to extract exitDate or fallback to entryDate
    const getTradeDate = (t: (typeof closedTrades)[0]) =>
        t.exitDate || t.entryDate;

    // Filter out any trades with invalid dates
    const validTrades = closedTrades.filter((t) => {
        const d = getTradeDate(t);
        return d && !isNaN(d.getTime());
    });

    if (validTrades.length === 0) {
        return {
            isFirstWeeklyReview,
            firstReviewReady: false,
            returningReviewReady: false,
            ready: false,
            reason: "NO_TRADES",
            closedTradeCount: 0,
            firstClosedTradeDate: null,
            latestClosedTradeDate: null,
            tradeDateSpanDays: 0,
            weeklyReportCount,
        };
    }

    const firstTradeDate = getTradeDate(validTrades[0]);
    const latestTradeDate = getTradeDate(validTrades[validTrades.length - 1]);

    // Compute trade date span in days
    const diffTime = Math.abs(
        latestTradeDate.getTime() - firstTradeDate.getTime()
    );
    const tradeDateSpanDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Determine if there are closed trades in the previous completed calendar week
    const startOfThisWeek = startOfWeek(now, { weekStartsOn: 1 });
    const startOfPreviousWeek = subDays(startOfThisWeek, 7);
    const endOfPreviousWeek = subMilliseconds(startOfThisWeek, 1);

    const closedTradeDates = validTrades.map(getTradeDate);
    const hasPreviousWeekTrades = closedTradeDates.some(
        (d) => d >= startOfPreviousWeek && d <= endOfPreviousWeek
    );

    let firstReviewReady = false;
    let returningReviewReady = false;
    let ready = false;
    let reason: WeeklyReviewEligibility["reason"] = "NOT_ENOUGH_DATA";

    if (isFirstWeeklyReview) {
        firstReviewReady =
            closedTradeCount >= 5 ||
            tradeDateSpanDays >= 5 ||
            hasPreviousWeekTrades;
        ready = firstReviewReady;
        reason = firstReviewReady ? "READY_FIRST_REVIEW" : "NOT_ENOUGH_DATA";
    } else {
        // Returning user
        const lastReportEnd = latestWeeklyReport?.periodEnd || null;
        if (lastReportEnd) {
            const hasClosedTradesAfterLastReport = closedTradeDates.some(
                (d) => d > lastReportEnd
            );
            const daysSince = Math.floor(
                (now.getTime() - lastReportEnd.getTime()) /
                    (1000 * 60 * 60 * 24)
            );

            returningReviewReady =
                daysSince >= 7 && hasClosedTradesAfterLastReport;
            ready = returningReviewReady;

            if (!hasClosedTradesAfterLastReport) {
                reason = "NO_NEW_TRADES_AFTER_LAST_REPORT";
            } else if (daysSince < 7) {
                reason = "NOT_ENOUGH_DATA";
            } else {
                reason = "READY_RETURNING_REVIEW";
            }
        }
    }

    return {
        isFirstWeeklyReview,
        firstReviewReady,
        returningReviewReady,
        ready,
        reason,
        closedTradeCount,
        firstClosedTradeDate: firstTradeDate,
        latestClosedTradeDate: latestTradeDate,
        tradeDateSpanDays,
        weeklyReportCount,
    };
}
