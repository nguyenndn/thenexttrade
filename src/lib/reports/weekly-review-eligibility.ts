import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
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

    const startOfThisWeek = startOfWeek(now, { weekStartsOn: 1 });
    const startOfPreviousWeek = subDays(startOfThisWeek, 7);
    const endOfPreviousWeek = subMilliseconds(startOfThisWeek, 1);

    const [latestWeeklyReport, weeklyReportCount] = await Promise.all([
        prisma.tradingReport.findFirst({
            where: { userId, type: "WEEKLY" },
            orderBy: { periodEnd: "desc" },
            select: { periodEnd: true },
        }),
        prisma.tradingReport.count({
            where: { userId, type: "WEEKLY" },
        }),
    ]);

    const lastReportEnd = latestWeeklyReport?.periodEnd ?? null;
    const normalizedAccountId =
        accountId && accountId !== "all" ? accountId : undefined;
    const accountFilter = normalizedAccountId
        ? Prisma.sql`AND "accountId" = ${normalizedAccountId}`
        : Prisma.empty;

    const aggRows = await prisma.$queryRaw<
        Array<{
            closedTradeCount: number | bigint;
            firstTradeDate: Date | null;
            latestTradeDate: Date | null;
            prevWeekCount: number | bigint;
            afterReportCount: number | bigint;
        }>
    >`
        SELECT
            COUNT(*)::int AS "closedTradeCount",
            MIN(COALESCE("exitDate", "entryDate")) AS "firstTradeDate",
            MAX(COALESCE("exitDate", "entryDate")) AS "latestTradeDate",
            COUNT(*) FILTER (
                WHERE COALESCE("exitDate", "entryDate") >= ${startOfPreviousWeek}
                  AND COALESCE("exitDate", "entryDate") <= ${endOfPreviousWeek}
            )::int AS "prevWeekCount",
            COUNT(*) FILTER (
                WHERE ${lastReportEnd}::timestamptz IS NOT NULL
                  AND COALESCE("exitDate", "entryDate") > ${lastReportEnd}::timestamptz
            )::int AS "afterReportCount"
        FROM "journal_entries"
        WHERE "userId" = ${userId}::uuid
          AND "status" = 'CLOSED'
          ${accountFilter}
    `;

    const agg = aggRows[0];
    const closedTradeCount = Number(agg?.closedTradeCount || 0);
    const isFirstWeeklyReview = weeklyReportCount === 0;

    if (
        closedTradeCount === 0 ||
        !agg?.firstTradeDate ||
        !agg?.latestTradeDate
    ) {
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

    const firstTradeDate =
        agg.firstTradeDate instanceof Date
            ? agg.firstTradeDate
            : new Date(agg.firstTradeDate);
    const latestTradeDate =
        agg.latestTradeDate instanceof Date
            ? agg.latestTradeDate
            : new Date(agg.latestTradeDate);

    if (isNaN(firstTradeDate.getTime()) || isNaN(latestTradeDate.getTime())) {
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

    const diffTime = Math.abs(
        latestTradeDate.getTime() - firstTradeDate.getTime()
    );
    const tradeDateSpanDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const hasPreviousWeekTrades = Number(agg.prevWeekCount || 0) > 0;

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
    } else if (lastReportEnd) {
        const hasClosedTradesAfterLastReport =
            Number(agg.afterReportCount || 0) > 0;
        const daysSince = Math.floor(
            (now.getTime() - lastReportEnd.getTime()) / (1000 * 60 * 60 * 24)
        );

        returningReviewReady = daysSince >= 7 && hasClosedTradesAfterLastReport;
        ready = returningReviewReady;

        if (!hasClosedTradesAfterLastReport) {
            reason = "NO_NEW_TRADES_AFTER_LAST_REPORT";
        } else if (daysSince < 7) {
            reason = "NOT_ENOUGH_DATA";
        } else {
            reason = "READY_RETURNING_REVIEW";
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
