"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Trophy, Flame, BarChart3, User } from "lucide-react";
import type { LeaderboardType } from "../actions";

const TABS: {
    type: LeaderboardType;
    label: string;
    icon: React.ElementType;
    activeColor: string;
    activeBg: string;
    badge?: string;
}[] = [
    {
        type: "sprint",
        label: "Trading Sprints",
        icon: Trophy,
        activeColor: "text-amber-600 dark:text-gold",
        activeBg:
            "bg-gold/10 border-gold/25",
        badge: "LIVE",
    },
    {
        type: "trading",
        label: "All Performance",
        icon: BarChart3,
        activeColor: "text-amber-600 dark:text-gold",
        activeBg:
            "bg-gold/10 border-gold/25",
    },
    {
        type: "streak",
        label: "Discipline Streak",
        icon: Flame,
        activeColor: "text-amber-600 dark:text-gold",
        activeBg:
            "bg-gold/10 border-gold/25",
    },
    {
        type: "mystats",
        label: "My Telemetry",
        icon: User,
        activeColor: "text-amber-600 dark:text-gold",
        activeBg:
            "bg-gold/10 border-gold/25",
    },
];

interface LeaderboardTabsProps {
    activeType: LeaderboardType;
    equalWidth?: boolean;
    hasActiveCompetition?: boolean;
}

export function LeaderboardTabs({
    activeType,
    equalWidth = true,
    hasActiveCompetition = false,
}: LeaderboardTabsProps) {
    const searchParams = useSearchParams();

    const visibleTabs = TABS.filter((tab) => {
        if (tab.type === "sprint") {
            return hasActiveCompetition;
        }
        return true;
    });

    return (
        <div
            className={cn(
                "bg-white dark:bg-[#1E2028] p-1 sm:p-1.5 gap-1.5 sm:gap-1 rounded-xl border border-dashboard dark:border-white/[0.08] shadow-sm h-auto max-w-full overflow-x-auto scrollbar-hide",
                equalWidth
                    ? "w-full flex lg:w-auto lg:inline-flex"
                    : "w-auto inline-flex"
            )}
        >
            {visibleTabs.map((tab) => {
                const isActive = activeType === tab.type;
                const Icon = tab.icon;
                const tabParams = new URLSearchParams(searchParams.toString());
                tabParams.set("type", tab.type);

                return (
                    <Link
                        key={tab.type}
                        href={`/dashboard/leaderboard?${tabParams.toString()}`}
                        className={cn(
                            "shrink-0 rounded-lg px-2.5 sm:px-3.5 py-1.5 text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 border whitespace-nowrap",
                            equalWidth && "flex-1 text-center lg:flex-none",
                            isActive
                                ? cn(tab.activeBg, tab.activeColor, "font-bold shadow-xs")
                                : "text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5"
                        )}
                    >
                        <Icon size={15} className="hidden sm:block shrink-0" />
                        <span>
                            {tab.type === "trading" ? (
                                <>
                                    <span className="hidden sm:inline">All </span>
                                    Performance
                                </>
                            ) : tab.type === "streak" ? (
                                <>
                                    <span className="hidden sm:inline">Discipline </span>
                                    Streak
                                </>
                            ) : tab.type === "mystats" ? (
                                <>
                                    My{" "}
                                    <span className="hidden sm:inline">Telemetry</span>
                                    <span className="sm:hidden">Stats</span>
                                </>
                            ) : (
                                tab.label
                            )}
                        </span>
                        {tab.badge && (
                            <>
                                <span
                                    className="sm:hidden relative flex h-2 w-2 shrink-0"
                                    aria-label={tab.badge}
                                >
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                </span>
                                <span className="hidden sm:inline-flex text-[9px] font-extrabold px-1.5 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                    {tab.badge}
                                </span>
                            </>
                        )}
                    </Link>
                );
            })}
        </div>
    );
}
