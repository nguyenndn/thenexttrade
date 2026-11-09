"use client";

import { Globe, Sun, Moon, Sunset } from "lucide-react";
import { formatDashboardCurrency } from "@/lib/utils/cent-account";

interface SessionData {
    session: string;
    trades: number;
    pnl: number;
    winRate: number;
}

const SESSION_CONFIG: Record<
    string,
    { icon: typeof Globe; color: string; bgColor: string; hours: string }
> = {
    Sydney: {
        icon: Sunset,
        color: "text-amber-600 dark:text-gold",
        bgColor: "bg-gold/10",
        hours: "04:00–13:00",
    },
    Tokyo: {
        icon: Moon,
        color: "text-amber-600 dark:text-gold",
        bgColor: "bg-gold/10",
        hours: "07:00–16:00",
    },
    London: {
        icon: Sun,
        color: "text-amber-500",
        bgColor: "bg-amber-500/10",
        hours: "15:00–00:00",
    },
    "New York": {
        icon: Globe,
        color: "text-emerald-500",
        bgColor: "bg-emerald-500/10",
        hours: "20:00–05:00",
    },
};

interface TradingSessionsCardProps {
    data: SessionData[];
    currency?: string;
}

export function TradingSessionsCard({
    data,
    currency = "USD",
}: TradingSessionsCardProps) {
    const bestSession =
        data.length > 0
            ? data.reduce((best, s) => (s.pnl > best.pnl ? s : best), data[0])
            : null;
    const totalTrades = data.reduce((sum, s) => sum + s.trades, 0);

    return (
        <div className="flex flex-col h-full w-full overflow-hidden">
            {/* Header */}
            <div className="px-5 pt-5 pb-3">
                <div className="flex items-center gap-3 mb-1">
                    <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                        <Globe size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-700 dark:text-white text-sm">
                            Trading Sessions
                        </h3>
                        <p className="text-xs text-gray-500">
                            Performance by Market Session
                        </p>
                    </div>
                </div>
            </div>

            {/* Sessions List */}
            <div className="flex-1 px-5 pb-5 overflow-y-auto min-h-0 custom-scrollbar">
                {data.length === 0 ? (
                    <div className="flex items-center justify-center h-full min-h-[120px]">
                        <p className="text-sm text-gray-400">No session data</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {data.map((session) => {
                            const config =
                                SESSION_CONFIG[session.session] ||
                                SESSION_CONFIG["London"];
                            const Icon = config.icon;
                            const isBest =
                                bestSession?.session === session.session &&
                                data.length > 1;
                            const tradePercent =
                                totalTrades > 0
                                    ? (session.trades / totalTrades) * 100
                                    : 0;

                            return (
                                <div
                                    key={session.session}
                                    className={`relative rounded-lg p-3 transition-all ${
                                        isBest
                                            ? "bg-gradient-to-r from-primary/5 to-emerald-500/5 border border-primary/20 dark:from-primary/10 dark:to-emerald-500/10"
                                            : "bg-gray-50 dark:bg-white/[0.03] border border-transparent"
                                    }`}
                                >
                                    {isBest && (
                                        <span className="absolute -top-1.5 right-3 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider bg-primary text-white rounded-lg">
                                            Best
                                        </span>
                                    )}
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`p-1.5 rounded-lg ${config.bgColor} ${config.color} shrink-0`}
                                        >
                                            <Icon size={14} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-xs font-bold text-gray-700 dark:text-white">
                                                        {session.session}
                                                    </span>
                                                    <span className="text-[10px] font-mono tabular-nums text-gray-400">
                                                        {config.hours}
                                                    </span>
                                                </div>
                                                <span
                                                    className={`text-xs font-black font-mono tabular-nums ${session.pnl >= 0 ? "text-primary" : "text-red-500"}`}
                                                >
                                                    {formatDashboardCurrency(
                                                        session.pnl,
                                                        currency,
                                                        {
                                                            signDisplay:
                                                                "always",
                                                        }
                                                    )}
                                                </span>
                                            </div>
                                            {/* Mini bar */}
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${session.pnl >= 0 ? "bg-primary" : "bg-red-400"}`}
                                                        style={{
                                                            width: `${Math.min(tradePercent, 100)}%`,
                                                        }}
                                                    />
                                                </div>
                                                <span className="text-[11px] text-gray-500 font-semibold font-mono tabular-nums shrink-0">
                                                    {session.trades} trades ·{" "}
                                                    {session.winRate.toFixed(1)}
                                                    %
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
