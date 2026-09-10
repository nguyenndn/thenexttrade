"use client";

import { useState, useMemo } from "react";
import {
    ShieldCheck,
    Target,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Clock,
    Search,
    Eye,
    X,
    Filter,
    Layers,
    SlidersHorizontal,
    Activity,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/Button";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { cn } from "@/lib/utils";

export interface TradingRuleItem {
    id: string;
    title: string;
    description: string | null;
    category: string;
    severity: string;
    isActive: boolean;
    sortOrder: number;
    createdAt: Date | string;
    strategy: { id: string; name: string } | null;
    account: { id: string; name: string | null; broker: string | null } | null;
    _count?: {
        checks: number;
    };
}

export interface TraderGoalItem {
    id: string;
    title: string;
    type: string;
    period: string;
    targetValue: number | null;
    metadata: unknown;
    status: string;
    startsAt: Date | string;
    endsAt: Date | string | null;
    account: { id: string; name: string | null; broker: string | null } | null;
}

export interface TradeRuleCheckItem {
    id: string;
    status: string;
    note: string | null;
    checkedAt: Date | string;
    tradingRule: {
        id: string;
        title: string;
        severity: string;
        category: string;
    };
    journalEntry: {
        id: string;
        symbol: string;
        type: string;
        pnl: number | null;
        entryDate: Date | string;
    };
}

interface UserRulesGoalsTabProps {
    rules: TradingRuleItem[];
    goals: TraderGoalItem[];
    ruleChecks: TradeRuleCheckItem[];
}

export function UserRulesGoalsTab({ rules, goals, ruleChecks }: UserRulesGoalsTabProps) {
    const [activeSection, setActiveSection] = useState<"rules" | "goals" | "checks">("rules");
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("ALL");
    const [selectedRule, setSelectedRule] = useState<TradingRuleItem | null>(null);
    const [selectedGoal, setSelectedGoal] = useState<TraderGoalItem | null>(null);

    // KPI Metrics
    const stats = useMemo(() => {
        const totalRules = rules.length;
        const activeRules = rules.filter((r) => r.isActive).length;
        const criticalRules = rules.filter((r) => r.severity === "CRITICAL" || r.severity === "HIGH").length;
        const activeGoals = goals.filter((g) => g.status === "ACTIVE").length;

        const totalChecks = ruleChecks.length;
        const passedChecks = ruleChecks.filter((c) => c.status === "PASSED").length;
        const violations = ruleChecks.filter((c) => c.status === "VIOLATED").length;
        const complianceRate = totalChecks > 0 ? ((passedChecks / totalChecks) * 100).toFixed(1) : "100.0";

        return {
            totalRules,
            activeRules,
            criticalRules,
            activeGoals,
            totalChecks,
            passedChecks,
            violations,
            complianceRate,
        };
    }, [rules, goals, ruleChecks]);

    // Categories list for rules
    const ruleCategories = useMemo(() => {
        const set = new Set(rules.map((r) => r.category).filter(Boolean));
        return ["ALL", ...Array.from(set)];
    }, [rules]);

    // Filtered rules
    const filteredRules = useMemo(() => {
        return rules.filter((rule) => {
            if (categoryFilter !== "ALL" && rule.category !== categoryFilter) return false;
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchTitle = rule.title.toLowerCase().includes(q);
                const matchDesc = rule.description?.toLowerCase().includes(q);
                const matchStrat = rule.strategy?.name.toLowerCase().includes(q);
                if (!matchTitle && !matchDesc && !matchStrat) return false;
            }
            return true;
        });
    }, [rules, categoryFilter, searchQuery]);

    // Filtered goals
    const filteredGoals = useMemo(() => {
        if (!searchQuery.trim()) return goals;
        const q = searchQuery.toLowerCase();
        return goals.filter(
            (g) => g.title.toLowerCase().includes(q) || g.type.toLowerCase().includes(q) || g.period.toLowerCase().includes(q)
        );
    }, [goals, searchQuery]);

    // Filtered rule checks
    const filteredChecks = useMemo(() => {
        if (!searchQuery.trim()) return ruleChecks;
        const q = searchQuery.toLowerCase();
        return ruleChecks.filter(
            (c) =>
                c.tradingRule.title.toLowerCase().includes(q) ||
                c.journalEntry.symbol.toLowerCase().includes(q) ||
                c.status.toLowerCase().includes(q) ||
                c.note?.toLowerCase().includes(q)
        );
    }, [ruleChecks, searchQuery]);

    return (
        <div className="space-y-6">
            {/* Top KPI Cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#151925]">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        <ShieldCheck size={14} className="text-primary" /> Active Rules
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-gray-900 dark:text-white">
                            {stats.activeRules}
                        </span>
                        <span className="text-xs text-gray-500">of {stats.totalRules} configured</span>
                    </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#151925]">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        <CheckCircle2 size={14} className="text-emerald-500" /> Compliance Rate
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                            {stats.complianceRate}%
                        </span>
                        <span className="text-xs text-gray-500">{stats.passedChecks} passed</span>
                    </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#151925]">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        <AlertTriangle size={14} className="text-rose-500" /> Rule Violations
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
                            {stats.violations}
                        </span>
                        <span className="text-xs text-gray-500">{stats.criticalRules} critical rules</span>
                    </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#151925]">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        <Target size={14} className="text-blue-500" /> Active Goals
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                            {stats.activeGoals}
                        </span>
                        <span className="text-xs text-gray-500">in tracking</span>
                    </div>
                </div>
            </div>

            {/* Sub-Section Navigation & Filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex rounded-xl border border-gray-200 bg-[#F1F3F5] p-1 dark:border-white/10 dark:bg-[#1A1D27] w-fit">
                    <button
                        type="button"
                        onClick={() => setActiveSection("rules")}
                        className={cn(
                            "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors",
                            activeSection === "rules"
                                ? "bg-white text-gray-900 shadow-sm dark:bg-[#252936] dark:text-white"
                                : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                        )}
                    >
                        <ShieldCheck size={14} /> Trading Rules ({rules.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveSection("goals")}
                        className={cn(
                            "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors",
                            activeSection === "goals"
                                ? "bg-white text-gray-900 shadow-sm dark:bg-[#252936] dark:text-white"
                                : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                        )}
                    >
                        <Target size={14} /> Behavior Goals ({goals.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveSection("checks")}
                        className={cn(
                            "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors",
                            activeSection === "checks"
                                ? "bg-white text-gray-900 shadow-sm dark:bg-[#252936] dark:text-white"
                                : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                        )}
                    >
                        <Activity size={14} /> Rule Check Telemetry ({ruleChecks.length})
                    </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="w-full sm:w-64">
                        <PremiumInput
                            placeholder={
                                activeSection === "rules"
                                    ? "Search rules or strategy..."
                                    : activeSection === "goals"
                                    ? "Search goals..."
                                    : "Search check audit log..."
                            }
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            prefix={<Search size={14} className="text-gray-400" />}
                        />
                    </div>

                    {activeSection === "rules" && ruleCategories.length > 1 && (
                        <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-white p-1 dark:border-white/10 dark:bg-[#151925]">
                            {ruleCategories.slice(0, 4).map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setCategoryFilter(cat)}
                                    className={cn(
                                        "rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase transition-colors",
                                        categoryFilter === cat
                                            ? "bg-primary text-white"
                                            : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
                                    )}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Section 1: Trading Rules */}
            {activeSection === "rules" && (
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#151925] overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <ShieldCheck size={16} className="text-primary" /> Configured Trading Rules ({filteredRules.length})
                        </h3>
                        <span className="text-xs text-gray-500">Enforcement Telemetry</span>
                    </div>

                    {filteredRules.length > 0 ? (
                        <div className="divide-y divide-gray-200 dark:divide-white/10">
                            {filteredRules.map((rule) => (
                                <div
                                    key={rule.id}
                                    className="p-4 sm:p-5 transition-colors hover:bg-gray-50/60 dark:hover:bg-white/[0.02] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                                >
                                    <div className="flex items-start gap-3 min-w-0">
                                        <div
                                            className={cn(
                                                "p-2.5 rounded-xl shrink-0 mt-0.5",
                                                rule.severity === "CRITICAL"
                                                    ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300"
                                                    : rule.severity === "HIGH"
                                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                                                    : "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                                            )}
                                        >
                                            <ShieldCheck size={18} />
                                        </div>

                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                                                    {rule.title}
                                                </h4>
                                                <span
                                                    className={cn(
                                                        "text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider",
                                                        rule.severity === "CRITICAL"
                                                            ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
                                                            : rule.severity === "HIGH"
                                                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                                                            : "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400"
                                                    )}
                                                >
                                                    {rule.severity}
                                                </span>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 uppercase">
                                                    {rule.category}
                                                </span>
                                                <span
                                                    className={cn(
                                                        "text-[10px] font-bold px-2 py-0.5 rounded-md uppercase",
                                                        rule.isActive
                                                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                                                            : "bg-gray-100 text-gray-500 dark:bg-white/10"
                                                    )}
                                                >
                                                    {rule.isActive ? "Active" : "Inactive"}
                                                </span>
                                            </div>

                                            {rule.description && (
                                                <p className="mt-1 text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                                                    {rule.description}
                                                </p>
                                            )}

                                            <div className="mt-2 flex items-center gap-3 text-[11px] text-gray-500 flex-wrap">
                                                <span>Created {format(new Date(rule.createdAt), "MMM d, yyyy")}</span>
                                                {rule.strategy && (
                                                    <span>· Strategy: <strong className="text-gray-700 dark:text-gray-300">{rule.strategy.name}</strong></span>
                                                )}
                                                {rule._count && (
                                                    <span>· {rule._count.checks} trade evaluations</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSelectedRule(rule)}
                                        className="rounded-xl shrink-0 self-end sm:self-center gap-1.5 text-xs font-semibold"
                                    >
                                        <Eye size={14} /> View Rule
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center">
                            <p className="text-sm text-gray-500">No trading rules set up by this user.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Section 2: Behavior Goals */}
            {activeSection === "goals" && (
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#151925] overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Target size={16} className="text-blue-500" /> Trader Behavior Goals ({filteredGoals.length})
                        </h3>
                        <span className="text-xs text-gray-500">Target Tracking</span>
                    </div>

                    {filteredGoals.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                            {filteredGoals.map((goal) => (
                                <div
                                    key={goal.id}
                                    className="rounded-xl border border-gray-200 bg-gray-50/40 p-4 transition-all hover:border-gray-300 dark:border-white/10 dark:bg-[#1A1D27] dark:hover:border-white/20 flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-center justify-between gap-2">
                                            <h4 className="font-bold text-gray-900 dark:text-white text-sm truncate">
                                                {goal.title}
                                            </h4>
                                            <span
                                                className={cn(
                                                    "text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0",
                                                    goal.status === "ACTIVE"
                                                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                                                        : goal.status === "COMPLETED"
                                                        ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                                                        : "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300"
                                                )}
                                            >
                                                {goal.status}
                                            </span>
                                        </div>

                                        {/* 2x2 Matrix Card */}
                                        <div className="mt-3 rounded-xl border border-gray-200 bg-white dark:border-white/10 dark:bg-[#151925] divide-y divide-gray-200 dark:divide-white/10 text-xs">
                                            <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-white/10">
                                                <div className="p-2.5">
                                                    <span className="block text-[10px] font-semibold text-gray-400 uppercase">Goal Type</span>
                                                    <span className="font-bold text-gray-800 dark:text-gray-200 truncate block">
                                                        {goal.type}
                                                    </span>
                                                </div>
                                                <div className="p-2.5">
                                                    <span className="block text-[10px] font-semibold text-gray-400 uppercase">Cadence</span>
                                                    <span className="font-bold text-gray-800 dark:text-gray-200 truncate block">
                                                        {goal.period}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-white/10">
                                                <div className="p-2.5">
                                                    <span className="block text-[10px] font-semibold text-gray-400 uppercase">Target Value</span>
                                                    <span className="font-bold text-primary">
                                                        {goal.targetValue !== null ? goal.targetValue : "Discretionary"}
                                                    </span>
                                                </div>
                                                <div className="p-2.5">
                                                    <span className="block text-[10px] font-semibold text-gray-400 uppercase">Window</span>
                                                    <span className="font-bold text-gray-800 dark:text-gray-200 truncate block">
                                                        Since {format(new Date(goal.startsAt), "MMM d")}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-white/10 flex items-center justify-between text-[11px] text-gray-500">
                                        <span>
                                            {goal.endsAt ? `Ends ${format(new Date(goal.endsAt), "MMM d, yyyy")}` : "Continuous Tracking"}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setSelectedGoal(goal)}
                                            className="rounded-lg h-7 px-2.5 text-xs font-semibold"
                                        >
                                            Details
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center">
                            <p className="text-sm text-gray-500">No behavioral goals defined for this user.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Section 3: Rule Check Telemetry Log */}
            {activeSection === "checks" && (
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#151925] overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Activity size={16} className="text-emerald-500" /> Trade-Level Rule Verification Log ({filteredChecks.length})
                        </h3>
                        <span className="text-xs text-gray-500">Historical Checks</span>
                    </div>

                    {filteredChecks.length > 0 ? (
                        <div className="divide-y divide-gray-200 dark:divide-white/10">
                            {filteredChecks.map((check) => (
                                <div
                                    key={check.id}
                                    className="p-3.5 sm:p-4 transition-colors hover:bg-gray-50/60 dark:hover:bg-white/[0.02] flex items-center justify-between gap-3 text-xs"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="shrink-0">
                                            {check.status === "PASSED" ? (
                                                <CheckCircle2 size={16} className="text-emerald-500" />
                                            ) : check.status === "VIOLATED" ? (
                                                <XCircle size={16} className="text-rose-500" />
                                            ) : (
                                                <Clock size={16} className="text-gray-400" />
                                            )}
                                        </div>

                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-bold text-gray-900 dark:text-white">
                                                    {check.tradingRule.title}
                                                </span>
                                                <span
                                                    className={cn(
                                                        "text-[10px] font-bold px-1.5 py-0.5 rounded uppercase",
                                                        check.status === "PASSED"
                                                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                                                            : check.status === "VIOLATED"
                                                            ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300"
                                                            : "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400"
                                                    )}
                                                >
                                                    {check.status}
                                                </span>
                                                <span className="text-[11px] text-gray-500">
                                                    on trade <strong>{check.journalEntry.symbol}</strong> ({check.journalEntry.type})
                                                </span>
                                            </div>
                                            {check.note && (
                                                <p className="mt-0.5 text-gray-600 dark:text-gray-400 italic text-[11px]">
                                                    Note: {check.note}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="text-right text-[11px] text-gray-500 shrink-0">
                                        {format(new Date(check.checkedAt), "MMM d, HH:mm")}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center">
                            <p className="text-sm text-gray-500">No rule checks recorded yet.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Rule Detail Modal */}
            {selectedRule && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#151925]">
                        <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-white/10">
                            <div>
                                <h3 className="text-lg font-black text-gray-900 dark:text-white">
                                    {selectedRule.title}
                                </h3>
                                <p className="text-xs text-gray-500">
                                    Category: {selectedRule.category} · Severity: {selectedRule.severity}
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedRule(null)}
                                className="rounded-xl p-2"
                                aria-label="Close modal"
                            >
                                <X size={18} />
                            </Button>
                        </div>

                        <div className="mt-4 space-y-4 text-xs">
                            {selectedRule.description && (
                                <div>
                                    <span className="font-bold text-gray-400 uppercase tracking-wider block">Rule Description & Constraint</span>
                                    <p className="mt-1 text-gray-800 dark:text-gray-200 leading-relaxed bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-200 dark:border-white/10">
                                        {selectedRule.description}
                                    </p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5">
                                    <span className="block text-[10px] font-bold text-gray-400 uppercase">Status</span>
                                    <span className={cn("font-bold mt-1 block", selectedRule.isActive ? "text-emerald-500" : "text-gray-500")}>
                                        {selectedRule.isActive ? "Enforced & Active" : "Disabled / Inactive"}
                                    </span>
                                </div>
                                <div className="p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5">
                                    <span className="block text-[10px] font-bold text-gray-400 uppercase">Linked Strategy</span>
                                    <span className="font-bold text-gray-800 dark:text-gray-200 mt-1 block truncate">
                                        {selectedRule.strategy?.name || "Global Account Rule"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end border-t border-gray-200 pt-4 dark:border-white/10">
                            <Button variant="outline" onClick={() => setSelectedRule(null)} className="rounded-xl">
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Goal Detail Modal */}
            {selectedGoal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#151925]">
                        <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-white/10">
                            <div>
                                <h3 className="text-lg font-black text-gray-900 dark:text-white">
                                    {selectedGoal.title}
                                </h3>
                                <p className="text-xs text-gray-500">
                                    {selectedGoal.period} Goal · Type: {selectedGoal.type}
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedGoal(null)}
                                className="rounded-xl p-2"
                                aria-label="Close modal"
                            >
                                <X size={18} />
                            </Button>
                        </div>

                        <div className="mt-4 space-y-3 text-xs">
                            <div className="p-3 rounded-xl border border-blue-100 bg-blue-50/50 dark:border-blue-900/30 dark:bg-blue-950/20">
                                <span className="font-bold text-blue-700 dark:text-blue-300 block">Target Criteria</span>
                                <p className="mt-1 text-gray-800 dark:text-gray-200 font-semibold">
                                    {selectedGoal.targetValue !== null ? `Target Threshold: ${selectedGoal.targetValue}` : "Qualitative Goal"}
                                </p>
                            </div>

                            <div className="text-gray-600 dark:text-gray-400">
                                <div>Tracking Window: Starts {format(new Date(selectedGoal.startsAt), "PPP")}</div>
                                {selectedGoal.endsAt && (
                                    <div className="mt-1">Ends {format(new Date(selectedGoal.endsAt), "PPP")}</div>
                                )}
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end border-t border-gray-200 pt-4 dark:border-white/10">
                            <Button variant="outline" onClick={() => setSelectedGoal(null)} className="rounded-xl">
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
