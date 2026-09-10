"use client";

import { useState, useMemo } from "react";
import {
    BarChart3,
    Calendar,
    FileText,
    TrendingUp,
    TrendingDown,
    Search,
    Eye,
    X,
    Lightbulb,
    CheckCircle2,
    Clock,
    Percent,
    SlidersHorizontal,
    Activity,
    Layers,
    DollarSign,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/Button";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { cn } from "@/lib/utils";

export interface TradingReportItem {
    id: string;
    type: string;
    periodStart: Date | string;
    periodEnd: Date | string;
    periodLabel: string;
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
    planCompliance: number | null;
    avgConfidence: number | null;
    bySymbol: unknown;
    byStrategy: unknown;
    bySession: unknown;
    byDirection: unknown;
    topEmotions: unknown;
    topMistakes: unknown;
    emailSent: boolean;
    createdAt: Date | string;
}

export interface TradingDayNoteItem {
    id: string;
    date: Date | string;
    note: string;
    createdAt: Date | string;
    updatedAt: Date | string;
}

export interface TraderInsightSnapshotItem {
    id: string;
    insightType: string;
    title: string;
    summary: string;
    evidence: unknown;
    sampleSize: number;
    confidence: string;
    periodStart: Date | string;
    periodEnd: Date | string;
    status: string;
    createdAt: Date | string;
}

interface UserReportsNotesTabProps {
    reports: TradingReportItem[];
    dayNotes: TradingDayNoteItem[];
    insights: TraderInsightSnapshotItem[];
}

export function UserReportsNotesTab({
    reports,
    dayNotes,
    insights,
}: UserReportsNotesTabProps) {
    const [activeSection, setActiveSection] = useState<"reports" | "notes" | "insights">("reports");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedReport, setSelectedReport] = useState<TradingReportItem | null>(null);
    const [selectedNote, setSelectedNote] = useState<TradingDayNoteItem | null>(null);

    // KPI Metrics
    const stats = useMemo(() => {
        const totalReports = reports.length;
        const totalPnL = reports.reduce((acc, r) => acc + (r.netPnL || 0), 0);
        const avgWinRate =
            totalReports > 0
                ? (reports.reduce((acc, r) => acc + (r.winRate || 0), 0) / totalReports).toFixed(1)
                : "0.0";
        const totalNotes = dayNotes.length;

        return {
            totalReports,
            totalPnL,
            avgWinRate,
            totalNotes,
            totalInsights: insights.length,
        };
    }, [reports, dayNotes, insights]);

    // Filtered lists
    const filteredReports = useMemo(() => {
        if (!searchQuery.trim()) return reports;
        const q = searchQuery.toLowerCase();
        return reports.filter(
            (r) => r.periodLabel.toLowerCase().includes(q) || r.type.toLowerCase().includes(q)
        );
    }, [reports, searchQuery]);

    const filteredNotes = useMemo(() => {
        if (!searchQuery.trim()) return dayNotes;
        const q = searchQuery.toLowerCase();
        return dayNotes.filter((n) => n.note.toLowerCase().includes(q));
    }, [dayNotes, searchQuery]);

    const filteredInsights = useMemo(() => {
        if (!searchQuery.trim()) return insights;
        const q = searchQuery.toLowerCase();
        return insights.filter(
            (i) =>
                i.title.toLowerCase().includes(q) ||
                i.summary.toLowerCase().includes(q) ||
                i.insightType.toLowerCase().includes(q)
        );
    }, [insights, searchQuery]);

    return (
        <div className="space-y-6">
            {/* Top KPI Cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#151925]">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        <BarChart3 size={14} className="text-primary" /> Generated Reports
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-gray-900 dark:text-white">
                            {stats.totalReports}
                        </span>
                        <span className="text-xs text-gray-500">weekly / monthly</span>
                    </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#151925]">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        <DollarSign size={14} className="text-emerald-500" /> Aggregate Reported P&L
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span
                            className={cn(
                                "text-2xl font-black",
                                stats.totalPnL >= 0
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-rose-600 dark:text-rose-400"
                            )}
                        >
                            {stats.totalPnL >= 0 ? "+" : ""}${stats.totalPnL.toFixed(2)}
                        </span>
                    </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#151925]">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        <Percent size={14} className="text-blue-500" /> Avg Reported Win Rate
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                            {stats.avgWinRate}%
                        </span>
                        <span className="text-xs text-gray-500">across cycles</span>
                    </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#151925]">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        <Calendar size={14} className="text-amber-500" /> Day Notes & Insights
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                            {stats.totalNotes + stats.totalInsights}
                        </span>
                        <span className="text-xs text-gray-500">{stats.totalNotes} notes · {stats.totalInsights} insights</span>
                    </div>
                </div>
            </div>

            {/* Sub-Section Navigation & Filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex rounded-xl border border-gray-200 bg-[#F1F3F5] p-1 dark:border-white/10 dark:bg-[#1A1D27] w-fit">
                    <button
                        type="button"
                        onClick={() => setActiveSection("reports")}
                        className={cn(
                            "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors",
                            activeSection === "reports"
                                ? "bg-white text-gray-900 shadow-sm dark:bg-[#252936] dark:text-white"
                                : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                        )}
                    >
                        <BarChart3 size={14} /> Performance Reports ({reports.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveSection("notes")}
                        className={cn(
                            "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors",
                            activeSection === "notes"
                                ? "bg-white text-gray-900 shadow-sm dark:bg-[#252936] dark:text-white"
                                : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                        )}
                    >
                        <Calendar size={14} /> Trading Day Notes ({dayNotes.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveSection("insights")}
                        className={cn(
                            "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors",
                            activeSection === "insights"
                                ? "bg-white text-gray-900 shadow-sm dark:bg-[#252936] dark:text-white"
                                : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                        )}
                    >
                        <Lightbulb size={14} /> Behavioral Insights ({insights.length})
                    </button>
                </div>

                <div className="w-full sm:w-64">
                    <PremiumInput
                        placeholder="Search reports or notes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        prefix={<Search size={14} className="text-gray-400" />}
                    />
                </div>
            </div>

            {/* Section 1: Performance Reports (GAP-8) */}
            {activeSection === "reports" && (
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#151925] overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <BarChart3 size={16} className="text-primary" /> Generated Performance Reports ({filteredReports.length})
                        </h3>
                        <span className="text-xs text-gray-500">Historical Cycles</span>
                    </div>

                    {filteredReports.length > 0 ? (
                        <div className="divide-y divide-gray-200 dark:divide-white/10">
                            {filteredReports.map((report) => (
                                <div
                                    key={report.id}
                                    className="p-4 sm:p-5 transition-colors hover:bg-gray-50/60 dark:hover:bg-white/[0.02]"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                                                    {report.periodLabel}
                                                </h4>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary uppercase">
                                                    {report.type}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {format(new Date(report.periodStart), "MMM d")} – {format(new Date(report.periodEnd), "MMM d, yyyy")}
                                                </span>
                                            </div>

                                            {/* 2x2 Matrix Card for Specs */}
                                            <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50/50 dark:border-white/10 dark:bg-[#1A1D27] divide-y divide-gray-200 dark:divide-white/10 text-xs sm:w-96">
                                                <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-white/10">
                                                    <div className="p-2.5">
                                                        <span className="block text-[10px] font-semibold text-gray-400 uppercase">Trades & Win Rate</span>
                                                        <span className="font-bold text-gray-800 dark:text-gray-200">
                                                            {report.totalTrades} trades · {report.winRate.toFixed(1)}% WR
                                                        </span>
                                                    </div>
                                                    <div className="p-2.5">
                                                        <span className="block text-[10px] font-semibold text-gray-400 uppercase">Net P&L</span>
                                                        <span
                                                            className={cn(
                                                                "font-bold",
                                                                report.netPnL >= 0
                                                                    ? "text-emerald-600 dark:text-emerald-400"
                                                                    : "text-rose-600 dark:text-rose-400"
                                                            )}
                                                        >
                                                            {report.netPnL >= 0 ? "+" : ""}${report.netPnL.toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-white/10">
                                                    <div className="p-2.5">
                                                        <span className="block text-[10px] font-semibold text-gray-400 uppercase">Profit Factor</span>
                                                        <span className="font-bold text-gray-800 dark:text-gray-200">
                                                            {report.profitFactor ? report.profitFactor.toFixed(2) : "—"}
                                                        </span>
                                                    </div>
                                                    <div className="p-2.5">
                                                        <span className="block text-[10px] font-semibold text-gray-400 uppercase">Plan Compliance</span>
                                                        <span className="font-bold text-blue-600 dark:text-blue-400">
                                                            {report.planCompliance !== null ? `${report.planCompliance.toFixed(0)}%` : "N/A"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                                            <span className="text-[11px] text-gray-400">
                                                Generated {format(new Date(report.createdAt), "MMM d, HH:mm")}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setSelectedReport(report)}
                                                className="rounded-xl gap-1.5 text-xs font-semibold"
                                            >
                                                <Eye size={14} /> Inspect Report
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center">
                            <p className="text-sm text-gray-500">No performance reports generated yet.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Section 2: Trading Day Notes (GAP-10) */}
            {activeSection === "notes" && (
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#151925] overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Calendar size={16} className="text-amber-500" /> Trading Day Notes & Reflection ({filteredNotes.length})
                        </h3>
                        <span className="text-xs text-gray-500">Trader Daily Journal</span>
                    </div>

                    {filteredNotes.length > 0 ? (
                        <div className="divide-y divide-gray-200 dark:divide-white/10">
                            {filteredNotes.map((dn) => (
                                <div
                                    key={dn.id}
                                    className="p-4 sm:p-5 transition-colors hover:bg-gray-50/60 dark:hover:bg-white/[0.02] flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3"
                                >
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                                                {format(new Date(dn.date), "EEEE, MMM d, yyyy")}
                                            </span>
                                            <span className="text-[11px] text-gray-400">
                                                Saved {formatDistanceToNow(new Date(dn.updatedAt), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-xs text-gray-800 dark:text-gray-200 whitespace-pre-line leading-relaxed">
                                            {dn.note}
                                        </p>
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSelectedNote(dn)}
                                        className="rounded-xl shrink-0 self-end sm:self-center gap-1.5 text-xs font-semibold"
                                    >
                                        <Eye size={14} /> View Note
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center">
                            <p className="text-sm text-gray-500">No day notes recorded by this user.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Section 3: Behavioral Insights (GAP-10) */}
            {activeSection === "insights" && (
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#151925] overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Lightbulb size={16} className="text-amber-500" /> Algorithmic Behavioral Insights ({filteredInsights.length})
                        </h3>
                        <span className="text-xs text-gray-500">Behavioral Leak Radar</span>
                    </div>

                    {filteredInsights.length > 0 ? (
                        <div className="divide-y divide-gray-200 dark:divide-white/10">
                            {filteredInsights.map((ins) => (
                                <div
                                    key={ins.id}
                                    className="p-4 sm:p-5 transition-colors hover:bg-gray-50/60 dark:hover:bg-white/[0.02] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs"
                                >
                                    <div className="flex items-start gap-3 min-w-0">
                                        <div className="p-2 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 shrink-0 mt-0.5">
                                            <Lightbulb size={18} />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                                                    {ins.title}
                                                </h4>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 uppercase">
                                                    {ins.insightType}
                                                </span>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 uppercase">
                                                    Confidence: {ins.confidence}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-gray-600 dark:text-gray-300 leading-relaxed">
                                                {ins.summary}
                                            </p>
                                            <div className="mt-1.5 text-[11px] text-gray-400">
                                                Evaluated over sample size of {ins.sampleSize} trades · {format(new Date(ins.createdAt), "MMM d, yyyy")}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center">
                            <p className="text-sm text-gray-500">No behavioral insight snapshots generated for this user.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Report Inspection Modal */}
            {selectedReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#151925]">
                        <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-white/10">
                            <div>
                                <h3 className="text-lg font-black text-gray-900 dark:text-white">
                                    {selectedReport.periodLabel}
                                </h3>
                                <p className="text-xs text-gray-500">
                                    Cycle: {format(new Date(selectedReport.periodStart), "PPP")} – {format(new Date(selectedReport.periodEnd), "PPP")}
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedReport(null)}
                                className="rounded-xl p-2"
                                aria-label="Close modal"
                            >
                                <X size={18} />
                            </Button>
                        </div>

                        <div className="mt-4 space-y-4 text-xs">
                            {/* 2x2 Matrix Card */}
                            <div className="rounded-xl border border-gray-200 dark:border-white/10 divide-y divide-gray-200 dark:divide-white/10 overflow-hidden">
                                <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-white/10 bg-gray-50/50 dark:bg-white/[0.02]">
                                    <div className="p-3">
                                        <span className="block text-[10px] font-bold text-gray-400 uppercase">Win / Loss Metrics</span>
                                        <div className="mt-1 space-y-1 font-semibold text-gray-800 dark:text-gray-200">
                                            <div>Win Rate: <span className="font-bold text-emerald-500">{selectedReport.winRate.toFixed(1)}%</span> ({selectedReport.winCount}W / {selectedReport.lossCount}L)</div>
                                            <div>Profit Factor: <span className="font-bold">{selectedReport.profitFactor?.toFixed(2) || "—"}</span></div>
                                            <div>Avg Win: <span className="text-emerald-500">${selectedReport.avgWin?.toFixed(2) || "0.00"}</span></div>
                                            <div>Avg Loss: <span className="text-rose-500">${selectedReport.avgLoss?.toFixed(2) || "0.00"}</span></div>
                                        </div>
                                    </div>
                                    <div className="p-3">
                                        <span className="block text-[10px] font-bold text-gray-400 uppercase">P&L & Extremes</span>
                                        <div className="mt-1 space-y-1 font-semibold text-gray-800 dark:text-gray-200">
                                            <div>Net P&L: <span className={cn("font-bold", selectedReport.netPnL >= 0 ? "text-emerald-500" : "text-rose-500")}>
                                                {selectedReport.netPnL >= 0 ? "+" : ""}${selectedReport.netPnL.toFixed(2)}
                                            </span></div>
                                            <div>Largest Win: <span className="text-emerald-500">${selectedReport.largestWin?.toFixed(2) || "0.00"}</span></div>
                                            <div>Largest Loss: <span className="text-rose-500">${selectedReport.largestLoss?.toFixed(2) || "0.00"}</span></div>
                                            <div>Plan Compliance: <span className="text-blue-500">{selectedReport.planCompliance ? `${selectedReport.planCompliance.toFixed(0)}%` : "N/A"}</span></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Top Mistakes & Emotions if available */}
                            {Boolean(selectedReport.topMistakes) && (
                                <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4 dark:border-rose-900/30 dark:bg-rose-950/20">
                                    <span className="font-bold text-rose-700 dark:text-rose-300 block">Top Behavioral Mistakes</span>
                                    <pre className="mt-1 text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-sans text-xs">
                                        {JSON.stringify(selectedReport.topMistakes, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end border-t border-gray-200 pt-4 dark:border-white/10">
                            <Button variant="outline" onClick={() => setSelectedReport(null)} className="rounded-xl">
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Note Full Modal */}
            {selectedNote && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#151925]">
                        <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-white/10">
                            <div>
                                <h3 className="text-lg font-black text-gray-900 dark:text-white">
                                    {format(new Date(selectedNote.date), "EEEE, MMMM d, yyyy")}
                                </h3>
                                <p className="text-xs text-gray-500">Day Note Inspection</p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedNote(null)}
                                className="rounded-xl p-2"
                                aria-label="Close modal"
                            >
                                <X size={18} />
                            </Button>
                        </div>

                        <div className="mt-4">
                            <p className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-line leading-relaxed bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/10">
                                {selectedNote.note}
                            </p>
                        </div>

                        <div className="mt-6 flex justify-end border-t border-gray-200 pt-4 dark:border-white/10">
                            <Button variant="outline" onClick={() => setSelectedNote(null)} className="rounded-xl">
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
