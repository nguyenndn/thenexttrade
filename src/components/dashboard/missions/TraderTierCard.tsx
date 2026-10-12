"use client";

import Link from "next/link";
import {
    Shield,
    ShieldCheck,
    Gem,
    Diamond,
    Crown,
    Zap,
    ChevronRight,
    Trophy,
} from "lucide-react";
import { getTierProgress } from "@/lib/gamification";
import { cn } from "@/lib/utils";

interface TraderTierCardProps {
    userXp: number;
    className?: string;
}

const TIER_ICONS: Record<string, React.ElementType> = {
    Shield,
    ShieldCheck,
    Gem,
    Diamond,
    Crown,
};

const TIER_PERKS: Record<string, string[]> = {
    novice: ["Trade Journal Access", "Basic Academy Curriculum", "Community Read Access"],
    disciplined: ["Automated Metric Radar", "Daily Consistency Streak", "Weekly Performance Review"],
    consistent: ["Leaderboard Ranking Verification", "Advanced Trade Telemetry", "Custom Strategy Playbooks"],
    funded: ["Priority AI Coach Diagnostics", "VIP Alpha Discussions", "Exclusive Risk Matrix"],
    master: ["Master Trader Gold Badge", "Top 1% Community Verification", "All Systems & EAs Unlocked"],
};

export function TraderTierCard({ userXp, className }: TraderTierCardProps) {
    const { current, next, progress, xpToNext } = getTierProgress(userXp);
    const CurrentIcon = TIER_ICONS[current.icon] || Shield;
    const perks = TIER_PERKS[current.name.toLowerCase()] || TIER_PERKS.novice;

    return (
        <div
            className={cn(
                "rounded-xl border border-dashboard dark:border-white/[0.08] bg-white dark:bg-[#1E2028] p-5 sm:p-6 shadow-sm relative overflow-hidden",
                className
            )}
        >
            {/* Ambient Background Glow */}
            <div
                className="absolute top-0 right-0 w-44 h-44 rounded-full blur-3xl opacity-15 pointer-events-none -mr-16 -mt-16"
                style={{ backgroundColor: current.color }}
            />

            {/* Header: Tier Identity */}
            <div className="flex items-center justify-between gap-3 mb-4 relative z-10">
                <div className="flex items-center gap-3">
                    <div
                        className="w-11 h-11 rounded-lg flex items-center justify-center border shadow-xs shrink-0"
                        style={{
                            backgroundColor: `${current.color}15`,
                            borderColor: `${current.color}35`,
                            color: current.color,
                        }}
                    >
                        <CurrentIcon size={22} strokeWidth={2.2} />
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                                Trader Rank
                            </span>
                        </div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">
                            {current.label}
                        </h3>
                    </div>
                </div>

                <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 block">
                        Total Edge
                    </span>
                    <div className="flex items-center justify-end gap-1 text-amber-500 font-extrabold text-sm tabular-nums">
                        <Zap size={14} className="fill-amber-500 shrink-0" />
                        <span>{userXp.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Progress to Next Tier */}
            <div className="space-y-2 py-3 border-y border-dashboard dark:border-white/[0.06] relative z-10">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1">
                        {next ? (
                            <>
                                Next:{" "}
                                <strong className="text-gray-900 dark:text-white font-bold">
                                    {next.label}
                                </strong>
                            </>
                        ) : (
                            <strong className="text-amber-500 font-bold">Maximum Tier Achieved</strong>
                        )}
                    </span>
                    <span className="font-bold tabular-nums text-gray-700 dark:text-gray-300">
                        {progress}%
                    </span>
                </div>

                {/* Progress Track */}
                <div className="h-2.5 rounded-full bg-gray-100 dark:bg-white/[0.06] p-0.5 overflow-hidden border border-dashboard dark:border-white/[0.06]">
                    <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                            width: `${progress}%`,
                            backgroundColor: current.color,
                            boxShadow: `0 0 10px ${current.color}60`,
                        }}
                    />
                </div>

                {next ? (
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 tabular-nums">
                        Earn <strong className="text-gray-700 dark:text-gray-300 font-semibold">{xpToNext.toLocaleString()} more Edge</strong> to unlock the next rank badge.
                    </p>
                ) : (
                    <p className="text-[11px] text-gold dark:text-amber-400 font-medium">
                        You hold the highest tier in TheNextTrade community.
                    </p>
                )}
            </div>

            {/* Unlocked Perks */}
            <div className="pt-3 relative z-10">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 block mb-2">
                    Current Tier Privileges
                </span>
                <ul className="space-y-1.5">
                    {perks.map((perk) => (
                        <li
                            key={perk}
                            className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300"
                        >
                            <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: current.color }}
                            />
                            <span className="truncate">{perk}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Link to Leaderboard */}
            <div className="mt-4 pt-3 border-t border-dashboard dark:border-white/[0.06] relative z-10">
                <Link
                    href="/dashboard/leaderboard"
                    className="flex items-center justify-between text-xs font-bold text-gray-500 hover:text-gold dark:text-gray-400 dark:hover:text-gold transition-colors group"
                >
                    <span className="flex items-center gap-1.5">
                        <Trophy size={14} className="text-amber-500 shrink-0" />
                        View Community Standings
                    </span>
                    <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform shrink-0" />
                </Link>
            </div>
        </div>
    );
}
