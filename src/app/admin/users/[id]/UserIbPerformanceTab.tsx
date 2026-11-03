"use client";

import { format } from "date-fns";
import {
    LineChart,
    Users,
    CheckCircle2,
    AlertCircle,
    Layers,
    FileSpreadsheet,
    Calendar,
} from "lucide-react";

interface UserIbPerformanceTabProps {
    user: {
        id: string;
        ibLeads: Array<{
            id: string;
            broker: string;
            affiliateUrl: string | null;
            source: string;
            utmSource: string | null;
            utmMedium: string | null;
            utmCampaign: string | null;
            clickedAt: string | Date;
            convertedAt: string | Date | null;
        }>;
        ibActivitySnapshots: Array<{
            id: string;
            broker: string | null;
            accountNumberMasked: string | null;
            periodStart: string | Date;
            periodEnd: string | Date;
            tradeCount: number;
            closedLotVolume: number;
            netPnl: number;
            activityStatus: string;
            lastTradeAt: string | Date | null;
        }>;
        tradingReports: Array<{
            id: string;
            type: string;
            periodStart: string | Date;
            periodEnd: string | Date;
            periodLabel: string;
            totalTrades: number;
            winCount: number;
            lossCount: number;
            winRate: number;
            netPnL: number;
        }>;
    };
}

export function UserIbPerformanceTab({ user }: UserIbPerformanceTabProps) {
    // Aggregate Stats
    const totalLeads = user.ibLeads.length;
    const convertedLeads = user.ibLeads.filter((l) => l.convertedAt).length;
    const conversionRate =
        totalLeads > 0
            ? ((convertedLeads / totalLeads) * 100).toFixed(1)
            : "0.0";

    const totalLots = user.ibActivitySnapshots.reduce(
        (acc, curr) => acc + curr.closedLotVolume,
        0
    );

    return (
        <div className="space-y-6">
            {/* Overview stats cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-5 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-gold/10 text-amber-600 dark:text-gold rounded-lg">
                        <Users size={22} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            Broker Link Activity
                        </p>
                        <h4 className="text-2xl font-black text-gray-700 dark:text-white mt-1 font-mono tabular-nums">
                            {convertedLeads}{" "}
                            <span className="text-xs font-bold text-gray-600">
                                / {totalLeads} clicks
                            </span>
                        </h4>
                        <p className="text-[11px] text-gray-600 mt-1">
                            <span className="font-bold text-amber-600 dark:text-gold font-mono tabular-nums">
                                {conversionRate}%
                            </span>{" "}
                            linked-account rate
                        </p>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-5 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-lg">
                        <Layers size={22} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            Recorded Broker Volume
                        </p>
                        <h4 className="text-2xl font-black text-gray-700 dark:text-white mt-1 font-mono tabular-nums">
                            {totalLots.toFixed(2)}{" "}
                            <span className="text-xs font-bold text-gray-600">
                                Lots
                            </span>
                        </h4>
                        <p className="text-[11px] text-gray-600 mt-1">
                            From stored broker activity snapshots
                        </p>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-5 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-gold/10 text-amber-600 dark:text-gold rounded-lg">
                        <FileSpreadsheet size={22} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            Generated Reports
                        </p>
                        <h4 className="text-2xl font-black text-gray-700 dark:text-white mt-1 font-mono tabular-nums">
                            {user.tradingReports.length}{" "}
                            <span className="text-xs font-bold text-gray-600">
                                Generated
                            </span>
                        </h4>
                        <p className="text-[11px] text-gray-600 mt-1">
                            Weekly and monthly intervals
                        </p>
                    </div>
                </div>
            </div>

            {/* Grid: 1. IB Leads & Snapshots (Left 2/3), 2. Reports (Right 1/3) */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* IB Leads & Activity */}
                <div className="xl:col-span-2 space-y-6">
                    {/* IB Leads table */}
                    <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
                        <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-white/10">
                            <h3 className="text-sm font-bold text-gray-700 dark:text-white flex items-center gap-2">
                                <Users size={16} className="text-amber-600 dark:text-gold" />{" "}
                                Broker Referral Journey
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Broker links opened by this user and whether an
                                account was linked
                            </p>
                        </div>

                        {user.ibLeads.length > 0 ? (
                            <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-[#151925] text-[10px] font-bold text-gray-500 uppercase tracking-wider sticky top-0 backdrop-blur-md">
                                            <th className="p-3 sm:px-5">
                                                Broker
                                            </th>
                                            <th className="p-3">
                                                Source & Campaign
                                            </th>
                                            <th className="p-3">Clicked At</th>
                                            <th className="p-3 text-right">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-white/10 text-xs">
                                        {user.ibLeads.map((lead) => (
                                            <tr
                                                key={lead.id}
                                                className="hover:bg-gray-50/20 dark:hover:bg-white/[0.01] transition-colors"
                                            >
                                                <td className="p-3 sm:px-5 font-bold text-gray-700 dark:text-white">
                                                    {lead.broker}
                                                    <p className="text-[10px] font-medium text-gray-500 mt-0.5">
                                                        Entry point: {lead.source}
                                                    </p>
                                                </td>
                                                <td className="p-3">
                                                    <p className="font-medium text-gray-700 dark:text-white truncate max-w-[180px]">
                                                        {lead.utmCampaign ||
                                                            "Organic"}
                                                    </p>
                                                    <p className="text-[10px] text-gray-500 mt-0.5 truncate max-w-[180px]">
                                                        {lead.utmSource
                                                            ? `src: ${lead.utmSource}`
                                                            : ""}{" "}
                                                        {lead.utmMedium
                                                            ? `/ medium: ${lead.utmMedium}`
                                                            : ""}
                                                    </p>
                                                </td>
                                                <td className="p-3 text-gray-600 font-mono tabular-nums">
                                                    {format(
                                                        new Date(
                                                            lead.clickedAt
                                                        ),
                                                        "MMM d, yyyy / HH:mm"
                                                    )}
                                                </td>
                                                <td className="p-3 text-right">
                                                    {lead.convertedAt ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 font-bold">
                                                            <CheckCircle2
                                                                size={10}
                                                            />{" "}
                                                            Converted
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400 font-bold">
                                                            <AlertCircle
                                                                size={10}
                                                            />{" "}
                                                            Clicked
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-8 text-center bg-gray-50/30 dark:bg-transparent">
                                <p className="text-xs text-gray-600">
                                    No referral clicks logged for this user.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* IB Activity Snapshots */}
                    <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
                        <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-white/10">
                            <h3 className="text-sm font-bold text-gray-700 dark:text-white flex items-center gap-2">
                                <LineChart
                                    size={16}
                                    className="text-emerald-500"
                                />{" "}
                                Broker-linked Trading Snapshots
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Stored trade volume and PnL snapshots linked to
                                this user
                            </p>
                        </div>

                        {user.ibActivitySnapshots.length > 0 ? (
                            <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-[#151925] text-[10px] font-bold text-gray-500 uppercase tracking-wider sticky top-0 backdrop-blur-md">
                                            <th className="p-3 sm:px-5">
                                                Snapshot Period
                                            </th>
                                            <th className="p-3">Trades</th>
                                            <th className="p-3">
                                                Volume (Lots)
                                            </th>
                                            <th className="p-3">Net PnL</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-white/10 text-xs">
                                        {user.ibActivitySnapshots.map(
                                            (snap) => (
                                                <tr
                                                    key={snap.id}
                                                    className="hover:bg-gray-50/20 dark:hover:bg-white/[0.01] transition-colors"
                                                >
                                                    <td className="p-3 sm:px-5 font-mono tabular-nums">
                                                        <p className="font-bold text-gray-700 dark:text-white">
                                                            {format(
                                                                new Date(
                                                                    snap.periodStart
                                                                ),
                                                                "MMM d"
                                                            )}{" "}
                                                            -{" "}
                                                            {format(
                                                                new Date(
                                                                    snap.periodEnd
                                                                ),
                                                                "MMM d, yyyy"
                                                            )}
                                                        </p>
                                                        <p className="text-[10px] text-gray-500 mt-0.5">
                                                            {snap.broker} / #
                                                            {snap.accountNumberMasked ||
                                                                "Unknown"}
                                                        </p>
                                                    </td>
                                                    <td className="p-3 font-medium text-gray-700 dark:text-white font-mono tabular-nums">
                                                        {snap.tradeCount} trades
                                                        {snap.lastTradeAt && (
                                                            <p className="text-[9px] text-gray-500 mt-0.5">
                                                                Last:{" "}
                                                                {format(
                                                                    new Date(
                                                                        snap.lastTradeAt
                                                                    ),
                                                                    "MMM d / HH:mm"
                                                                )}
                                                            </p>
                                                        )}
                                                    </td>
                                                    <td className="p-3 font-bold text-gray-700 dark:text-white font-mono tabular-nums">
                                                        {snap.closedLotVolume.toFixed(
                                                            2
                                                        )}{" "}
                                                        lots
                                                    </td>
                                                    <td className="p-3">
                                                        <span
                                                            className={`font-bold font-mono tabular-nums ${snap.netPnl >= 0 ? "text-emerald-500" : "text-rose-500"}`}
                                                        >
                                                            {snap.netPnl >= 0
                                                                ? "+"
                                                                : ""}
                                                            $
                                                            {snap.netPnl.toLocaleString(
                                                                undefined,
                                                                {
                                                                    minimumFractionDigits: 2,
                                                                    maximumFractionDigits: 2,
                                                                }
                                                            )}
                                                        </span>
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-8 text-center bg-gray-50/30 dark:bg-transparent">
                                <p className="text-xs text-gray-600">
                                    No volume snapshots recorded.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right column: generated reports */}
                <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm flex flex-col">
                    <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-white/10">
                        <h3 className="text-sm font-bold text-gray-700 dark:text-white flex items-center gap-2">
                            <FileSpreadsheet
                                size={16}
                                className="text-amber-600 dark:text-gold"
                            />{" "}
                            Generated Performance Reports
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Weekly and monthly summaries generated for this user
                        </p>
                    </div>

                    {user.tradingReports.length > 0 ? (
                        <div className="divide-y divide-gray-200 dark:divide-white/10 flex-1 overflow-y-auto max-h-[660px]">
                            {user.tradingReports.map((report) => {
                                const breakEvenCount = Math.max(
                                    0,
                                    report.totalTrades -
                                        report.winCount -
                                        report.lossCount
                                );

                                return (
                                    <div
                                        key={report.id}
                                        className="p-4 space-y-3 hover:bg-gray-50/30 dark:hover:bg-white/[0.01] transition-colors"
                                    >
                                    <div className="flex items-center justify-between">
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-gold/10 text-amber-700 border border-gold/20 dark:text-gold">
                                            {report.type}
                                        </span>
                                        <span className="text-[10px] text-gray-600 flex items-center gap-1 font-medium font-mono tabular-nums">
                                            <Calendar size={11} />{" "}
                                            {report.periodLabel}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center text-xs bg-gray-50/80 dark:bg-[#151925] p-2 rounded-lg border border-gray-200 dark:border-white/10 font-mono tabular-nums">
                                        <div>
                                            <p className="text-[10px] text-gray-600 uppercase font-medium font-sans">
                                                Trades
                                            </p>
                                            <p className="font-bold text-gray-700 dark:text-white mt-0.5">
                                                {report.totalTrades}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-600 uppercase font-medium font-sans">
                                                Win Rate
                                            </p>
                                            <p className="font-bold text-gray-700 dark:text-white mt-0.5">
                                                {report.winRate.toFixed(1)}%
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-600 uppercase font-medium font-sans">
                                                Net PnL
                                            </p>
                                            <p
                                                className={`font-bold mt-0.5 ${report.netPnL >= 0 ? "text-emerald-500" : "text-rose-500"}`}
                                            >
                                                {report.netPnL >= 0 ? "+" : ""}$
                                                {report.netPnL.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-[10px] text-gray-600 font-mono tabular-nums">
                                        <span>
                                            Wins / BE / Losses:{" "}
                                            <span className="font-bold text-emerald-500">
                                                {report.winCount}
                                            </span>{" "}
                                            /{" "}
                                            <span className="font-bold text-gray-600 dark:text-gray-300">
                                                {breakEvenCount}
                                            </span>{" "}
                                            /{" "}
                                            <span className="font-bold text-rose-500">
                                                {report.lossCount}
                                            </span>
                                        </span>
                                        <span>
                                            {format(
                                                new Date(report.periodStart),
                                                "MMM d"
                                            )}{" "}
                                            -{" "}
                                            {format(
                                                new Date(report.periodEnd),
                                                "MMM d, yyyy"
                                            )}
                                        </span>
                                    </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-8 text-center flex-1 flex flex-col items-center justify-center bg-gray-50/30 dark:bg-transparent">
                            <p className="text-xs text-gray-600">
                                No generated performance reports yet.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
