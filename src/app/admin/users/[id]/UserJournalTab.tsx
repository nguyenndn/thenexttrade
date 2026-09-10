"use client";

import { useState, useMemo } from "react";
import {
    LineChart,
    Search,
    TrendingUp,
    TrendingDown,
    Calendar,
    Tag,
    ShieldAlert,
    ExternalLink,
    FileText,
    Eye,
    X,
    CheckCircle2,
    XCircle,
    SlidersHorizontal,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/Button";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { cn } from "@/lib/utils";

interface JournalEntryItem {
    id: string;
    symbol: string;
    type: "BUY" | "SELL";
    entryPrice: number;
    exitPrice: number | null;
    stopLoss: number | null;
    takeProfit: number | null;
    lotSize: number;
    pnl: number | null;
    status: string;
    entryDate: Date | string;
    exitDate: Date | string | null;
    notes: string | null;
    images: string[];
    result: string | null;
    strategy: string | null;
    confidenceLevel: number | null;
    emotionBefore: string | null;
    emotionAfter: string | null;
    notesPsychology: string | null;
    mistakes: unknown;
    account: { id: string; name: string | null; broker: string | null } | null;
    tradePlan: { id: string; setupName: string | null; status: string } | null;
    ruleChecks?: Array<{
        id: string;
        status: string;
        tradingRule: { title: string };
    }>;
}

interface UserJournalTabProps {
    entries: JournalEntryItem[];
    totalCount: number;
}

export function UserJournalTab({ entries, totalCount }: UserJournalTabProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [resultFilter, setResultFilter] = useState<string>("ALL");
    const [typeFilter, setTypeFilter] = useState<string>("ALL");
    const [selectedEntry, setSelectedEntry] = useState<JournalEntryItem | null>(null);

    // Compute stats
    const stats = useMemo(() => {
        let wins = 0;
        let losses = 0;
        let totalPnl = 0;
        let grossProfit = 0;
        let grossLoss = 0;
        let buys = 0;
        let sells = 0;

        entries.forEach((e) => {
            const p = e.pnl || 0;
            totalPnl += p;
            if (p > 0 || e.result === "WIN") {
                wins++;
                grossProfit += p;
            } else if (p < 0 || e.result === "LOSS") {
                losses++;
                grossLoss += Math.abs(p);
            }
            if (e.type === "BUY") buys++;
            if (e.type === "SELL") sells++;
        });

        const totalTrades = entries.length;
        const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
        const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99 : 0;

        return {
            totalTrades,
            wins,
            losses,
            totalPnl,
            winRate,
            profitFactor,
            buys,
            sells,
        };
    }, [entries]);

    // Filter entries
    const filteredEntries = useMemo(() => {
        return entries.filter((entry) => {
            const q = searchQuery.toLowerCase().trim();
            const matchesQuery =
                !q ||
                entry.symbol.toLowerCase().includes(q) ||
                (entry.notes && entry.notes.toLowerCase().includes(q)) ||
                (entry.strategy && entry.strategy.toLowerCase().includes(q)) ||
                (entry.account?.name && entry.account.name.toLowerCase().includes(q));

            const matchesResult =
                resultFilter === "ALL" ||
                (resultFilter === "WIN" && ((entry.pnl && entry.pnl > 0) || entry.result === "WIN")) ||
                (resultFilter === "LOSS" && ((entry.pnl && entry.pnl < 0) || entry.result === "LOSS")) ||
                (resultFilter === "BE" && (entry.pnl === 0 || entry.result === "BE"));

            const matchesType = typeFilter === "ALL" || entry.type === typeFilter;

            return matchesQuery && matchesResult && matchesType;
        });
    }, [entries, searchQuery, resultFilter, typeFilter]);

    return (
        <div className="space-y-6">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 shadow-sm">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                        Total Trades
                    </p>
                    <p className="text-xl font-black text-gray-900 dark:text-white mt-1">
                        {totalCount}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        Showing {entries.length} recent
                    </p>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 shadow-sm">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                        Win Rate
                    </p>
                    <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                        {stats.winRate.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        {stats.wins}W - {stats.losses}L
                    </p>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 shadow-sm">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                        Net P&L
                    </p>
                    <p
                        className={cn(
                            "text-xl font-black mt-1",
                            stats.totalPnl >= 0
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-rose-600 dark:text-rose-400"
                        )}
                    >
                        {stats.totalPnl >= 0 ? "+" : ""}${stats.totalPnl.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        PF: {stats.profitFactor.toFixed(2)}
                    </p>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 shadow-sm">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                        Direction Bias
                    </p>
                    <p className="text-xl font-black text-gray-900 dark:text-white mt-1">
                        {stats.buys} Long / {stats.sells} Short
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        {stats.totalTrades > 0
                            ? `${Math.round((stats.buys / stats.totalTrades) * 100)}% Long`
                            : "No trades"}
                    </p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
                <div className="w-full md:max-w-xs">
                    <PremiumInput
                        icon={Search}
                        placeholder="Search symbol, notes, strategy..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
                    {/* Result Filter */}
                    <div className="flex rounded-lg border border-gray-200 dark:border-white/10 p-0.5 bg-gray-50 dark:bg-white/[0.03]">
                        {["ALL", "WIN", "LOSS"].map((res) => (
                            <button
                                key={res}
                                type="button"
                                onClick={() => setResultFilter(res)}
                                className={cn(
                                    "px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer",
                                    resultFilter === res
                                        ? "bg-white dark:bg-white/10 text-primary shadow-sm"
                                        : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                                )}
                            >
                                {res === "ALL" ? "All Results" : res === "WIN" ? "Wins" : "Losses"}
                            </button>
                        ))}
                    </div>

                    {/* Type Filter */}
                    <div className="flex rounded-lg border border-gray-200 dark:border-white/10 p-0.5 bg-gray-50 dark:bg-white/[0.03]">
                        {["ALL", "BUY", "SELL"].map((t) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setTypeFilter(t)}
                                className={cn(
                                    "px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer",
                                    typeFilter === t
                                        ? "bg-white dark:bg-white/10 text-primary shadow-sm"
                                        : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                                )}
                            >
                                {t === "ALL" ? "All Sides" : t}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Entries Table */}
            <div className="bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-gray-50/70 dark:bg-white/[0.02] border-b border-gray-200 dark:border-white/10 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                            <tr>
                                <th className="py-3.5 px-4">Trade</th>
                                <th className="py-3.5 px-4">Account</th>
                                <th className="py-3.5 px-4">Entry / Exit</th>
                                <th className="py-3.5 px-4">Lot Size</th>
                                <th className="py-3.5 px-4">Net P&L</th>
                                <th className="py-3.5 px-4">Strategy & Plan</th>
                                <th className="py-3.5 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {filteredEntries.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-gray-400">
                                        <FileText size={36} className="mx-auto mb-2 opacity-40" />
                                        <p className="font-semibold">No journal entries found</p>
                                        <p className="text-[11px] mt-0.5">
                                            {searchQuery || resultFilter !== "ALL" || typeFilter !== "ALL"
                                                ? "Try clearing filters to see all entries."
                                                : "This trader has not logged any trades yet."}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredEntries.map((entry) => {
                                    const isProfit = (entry.pnl || 0) > 0 || entry.result === "WIN";
                                    const isLoss = (entry.pnl || 0) < 0 || entry.result === "LOSS";

                                    return (
                                        <tr
                                            key={entry.id}
                                            className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
                                        >
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={cn(
                                                            "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider",
                                                            entry.type === "BUY"
                                                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                                        )}
                                                    >
                                                        {entry.type}
                                                    </span>
                                                    <span className="font-bold text-gray-900 dark:text-white">
                                                        {entry.symbol}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-gray-400 mt-0.5">
                                                    {format(new Date(entry.entryDate), "MMM d, HH:mm")}
                                                </p>
                                            </td>

                                            <td className="py-3 px-4">
                                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                                    {entry.account?.name || "Manual Log"}
                                                </span>
                                                {entry.account?.broker && (
                                                    <p className="text-[10px] text-gray-400">
                                                        {entry.account.broker}
                                                    </p>
                                                )}
                                            </td>

                                            <td className="py-3 px-4 font-mono text-[11px]">
                                                <div>
                                                    <span className="text-gray-500">In:</span> {entry.entryPrice}
                                                </div>
                                                {entry.exitPrice && (
                                                    <div>
                                                        <span className="text-gray-500">Out:</span> {entry.exitPrice}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="py-3 px-4 font-mono font-medium text-gray-700 dark:text-gray-300">
                                                {entry.lotSize} lots
                                            </td>

                                            <td className="py-3 px-4">
                                                <span
                                                    className={cn(
                                                        "font-bold font-mono text-sm",
                                                        isProfit
                                                            ? "text-emerald-600 dark:text-emerald-400"
                                                            : isLoss
                                                              ? "text-rose-600 dark:text-rose-400"
                                                              : "text-gray-500"
                                                    )}
                                                >
                                                    {entry.pnl !== null && entry.pnl !== undefined
                                                        ? `${entry.pnl >= 0 ? "+" : ""}$${entry.pnl.toFixed(2)}`
                                                        : "Open / N/A"}
                                                </span>
                                            </td>

                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    {entry.strategy && (
                                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary/10 text-primary">
                                                            {entry.strategy}
                                                        </span>
                                                    )}
                                                    {entry.tradePlan && (
                                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                                            Plan: {entry.tradePlan.setupName || "Linked"}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="py-3 px-4 text-right">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setSelectedEntry(entry)}
                                                    className="h-7 px-2.5 text-xs font-semibold gap-1"
                                                >
                                                    <Eye size={13} />
                                                    Inspect
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Trade Details Inspection Modal */}
            {selectedEntry && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in-0">
                    <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-white/10">
                            <div className="flex items-center gap-2.5">
                                <span
                                    className={cn(
                                        "px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider",
                                        selectedEntry.type === "BUY"
                                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                    )}
                                >
                                    {selectedEntry.type}
                                </span>
                                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                    {selectedEntry.symbol} Trade Telemetry
                                </h3>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedEntry(null)}
                                className="w-8 h-8 rounded-full"
                            >
                                <X size={16} />
                            </Button>
                        </div>

                        {/* 2x2 Matrix Card */}
                        <div className="grid grid-cols-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] divide-x divide-y divide-gray-200 dark:divide-white/10">
                            <div className="p-3">
                                <span className="text-[10px] font-bold uppercase text-gray-400">Entry Price</span>
                                <p className="font-mono text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                                    {selectedEntry.entryPrice}
                                </p>
                            </div>
                            <div className="p-3">
                                <span className="text-[10px] font-bold uppercase text-gray-400">Exit Price</span>
                                <p className="font-mono text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                                    {selectedEntry.exitPrice ?? "In Market"}
                                </p>
                            </div>
                            <div className="p-3">
                                <span className="text-[10px] font-bold uppercase text-gray-400">Volume</span>
                                <p className="font-mono text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                                    {selectedEntry.lotSize} lots
                                </p>
                            </div>
                            <div className="p-3">
                                <span className="text-[10px] font-bold uppercase text-gray-400">Net P&L</span>
                                <p
                                    className={cn(
                                        "font-mono text-sm font-bold mt-0.5",
                                        (selectedEntry.pnl || 0) >= 0
                                            ? "text-emerald-600 dark:text-emerald-400"
                                            : "text-rose-600 dark:text-rose-400"
                                    )}
                                >
                                    ${(selectedEntry.pnl ?? 0).toFixed(2)}
                                </p>
                            </div>
                        </div>

                        {/* Timing */}
                        <div className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
                            <p>
                                <strong>Opened:</strong>{" "}
                                {format(new Date(selectedEntry.entryDate), "MMM d, yyyy HH:mm:ss")}
                            </p>
                            {selectedEntry.exitDate && (
                                <p>
                                    <strong>Closed:</strong>{" "}
                                    {format(new Date(selectedEntry.exitDate), "MMM d, yyyy HH:mm:ss")}
                                </p>
                            )}
                            <p>
                                <strong>Account:</strong> {selectedEntry.account?.name || "Manual"}
                            </p>
                        </div>

                        {/* Trader Notes */}
                        {selectedEntry.notes && (
                            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 space-y-1">
                                <span className="text-[10px] font-bold uppercase text-gray-400">Trader Notes</span>
                                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                    {selectedEntry.notes}
                                </p>
                            </div>
                        )}

                        {/* Psychology & Emotions */}
                        {(selectedEntry.emotionBefore || selectedEntry.emotionAfter || selectedEntry.notesPsychology) && (
                            <div className="p-3.5 rounded-xl bg-purple-50/50 dark:bg-purple-500/5 border border-purple-200/50 dark:border-purple-500/10 space-y-1">
                                <span className="text-[10px] font-bold uppercase text-purple-600 dark:text-purple-400">
                                    Psychology & Emotions
                                </span>
                                <div className="text-xs space-y-1 text-gray-700 dark:text-gray-300">
                                    {selectedEntry.emotionBefore && (
                                        <p>
                                            <strong>Before Entry:</strong> {selectedEntry.emotionBefore}
                                        </p>
                                    )}
                                    {selectedEntry.emotionAfter && (
                                        <p>
                                            <strong>After Exit:</strong> {selectedEntry.emotionAfter}
                                        </p>
                                    )}
                                    {selectedEntry.notesPsychology && (
                                        <p className="mt-1 whitespace-pre-wrap">{selectedEntry.notesPsychology}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Attached Images */}
                        {selectedEntry.images && selectedEntry.images.length > 0 && (
                            <div className="space-y-2">
                                <span className="text-[10px] font-bold uppercase text-gray-400">
                                    Trade Charts ({selectedEntry.images.length})
                                </span>
                                <div className="grid grid-cols-2 gap-2">
                                    {selectedEntry.images.map((img, i) => (
                                        <a
                                            key={i}
                                            href={img}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block rounded-lg overflow-hidden border border-gray-200 dark:border-white/10 hover:opacity-90"
                                        >
                                            <img
                                                src={img}
                                                alt={`Chart ${i + 1}`}
                                                className="w-full h-28 object-cover"
                                            />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="pt-2 flex justify-end">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedEntry(null)}
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
