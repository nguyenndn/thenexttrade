"use client";

import { UserTierBadge } from "./UserTierBadge";
import { cn } from "@/lib/utils";
import type { LeaderboardResponse, LeaderboardEntry } from "../actions";
import { ArrowUp, ArrowDown, Target, TrendingUp } from "lucide-react";

interface MyRankCardProps {
    myRank: LeaderboardResponse["myRank"];
    rivals: LeaderboardResponse["rivals"];
}

export function MyRankCard({ myRank, rivals }: MyRankCardProps) {
    if (!myRank) {
        return (
            <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-dashboard shadow-sm p-6">
                <h3 className="text-sm font-bold text-gray-700 dark:text-white mb-3 flex items-center gap-2">
                    <Target size={16} className="text-amber-600 dark:text-gold" />
                    Your Position
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                    Start earning Edge to appear on the leaderboard!
                </p>
            </div>
        );
    }

    const { rank, value, percentile, tierProgress } = myRank;

    return (
        <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-dashboard shadow-sm p-6 space-y-5">
            {/* Rank */}
            <div>
                <h3 className="text-sm font-bold text-gray-700 dark:text-white mb-3 flex items-center gap-2">
                    <Target size={16} className="text-amber-600 dark:text-gold" />
                    Your Position
                </h3>
                <div className="flex items-baseline gap-2 font-mono tabular-nums">
                    <span className="text-4xl font-black text-amber-600 dark:text-gold">
                        #{rank}
                    </span>
                    <span className="text-sm text-gray-500">
                        Top {percentile}%
                    </span>
                </div>
            </div>

            {/* Edge Progress */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <UserTierBadge
                        tierName={tierProgress.current.name}
                        tierColor={tierProgress.current.color}
                        tierIcon={tierProgress.current.icon}
                        tierLabel={tierProgress.current.label}
                        size="sm"
                    />
                    {tierProgress.next && (
                        <UserTierBadge
                            tierName={tierProgress.next.name}
                            tierColor={tierProgress.next.color}
                            tierIcon={tierProgress.next.icon}
                            tierLabel={tierProgress.next.label}
                            size="sm"
                        />
                    )}
                </div>

                <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                    <div
                        className="h-full rounded-full bg-gold transition-all duration-500"
                        style={{ width: `${tierProgress.progress}%` }}
                    />
                </div>

                {tierProgress.next && (
                    <p className="text-xs text-gray-500 mt-1.5 font-mono tabular-nums">
                        {tierProgress.xpToNext.toLocaleString()} Edge to{" "}
                        {tierProgress.next.label}
                    </p>
                )}
            </div>

            {/* Rivalry Tracker */}
            {rivals && (rivals.above || rivals.below) && (
                <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                        Rivals
                    </h4>
                    <div className="space-y-2">
                        {rivals.above && (
                            <RivalRow
                                entry={rivals.above}
                                direction="above"
                                gap={rivals.above.value - value}
                            />
                        )}
                        <div className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-gold/10 border border-gold/20">
                            <span className="text-xs font-black font-mono tabular-nums text-amber-600 dark:text-gold">
                                #{rank}
                            </span>
                            <span className="text-xs font-bold text-amber-600 dark:text-gold flex-1">
                                You
                            </span>
                            <span className="text-xs font-black text-amber-600 dark:text-gold font-mono tabular-nums">
                                {value.toLocaleString()}
                            </span>
                        </div>
                        {rivals.below && (
                            <RivalRow
                                entry={rivals.below}
                                direction="below"
                                gap={value - rivals.below.value}
                            />
                        )}
                    </div>
                </div>
            )}

            {/* Quick Stats */}
            <div className="flex items-center gap-3 pt-2 border-t border-dashboard">
                <TrendingUp size={14} className="text-gray-500" />
                <span className="text-xs font-mono tabular-nums text-gray-600 dark:text-gray-300">
                    Total: {value.toLocaleString()} Edge
                </span>
            </div>
        </div>
    );
}

function RivalRow({
    entry,
    direction,
    gap,
}: {
    entry: LeaderboardEntry;
    direction: "above" | "below";
    gap: number;
}) {
    return (
        <div className="flex items-center gap-2 py-1.5 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
            <span className="text-xs font-bold font-mono tabular-nums text-gray-500 w-6">
                #{entry.rank}
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-300 flex-1 truncate">
                {entry.name}
            </span>
            <span
                className={cn(
                    "text-[10px] font-bold font-mono tabular-nums flex items-center gap-0.5",
                    direction === "above" ? "text-rose-500" : "text-emerald-500"
                )}
            >
                {direction === "above" ? (
                    <ArrowUp size={10} />
                ) : (
                    <ArrowDown size={10} />
                )}
                {gap.toLocaleString()}
            </span>
        </div>
    );
}
