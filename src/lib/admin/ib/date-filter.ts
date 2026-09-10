export type IbStatsRange = "7d" | "30d" | "all";

export type IbStatsFilter =
    | IbStatsRange
    | {
          range?: string;
          from?: string;
          to?: string;
      };

export interface ResolvedIbDateFilter {
    start: Date | null;
    end: Date | null;
    label: string;
}

export function resolveIbDateFilter(filter?: IbStatsFilter): ResolvedIbDateFilter {
    const now = new Date();
    if (!filter) {
        return {
            start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
            end: now,
            label: "last 30 days",
        };
    }

    if (typeof filter === "string") {
        if (filter === "7d") {
            return {
                start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
                end: now,
                label: "last 7 days",
            };
        }
        if (filter === "all") {
            return {
                start: null,
                end: null,
                label: "all time",
            };
        }
        return {
            start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
            end: now,
            label: "last 30 days",
        };
    }

    if (filter.from && filter.to) {
        const start = new Date(filter.from);
        start.setHours(0, 0, 0, 0);
        const end = new Date(filter.to);
        end.setHours(23, 59, 59, 999);
        const startFormatted = start.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
        const endFormatted = end.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
        return {
            start,
            end,
            label: `${startFormatted} - ${endFormatted}`,
        };
    }

    if (filter.range === "all") {
        return { start: null, end: null, label: "all time" };
    }

    if (filter.range === "7d") {
        return {
            start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
            end: now,
            label: "last 7 days",
        };
    }

    return {
        start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        end: now,
        label: "last 30 days",
    };
}

export function buildDateRangeClause(start: Date | null, end: Date | null) {
    if (start && end) return { gte: start, lte: end };
    if (start) return { gte: start };
    if (end) return { lte: end };
    return undefined;
}
