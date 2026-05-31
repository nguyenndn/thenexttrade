"use client";

import { useState } from "react";
import {
    TrendingUp, TrendingDown, BarChart3, Target, Brain,
    ChevronLeft, ChevronRight, Calendar,
    ArrowUpRight, ArrowDownRight, Minus, Crosshair, Clock
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { WeeklyCoachPlan } from "@/components/coach/WeeklyCoachPlan";
import { EmptyStateCTAs } from "@/components/ui/EmptyStateCTAs";

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
}

function DeltaBadge({ current, previous, suffix = "", isPercent = false }: { current: number; previous: number | null; suffix?: string; isPercent?: boolean }) {
    if (previous === null || previous === undefined) return <span className="text-xs text-gray-400">—</span>;
    const delta = current - previous;
    const isPositive = delta > 0;
    const isZero = delta === 0;

    return (
        <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${isPositive ? "text-emerald-500" : isZero ? "text-gray-400" : "text-red-500"}`}>
            {isPositive ? <ArrowUpRight size={12} /> : isZero ? <Minus size={12} /> : <ArrowDownRight size={12} />}
            {isPercent ? `${Math.abs(delta).toFixed(1)}%` : `$${Math.abs(delta).toFixed(0)}`}{suffix}
        </span>
    );
}

function StatCard({ label, value, icon: Icon, color, iconBg, delta, previous, isPercent, borderColor }: {
    label: string; value: string; icon: any; color: string; iconBg: string; delta?: number; previous?: number | null; isPercent?: boolean; borderColor?: string;
}) {
    return (
        <div className={`bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 p-5 shadow-sm hover:shadow-md transition-shadow duration-200 border-t-4 ${borderColor || "border-t-transparent"}`}>
            <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${iconBg}`}>
                    <Icon size={18} className={color} />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{label}</span>
            </div>
            <p className="text-2xl font-black text-gray-800 dark:text-white">{value}</p>
            {previous !== undefined && (
                <div className="mt-1.5 flex items-center gap-1.5">
                    <DeltaBadge current={delta ?? 0} previous={previous} isPercent={isPercent} />
                    <span className="text-xs text-gray-400 dark:text-gray-500">vs prev</span>
                </div>
            )}
        </div>
    );
}

function BreakdownTable({ data, title, icon: Icon, iconColor }: { data: any[] | null; title: string; icon: any; iconColor: string }) {
    if (!data || data.length === 0) return null;

    return (
        <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-200 dark:border-white/10 flex items-center gap-2.5">
                <div className={`p-2 ${iconColor} rounded-lg`}>
                    <Icon size={18} />
                </div>
                <h3 className="text-sm font-bold text-gray-700 dark:text-white">{title}</h3>
            </div>

            {/* Table header */}
            <div className="grid grid-cols-12 gap-2 px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-white/[0.02]">
                <div className="col-span-5">Name</div>
                <div className="col-span-2 text-right">Trades</div>
                <div className="col-span-2 text-right">Win Rate</div>
                <div className="col-span-3 text-right">P&L</div>
            </div>

            {/* Rows */}
            <div>
                {data.map((item, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center px-5 h-[52px] hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors border-b border-gray-50 dark:border-white/5 last:border-0">
                        <div className="col-span-5 flex items-center gap-2 min-w-0">
                            <span className="text-xs font-mono bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded shrink-0">{i + 1}</span>
                            <span className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{item.name}</span>
                        </div>
                        <div className="col-span-2 text-right text-xs text-gray-500 font-medium">{item.trades}</div>
                        <div className="col-span-2 text-right text-xs text-gray-500 font-medium">{item.winRate?.toFixed(0)}%</div>
                        <div className={`col-span-3 text-right font-bold text-sm ${item.pnl >= 0 ? "text-primary" : "text-red-500"}`}>
                            {item.pnl >= 0 ? "+" : ""}${item.pnl?.toFixed(2)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function PsychologySection({ confidence, compliance, emotions, mistakes }: {
    confidence: number | null; compliance: number | null; emotions: any[] | null; mistakes: any[] | null;
}) {
    const hasData = confidence !== null || compliance !== null || (emotions && emotions.length > 0) || (mistakes && mistakes.length > 0);
    if (!hasData) return null;

    return (
        <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-200 dark:border-white/10 flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500"><Brain size={18} /></div>
                <div>
                    <h3 className="text-sm font-bold text-gray-700 dark:text-white">Psychology & Discipline</h3>
                    <p className="text-xs text-gray-500">Mindset & emotional tracking</p>
                </div>
            </div>

            <div className="p-5">
                <div className="grid grid-cols-2 gap-4 mb-4">
                    {confidence !== null && (
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Avg Confidence</p>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-2.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${(confidence / 5) * 100}%` }} />
                                </div>
                                <span className="text-sm font-bold text-gray-700 dark:text-white">{confidence.toFixed(1)}/5</span>
                            </div>
                        </div>
                    )}
                    {compliance !== null && (
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Plan Compliance</p>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-2.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all ${compliance >= 70 ? "bg-emerald-500" : compliance >= 40 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${compliance}%` }} />
                                </div>
                                <span className="text-sm font-bold text-gray-700 dark:text-white">{compliance.toFixed(0)}%</span>
                            </div>
                        </div>
                    )}
                </div>

                {emotions && emotions.length > 0 && (
                    <div className="mb-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Top Emotions</p>
                        <div className="flex flex-wrap gap-1.5">
                            {emotions.map((e: any, i: number) => (
                                <span key={i} className="px-2.5 py-1 bg-gray-100 dark:bg-white/5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300">
                                    {e.emotion} <span className="text-gray-400">×{e.count}</span>
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {mistakes && mistakes.length > 0 && (
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Top Mistakes</p>
                        <div className="space-y-1.5">
                            {mistakes.map((m: any, i: number) => (
                                <div key={i} className="flex items-center justify-between py-1.5">
                                    <span className="text-sm text-gray-600 dark:text-gray-300">{m.name}</span>
                                    <span className="text-xs font-bold bg-red-50 dark:bg-red-500/10 text-red-500 px-2 py-0.5 rounded">{m.count}×</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function TradesList({ trades, title, icon: Icon, iconColor, pnlColor }: { trades: any[] | null; title: string; icon: any; iconColor: string; pnlColor: string }) {
    if (!trades || trades.length === 0) return null;

    return (
        <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-200 dark:border-white/10 flex items-center gap-2.5">
                <div className={`p-2 rounded-lg ${iconColor}`}><Icon size={18} /></div>
                <h3 className="text-sm font-bold text-gray-700 dark:text-white">{title}</h3>
            </div>

            {/* Table header */}
            <div className="grid grid-cols-12 gap-2 px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-white/[0.02]">
                <div className="col-span-5">Symbol</div>
                <div className="col-span-4 text-center">Date</div>
                <div className="col-span-3 text-right">P&L</div>
            </div>

            {/* Rows */}
            <div>
                {trades.map((t: any, i: number) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center px-5 h-[52px] hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors border-b border-gray-50 dark:border-white/5 last:border-0">
                        <div className="col-span-5">
                            <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{t.symbol}</span>
                        </div>
                        <div className="col-span-4 text-center text-xs text-gray-500 font-medium">
                            {t.date ? new Date(t.date).toLocaleDateString() : ""}
                        </div>
                        <div className={`col-span-3 text-right font-bold text-sm ${pnlColor}`}>
                            {t.pnl >= 0 ? "+" : ""}${t.pnl?.toFixed(2)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}



export function ReportView({ reports, total, type }: ReportViewProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (reports.length === 0) {
        return (
            <div className="text-center py-16 bg-white dark:bg-[#1E2028] rounded-xl border-2 border-dashed border-gray-200 dark:border-white/10 mt-8">
                {/* Animated Calendar Icon */}
                <div className="relative w-20 h-20 mb-6 mx-auto">
                    <div className="absolute inset-0 rounded-full bg-blue-500/10 dark:bg-blue-500/5 animate-[report-ping_3s_cubic-bezier(0,0,0.2,1)_infinite]" />
                    <div className="relative w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center animate-[report-float_3s_ease-in-out_infinite]">
                        <Calendar size={32} className="text-gray-500 dark:text-gray-300" strokeWidth={1.5} />
                        {/* Sparkle dots */}
                        <div className="absolute -top-2 left-3 w-1.5 h-1.5 rounded-full bg-blue-400/40 animate-[report-sparkle_2.5s_ease-in-out_infinite_1.2s]" />
                        <div className="absolute -bottom-1 -right-1 w-1 h-1 rounded-full bg-blue-400/30 animate-[report-sparkle_3s_ease-in-out_infinite_0.8s]" />
                        <div className="absolute top-0 -right-2 w-1 h-1 rounded-full bg-blue-400/25 animate-[report-sparkle_2s_ease-in-out_infinite_1.5s]" />
                    </div>
                </div>

                <h3 className="text-xl font-bold text-gray-700 dark:text-white mb-2">
                    {type === "weekly" ? "No Weekly Reviews Yet" : "No Monthly Reviews Yet"}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 px-6 max-w-sm mx-auto mb-2">
                    {type === "weekly"
                        ? "Log trades during the week, then generate a review to find one strength, one leak, and one next focus."
                        : "Generate a monthly review after you have trading data for the month."}
                </p>

                <EmptyStateCTAs />

                <style jsx>{`
                    @keyframes report-float {
                        0%, 100% { transform: translateY(0px); }
                        50% { transform: translateY(-6px); }
                    }
                    @keyframes report-ping {
                        0% { transform: scale(1); opacity: 0.3; }
                        75%, 100% { transform: scale(1.3); opacity: 0; }
                    }
                    @keyframes report-sparkle {
                        0%, 100% { opacity: 0; transform: scale(0); }
                        50% { opacity: 1; transform: scale(1); }
                    }
                `}</style>
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
            <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 px-5 py-4 shadow-sm hover:shadow-md transition-shadow duration-200 flex items-center justify-between">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentIndex(i => i + 1)}
                    disabled={!canPrev}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-white"
                >
                    <ChevronLeft size={18} />
                    <span className="hidden sm:inline ml-1">Older</span>
                </Button>

                <div className="text-center">
                    <h2 className="text-base sm:text-lg font-black text-gray-800 dark:text-white">{report.periodLabel}</h2>
                    <p className="text-xs text-gray-500">
                        {new Date(report.periodStart).toLocaleDateString()} — {new Date(report.periodEnd).toLocaleDateString()}
                    </p>
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentIndex(i => i - 1)}
                    disabled={!canNext}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-white"
                >
                    <span className="hidden sm:inline mr-1">Newer</span>
                    <ChevronRight size={18} />
                </Button>
            </div>

            {/* Weekly Coach Plan checklist */}
            {report.coachPlan && (
                <WeeklyCoachPlan plan={report.coachPlan} />
            )}



            {/* Core Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    label="Net P/L"
                    value={`${report.netPnL >= 0 ? "+" : ""}$${report.netPnL.toFixed(2)}`}
                    icon={report.netPnL >= 0 ? TrendingUp : TrendingDown}
                    color={report.netPnL >= 0 ? "text-emerald-500" : "text-red-500"}
                    iconBg={report.netPnL >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"}
                    borderColor={report.netPnL >= 0 ? "border-t-emerald-500" : "border-t-red-500"}
                    delta={report.netPnL}
                    previous={report.prevPnL}
                />
                <StatCard
                    label="Win Rate"
                    value={`${report.winRate.toFixed(1)}%`}
                    icon={Target}
                    color="text-blue-500"
                    iconBg="bg-blue-500/10"
                    borderColor="border-t-blue-500"
                    delta={report.winRate}
                    previous={report.prevWinRate}
                    isPercent
                />
                <StatCard
                    label="Total Trades"
                    value={`${report.totalTrades}`}
                    icon={BarChart3}
                    color="text-purple-500"
                    iconBg="bg-purple-500/10"
                    borderColor="border-t-purple-500"
                />
                <StatCard
                    label="Profit Factor"
                    value={!isFinite(report.profitFactor) ? "∞" : report.profitFactor.toFixed(2)}
                    icon={TrendingUp}
                    color="text-amber-500"
                    iconBg="bg-amber-500/10"
                    borderColor="border-t-amber-500"
                />
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 p-5 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Avg Win</p>
                    <p className="text-lg font-black text-primary">+${report.avgWin.toFixed(2)}</p>
                </div>
                <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 p-5 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Avg Loss</p>
                    <p className="text-lg font-black text-red-500">-${report.avgLoss.toFixed(2)}</p>
                </div>
                <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 p-5 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Largest Win</p>
                    <p className="text-lg font-black text-primary">+${report.largestWin.toFixed(2)}</p>
                </div>
                <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 p-5 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Largest Loss</p>
                    <p className="text-lg font-black text-red-500">${report.largestLoss.toFixed(2)}</p>
                </div>
            </div>

            {/* Breakdowns + Psychology Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <BreakdownTable data={report.bySymbol} title="Performance by Symbol" icon={BarChart3} iconColor="bg-cyan-500/10 text-cyan-500" />
                <BreakdownTable data={report.byStrategy} title="Performance by Strategy" icon={Crosshair} iconColor="bg-primary/10 text-primary" />
                <BreakdownTable data={report.bySession} title="Performance by Session" icon={Clock} iconColor="bg-indigo-500/10 text-indigo-500" />
                <PsychologySection
                    confidence={report.avgConfidence}
                    compliance={report.planCompliance}
                    emotions={report.topEmotions}
                    mistakes={report.topMistakes}
                />
            </div>

            {/* Best/Worst Trades */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TradesList trades={report.bestTrades} title="Best Trades" icon={TrendingUp} iconColor="bg-emerald-500/10 text-emerald-500" pnlColor="text-primary" />
                <TradesList trades={report.worstTrades} title="Worst Trades" icon={TrendingDown} iconColor="bg-red-500/10 text-red-500" pnlColor="text-red-500" />
            </div>
        </div>
    );
}
