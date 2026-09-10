"use client";

import { useState, useMemo } from "react";
import {
    Compass,
    BookOpen,
    Target,
    Shield,
    TrendingUp,
    TrendingDown,
    Calendar,
    Clock,
    Tag,
    Eye,
    X,
    CheckCircle2,
    XCircle,
    SlidersHorizontal,
    Search,
    Layers,
    ArrowRight,
    AlertCircle,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/Button";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { cn } from "@/lib/utils";

export interface TradePlanItem {
    id: string;
    symbol: string;
    type: "BUY" | "SELL" | null;
    plannedEntry: number | null;
    plannedStopLoss: number | null;
    plannedTakeProfit: number | null;
    plannedLotSize: number | null;
    riskAmount: number | null;
    setupName: string | null;
    thesis: string | null;
    invalidation: string | null;
    emotionBefore: string | null;
    confidenceLevel: number | null;
    ruleChecklist: unknown;
    tags: string[];
    images: string[];
    status: string;
    plannedAt: Date | string;
    openedAt: Date | string | null;
    cancelledAt: Date | string | null;
    reviewedAt: Date | string | null;
    account: { id: string; name: string | null; broker: string | null } | null;
    journalEntry: {
        id: string;
        entryPrice: number;
        exitPrice: number | null;
        lotSize: number;
        pnl: number | null;
        status: string;
        result: string | null;
        entryDate: Date | string;
        exitDate: Date | string | null;
    } | null;
}

export interface StrategyItem {
    id: string;
    name: string;
    description: string | null;
    rules: string | null;
    color: string;
    isPlaybook: boolean;
    setupType: string | null;
    timeframes: string[];
    pairs: string[];
    idealEntry: string | null;
    idealStopLoss: string | null;
    idealTakeProfit: string | null;
    riskRewardMin: number | null;
    referenceImages: string[];
    createdAt: Date | string;
    _count?: {
        tradingRules: number;
    };
}

interface UserTradePlansTabProps {
    plans: TradePlanItem[];
    strategies: StrategyItem[];
}

export function UserTradePlansTab({ plans, strategies }: UserTradePlansTabProps) {
    const [activeSection, setActiveSection] = useState<"plans" | "strategies">("plans");
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [selectedPlan, setSelectedPlan] = useState<TradePlanItem | null>(null);
    const [selectedStrategy, setSelectedStrategy] = useState<StrategyItem | null>(null);

    // KPI Metrics
    const stats = useMemo(() => {
        const total = plans.length;
        const executed = plans.filter((p) => p.status === "EXECUTED" || !!p.journalEntry).length;
        const planned = plans.filter((p) => p.status === "PLANNED").length;
        const cancelled = plans.filter((p) => p.status === "CANCELLED").length;
        const executionRate = total > 0 ? ((executed / total) * 100).toFixed(1) : "0.0";
        const playbooks = strategies.filter((s) => s.isPlaybook).length;

        return { total, executed, planned, cancelled, executionRate, totalStrategies: strategies.length, playbooks };
    }, [plans, strategies]);

    // Filtered plans
    const filteredPlans = useMemo(() => {
        return plans.filter((plan) => {
            if (statusFilter !== "ALL" && plan.status !== statusFilter) return false;
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchSymbol = plan.symbol.toLowerCase().includes(q);
                const matchSetup = plan.setupName?.toLowerCase().includes(q);
                const matchThesis = plan.thesis?.toLowerCase().includes(q);
                const matchTag = plan.tags.some((t) => t.toLowerCase().includes(q));
                if (!matchSymbol && !matchSetup && !matchThesis && !matchTag) return false;
            }
            return true;
        });
    }, [plans, statusFilter, searchQuery]);

    // Filtered strategies
    const filteredStrategies = useMemo(() => {
        if (!searchQuery.trim()) return strategies;
        const q = searchQuery.toLowerCase();
        return strategies.filter(
            (s) =>
                s.name.toLowerCase().includes(q) ||
                s.setupType?.toLowerCase().includes(q) ||
                s.description?.toLowerCase().includes(q) ||
                s.pairs.some((p) => p.toLowerCase().includes(q))
        );
    }, [strategies, searchQuery]);

    return (
        <div className="space-y-6">
            {/* Top KPI Cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#151925]">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        <Compass size={14} className="text-primary" /> Total Trade Plans
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-gray-900 dark:text-white">{stats.total}</span>
                        <span className="text-xs text-gray-500">{stats.planned} pending</span>
                    </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#151925]">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        <CheckCircle2 size={14} className="text-emerald-500" /> Plan Execution Rate
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                            {stats.executionRate}%
                        </span>
                        <span className="text-xs text-gray-500">{stats.executed} executed</span>
                    </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#151925]">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        <BookOpen size={14} className="text-blue-500" /> Playbook Strategies
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                            {stats.playbooks}
                        </span>
                        <span className="text-xs text-gray-500">of {stats.totalStrategies} total</span>
                    </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#151925]">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        <XCircle size={14} className="text-rose-500" /> Discarded / Cancelled
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
                            {stats.cancelled}
                        </span>
                        <span className="text-xs text-gray-500">plans dropped</span>
                    </div>
                </div>
            </div>

            {/* Sub-Section Navigation & Filter Bar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex rounded-xl border border-gray-200 bg-[#F1F3F5] p-1 dark:border-white/10 dark:bg-[#1A1D27] w-fit">
                    <button
                        type="button"
                        onClick={() => setActiveSection("plans")}
                        className={cn(
                            "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors",
                            activeSection === "plans"
                                ? "bg-white text-gray-900 shadow-sm dark:bg-[#252936] dark:text-white"
                                : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                        )}
                    >
                        <Compass size={14} /> Trade Plans ({plans.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveSection("strategies")}
                        className={cn(
                            "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors",
                            activeSection === "strategies"
                                ? "bg-white text-gray-900 shadow-sm dark:bg-[#252936] dark:text-white"
                                : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                        )}
                    >
                        <BookOpen size={14} /> Playbooks & Strategies ({strategies.length})
                    </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="w-full sm:w-64">
                        <PremiumInput
                            placeholder={activeSection === "plans" ? "Search symbol, setup, thesis..." : "Search strategy, pairs..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            prefix={<Search size={14} className="text-gray-400" />}
                        />
                    </div>
                    {activeSection === "plans" && (
                        <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-white p-1 dark:border-white/10 dark:bg-[#151925]">
                            {["ALL", "PLANNED", "EXECUTED", "CANCELLED"].map((st) => (
                                <button
                                    key={st}
                                    type="button"
                                    onClick={() => setStatusFilter(st)}
                                    className={cn(
                                        "rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase transition-colors",
                                        statusFilter === st
                                            ? "bg-primary text-white"
                                            : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
                                    )}
                                >
                                    {st}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Content Area */}
            {activeSection === "plans" ? (
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#151925] overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Compass size={16} className="text-primary" /> Pre-Trade Plans ({filteredPlans.length})
                        </h3>
                        <span className="text-xs text-gray-500">Read-Only Telemetry View</span>
                    </div>

                    {filteredPlans.length > 0 ? (
                        <div className="divide-y divide-gray-200 dark:divide-white/10">
                            {filteredPlans.map((plan) => {
                                const hasActual = !!plan.journalEntry;
                                return (
                                    <div
                                        key={plan.id}
                                        className="p-4 sm:p-5 transition-colors hover:bg-gray-50/60 dark:hover:bg-white/[0.02]"
                                    >
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex items-start gap-3 min-w-0">
                                                <div
                                                    className={cn(
                                                        "p-2.5 rounded-xl shrink-0 mt-0.5",
                                                        plan.type === "BUY"
                                                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                                                            : plan.type === "SELL"
                                                            ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
                                                            : "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400"
                                                    )}
                                                >
                                                    {plan.type === "BUY" ? (
                                                        <TrendingUp size={18} />
                                                    ) : plan.type === "SELL" ? (
                                                        <TrendingDown size={18} />
                                                    ) : (
                                                        <Target size={18} />
                                                    )}
                                                </div>

                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="text-base font-black text-gray-900 dark:text-white">
                                                            {plan.symbol}
                                                        </span>
                                                        <span
                                                            className={cn(
                                                                "text-[11px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider",
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
                                                                "text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider",
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
                                                            <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                                                                {plan.setupName}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <p className="mt-1 text-xs text-gray-500 flex items-center gap-2 flex-wrap">
                                                        <span>Planned: {format(new Date(plan.plannedAt), "MMM d, yyyy HH:mm")}</span>
                                                        <span>({formatDistanceToNow(new Date(plan.plannedAt), { addSuffix: true })})</span>
                                                        {plan.account && (
                                                            <span>· Account: {plan.account.name || plan.account.broker}</span>
                                                        )}
                                                    </p>

                                                    {plan.thesis && (
                                                        <p className="mt-2 text-xs text-gray-700 dark:text-gray-300 line-clamp-2 italic">
                                                            "{plan.thesis}"
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                                                {/* Plan Specs Overview */}
                                                <div className="text-right text-xs">
                                                    <div className="font-semibold text-gray-900 dark:text-white">
                                                        Entry: {plan.plannedEntry?.toLocaleString() || "Market"}
                                                    </div>
                                                    <div className="text-[11px] text-gray-500">
                                                        SL: {plan.plannedStopLoss?.toLocaleString() || "—"} · TP: {plan.plannedTakeProfit?.toLocaleString() || "—"}
                                                    </div>
                                                </div>

                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setSelectedPlan(plan)}
                                                    className="rounded-xl gap-1.5 text-xs font-semibold"
                                                >
                                                    <Eye size={14} /> Plan vs Actual
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Plan vs Actual Quick Strip if executed */}
                                        {hasActual && plan.journalEntry && (
                                            <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50/50 p-2.5 dark:border-blue-900/30 dark:bg-blue-950/20 text-xs flex items-center justify-between flex-wrap gap-2">
                                                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-semibold">
                                                    <ArrowRight size={14} /> Linked Execution: {plan.journalEntry.lotSize} lots @ {plan.journalEntry.entryPrice}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-500">Result:</span>
                                                    <span
                                                        className={cn(
                                                            "font-bold",
                                                            (plan.journalEntry.pnl || 0) > 0
                                                                ? "text-emerald-600 dark:text-emerald-400"
                                                                : (plan.journalEntry.pnl || 0) < 0
                                                                ? "text-rose-600 dark:text-rose-400"
                                                                : "text-gray-600"
                                                        )}
                                                    >
                                                        {plan.journalEntry.pnl !== null
                                                            ? `${plan.journalEntry.pnl >= 0 ? "+" : ""}$${plan.journalEntry.pnl.toFixed(2)}`
                                                            : "Open"}
                                                    </span>
                                                    <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 font-bold">
                                                        {plan.journalEntry.result || plan.journalEntry.status}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-8 text-center">
                            <p className="text-sm text-gray-500">No trade plans recorded for this user.</p>
                        </div>
                    )}
                </div>
            ) : (
                /* Strategies & Playbook Section */
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#151925] overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <BookOpen size={16} className="text-blue-500" /> Playbooks & Strategy Library ({filteredStrategies.length})
                        </h3>
                        <span className="text-xs text-gray-500">User Setup Catalog</span>
                    </div>

                    {filteredStrategies.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                            {filteredStrategies.map((strat) => (
                                <div
                                    key={strat.id}
                                    className="rounded-xl border border-gray-200 bg-gray-50/40 p-4 transition-all hover:border-gray-300 dark:border-white/10 dark:bg-[#1A1D27] dark:hover:border-white/20 flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div
                                                    className="w-3.5 h-3.5 rounded-full shrink-0"
                                                    style={{ backgroundColor: strat.color || "#6366F1" }}
                                                />
                                                <h4 className="font-bold text-gray-900 dark:text-white truncate text-sm">
                                                    {strat.name}
                                                </h4>
                                            </div>
                                            <span
                                                className={cn(
                                                    "text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0",
                                                    strat.isPlaybook
                                                        ? "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300"
                                                        : "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400"
                                                )}
                                            >
                                                {strat.isPlaybook ? "Playbook" : "Strategy"}
                                            </span>
                                        </div>

                                        {strat.setupType && (
                                            <p className="mt-1 text-xs font-semibold text-primary">
                                                Setup: {strat.setupType}
                                            </p>
                                        )}

                                        {strat.description && (
                                            <p className="mt-2 text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                                                {strat.description}
                                            </p>
                                        )}

                                        {/* 2x2 Matrix Card for Specs */}
                                        <div className="mt-3 rounded-xl border border-gray-200 bg-white dark:border-white/10 dark:bg-[#151925] divide-y divide-gray-200 dark:divide-white/10 text-xs">
                                            <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-white/10">
                                                <div className="p-2.5">
                                                    <span className="block text-[10px] font-semibold text-gray-400 uppercase">Target Pairs</span>
                                                    <span className="font-bold text-gray-800 dark:text-gray-200 truncate block">
                                                        {strat.pairs?.length > 0 ? strat.pairs.join(", ") : "All Pairs"}
                                                    </span>
                                                </div>
                                                <div className="p-2.5">
                                                    <span className="block text-[10px] font-semibold text-gray-400 uppercase">Timeframes</span>
                                                    <span className="font-bold text-gray-800 dark:text-gray-200 truncate block">
                                                        {strat.timeframes?.length > 0 ? strat.timeframes.join(", ") : "Any"}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-white/10">
                                                <div className="p-2.5">
                                                    <span className="block text-[10px] font-semibold text-gray-400 uppercase">Min Risk:Reward</span>
                                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                        {strat.riskRewardMin ? `1 : ${strat.riskRewardMin}` : "Discretionary"}
                                                    </span>
                                                </div>
                                                <div className="p-2.5">
                                                    <span className="block text-[10px] font-semibold text-gray-400 uppercase">Linked Rules</span>
                                                    <span className="font-bold text-gray-800 dark:text-gray-200">
                                                        {strat._count?.tradingRules || 0} Rules
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-white/10 flex items-center justify-between text-[11px] text-gray-500">
                                        <span>Created {format(new Date(strat.createdAt), "MMM d, yyyy")}</span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setSelectedStrategy(strat)}
                                            className="rounded-lg h-7 px-2.5 text-xs font-semibold"
                                        >
                                            View Setup
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center">
                            <p className="text-sm text-gray-500">No trading strategies or playbooks created by this user.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Plan vs Actual Detail Modal */}
            {selectedPlan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#151925]">
                        <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-white/10">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-black text-gray-900 dark:text-white">
                                        Plan vs Actual: {selectedPlan.symbol}
                                    </h3>
                                    <span
                                        className={cn(
                                            "text-xs font-bold px-2 py-0.5 rounded uppercase",
                                            selectedPlan.type === "BUY"
                                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                                                : "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300"
                                        )}
                                    >
                                        {selectedPlan.type}
                                    </span>
                                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300">
                                        {selectedPlan.status}
                                    </span>
                                </div>
                                <p className="mt-0.5 text-xs text-gray-500">
                                    Planned on {format(new Date(selectedPlan.plannedAt), "PPP 'at' HH:mm")}
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedPlan(null)}
                                className="rounded-xl p-2"
                                aria-label="Close modal"
                            >
                                <X size={18} />
                            </Button>
                        </div>

                        <div className="mt-4 space-y-4">
                            {/* 2x2 Matrix Specs Comparison */}
                            <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden divide-y divide-gray-200 dark:divide-white/10 text-xs">
                                <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-white/10 bg-gray-50/50 dark:bg-white/[0.02]">
                                    <div className="p-3">
                                        <span className="block text-[10px] font-bold text-gray-400 uppercase">Pre-Trade Plan</span>
                                        <div className="mt-1 space-y-1 font-semibold text-gray-800 dark:text-gray-200">
                                            <div>Planned Entry: <span className="font-bold">{selectedPlan.plannedEntry || "Market"}</span></div>
                                            <div>Stop Loss: <span className="font-bold text-rose-500">{selectedPlan.plannedStopLoss || "None"}</span></div>
                                            <div>Take Profit: <span className="font-bold text-emerald-500">{selectedPlan.plannedTakeProfit || "None"}</span></div>
                                            <div>Planned Size: <span className="font-bold">{selectedPlan.plannedLotSize ? `${selectedPlan.plannedLotSize} lots` : "Discretionary"}</span></div>
                                        </div>
                                    </div>

                                    <div className="p-3">
                                        <span className="block text-[10px] font-bold text-gray-400 uppercase">Actual Execution</span>
                                        {selectedPlan.journalEntry ? (
                                            <div className="mt-1 space-y-1 font-semibold text-gray-800 dark:text-gray-200">
                                                <div>Actual Entry: <span className="font-bold">{selectedPlan.journalEntry.entryPrice}</span></div>
                                                <div>Actual Exit: <span className="font-bold">{selectedPlan.journalEntry.exitPrice || "Open"}</span></div>
                                                <div>Net P&L: <span className={cn("font-bold", (selectedPlan.journalEntry.pnl || 0) >= 0 ? "text-emerald-500" : "text-rose-500")}>
                                                    {selectedPlan.journalEntry.pnl !== null ? `$${selectedPlan.journalEntry.pnl.toFixed(2)}` : "Open"}
                                                </span></div>
                                                <div>Actual Size: <span className="font-bold">{selectedPlan.journalEntry.lotSize} lots</span></div>
                                            </div>
                                        ) : (
                                            <div className="mt-2 text-xs text-gray-500 italic flex items-center gap-1">
                                                <AlertCircle size={14} /> Not yet linked to an executed journal trade.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Thesis & Reasoning */}
                            {selectedPlan.thesis && (
                                <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-white/10 dark:bg-white/[0.02]">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Trade Thesis & Context</h4>
                                    <p className="mt-1.5 text-xs text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line">
                                        {selectedPlan.thesis}
                                    </p>
                                </div>
                            )}

                            {/* Invalidation Criteria */}
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

                            {/* Tags & Psychology */}
                            <div className="flex flex-wrap items-center gap-2 pt-2">
                                {selectedPlan.emotionBefore && (
                                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                                        Pre-Trade Emotion: {selectedPlan.emotionBefore}
                                    </span>
                                )}
                                {selectedPlan.confidenceLevel && (
                                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                                        Confidence: {selectedPlan.confidenceLevel} / 5
                                    </span>
                                )}
                                {selectedPlan.tags?.map((tag) => (
                                    <span key={tag} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end border-t border-gray-200 pt-4 dark:border-white/10">
                            <Button variant="outline" onClick={() => setSelectedPlan(null)} className="rounded-xl">
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Strategy Detail Modal */}
            {selectedStrategy && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#151925]">
                        <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-white/10">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-4 h-4 rounded-full"
                                    style={{ backgroundColor: selectedStrategy.color || "#6366F1" }}
                                />
                                <div>
                                    <h3 className="text-lg font-black text-gray-900 dark:text-white">
                                        {selectedStrategy.name}
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        {selectedStrategy.isPlaybook ? "Systematic Playbook Setup" : "Standard Strategy"}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedStrategy(null)}
                                className="rounded-xl p-2"
                                aria-label="Close modal"
                            >
                                <X size={18} />
                            </Button>
                        </div>

                        <div className="mt-4 space-y-4 text-xs">
                            {selectedStrategy.description && (
                                <div>
                                    <span className="font-bold text-gray-400 uppercase tracking-wider block">Description</span>
                                    <p className="mt-1 text-gray-800 dark:text-gray-200 leading-relaxed">
                                        {selectedStrategy.description}
                                    </p>
                                </div>
                            )}

                            {selectedStrategy.idealEntry && (
                                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-900/30 dark:bg-emerald-950/20">
                                    <span className="font-bold text-emerald-700 dark:text-emerald-300 block">Ideal Entry Trigger</span>
                                    <p className="mt-1 text-gray-800 dark:text-gray-200">{selectedStrategy.idealEntry}</p>
                                </div>
                            )}

                            {selectedStrategy.idealStopLoss && (
                                <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3 dark:border-rose-900/30 dark:bg-rose-950/20">
                                    <span className="font-bold text-rose-700 dark:text-rose-300 block">Ideal Stop Loss Rule</span>
                                    <p className="mt-1 text-gray-800 dark:text-gray-200">{selectedStrategy.idealStopLoss}</p>
                                </div>
                            )}

                            {selectedStrategy.rules && (
                                <div>
                                    <span className="font-bold text-gray-400 uppercase tracking-wider block">Setup Checklist / Rules</span>
                                    <pre className="mt-1 p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-sans">
                                        {selectedStrategy.rules}
                                    </pre>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end border-t border-gray-200 pt-4 dark:border-white/10">
                            <Button variant="outline" onClick={() => setSelectedStrategy(null)} className="rounded-xl">
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
