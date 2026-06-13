export type SignalSeverity = "INFO" | "LOW" | "MEDIUM" | "HIGH";
export type SignalStatus = "ACTIVE" | "RESOLVED" | "DISMISSED";

export type SignalType =
 // Onboarding/Activation
 | "NO_ACCOUNT"
 | "ACCOUNT_NEVER_SYNCED"
 | "SYNC_STALE"
 | "NO_FIRST_TRADE"
 | "NO_WEEKLY_REVIEW"
 | "NO_LESSON_STARTED"
 // Trade Weaknesses
 | "LOSS_STREAK"
 | "SL_CLUSTER"
 | "REVENGE_SIZE_UP"
 | "LOW_PLAN_COMPLIANCE"
 | "BE_HEAVY"
 | "WEAK_SYMBOL"
 | "WEAK_SESSION"
 | "RECURRING_MISTAKE";

export interface TraderSignalInput {
 signalType: SignalType;
 severity: SignalSeverity;
 status?: SignalStatus;
 sourceType?: string;
 sourceId?: string;
 title: string;
 summary: string;
 actionLabel?: string;
 actionHref?: string;
 metadata?: any;
}
