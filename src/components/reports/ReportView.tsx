"use client";

import { useState } from "react";
import {
    TrendingUp,
    TrendingDown,
    BarChart3,
    Target,
    Brain,
    ChevronLeft,
    ChevronRight,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Minus,
    Crosshair,
    Clock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { WeeklyCoachPlan } from "@/components/coach/WeeklyCoachPlan";
import { EmptyStateCTAs } from "@/components/ui/EmptyStateCTAs";
import { formatDashboardCurrency } from "@/lib/utils/cent-account";

interface ReportData {
    id: string;
    type: string;
    periodLabel: string;
    periodStart: string;
    periodEnd: string;
    totalTrades: number;
    winCount: number;
    lossCount: number;
    winRate: number;
    netPnL: number;
    grossProfit: number;
    grossLoss: number;
    profitFactor: number;
    avgWin: number;
    avgLoss: number;
    largestWin: number;
    largestLoss: number;
    prevPnL: number | null;
    prevWinRate: number | null;
    prevTrades: number | null;
    bySymbol: any[] | null;
    byStrategy: any[] | null;
    bySession: any[] | null;
    byDirection: any[] | null;
    byDay: any[] | null;
    avgConfidence: number | null;
    planCompliance: number | null;
    topEmotions: any[] | null;
    topMistakes: any[] | null;
    bestTrades: any[] | null;
    worstTrades: any[] | null;
    createdAt: string;
    coachPlan?: any;
}

interface ReportViewProps {
    reports: ReportData[];
    total: number;
    type: "weekly" | "monthly";
    currency?: string;
}

function DeltaBadge({
    current,
    previous,
    suffix = "",
    isPercent = false,
    currency = "USD",
}: {
    current: number;
    previous: number | null;
    suffix?: string;
    isPercent?: boolean;
    currency?: string;
}) {
    if (previous === null || previous === undefined)
        return <span className="text-xs text-gray-400">—</span>;
    const delta = current - previous;
    const isPositive = delta > 0;
    const isZero = delta === 0;

    return (
        <span
            className={`inline-flex items-center gap-0.5 text-xs font-bold font-mono tabular-nums ${isPositive ? "text-emerald-500" : isZero ? "text-gray-400" : "text-red-500"}`}
        >
            {isPositive ? (
                <ArrowUpRight size={12} />
            ) : isZero ? (
                <Minus size={12} />
            ) : (
                <ArrowDownRight size={12} />
            )}
            {isPercent
                ? `${Math.abs(delta).toFixed(1)}%`
                : formatDashboardCurrency(Math.abs(delta), currency, {
                      fractionDigits: 0,
                      signDisplay: "never",
                  })}
            {suffix}
        </span>
    );
}

function StatCard({
    label,
    value,
    icon: Icon,
    color,
    iconBg,
    delta,
    previous,
    isPercent,
    borderColor,
    currency = "USD",
}: {
    label: string;
    value: string;
    icon: any;
    color: string;
    iconBg: string;
    delta?: number;
    previous?: number | null;
    isPercent?: boolean;
    borderColor?: string;
    currency?: string;
}) {
    return (
        <div
            className={`bg-white dark:bg-[#1E2028] rounded-xl border border-dashboard p-5 shadow-sm hover:shadow-md transition-shadow duration-200 border-t-4 ${borderColor || "border-t-transparent"}`}
        >
            <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${iconBg}`}>
                    <Icon size={18} className={color} />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {label}
                </span>
            </div>
            <p className="text-2xl font-black font-mono tabular-nums text-gray-800 dark:text-white">
                {value}
            </p>
            {previous !== undefined && (
                <div className="mt-1.5 flex items-center gap-1.5">
                    <DeltaBadge
                        current={delta ?? 0}
                        previous={previous}
                        isPercent={isPercent}
                        currency={currency}
                    />
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                        vs prev
                    </span>
                </div>
            )}
        </div>
    );
}

function BreakdownTable({
    data,
    title,
    icon: Icon,
    iconColor,
    currency = "USD",
}: {
    data: any[] | null;
    title: string;
    icon: any;
    iconColor: string;
    currency?: string;
}) {
    if (!data || data.length === 0) return null;

    return (
        <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-dashboard shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-dashboard flex items-center gap-2.5">
                <div className={`p-2 ${iconColor} rounded-lg`}>
                    <Icon size={18} />
                </div>
                <h3 className="text-sm font-bold text-gray-700 dark:text-white">
                    {title}
                </h3>
            </div>

            {/* Table header */}
            <div className="grid grid-cols-12 gap-2 px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-50/80 dark:bg-[#151925]">
                <div className="col-span-5">Name</div>
                <div className="col-span-2 text-right">Trades</div>
                <div className="col-span-2 text-right">Win Rate</div>
                <div className="col-span-3 text-right">P&L</div>
            </div>

            {/* Rows */}
            <div>
                {data.map((item, i) => (
                    <div
                        key={i}
                        className="grid grid-cols-12 gap-2 items-center px-5 h-[52px] hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors border-b border-gray-50 dark:border-white/[0.04] last:border-0"
                    >
                        <div className="col-span-5 flex items-center gap-2 min-w-0">
                            <span className="text-xs font-mono tabular-nums bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-lg shrink-0">
                                {i + 1}
                            </span>
                            <span className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">
                                {item.name}
                            </span>
                        </div>
                        <div className="col-span-2 text-right text-xs font-mono tabular-nums text-gray-500 font-medium">
                            {item.trades}
                        </div>
                        <div className="col-span-2 text-right text-xs font-mono tabular-nums text-gray-500 font-medium">
                            {item.winRate?.toFixed(0)}%
                        </div>
                        <div
                            className={`col-span-3 text-right font-bold font-mono tabular-nums text-sm ${item.pnl >= 0 ? "text-emerald-500" : "text-red-500"}`}
                        >
                            {formatDashboardCurrency(
                                item.pnl ?? 0,
                                currency,
                                { signDisplay: "always" }
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function PsychologySection({
    confidence,
    compliance,
    emotions,
    mistakes,
}: {
    confidence: number | null;
    compliance: number | null;
    emotions: any[] | null;
    mistakes: any[] | null;
}) {
    const hasData =
        confidence !== null ||
        compliance !== null ||
        (emotions && emotions.length > 0) ||
        (mistakes && mistakes.length > 0);
    if (!hasData) return null;

    return (
        <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-dashboard shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-dashboard flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-gold/10 border border-gold/20 text-amber-600 dark:text-gold">
                    <Brain size={18} />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-gray-700 dark:text-white">
                        Psychology & Discipline
                    </h3>
                    <p className="text-xs text-gray-500">
                        Mindset & emotional tracking
                    </p>
                </div>
            </div>

            <div className="p-5">
                <div className="grid grid-cols-2 gap-4 mb-4">
                    {confidence !== null && (
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                                Avg Confidence
                            </p>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-2.5 bg-gray-100 dark:bg-[#151925] rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gold rounded-full transition-all"
                                        style={{
                                            width: `${(confidence / 5) * 100}%`,
                                        }}
                                    />
                                </div>
                                <span className="text-sm font-bold font-mono tabular-nums text-gray-700 dark:text-white">
                                    {confidence.toFixed(1)}/5
                                </span>
                            </div>
                        </div>
                    )}
                    {compliance !== null && (
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                                Plan Compliance
                            </p>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-2.5 bg-gray-100 dark:bg-[#151925] rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all ${compliance >= 70 ? "bg-emerald-500" : compliance >= 40 ? "bg-amber-500" : "bg-red-500"}`}
                                        style={{ width: `${compliance}%` }}
                                    />
                                </div>
                                <span className="text-sm font-bold font-mono tabular-nums text-gray-700 dark:text-white">
                                    {compliance.toFixed(0)}%
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {emotions && emotions.length > 0 && (
                    <div className="mb-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                            Top Emotions
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {emotions.map((e: any, i: number) => (
                                <span
                                    key={i}
                                    className="px-2.5 py-1 bg-gray-50/80 dark:bg-[#151925] border border-dashboard rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300"
                                >
                                    {e.emotion}{" "}
                                    <span className="font-mono tabular-nums text-gray-400">
                                        ×{e.count}
                                    </span>
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {mistakes && mistakes.length > 0 && (
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                            Top Mistakes
                        </p>
                        <div className="space-y-1.5">
                            {mistakes.map((m: any, i: number) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between py-1.5"
                                >
                                    <span className="text-sm text-gray-600 dark:text-gray-300">
                                        {m.name}
                                    </span>
                                    <span className="text-xs font-bold font-mono tabular-nums bg-red-50 dark:bg-red-500/10 text-red-500 px-2 py-0.5 rounded-lg">
                                        {m.count}×
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function TradesList({
    trades,
    title,
    icon: Icon,
    iconColor,
    pnlColor,
    currency = "USD",
}: {
    trades: any[] | null;
    title: string;
    icon: any;
    iconColor: string;
    pnlColor: string;
    currency?: string;
}) {
    if (!trades || trades.length === 0) return null;

    return (
        <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-dashboard shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-dashboard flex items-center gap-2.5">
                <div className={`p-2 rounded-lg ${iconColor}`}>
                    <Icon size={18} />
                </div>
                <h3 className="text-sm font-bold text-gray-700 dark:text-white">
                    {title}
                </h3>
            </div>

            {/* Table header */}
            <div className="grid grid-cols-12 gap-2 px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-50/80 dark:bg-[#151925]">
                <div className="col-span-5">Symbol</div>
                <div className="col-span-4 text-center">Date</div>
                <div className="col-span-3 text-right">P&L</div>
            </div>

            {/* Rows */}
            <div>
                {trades.map((t: any, i: number) => (
                    <div
                        key={i}
                        className="grid grid-cols-12 gap-2 items-center px-5 h-[52px] hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors border-b border-gray-50 dark:border-white/[0.04] last:border-0"
                    >
                        <div className="col-span-5">
                            <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                                {t.symbol}
                            </span>
                        </div>
                        <div className="col-span-4 text-center text-xs font-mono tabular-nums text-gray-500 font-medium">
                            {t.date
                                ? new Date(t.date).toLocaleDateString()
                                : ""}
                        </div>
                        <div
                            className={`col-span-3 text-right font-bold font-mono tabular-nums text-sm ${pnlColor}`}
                        >
                            {formatDashboardCurrency(t.pnl ?? 0, currency, {
                                signDisplay: "always",
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function ReportView({
    reports,
    total,
    type,
    currency = "USD",
}: ReportViewProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (reports.length === 0) {
        return (
            <div className="text-center py-16 bg-white dark:bg-[#1E2028] rounded-xl border-2 border-dashed border-dashboard mt-8">
                <div className="w-16 h-16 mb-6 mx-auto bg-gold/10 border border-gold/20 rounded-xl flex items-center justify-center">
                    <Calendar
                        size={28}
                        className="text-amber-600 dark:text-gold"
                        strokeWidth={1.75}
                    />
                </div>

                <h3 className="text-xl font-bold text-gray-700 dark:text-white mb-2">
                    {type === "weekly"
                        ? "No Weekly Reviews Yet"
                        : "No Monthly Reviews Yet"}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 px-6 max-w-sm mx-auto mb-2">
                    {type === "weekly"
                        ? "Log trades during the week, then generate a review to find one strength, one leak, and one next focus."
                        : "Generate a monthly review after you have trading data for the month."}
                </p>

                <EmptyStateCTAs />
            </div>
        );
    }

    const report = reports[currentIndex];
    if (!report) return null;

    const canPrev = currentIndex < reports.length - 1;
    const canNext = currentIndex > 0;

    return (
        <div className="space-y-4">
            {/* Period Navigator */}
            <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-dashboard px-5 py-4 shadow-sm hover:shadow-md transition-shadow duration-200 flex items-center justify-between">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentIndex((i) => i + 1)}
                    disabled={!canPrev}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-white"
                >
                    <ChevronLeft size={18} />
                    <span className="hidden sm:inline ml-1">Older</span>
                </Button>

                <div className="text-center">
                    <h2 className="text-base sm:text-lg font-black text-gray-800 dark:text-white">
                        {report.periodLabel}
                    </h2>
                    <p className="text-xs font-mono tabular-nums text-gray-500">
                        {new Date(report.periodStart).toLocaleDateString()} —{" "}
                        {new Date(report.periodEnd).toLocaleDateString()}
                    </p>
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentIndex((i) => i - 1)}
                    disabled={!canNext}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-white"
                >
                    <span className="hidden sm:inline mr-1">Newer</span>
                    <ChevronRight size={18} />
                </Button>
            </div>

            {/* Weekly Coach Plan checklist */}
            {report.coachPlan && <WeeklyCoachPlan plan={report.coachPlan} />}

            {/* Core Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    label="Net P/L"
                    value={formatDashboardCurrency(report.netPnL, currency, {
                        signDisplay: "always",
                    })}
                    icon={report.netPnL >= 0 ? TrendingUp : TrendingDown}
                    color={
                        report.netPnL >= 0 ? "text-emerald-500" : "text-red-500"
                    }
                    iconBg={
                        report.netPnL >= 0
                            ? "bg-emerald-500/10"
                            : "bg-red-500/10"
                    }
                    borderColor={
                        report.netPnL >= 0
                            ? "border-t-emerald-500"
                            : "border-t-red-500"
                    }
                    delta={report.netPnL}
                    previous={report.prevPnL}
                    currency={currency}
                />
                <StatCard
                    label="Win Rate"
                    value={`${report.winRate.toFixed(1)}%`}
                    icon={Target}
                    color={
                        report.winRate >= 50
                            ? "text-emerald-500"
                            : "text-amber-500"
                    }
                    iconBg={
                        report.winRate >= 50
                            ? "bg-emerald-500/10"
                            : "bg-amber-500/10"
                    }
                    borderColor={
                        report.winRate >= 50
                            ? "border-t-emerald-500"
                            : "border-t-amber-500"
                    }
                    delta={report.winRate}
                    previous={report.prevWinRate}
                    isPercent
                />
                <StatCard
                    label="Total Trades"
                    value={`${report.totalTrades}`}
                    icon={BarChart3}
                    color="text-amber-600 dark:text-gold"
                    iconBg="bg-gold/10"
                    borderColor="border-t-amber-500"
                />
                <StatCard
                    label="Profit Factor"
                    value={
                        !isFinite(report.profitFactor)
                            ? "∞"
                            : report.profitFactor.toFixed(2)
                    }
                    icon={TrendingUp}
                    color="text-amber-500"
                    iconBg="bg-amber-500/10"
                    borderColor="border-t-amber-500"
                />
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-dashboard p-5 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                        Avg Win
                    </p>
                    <p className="text-lg font-black font-mono tabular-nums text-emerald-500">
                        {formatDashboardCurrency(report.avgWin, currency, {
                            signDisplay: "always",
                        })}
                    </p>
                </div>
                <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-dashboard p-5 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                        Avg Loss
                    </p>
                    <p className="text-lg font-black font-mono tabular-nums text-red-500">
                        {formatDashboardCurrency(
                            -Math.abs(report.avgLoss),
                            currency,
                            { signDisplay: "always" }
                        )}
                    </p>
                </div>
                <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-dashboard p-5 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                        Largest Win
                    </p>
                    <p className="text-lg font-black font-mono tabular-nums text-emerald-500">
                        {formatDashboardCurrency(report.largestWin, currency, {
                            signDisplay: "always",
                        })}
                    </p>
                </div>
                <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-dashboard p-5 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                        Largest Loss
                    </p>
                    <p className="text-lg font-black font-mono tabular-nums text-red-500">
                        {formatDashboardCurrency(report.largestLoss, currency)}
                    </p>
                </div>
            </div>

            {/* Breakdowns + Psychology Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <BreakdownTable
                    data={report.bySymbol}
                    title="Performance by Symbol"
                    icon={BarChart3}
                    iconColor="bg-gold/10 text-amber-600 dark:text-gold"
                    currency={currency}
                />
                <BreakdownTable
                    data={report.byStrategy}
                    title="Performance by Strategy"
                    icon={Crosshair}
                    iconColor="bg-gold/10 text-amber-600 dark:text-gold"
                    currency={currency}
                />
                <BreakdownTable
                    data={report.bySession}
                    title="Performance by Session"
                    icon={Clock}
                    iconColor="bg-gold/10 text-amber-600 dark:text-gold"
                    currency={currency}
                />
                <BreakdownTable
                    data={report.byDirection}
                    title="Performance by Direction"
                    icon={Target}
                    iconColor="bg-emerald-500/10 text-emerald-500"
                    currency={currency}
                />
                <PsychologySection
                    confidence={report.avgConfidence}
                    compliance={report.planCompliance}
                    emotions={report.topEmotions}
                    mistakes={report.topMistakes}
                />
            </div>

            {/* Best/Worst Trades */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TradesList
                    trades={report.bestTrades}
                    title="Best Trades"
                    icon={TrendingUp}
                    iconColor="bg-emerald-500/10 text-emerald-500"
                    pnlColor="text-emerald-500"
                    currency={currency}
                />
                <TradesList
                    trades={report.worstTrades}
                    title="Worst Trades"
                    icon={TrendingDown}
                    iconColor="bg-red-500/10 text-red-500"
                    pnlColor="text-red-500"
                    currency={currency}
                />
            </div>
        </div>
    );
}
