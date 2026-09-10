export type BehaviorGroup =
    | "REGISTERED_NEVER_TRADED"
    | "TRADING_WELL"
    | "LOSING_STREAK"
    | "WINNING_STREAK"
    | "NEUTRAL";

export type BehaviorSeverity =
    | "CRITICAL"
    | "ATTENTION"
    | "MONITOR"
    | "HEALTHY"
    | "INSUFFICIENT_DATA";

export type StatusDotColor = "RED" | "YELLOW" | "GREEN" | "GRAY";

export type TrendDirection = "UP" | "STEADY" | "DOWN";

export interface SummaryChip {
    label: string;
    variant?: "default" | "destructive" | "warning" | "success" | "outline";
}

export interface BehaviorMetrics {
    totalTrades: number;
    closedTrades30: number;
    activeDays30: number;
    activeDaysPrev30: number;
    daysSinceLastTrade: number | null;
    daysSinceSignup: number;
    hasLiveAccount: boolean;
    hasDemoAccount: boolean;
    accountsCount: number;
    lastTradeAt: Date | null;
    lastSyncAt: Date | null;
    maxStreak: number;
    streakType: "WIN" | "LOSS" | "NONE";
    productAdoptionCount: number; // 0 to 8
    productAdoptionFeatures: string[];
    stayedAfterLoss: boolean | null; // null if no loss yet
    trend: TrendDirection;
    isSyncStale: boolean;
}

export interface BehaviorClassification {
    group: BehaviorGroup;
    severity: BehaviorSeverity;
    dotColor: StatusDotColor;
    primarySignal: string | null;
    chips: SummaryChip[];
    reasons: string[];
    actionSuggestion: string;
    narrativeParagraphs: string[];
    metrics: BehaviorMetrics;
}

export interface UserBehaviorSegmentItem {
    userId: string;
    user: {
        id: string;
        name: string | null;
        email: string | null;
        image: string | null;
        createdAt: Date;
    };
    classification: BehaviorClassification;
    lastActivityAt: Date | null;
}
