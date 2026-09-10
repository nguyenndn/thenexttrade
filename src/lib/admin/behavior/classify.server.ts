import {
    BehaviorClassification,
    BehaviorGroup,
    BehaviorMetrics,
    BehaviorSeverity,
    StatusDotColor,
    SummaryChip,
    TrendDirection,
} from "./types";
import { isDemoTradingAccount } from "@/lib/admin/ib/capital.server";

export interface ClassifyUserInput {
    user: {
        id: string;
        name: string | null;
        email: string | null;
        createdAt: Date;
    };
    tradingAccounts?: Array<{
        id: string;
        accountType?: string | null;
        server?: string | null;
        status?: string | null;
        broker?: string | null;
    }>;
    journalEntries?: Array<{
        id: string;
        status: string;
        result?: string | null;
        pnl?: number | null;
        entryDate: Date;
        createdAt: Date;
        syncSource?: string | null;
        lotSize?: number | null;
    }>;
    totalJournalCount?: number;
    activeSignals?: Array<{
        signalType: string;
        severity: string;
        title: string;
        summary: string;
    }>;
    productAdoptionCount?: number;
    productAdoptionFeatures?: string[];
    isSyncStale?: boolean;
    computedActivity?: {
        activeDays30: number;
        activeDaysPrev30: number;
        trend: TrendDirection;
        daysSinceLastTrade: number | null;
        lastTradeAt: Date | null;
        lastSyncAt: Date | null;
        stayedAfterLoss: boolean | null;
        closedTrades30: number;
        totalTrades: number;
        maxStreak: number;
        streakType: "WIN" | "LOSS" | "NONE";
    };
}

/**
 * Classifies a user into one of 4 primary behavior groups + computes metrics,
 * severity level, status dot color, chips, reasons, narrative paragraphs, and next action.
 */
export function classifyUser(input: ClassifyUserInput): BehaviorClassification {
    const now = new Date();
    const daysSinceSignup = Math.max(
        0,
        Math.floor((now.getTime() - new Date(input.user.createdAt).getTime()) / (24 * 60 * 60 * 1000))
    );

    const accounts = input.tradingAccounts || [];
    const accountsCount = accounts.length;
    const hasLiveAccount = accounts.some((acc) => !isDemoTradingAccount(acc));
    const hasDemoAccount = accounts.some((acc) => isDemoTradingAccount(acc));

    // Resolve metrics from computedActivity if supplied, otherwise compute from journalEntries
    let activeDays30 = 0;
    let activeDaysPrev30 = 0;
    let trend: TrendDirection = "STEADY";
    let daysSinceLastTrade: number | null = null;
    let lastTradeAt: Date | null = null;
    let lastSyncAt: Date | null = null;
    let stayedAfterLoss: boolean | null = null;
    let closedTrades30 = 0;
    let totalTrades = input.totalJournalCount ?? 0;
    let maxStreak = 0;
    let streakType: "WIN" | "LOSS" | "NONE" = "NONE";

    if (input.computedActivity) {
        activeDays30 = input.computedActivity.activeDays30;
        activeDaysPrev30 = input.computedActivity.activeDaysPrev30;
        trend = input.computedActivity.trend;
        daysSinceLastTrade = input.computedActivity.daysSinceLastTrade;
        lastTradeAt = input.computedActivity.lastTradeAt;
        lastSyncAt = input.computedActivity.lastSyncAt;
        stayedAfterLoss = input.computedActivity.stayedAfterLoss;
        closedTrades30 = input.computedActivity.closedTrades30;
        totalTrades = input.computedActivity.totalTrades;
        maxStreak = input.computedActivity.maxStreak;
        streakType = input.computedActivity.streakType;
    } else if (input.journalEntries) {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

        const closedCurrent = input.journalEntries.filter(
            (j) => j.status === "CLOSED" && new Date(j.entryDate) >= thirtyDaysAgo
        );
        const closedPrev = input.journalEntries.filter(
            (j) =>
                j.status === "CLOSED" &&
                new Date(j.entryDate) >= sixtyDaysAgo &&
                new Date(j.entryDate) < thirtyDaysAgo
        );

        const daysSetCurrent = new Set(
            closedCurrent.map((j) => new Date(j.entryDate).toISOString().slice(0, 10))
        );
        const daysSetPrev = new Set(
            closedPrev.map((j) => new Date(j.entryDate).toISOString().slice(0, 10))
        );

        activeDays30 = daysSetCurrent.size;
        activeDaysPrev30 = daysSetPrev.size;
        closedTrades30 = closedCurrent.length;

        if (activeDaysPrev30 === 0) {
            trend = activeDays30 > 0 ? "UP" : "STEADY";
        } else if (activeDays30 > activeDaysPrev30 + 1) {
            trend = "UP";
        } else if (activeDays30 < activeDaysPrev30 - 1) {
            trend = "DOWN";
        }

        const sortedTrades = [...input.journalEntries]
            .filter((j) => j.status === "CLOSED")
            .sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());

        if (sortedTrades.length > 0) {
            const lastTrade = sortedTrades[sortedTrades.length - 1];
            lastTradeAt = new Date(lastTrade.entryDate);
            daysSinceLastTrade = Math.max(
                0,
                Math.floor((now.getTime() - lastTradeAt.getTime()) / (24 * 60 * 60 * 1000))
            );
        }

        const syncTrades = input.journalEntries
            .filter((j) => j.syncSource && j.syncSource !== "MANUAL")
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        if (syncTrades.length > 0) {
            lastSyncAt = new Date(syncTrades[0].createdAt);
        }

        // Compute streak on current 30d trades
        let currentLoss = 0;
        let maxLoss = 0;
        let currentWin = 0;
        let maxWin = 0;

        for (const t of closedCurrent) {
            const isLoss = t.result === "LOSS" || t.result === "BIG_LOSS" || (t.pnl !== null && t.pnl !== undefined && t.pnl < 0);
            const isWin = t.result === "WIN" || t.result === "BIG_WIN" || (t.pnl !== null && t.pnl !== undefined && t.pnl > 0);
            if (isLoss) {
                currentLoss++;
                maxLoss = Math.max(maxLoss, currentLoss);
                currentWin = 0;
            } else if (isWin) {
                currentWin++;
                maxWin = Math.max(maxWin, currentWin);
                currentLoss = 0;
            } else {
                currentLoss = 0;
                currentWin = 0;
            }
        }

        if (maxLoss >= 3 && maxLoss >= maxWin) {
            streakType = "LOSS";
            maxStreak = maxLoss;
        } else if (maxWin >= 3) {
            streakType = "WIN";
            maxStreak = maxWin;
        }
    }

    const isSyncStale = input.isSyncStale || (input.activeSignals?.some((s) => s.signalType === "SYNC_STALE") ?? false);
    const hasLossStreakSignal = input.activeSignals?.some((s) => s.signalType === "LOSS_STREAK");
    const hasWinStreakSignal = input.activeSignals?.some((s) => s.signalType === "WIN_STREAK");
    const hasTechnicalSyncSignal = input.activeSignals?.some((s) =>
        ["SYNC_STALE", "ACCOUNT_NEVER_SYNCED", "NO_ACCOUNT"].includes(s.signalType)
    );

    const metrics: BehaviorMetrics = {
        totalTrades,
        closedTrades30,
        activeDays30,
        activeDaysPrev30,
        daysSinceLastTrade,
        daysSinceSignup,
        hasLiveAccount,
        hasDemoAccount,
        accountsCount,
        lastTradeAt,
        lastSyncAt,
        maxStreak,
        streakType,
        productAdoptionCount: input.productAdoptionCount ?? 0,
        productAdoptionFeatures: input.productAdoptionFeatures ?? [],
        stayedAfterLoss,
        trend,
        isSyncStale,
    };

    // Determine Group, Severity, DotColor, Primary Signal, Reasons
    let group: BehaviorGroup = "NEUTRAL";
    let severity: BehaviorSeverity = "HEALTHY";
    let dotColor: StatusDotColor = "GREEN";
    let primarySignal: string | null = null;
    const reasons: string[] = [];

    // Group 1: Registered, never traded
    if (accountsCount > 0 && daysSinceSignup >= 3 && totalTrades === 0) {
        group = "REGISTERED_NEVER_TRADED";
        severity = daysSinceSignup >= 7 ? "ATTENTION" : "MONITOR";
        dotColor = "YELLOW";
        primarySignal = "ACCOUNT_NEVER_SYNCED";
        reasons.push(`Account connected ${daysSinceSignup}d ago, but 0 trades synced.`);
    }
    // Group 2: Losing streak
    else if (streakType === "LOSS" || hasLossStreakSignal) {
        group = "LOSING_STREAK";
        primarySignal = "LOSS_STREAK";
        if (maxStreak >= 5 && daysSinceLastTrade !== null && daysSinceLastTrade >= 14) {
            severity = "CRITICAL";
            dotColor = "RED";
            reasons.push(`${maxStreak}-trade loss streak and inactive for ${daysSinceLastTrade} days.`);
        } else if (maxStreak >= 5) {
            severity = "ATTENTION";
            dotColor = "YELLOW";
            reasons.push(`Hit a heavy ${maxStreak}-trade loss streak in current window.`);
        } else {
            severity = "ATTENTION";
            dotColor = "YELLOW";
            reasons.push(`${maxStreak || 3}-trade loss streak detected.`);
        }
    }
    // Group 3: Winning streak
    else if (streakType === "WIN" || hasWinStreakSignal) {
        group = "WINNING_STREAK";
        severity = "MONITOR";
        dotColor = "YELLOW";
        primarySignal = "WIN_STREAK";
        reasons.push(`${maxStreak || 3}-trade winning streak observed.`);
    }
    // Group 4: Trading well & consistent
    else if (
        closedTrades30 >= 5 &&
        daysSinceLastTrade !== null &&
        daysSinceLastTrade <= 7 &&
        activeDays30 >= 8 &&
        hasLiveAccount &&
        !hasLossStreakSignal
    ) {
        group = "TRADING_WELL";
        severity = "HEALTHY";
        dotColor = "GREEN";
        primarySignal = null;
        reasons.push(`Active ${activeDays30} days in last 30 with steady execution.`);
    }
    // Fallbacks / Technical sync issues
    else if (hasTechnicalSyncSignal) {
        group = "NEUTRAL";
        severity = "ATTENTION";
        dotColor = "YELLOW";
        primarySignal = isSyncStale ? "SYNC_STALE" : "ACCOUNT_NEVER_SYNCED";
        reasons.push("Telemetry connection is stale or disconnected.");
    } else if (closedTrades30 < 5 && totalTrades > 0) {
        group = "NEUTRAL";
        severity = "INSUFFICIENT_DATA";
        dotColor = "GRAY";
        primarySignal = "INSUFFICIENT_DATA";
        reasons.push(`Only ${closedTrades30} closed trades in the last 30 days.`);
    } else if (daysSinceLastTrade !== null && daysSinceLastTrade > 30) {
        group = "NEUTRAL";
        severity = "ATTENTION";
        dotColor = "YELLOW";
        primarySignal = "DORMANT";
        reasons.push(`No trading activity for ${daysSinceLastTrade} days.`);
    } else if (daysSinceLastTrade !== null && daysSinceLastTrade >= 14) {
        group = "NEUTRAL";
        severity = "ATTENTION";
        dotColor = "YELLOW";
        primarySignal = "TEMPO_SLOWING";
        reasons.push(`Trading tempo slowed down: ${daysSinceLastTrade} days since last trade.`);
    } else {
        group = "NEUTRAL";
        severity = accountsCount === 0 ? "ATTENTION" : "MONITOR";
        dotColor = accountsCount === 0 ? "YELLOW" : "GRAY";
        primarySignal = accountsCount === 0 ? "NO_ACCOUNT" : null;
        reasons.push(accountsCount === 0 ? "No broker account connected." : "Normal trading telemetry.");
    }

    const classification: BehaviorClassification = {
        group,
        severity,
        dotColor,
        primarySignal,
        chips: [],
        reasons,
        actionSuggestion: "",
        narrativeParagraphs: [],
        metrics,
    };

    classification.chips = buildChips(classification);
    classification.actionSuggestion = buildActionSuggestion(classification);
    classification.narrativeParagraphs = buildNarrative(classification);

    return classification;
}

/**
 * Builds factual chips (max 4, <= 5 words each)
 */
export function buildChips(c: BehaviorClassification): SummaryChip[] {
    const chips: SummaryChip[] = [];
    const m = c.metrics;

    if (m.accountsCount === 0) {
        chips.push({ label: `Signed Up ${m.daysSinceSignup}d Ago`, variant: "outline" });
        chips.push({ label: "No Account Connected", variant: "destructive" });
        return chips.slice(0, 4);
    }

    if (c.group === "REGISTERED_NEVER_TRADED") {
        chips.push({ label: `Account Linked ${m.daysSinceSignup}d Ago`, variant: "outline" });
        chips.push({ label: "Never Synced Trades", variant: "warning" });
        return chips.slice(0, 4);
    }

    if (c.severity === "INSUFFICIENT_DATA") {
        chips.push({ label: "Insufficient Data", variant: "outline" });
        chips.push({ label: `${m.closedTrades30} Trades / 30d`, variant: "outline" });
        return chips.slice(0, 4);
    }

    if (c.group === "LOSING_STREAK") {
        chips.push({
            label: `${m.maxStreak}-Trade Loss Streak`,
            variant: c.dotColor === "RED" ? "destructive" : "warning",
        });
        if (m.daysSinceLastTrade !== null && m.daysSinceLastTrade >= 14) {
            chips.push({ label: `Inactive ${m.daysSinceLastTrade}d`, variant: "destructive" });
        }
    } else if (c.group === "WINNING_STREAK") {
        chips.push({ label: `${m.maxStreak}-Trade Win Streak`, variant: "warning" });
        chips.push({ label: "Monitor Drawdown", variant: "outline" });
    } else if (c.group === "TRADING_WELL") {
        chips.push({ label: "Steady Execution", variant: "success" });
        chips.push({ label: `${m.activeDays30} Active Days / 30d`, variant: "outline" });
        chips.push({ label: "Disciplined Pace", variant: "success" });
    }

    if (m.daysSinceLastTrade !== null && m.daysSinceLastTrade > 30 && c.group !== "LOSING_STREAK") {
        chips.push({ label: `No Trades in ${m.daysSinceLastTrade}d`, variant: "warning" });
        chips.push({ label: "Paused Activity", variant: "outline" });
    } else if (m.daysSinceLastTrade !== null && m.daysSinceLastTrade >= 14 && c.group !== "LOSING_STREAK") {
        chips.push({ label: `Inactive ${m.daysSinceLastTrade}d`, variant: "warning" });
    }

    if (m.isSyncStale) {
        chips.push({ label: "EA Stale Sync", variant: "destructive" });
    }

    if (chips.length === 0) {
        chips.push({ label: `${m.closedTrades30} Trades / 30d`, variant: "outline" });
        chips.push({ label: `${m.activeDays30} Active Days`, variant: "outline" });
    }

    return chips.slice(0, 4);
}

/**
 * Builds 1-sentence next action recommendation starting with "→ "
 */
export function buildActionSuggestion(c: BehaviorClassification): string {
    const m = c.metrics;
    if (m.accountsCount === 0) {
        return "→ Reach out to help them connect their first broker trading account.";
    }
    if (c.group === "REGISTERED_NEVER_TRADED") {
        return "→ Verify whether the EA is properly installed and sending live heartbeats.";
    }
    if (c.group === "LOSING_STREAK" && c.dotColor === "RED") {
        return "→ Reach out before next session — high risk of emotional drawdown or account abandonment.";
    }
    if (c.group === "LOSING_STREAK") {
        return "→ Recommend resetting emotional bias and reviewing loss streak risk rules.";
    }
    if (c.group === "WINNING_STREAK") {
        return "→ Monitor position sizing to prevent aggressive overconfidence after the streak.";
    }
    if (c.group === "TRADING_WELL") {
        return "→ No action needed. Maintain monthly check-in schedule.";
    }
    if (m.daysSinceLastTrade !== null && m.daysSinceLastTrade > 30) {
        return "→ Check in to see if trader paused activity or changed trading platform.";
    }
    if (m.daysSinceLastTrade !== null && m.daysSinceLastTrade >= 14) {
        return "→ Check telemetry connection to ensure EA hasn't stopped sending sync packets.";
    }
    if (c.severity === "INSUFFICIENT_DATA") {
        return "→ No action needed. Revisit once trader records at least 5 closed trades.";
    }
    return "→ Monitor standard account telemetry and routine activity.";
}

/**
 * Builds deterministic narrative text (maximum 2 paragraphs, max 2 sentences each)
 * following the 8 sequential branches of Doc #4 Section 8.
 */
export function buildNarrative(c: BehaviorClassification): string[] {
    const m = c.metrics;

    // Branch 1: No trading account
    if (m.accountsCount === 0) {
        return [
            `This user signed up ${m.daysSinceSignup} days ago and has not connected a trading account yet. No trading activity to measure.`,
        ];
    }

    // Branch 2: Connected account, 0 trades synced
    if (m.totalTrades === 0) {
        return [
            `Account was linked ${m.daysSinceSignup} days ago but no trades have synced yet. The connection has never produced an execution record.`,
        ];
    }

    // Branch 3: Under minimum history (< 5 trades in 30d)
    if (m.closedTrades30 < 5) {
        return [
            `Only ${m.closedTrades30} closed trades recorded in the last 30 days (${m.totalTrades} total lifetime trades). Not enough history to describe a behavioral pattern yet.`,
        ];
    }

    // Branch 4: Stopped trading (> 30 days)
    if (m.daysSinceLastTrade !== null && m.daysSinceLastTrade > 30) {
        return [
            `Last trade was recorded ${m.daysSinceLastTrade} days ago with ${m.totalTrades} historical trades logged.`,
            `The account has been dormant for over a month with no recent live executions.`,
        ];
    }

    // Branch 5: Slowing down (14 - 30 days)
    if (m.daysSinceLastTrade !== null && m.daysSinceLastTrade >= 14) {
        return [
            `No trades have been recorded in ${m.daysSinceLastTrade} days. Previously active with ${m.closedTrades30} closed trades in the rolling 30-day window.`,
            `Trading rhythm has noticeably slowed down compared to previous frequency.`,
        ];
    }

    // Branch 6: Losing streak
    if (c.group === "LOSING_STREAK") {
        const daysPart = m.daysSinceLastTrade !== null ? ` (last trade ${m.daysSinceLastTrade} days ago)` : "";
        return [
            `Active across ${m.activeDays30} days in the last 30 with ${m.closedTrades30} closed trades, but currently on a ${m.maxStreak}-trade loss streak${daysPart}.`,
            `Sustained consecutive losses require disciplined drawdown control to protect trading capital.`,
        ];
    }

    // Branch 7: Steady trader
    if (c.group === "TRADING_WELL") {
        return [
            `Trading steadily: ${m.activeDays30} active days in the last 30, with ${m.closedTrades30} closed trades logged.`,
            `Volume and trading tempo remain consistent with healthy risk execution.`,
        ];
    }

    // Branch 8: Default normal telemetry / Winning streak
    if (c.group === "WINNING_STREAK") {
        return [
            `Active across ${m.activeDays30} days in the last 30 with ${m.closedTrades30} closed trades and an active ${m.maxStreak}-trade win streak.`,
            `Performance telemetry is strong; monitor post-streak sizing to prevent aggressive overconfidence.`,
        ];
    }

    return [
        `Recorded ${m.closedTrades30} closed trades across ${m.activeDays30} active days in the last 30 days.`,
        `Telemetry indicates regular account activity with no acute risk warnings.`,
    ];
}
