"use client";

import { useState } from "react";
import {
    TrendingUp, TrendingDown, BarChart3, Target, Brain,
    AlertTriangle, Trophy, ChevronLeft, ChevronRight, Calendar, ArrowUpRight, ArrowDownRight, Minus
} from "lucide-react";
import { Button } from "@/components/ui/Button";

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

function StatCard({ label, value, icon: Icon, color, delta, previous, isPercent }: {
    label: string; value: string; icon: any; color: string; delta?: number; previous?: number | null; isPercent?: boolean;
}) {
    return (
        <div className="bg-white dark:bg-[#0B0E14] rounded-xl border border-gray-200 dark:border-white/10 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-lg ${color}`}>
                    <Icon size={14} />
                </div>
                <span className="text-xs font-medium text-gray-500">{label}</span>
            </div>
            <p className="text-xl font-black text-gray-800 dark:text-white">{value}</p>
            {previous !== undefined && (
                <div className="mt-1">
                    <DeltaBadge current={delta ?? 0} previous={previous} isPercent={isPercent} />
                    <span className="text-[10px] text-gray-400 ml-1">vs prev</span>
                </div>
            )}
        </div>
    );
}

function BreakdownTable({ data, title }: { data: any[] | null; title: string }) {
    if (!data || data.length === 0) return null;

    return (
        <div className="bg-white dark:bg-[#0B0E14] rounded-xl border border-gray-200 dark:border-white/10 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-700 dark:text-white mb-3">{title}</h3>
            <div className="space-y-2">
                {data.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-white/5 last:border-0">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-mono bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded">{i + 1}</span>
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                            <span className="text-gray-500">{item.trades} trades</span>
                            <span className="text-gray-500">{item.winRate?.toFixed(0)}% WR</span>
                            <span className={`font-bold ${item.pnl >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                                {item.pnl >= 0 ? "+" : ""}${item.pnl?.toFixed(2)}
                            </span>
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
        <div className="bg-white dark:bg-[#0B0E14] rounded-xl border border-gray-200 dark:border-white/10 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500"><Brain size={16} /></div>
                <h3 className="text-sm font-bold text-gray-700 dark:text-white">Psychology & Discipline</h3>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                {confidence !== null && (
                    <div>
                        <p className="text-xs text-gray-500 mb-1">Avg Confidence</p>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${(confidence / 5) * 100}%` }} />
                            </div>
                            <span className="text-sm font-bold text-gray-700 dark:text-white">{confidence.toFixed(1)}/5</span>
                        </div>
                    </div>
                )}
                {compliance !== null && (
                    <div>
                        <p className="text-xs text-gray-500 mb-1">Plan Compliance</p>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all ${compliance >= 70 ? "bg-emerald-500" : compliance >= 40 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${compliance}%` }} />
                            </div>
                            <span className="text-sm font-bold text-gray-700 dark:text-white">{compliance.toFixed(0)}%</span>
                        </div>
                    </div>
                )}
            </div>

            {emotions && emotions.length > 0 && (
                <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">Top Emotions</p>
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
                    <p className="text-xs text-gray-500 mb-2">Top Mistakes</p>
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
    );
}

function TradesList({ trades, title, color }: { trades: any[] | null; title: string; color: string }) {
    if (!trades || trades.length === 0) return null;

    return (
        <div className="bg-white dark:bg-[#0B0E14] rounded-xl border border-gray-200 dark:border-white/10 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
                <div className={`p-1.5 rounded-lg ${color}`}><Trophy size={14} /></div>
                <h3 className="text-sm font-bold text-gray-700 dark:text-white">{title}</h3>
            </div>
            <div className="space-y-2">
                {trades.map((t: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-white/5 last:border-0">
                        <div>
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t.symbol}</span>
                            {t.date && <span className="text-xs text-gray-400 ml-2">{new Date(t.date).toLocaleDateString()}</span>}
                        </div>
                        <span className={`text-sm font-bold ${t.pnl >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                            {t.pnl >= 0 ? "+" : ""}${t.pnl?.toFixed(2)}
                        </span>
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
            <div className="bg-white dark:bg-[#0B0E14] rounded-xl border border-gray-200 dark:border-white/10 p-12 text-center shadow-sm">
                <div className="p-4 bg-gray-100 dark:bg-white/5 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Calendar size={28} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-700 dark:text-white mb-2">No Reports Yet</h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto">
                    {type === "weekly"
                        ? "Your first weekly report will be generated on Sunday. Keep trading and logging your entries!"
                        : "Your first monthly report will be generated on the 1st of next month. Stay consistent!"}
                </p>
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
            <div className="bg-white dark:bg-[#0B0E14] rounded-xl border border-gray-200 dark:border-white/10 px-5 py-3 shadow-sm flex items-center justify-between">
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
                    <h2 className="text-lg font-black text-gray-800 dark:text-white">{report.periodLabel}</h2>
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

            {/* Core Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                    label="Net P/L"
                    value={`${report.netPnL >= 0 ? "+" : ""}$${report.netPnL.toFixed(2)}`}
                    icon={report.netPnL >= 0 ? TrendingUp : TrendingDown}
                    color={report.netPnL >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}
                    delta={report.netPnL}
                    previous={report.prevPnL}
                />
                <StatCard
                    label="Win Rate"
                    value={`${report.winRate.toFixed(1)}%`}
                    icon={Target}
                    color="bg-blue-500/10 text-blue-500"
                    delta={report.winRate}
                    previous={report.prevWinRate}
                    isPercent
                />
                <StatCard
                    label="Total Trades"
                    value={`${report.totalTrades}`}
                    icon={BarChart3}
                    color="bg-purple-500/10 text-purple-500"
                />
                <StatCard
                    label="Profit Factor"
                    value={report.profitFactor >= 999 ? "∞" : report.profitFactor.toFixed(2)}
                    icon={TrendingUp}
                    color="bg-amber-500/10 text-amber-500"
                />
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-[#0B0E14] rounded-xl border border-gray-200 dark:border-white/10 p-4 shadow-sm">
                    <p className="text-xs text-gray-500 mb-1">Avg Win</p>
                    <p className="text-sm font-bold text-emerald-500">+${report.avgWin.toFixed(2)}</p>
                </div>
                <div className="bg-white dark:bg-[#0B0E14] rounded-xl border border-gray-200 dark:border-white/10 p-4 shadow-sm">
                    <p className="text-xs text-gray-500 mb-1">Avg Loss</p>
                    <p className="text-sm font-bold text-red-500">-${report.avgLoss.toFixed(2)}</p>
                </div>
                <div className="bg-white dark:bg-[#0B0E14] rounded-xl border border-gray-200 dark:border-white/10 p-4 shadow-sm">
                    <p className="text-xs text-gray-500 mb-1">Largest Win</p>
                    <p className="text-sm font-bold text-emerald-500">+${report.largestWin.toFixed(2)}</p>
                </div>
                <div className="bg-white dark:bg-[#0B0E14] rounded-xl border border-gray-200 dark:border-white/10 p-4 shadow-sm">
                    <p className="text-xs text-gray-500 mb-1">Largest Loss</p>
                    <p className="text-sm font-bold text-red-500">${report.largestLoss.toFixed(2)}</p>
                </div>
            </div>

            {/* Breakdowns + Psychology Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <BreakdownTable data={report.bySymbol} title="📊 Performance by Symbol" />
                <BreakdownTable data={report.byStrategy} title="🎯 Performance by Strategy" />
                <BreakdownTable data={report.bySession} title="🕐 Performance by Session" />
                <PsychologySection
                    confidence={report.avgConfidence}
                    compliance={report.planCompliance}
                    emotions={report.topEmotions}
                    mistakes={report.topMistakes}
                />
            </div>

            {/* Best/Worst Trades */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TradesList trades={report.bestTrades} title="Best Trades" color="bg-emerald-500/10 text-emerald-500" />
                <TradesList trades={report.worstTrades} title="Worst Trades" color="bg-red-500/10 text-red-500" />
            </div>
        </div>
    );
}
