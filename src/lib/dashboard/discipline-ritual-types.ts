import { format, subDays, parseISO } from "date-fns";
import {
    evaluateTradeReview,
    type TradeReviewCheckable,
} from "@/lib/journal/trade-review-status";

export interface RitualTradeSample extends TradeReviewCheckable {
    dateKey: string; // YYYY-MM-DD in account/local timezone
}

export interface RitualStepStatus {
    id: "TAG_PLAYBOOK" | "AUDIT_RULES" | "LOG_MINDSET";
    title: string;
    completedCount: number;
    totalCount: number;
    completed: boolean;
    href: string;
}

export interface DisciplineDayCell {
    date: string;
    tradeCount: number;
    reviewedCount: number;
    status: "DISCIPLINED" | "PARTIAL" | "UNREVIEWED" | "REST";
}

export interface DisciplineRitualData {
    focusDate: string;
    isTodayFocus: boolean;
    focusTradeCount: number;
    completedStepsCount: number;
    steps: RitualStepStatus[];
    days: DisciplineDayCell[];
    disciplineStreak: number;
    unreviewedLast28d: number;
}

export function computeDisciplineRitualFromTrades(
    trades: RitualTradeSample[],
    referenceDateKey?: string
): DisciplineRitualData {
    const refKey = referenceDateKey || format(new Date(), "yyyy-MM-dd");
    let refDate: Date;
    try {
        refDate = parseISO(refKey);
        if (Number.isNaN(refDate.getTime())) refDate = new Date();
    } catch {
        refDate = new Date();
    }

    // Group trades by YYYY-MM-DD
    const byDay = new Map<string, RitualTradeSample[]>();
    for (const t of trades) {
        if (!t.dateKey) continue;
        const arr = byDay.get(t.dateKey);
        if (arr) {
            arr.push(t);
        } else {
            byDay.set(t.dateKey, [t]);
        }
    }

    // Build 28-day window ending at refDate (oldest -> newest)
    const days: DisciplineDayCell[] = [];
    let unreviewedLast28d = 0;

    for (let i = 27; i >= 0; i--) {
        const dKey = format(subDays(refDate, i), "yyyy-MM-dd");
        const dayTrades = byDay.get(dKey) || [];
        const tradeCount = dayTrades.length;
        let reviewedCount = 0;

        for (const t of dayTrades) {
            if (evaluateTradeReview(t).isReviewed) {
                reviewedCount += 1;
            }
        }

        unreviewedLast28d += Math.max(0, tradeCount - reviewedCount);

        let status: DisciplineDayCell["status"] = "REST";
        if (tradeCount > 0) {
            if (reviewedCount === tradeCount) status = "DISCIPLINED";
            else if (reviewedCount > 0) status = "PARTIAL";
            else status = "UNREVIEWED";
        }

        days.push({
            date: dKey,
            tradeCount,
            reviewedCount,
            status,
        });
    }

    // Compute consecutive active-day Discipline Streak (walking backwards from newest active day)
    let disciplineStreak = 0;
    for (let i = days.length - 1; i >= 0; i--) {
        const cell = days[i];
        if (cell.status === "REST") continue;
        if (cell.status === "DISCIPLINED") {
            disciplineStreak += 1;
        } else {
            break;
        }
    }

    // Focus day: Today if trades exist today; otherwise most recent active trading day in window
    let focusDate = refKey;
    const todayTrades = byDay.get(refKey) || [];
    if (todayTrades.length === 0) {
        for (let i = days.length - 1; i >= 0; i--) {
            if (days[i].tradeCount > 0) {
                focusDate = days[i].date;
                break;
            }
        }
    }

    const isTodayFocus = focusDate === refKey;
    const focusTrades = byDay.get(focusDate) || [];
    const focusTradeCount = focusTrades.length;

    let taggedCount = 0;
    let auditedCount = 0;
    let mindsetCount = 0;

    for (const t of focusTrades) {
        const ev = evaluateTradeReview(t);
        if (ev.hasStrategy) taggedCount += 1;
        if (ev.hasRuleAudit) auditedCount += 1;
        if (ev.hasBehavioralNote) mindsetCount += 1;
    }

    const reviewHref = "/dashboard/journal?review=UNREVIEWED";
    const steps: RitualStepStatus[] = [
        {
            id: "TAG_PLAYBOOK",
            title: "Tag Strategy",
            completedCount: taggedCount,
            totalCount: focusTradeCount,
            completed: focusTradeCount > 0 && taggedCount === focusTradeCount,
            href: reviewHref,
        },
        {
            id: "AUDIT_RULES",
            title: "Grade Rule Checklist",
            completedCount: auditedCount,
            totalCount: focusTradeCount,
            completed: focusTradeCount > 0 && auditedCount === focusTradeCount,
            href: reviewHref,
        },
        {
            id: "LOG_MINDSET",
            title: "Log Mindset or Lesson",
            completedCount: mindsetCount,
            totalCount: focusTradeCount,
            completed: focusTradeCount > 0 && mindsetCount === focusTradeCount,
            href: reviewHref,
        },
    ];

    const completedStepsCount = steps.filter((s) => s.completed).length;

    return {
        focusDate,
        isTodayFocus,
        focusTradeCount,
        completedStepsCount,
        steps,
        days,
        disciplineStreak,
        unreviewedLast28d,
    };
}
