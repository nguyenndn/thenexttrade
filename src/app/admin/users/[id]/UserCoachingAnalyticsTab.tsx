"use client";

import { useState, useMemo } from "react";
import {
    Compass,
    BookOpen,
    Target,
    ShieldCheck,
    BarChart3,
    Lightbulb,
    Calendar,
    TrendingUp,
    TrendingDown,
    Eye,
    X,
    AlertCircle,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { TradePlanItem, StrategyItem } from "./UserTradePlansTab";
import type {
    TradingRuleItem,
    TraderGoalItem,
    TradeRuleCheckItem,
} from "./UserRulesGoalsTab";
import type {
    TradingReportItem,
    TradingDayNoteItem,
    TraderInsightSnapshotItem,
} from "./UserReportsNotesTab";

interface UserCoachingAnalyticsTabProps {
    plans: TradePlanItem[];
    strategies: StrategyItem[];
    rules: TradingRuleItem[];
    goals: TraderGoalItem[];
    ruleChecks: TradeRuleCheckItem[];
    reports: TradingReportItem[];
    dayNotes: TradingDayNoteItem[];
    insights: TraderInsightSnapshotItem[];
}

export function UserCoachingAnalyticsTab({
    plans,
    strategies,
    rules,
    goals,
    ruleChecks,
    reports,
    dayNotes,
    insights,
}: UserCoachingAnalyticsTabProps) {
    const [selectedPlan, setSelectedPlan] = useState<TradePlanItem | null>(null);
    const [selectedStrategy, setSelectedStrategy] = useState<StrategyItem | null>(null);
    const [selectedRule, setSelectedRule] = useState<TradingRuleItem | null>(null);
    const [selectedReport, setSelectedReport] = useState<TradingReportItem | null>(null);
    const [showAllPlans, setShowAllPlans] = useState(false);

    const stats = useMemo(() => {
        const activeRules = rules.filter((r) => r.isActive).length;
        const activeGoals = goals.filter((g) => g.status === "ACTIVE").length;
        const passedChecks = ruleChecks.filter((c) => c.status === "PASSED").length;
        const violations = ruleChecks.filter((c) => c.status === "VIOLATED").length;
        const complianceRate =
            ruleChecks.length > 0
                ? ((passedChecks / ruleChecks.length) * 100).toFixed(0)
                : "100";

        const executedPlans = plans.filter(
            (p) => p.status === "EXECUTED" || !!p.journalEntry
        ).length;

        return {
            activeRules,
            totalRules: rules.length,
            activeGoals,
            totalGoals: goals.length,
            complianceRate,
            violations,
            totalStrategies: strategies.length,
            totalPlans: plans.length,
            executedPlans,
            totalReports: reports.length,
            totalNotes: dayNotes.length,
            totalInsights: insights.length,
        };
    }, [rules, goals, ruleChecks, strategies, plans, reports, dayNotes, insights]);

    const visiblePlans = showAllPlans ? plans : plans.slice(0, 6);

    return (
        <div className="space-y-6">
            {/* 1. Unified Summary Strip */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#151925]">
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                        <ShieldCheck size={14} className="text-primary" /> Rules & Compliance
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-gray-900 dark:text-white">
                            {stats.activeRules}
                        </span>
                        <span className="text-xs text-gray-500">
                            active · {stats.complianceRate}% pass ({stats.violations} violations)
                        </span>
                    </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#151925]">
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                        <Target size={14} className="text-blue-500" /> Behavior Goals
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                            {stats.activeGoals}
                        </span>
                        <span className="text-xs text-gray-500">
                            active of {stats.totalGoals} goals
                        </span>
                    </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#151925]">
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                        <Compass size={14} className="text-emerald-500" /> Setups & Trade Plans
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                            {stats.totalPlans}
                        </span>
                        <span className="text-xs text-gray-500">
                            plans ({stats.executedPlans} executed) · {stats.totalStrategies} setups
                        </span>
                    </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#151925]">
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                        <BarChart3 size={14} className="text-amber-500" /> Reports & Notes
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                            {stats.totalReports + stats.totalNotes}
                        </span>
                        <span className="text-xs text-gray-500">
                            {stats.totalReports} reports · {stats.totalNotes} day notes
                        </span>
                    </div>
                </div>
            </div>

            {/* 2. Side-by-Side: Rules & Goals (Left) + Playbook Setups (Right) */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Left Card: Trading Rules & Behavior Goals */}
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#151925] overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <ShieldCheck size={16} className="text-primary" /> Execution Rules & Goals
                        </h3>
                        <span className="text-xs font-bold text-gray-500">
                            {rules.length} Rules · {goals.length} Goals
                        </span>
                    </div>

                    <div className="divide-y divide-gray-200 dark:divide-white/10 flex-1">
                        {rules.length === 0 && goals.length === 0 ? (
                            <div className="p-8 text-center text-sm text-gray-500">
                                No trading rules or behavior goals configured.
                            </div>
                        ) : (
                            <>
                                {rules.map((rule) => (
                                    <div
                                        key={rule.id}
                                        className="p-4 flex items-center justify-between gap-3 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
                                    >
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                    {rule.title}
                                                </span>
                                                <span
                                                    className={cn(
                                                        "text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase",
                                                        rule.severity === "CRITICAL"
                                                            ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300"
                                                            : rule.severity === "HIGH"
                                                              ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                                                              : "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400"
                                                    )}
                                                >
                                                    {rule.severity}
                                                </span>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 uppercase">
                                                    {rule.category}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-xs text-gray-500">
                                                {rule._count?.checks || 0} trade checks
                                                {rule.strategy ? ` · ${rule.strategy.name}` : ""}
                                            </p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setSelectedRule(rule)}
                                            className="rounded-lg h-8 text-xs font-semibold shrink-0"
                                        >
                                            <Eye size={13} className="mr-1" /> View
                                        </Button>
                                    </div>
                                ))}

                                {goals.map((goal) => (
                                    <div
                                        key={goal.id}
                                        className="p-4 flex items-center justify-between gap-3 bg-blue-50/20 dark:bg-blue-500/[0.03]"
                                    >
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Target size={14} className="text-blue-500 shrink-0" />
                                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                    {goal.title}
                                                </span>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 uppercase">
                                                    {goal.period} Goal
                                                </span>
                                            </div>
                                            <p className="mt-1 text-xs text-gray-500">
                                                Type: {goal.type}
                                                {goal.targetValue !== null
                                                    ? ` · Target: ${goal.targetValue}`
                                                    : ""}
                                                {" · "}Since {format(new Date(goal.startsAt), "MMM d, yyyy")}
                                            </p>
                                        </div>
                                        <span
                                            className={cn(
                                                "text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase shrink-0",
                                                goal.status === "ACTIVE"
                                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                                                    : "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400"
                                            )}
                                        >
                                            {goal.status}
                                        </span>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </div>

                {/* Right Card: Playbooks & Strategies */}
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#151925] overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <BookOpen size={16} className="text-blue-500" /> Playbooks & Strategies
                        </h3>
                        <span className="text-xs font-bold text-gray-500">
                            {strategies.length} Setups
                        </span>
                    </div>

                    <div className="divide-y divide-gray-200 dark:divide-white/10 flex-1">
                        {strategies.length === 0 ? (
                            <div className="p-8 text-center text-sm text-gray-500">
                                No strategies or playbooks created by this user.
                            </div>
                        ) : (
                            strategies.map((strat) => (
                                <div
                                    key={strat.id}
                                    className="p-4 flex items-center justify-between gap-3 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
                                >
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="w-3 h-3 rounded-full shrink-0"
                                                style={{
                                                    backgroundColor:
                                                        strat.color || "#6366F1",
                                                }}
                                            />
                                            <span className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                                {strat.name}
                                            </span>
                                            <span
                                                className={cn(
                                                    "text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase shrink-0",
                                                    strat.isPlaybook
                                                        ? "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300"
                                                        : "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400"
                                                )}
                                            >
                                                {strat.isPlaybook
                                                    ? "Playbook"
                                                    : "Strategy"}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-xs text-gray-500 truncate">
                                            {strat.pairs?.length > 0
                                                ? strat.pairs.join(", ")
                                                : "All Pairs"}
                                            {strat.timeframes?.length > 0
                                                ? ` · ${strat.timeframes.join(", ")}`
                                                : ""}
                                            {strat.riskRewardMin
                                                ? ` · Min 1:${strat.riskRewardMin} RR`
                                                : ""}
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSelectedStrategy(strat)}
                                        className="rounded-lg h-8 text-xs font-semibold shrink-0"
                                    >
                                        <Eye size={13} className="mr-1" /> Setup
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* 3. Pre-Trade Plans Table */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#151925] overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Compass size={16} className="text-emerald-500" /> Pre-Trade Plans ({plans.length})
                    </h3>
                    {plans.length > 6 && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAllPlans((v) => !v)}
                            className="h-7 text-xs font-bold rounded-lg"
                        >
                            {showAllPlans
                                ? "Show Recent (6)"
                                : `Show All (${plans.length})`}
                        </Button>
                    )}
                </div>

                {plans.length > 0 ? (
                    <div className="divide-y divide-gray-200 dark:divide-white/10">
                        {visiblePlans.map((plan) => (
                            <div
                                key={plan.id}
                                className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
                            >
                                <div className="flex items-start gap-3 min-w-0">
                                    <div
                                        className={cn(
                                            "p-2 rounded-lg shrink-0 mt-0.5",
                                            plan.type === "BUY"
                                                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                                                : plan.type === "SELL"
                                                  ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
                                                  : "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400"
                                        )}
                                    >
                                        {plan.type === "BUY" ? (
                                            <TrendingUp size={16} />
                                        ) : plan.type === "SELL" ? (
                                            <TrendingDown size={16} />
                                        ) : (
                                            <Target size={16} />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-sm font-black text-gray-900 dark:text-white">
                                                {plan.symbol}
                                            </span>
                                            <span
                                                className={cn(
                                                    "text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase",
                                                    plan.type === "BUY"
                                                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                                                        : plan.type === "SELL"
                                                          ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300"
                                                          : "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300"
                                                )}
                                            >
                                                {plan.type || "PENDING"}
                                            </span>
                                            <span
                                                className={cn(
                                                    "text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase",
                                                    plan.status === "EXECUTED"
                                                        ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                                                        : plan.status === "CANCELLED"
                                                          ? "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400"
                                                          : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                                                )}
                                            >
                                                {plan.status}
                                            </span>
                                            {plan.setupName && (
                                                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-lg">
                                                    {plan.setupName}
                                                </span>
                                            )}
                                        </div>
                                        <p className="mt-1 text-xs text-gray-500">
                                            {format(
                                                new Date(plan.plannedAt),
                                                "MMM d, yyyy · HH:mm"
                                            )}
                                            {" · "}Entry:{" "}
                                            {plan.plannedEntry?.toLocaleString() ||
                                                "Market"}
                                            {" · "}SL:{" "}
                                            {plan.plannedStopLoss?.toLocaleString() ||
                                                "—"}
                                            {" · "}TP:{" "}
                                            {plan.plannedTakeProfit?.toLocaleString() ||
                                                "—"}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                                    {plan.journalEntry && (
                                        <span
                                            className={cn(
                                                "text-xs font-bold",
                                                (plan.journalEntry.pnl || 0) >= 0
                                                    ? "text-emerald-600 dark:text-emerald-400"
                                                    : "text-rose-600 dark:text-rose-400"
                                            )}
                                        >
                                            {plan.journalEntry.pnl !== null
                                                ? `${plan.journalEntry.pnl >= 0 ? "+" : ""}$${plan.journalEntry.pnl.toFixed(2)}`
                                                : "Open"}
                                        </span>
                                    )}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSelectedPlan(plan)}
                                        className="rounded-lg h-8 gap-1.5 text-xs font-semibold"
                                    >
                                        <Eye size={13} /> Details
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center text-sm text-gray-500">
                        No trade plans recorded for this user.
                    </div>
                )}
            </div>

            {/* 4. Side-by-Side: Performance Reports & Day Notes/Insights */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Left: Performance Reports */}
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#151925] overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <BarChart3 size={16} className="text-primary" /> Performance Reports
                        </h3>
                        <span className="text-xs font-bold text-gray-500">
                            {reports.length} Cycles
                        </span>
                    </div>

                    <div className="divide-y divide-gray-200 dark:divide-white/10 flex-1">
                        {reports.length === 0 ? (
                            <div className="p-8 text-center text-sm text-gray-500">
                                No performance reports generated yet.
                            </div>
                        ) : (
                            reports.map((report) => (
                                <div
                                    key={report.id}
                                    className="p-4 flex items-center justify-between gap-3 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
                                >
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                {report.periodLabel}
                                            </span>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-primary/10 text-primary uppercase">
                                                {report.type}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-xs text-gray-500">
                                            {report.totalTrades} trades ·{" "}
                                            {report.winRate.toFixed(1)}% WR ·{" "}
                                            <span
                                                className={cn(
                                                    "font-bold",
                                                    report.netPnL >= 0
                                                        ? "text-emerald-600 dark:text-emerald-400"
                                                        : "text-rose-600 dark:text-rose-400"
                                                )}
                                            >
                                                {report.netPnL >= 0 ? "+" : ""}$
                                                {report.netPnL.toFixed(2)}
                                            </span>
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSelectedReport(report)}
                                        className="rounded-lg h-8 text-xs font-semibold shrink-0"
                                    >
                                        <Eye size={13} className="mr-1" /> Inspect
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right: Day Notes & Behavioral Insights */}
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#151925] overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Calendar size={16} className="text-amber-500" /> Day Notes & Behavioral Insights
                        </h3>
                        <span className="text-xs font-bold text-gray-500">
                            {dayNotes.length} Notes · {insights.length} Insights
                        </span>
                    </div>

                    <div className="divide-y divide-gray-200 dark:divide-white/10 flex-1">
                        {dayNotes.length === 0 && insights.length === 0 ? (
                            <div className="p-8 text-center text-sm text-gray-500">
                                No daily notes or behavioral insights recorded.
                            </div>
                        ) : (
                            <>
                                {insights.map((ins) => (
                                    <div
                                        key={ins.id}
                                        className="p-4 flex items-start gap-3 bg-amber-50/20 dark:bg-amber-500/[0.03]"
                                    >
                                        <Lightbulb
                                            size={16}
                                            className="text-amber-500 shrink-0 mt-0.5"
                                        />
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-xs font-bold text-gray-900 dark:text-white">
                                                    {ins.title}
                                                </span>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 uppercase">
                                                    {ins.insightType}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                                                {ins.summary}
                                            </p>
                                        </div>
                                    </div>
                                ))}

                                {dayNotes.map((dn) => (
                                    <div
                                        key={dn.id}
                                        className="p-4 space-y-1 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                                                {format(
                                                    new Date(dn.date),
                                                    "EEE, MMM d, yyyy"
                                                )}
                                            </span>
                                            <span className="text-[11px] text-gray-400">
                                                {formatDistanceToNow(
                                                    new Date(dn.updatedAt),
                                                    { addSuffix: true }
                                                )}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-line line-clamp-3">
                                            {dn.note}
                                        </p>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Plan Detail Modal */}
            {selectedPlan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#151925]">
                        <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-white/10">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-black text-gray-900 dark:text-white">
                                        Plan vs Actual: {selectedPlan.symbol}
                                    </h3>
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300">
                                        {selectedPlan.status}
                                    </span>
                                </div>
                                <p className="mt-0.5 text-xs text-gray-500">
                                    Planned on{" "}
                                    {format(
                                        new Date(selectedPlan.plannedAt),
                                        "PPP 'at' HH:mm"
                                    )}
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedPlan(null)}
                                className="rounded-lg p-2"
                                aria-label="Close modal"
                            >
                                <X size={18} />
                            </Button>
                        </div>

                        <div className="mt-4 space-y-4">
                            <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden divide-y divide-gray-200 dark:divide-white/10 text-xs">
                                <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-white/10 bg-gray-50/50 dark:bg-white/[0.02]">
                                    <div className="p-3">
                                        <span className="block text-[10px] font-bold text-gray-400 uppercase">
                                            Pre-Trade Plan
                                        </span>
                                        <div className="mt-1 space-y-1 font-semibold text-gray-800 dark:text-gray-200">
                                            <div>
                                                Planned Entry:{" "}
                                                <span className="font-bold">
                                                    {selectedPlan.plannedEntry ||
                                                        "Market"}
                                                </span>
                                            </div>
                                            <div>
                                                Stop Loss:{" "}
                                                <span className="font-bold text-rose-500">
                                                    {selectedPlan.plannedStopLoss ||
                                                        "None"}
                                                </span>
                                            </div>
                                            <div>
                                                Take Profit:{" "}
                                                <span className="font-bold text-emerald-500">
                                                    {selectedPlan.plannedTakeProfit ||
                                                        "None"}
                                                </span>
                                            </div>
                                            <div>
                                                Planned Size:{" "}
                                                <span className="font-bold">
                                                    {selectedPlan.plannedLotSize
                                                        ? `${selectedPlan.plannedLotSize} lots`
                                                        : "Discretionary"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-3">
                                        <span className="block text-[10px] font-bold text-gray-400 uppercase">
                                            Actual Execution
                                        </span>
                                        {selectedPlan.journalEntry ? (
                                            <div className="mt-1 space-y-1 font-semibold text-gray-800 dark:text-gray-200">
                                                <div>
                                                    Actual Entry:{" "}
                                                    <span className="font-bold">
                                                        {
                                                            selectedPlan
                                                                .journalEntry
                                                                .entryPrice
                                                        }
                                                    </span>
                                                </div>
                                                <div>
                                                    Actual Exit:{" "}
                                                    <span className="font-bold">
                                                        {selectedPlan
                                                            .journalEntry
                                                            .exitPrice ||
                                                            "Open"}
                                                    </span>
                                                </div>
                                                <div>
                                                    Net P&L:{" "}
                                                    <span
                                                        className={cn(
                                                            "font-bold",
                                                            (selectedPlan
                                                                .journalEntry
                                                                .pnl || 0) >= 0
                                                                ? "text-emerald-500"
                                                                : "text-rose-500"
                                                        )}
                                                    >
                                                        {selectedPlan
                                                            .journalEntry
                                                            .pnl !== null
                                                            ? `$${selectedPlan.journalEntry.pnl.toFixed(2)}`
                                                            : "Open"}
                                                    </span>
                                                </div>
                                                <div>
                                                    Actual Size:{" "}
                                                    <span className="font-bold">
                                                        {
                                                            selectedPlan
                                                                .journalEntry
                                                                .lotSize
                                                        }{" "}
                                                        lots
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="mt-2 text-xs text-gray-500 italic flex items-center gap-1">
                                                <AlertCircle size={14} /> Not
                                                linked to an executed trade.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {selectedPlan.thesis && (
                                <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-white/10 dark:bg-white/[0.02]">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                        Trade Thesis
                                    </h4>
                                    <p className="mt-1.5 text-xs text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line">
                                        {selectedPlan.thesis}
                                    </p>
                                </div>
                            )}

                            {selectedPlan.invalidation && (
                                <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4 dark:border-rose-900/30 dark:bg-rose-950/20">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                                        Invalidation & Hard Stop Criteria
                                    </h4>
                                    <p className="mt-1.5 text-xs text-gray-800 dark:text-gray-200 leading-relaxed">
                                        {selectedPlan.invalidation}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end border-t border-gray-200 pt-4 dark:border-white/10">
                            <Button
                                variant="outline"
                                onClick={() => setSelectedPlan(null)}
                                className="rounded-lg"
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Strategy Detail Modal */}
            {selectedStrategy && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#151925]">
                        <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-white/10">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-4 h-4 rounded-full"
                                    style={{
                                        backgroundColor:
                                            selectedStrategy.color || "#6366F1",
                                    }}
                                />
                                <div>
                                    <h3 className="text-lg font-black text-gray-900 dark:text-white">
                                        {selectedStrategy.name}
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        {selectedStrategy.isPlaybook
                                            ? "Systematic Playbook Setup"
                                            : "Standard Strategy"}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedStrategy(null)}
                                className="rounded-lg p-2"
                                aria-label="Close modal"
                            >
                                <X size={18} />
                            </Button>
                        </div>

                        <div className="mt-4 space-y-4 text-xs">
                            {selectedStrategy.description && (
                                <div>
                                    <span className="font-bold text-gray-400 uppercase tracking-wider block">
                                        Description
                                    </span>
                                    <p className="mt-1 text-gray-800 dark:text-gray-200 leading-relaxed">
                                        {selectedStrategy.description}
                                    </p>
                                </div>
                            )}

                            {selectedStrategy.idealEntry && (
                                <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-900/30 dark:bg-emerald-950/20">
                                    <span className="font-bold text-emerald-700 dark:text-emerald-300 block">
                                        Ideal Entry Trigger
                                    </span>
                                    <p className="mt-1 text-gray-800 dark:text-gray-200">
                                        {selectedStrategy.idealEntry}
                                    </p>
                                </div>
                            )}

                            {selectedStrategy.idealStopLoss && (
                                <div className="rounded-lg border border-rose-200 bg-rose-50/50 p-3 dark:border-rose-900/30 dark:bg-rose-950/20">
                                    <span className="font-bold text-rose-700 dark:text-rose-300 block">
                                        Ideal Stop Loss Rule
                                    </span>
                                    <p className="mt-1 text-gray-800 dark:text-gray-200">
                                        {selectedStrategy.idealStopLoss}
                                    </p>
                                </div>
                            )}

                            {selectedStrategy.rules && (
                                <div>
                                    <span className="font-bold text-gray-400 uppercase tracking-wider block">
                                        Setup Checklist / Rules
                                    </span>
                                    <pre className="mt-1 p-3 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-sans">
                                        {selectedStrategy.rules}
                                    </pre>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end border-t border-gray-200 pt-4 dark:border-white/10">
                            <Button
                                variant="outline"
                                onClick={() => setSelectedStrategy(null)}
                                className="rounded-lg"
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Rule Detail Modal */}
            {selectedRule && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#151925]">
                        <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-white/10">
                            <div>
                                <h3 className="text-lg font-black text-gray-900 dark:text-white">
                                    {selectedRule.title}
                                </h3>
                                <p className="text-xs text-gray-500">
                                    Category: {selectedRule.category} · Severity:{" "}
                                    {selectedRule.severity}
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedRule(null)}
                                className="rounded-lg p-2"
                                aria-label="Close modal"
                            >
                                <X size={18} />
                            </Button>
                        </div>

                        <div className="mt-4 space-y-4 text-xs">
                            {selectedRule.description && (
                                <div>
                                    <span className="font-bold text-gray-400 uppercase tracking-wider block">
                                        Rule Description
                                    </span>
                                    <p className="mt-1 text-gray-800 dark:text-gray-200 leading-relaxed bg-gray-50 dark:bg-white/5 p-3 rounded-lg border border-gray-200 dark:border-white/10">
                                        {selectedRule.description}
                                    </p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5">
                                    <span className="block text-[10px] font-bold text-gray-400 uppercase">
                                        Status
                                    </span>
                                    <span
                                        className={cn(
                                            "font-bold mt-1 block",
                                            selectedRule.isActive
                                                ? "text-emerald-500"
                                                : "text-gray-500"
                                        )}
                                    >
                                        {selectedRule.isActive
                                            ? "Enforced & Active"
                                            : "Disabled"}
                                    </span>
                                </div>
                                <div className="p-3 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5">
                                    <span className="block text-[10px] font-bold text-gray-400 uppercase">
                                        Linked Strategy
                                    </span>
                                    <span className="font-bold text-gray-800 dark:text-gray-200 mt-1 block truncate">
                                        {selectedRule.strategy?.name ||
                                            "Global Account Rule"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end border-t border-gray-200 pt-4 dark:border-white/10">
                            <Button
                                variant="outline"
                                onClick={() => setSelectedRule(null)}
                                className="rounded-lg"
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Report Detail Modal */}
            {selectedReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#151925]">
                        <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-white/10">
                            <div>
                                <h3 className="text-lg font-black text-gray-900 dark:text-white">
                                    {selectedReport.periodLabel}
                                </h3>
                                <p className="text-xs text-gray-500">
                                    Cycle:{" "}
                                    {format(
                                        new Date(selectedReport.periodStart),
                                        "PPP"
                                    )}{" "}
                                    –{" "}
                                    {format(
                                        new Date(selectedReport.periodEnd),
                                        "PPP"
                                    )}
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedReport(null)}
                                className="rounded-lg p-2"
                                aria-label="Close modal"
                            >
                                <X size={18} />
                            </Button>
                        </div>

                        <div className="mt-4 space-y-4 text-xs">
                            <div className="rounded-xl border border-gray-200 dark:border-white/10 divide-y divide-gray-200 dark:divide-white/10 overflow-hidden">
                                <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-white/10 bg-gray-50/50 dark:bg-white/[0.02]">
                                    <div className="p-3">
                                        <span className="block text-[10px] font-bold text-gray-400 uppercase">
                                            Win / Loss Metrics
                                        </span>
                                        <div className="mt-1 space-y-1 font-semibold text-gray-800 dark:text-gray-200">
                                            <div>
                                                Win Rate:{" "}
                                                <span className="font-bold text-emerald-500">
                                                    {selectedReport.winRate.toFixed(
                                                        1
                                                    )}
                                                    %
                                                </span>{" "}
                                                ({selectedReport.winCount}W /{" "}
                                                {selectedReport.lossCount}L)
                                            </div>
                                            <div>
                                                Profit Factor:{" "}
                                                <span className="font-bold">
                                                    {selectedReport.profitFactor?.toFixed(
                                                        2
                                                    ) || "—"}
                                                </span>
                                            </div>
                                            <div>
                                                Avg Win:{" "}
                                                <span className="text-emerald-500">
                                                    $
                                                    {selectedReport.avgWin?.toFixed(
                                                        2
                                                    ) || "0.00"}
                                                </span>
                                            </div>
                                            <div>
                                                Avg Loss:{" "}
                                                <span className="text-rose-500">
                                                    $
                                                    {selectedReport.avgLoss?.toFixed(
                                                        2
                                                    ) || "0.00"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-3">
                                        <span className="block text-[10px] font-bold text-gray-400 uppercase">
                                            P&L & Extremes
                                        </span>
                                        <div className="mt-1 space-y-1 font-semibold text-gray-800 dark:text-gray-200">
                                            <div>
                                                Net P&L:{" "}
                                                <span
                                                    className={cn(
                                                        "font-bold",
                                                        selectedReport.netPnL >=
                                                            0
                                                            ? "text-emerald-500"
                                                            : "text-rose-500"
                                                    )}
                                                >
                                                    {selectedReport.netPnL >= 0
                                                        ? "+"
                                                        : ""}
                                                    $
                                                    {selectedReport.netPnL.toFixed(
                                                        2
                                                    )}
                                                </span>
                                            </div>
                                            <div>
                                                Largest Win:{" "}
                                                <span className="text-emerald-500">
                                                    $
                                                    {selectedReport.largestWin?.toFixed(
                                                        2
                                                    ) || "0.00"}
                                                </span>
                                            </div>
                                            <div>
                                                Largest Loss:{" "}
                                                <span className="text-rose-500">
                                                    $
                                                    {selectedReport.largestLoss?.toFixed(
                                                        2
                                                    ) || "0.00"}
                                                </span>
                                            </div>
                                            <div>
                                                Plan Compliance:{" "}
                                                <span className="text-blue-500">
                                                    {selectedReport.planCompliance
                                                        ? `${selectedReport.planCompliance.toFixed(0)}%`
                                                        : "N/A"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end border-t border-gray-200 pt-4 dark:border-white/10">
                            <Button
                                variant="outline"
                                onClick={() => setSelectedReport(null)}
                                className="rounded-lg"
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
