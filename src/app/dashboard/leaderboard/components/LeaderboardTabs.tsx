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
        activeColor: "text-amber-600 dark:text-amber-400",
        activeBg:
            "bg-amber-500/10 dark:bg-amber-400/10 border-amber-500/25 dark:border-amber-400/20",
        badge: "LIVE",
    },
    {
        type: "trading",
        label: "All Performance",
        icon: BarChart3,
        activeColor: "text-blue-600 dark:text-blue-400",
        activeBg:
            "bg-blue-500/10 dark:bg-blue-400/10 border-blue-500/25 dark:border-blue-400/20",
    },
    {
        type: "streak",
        label: "Discipline Streak",
        icon: Flame,
        activeColor: "text-orange-600 dark:text-orange-400",
        activeBg:
            "bg-orange-500/10 dark:bg-orange-400/10 border-orange-500/25 dark:border-orange-400/20",
    },
    {
        type: "mystats",
        label: "My Telemetry",
        icon: User,
        activeColor: "text-sky-600 dark:text-sky-400",
        activeBg:
            "bg-sky-500/10 dark:bg-sky-400/10 border-sky-500/25 dark:border-sky-400/20",
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
                "bg-white dark:bg-[#1E2028] p-1.5 rounded-lg border border-dashboard dark:border-white/[0.08] shadow-sm h-auto",
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
                            "rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 border whitespace-nowrap",
                            equalWidth && "flex-1 text-center lg:flex-none",
                            isActive
                                ? cn(tab.activeBg, tab.activeColor, "font-bold shadow-xs")
                                : "text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5"
                        )}
                    >
                        <Icon size={15} className="shrink-0" />
                        <span>{tab.label}</span>
                        {tab.badge && (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                {tab.badge}
                            </span>
                        )}
                    </Link>
                );
            })}
        </div>
    );
}
