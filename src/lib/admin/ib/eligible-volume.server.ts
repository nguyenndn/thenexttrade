import { Prisma, TradeStatus } from "@prisma/client";

export const ELIGIBLE_SYNC_SOURCES = [
    "EA_SYNC",
    "EA_HISTORY",
    "SUPPORT_SYNC",
    "CLOUD_WORKER",
] as const;

export interface BuildEligibleJournalWhereOpts {
    userId?: string;
    userIds?: string[];
    accountId?: string;
    accountIds?: string[];
    since?: Date;
    until?: Date;
    status?: TradeStatus | Prisma.EnumTradeStatusFilter<"JournalEntry">;
    broker?: string;
    ibConfirmedOnly?: boolean;
}

/**
 * Builds standard Prisma where clause to filter out manual/unverified trade lots.
 * Excludes trades manually typed on the website (syncSource: "MANUAL").
 */
export function buildEligibleJournalWhere(
    opts: BuildEligibleJournalWhereOpts = {}
): Prisma.JournalEntryWhereInput {
    const where: Prisma.JournalEntryWhereInput = {
        syncSource: { in: [...ELIGIBLE_SYNC_SOURCES] },
    };

    if (opts.status) {
        where.status = opts.status;
    }

    if (opts.userId) {
        where.userId = opts.userId;
    } else if (opts.userIds && opts.userIds.length > 0) {
        where.userId = { in: opts.userIds };
    }

    if (opts.accountId) {
        where.accountId = opts.accountId;
    } else if (opts.accountIds && opts.accountIds.length > 0) {
        where.accountId = { in: opts.accountIds };
    }

    if (opts.since || opts.until) {
        const dateFilter: Prisma.DateTimeFilter = {};
        if (opts.since) dateFilter.gte = opts.since;
        if (opts.until) dateFilter.lte = opts.until;

        where.OR = [
            { exitDate: dateFilter },
            { exitDate: null, entryDate: dateFilter },
        ];
    }

    if (opts.ibConfirmedOnly || opts.broker) {
        const accountCondition: Prisma.TradingAccountWhereInput = {};
        if (opts.ibConfirmedOnly) {
            accountCondition.ibAttribution = "CONFIRMED";
        }
        if (opts.broker) {
            accountCondition.broker = { equals: opts.broker, mode: "insensitive" };
        }
        where.account = accountCondition;
    }

    return where;
}
