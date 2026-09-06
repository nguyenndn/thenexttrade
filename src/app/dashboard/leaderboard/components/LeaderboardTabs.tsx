"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Trophy, Flame, GraduationCap, BarChart3, User } from "lucide-react";
import type { LeaderboardType } from "../actions";

const TABS: {
    type: LeaderboardType;
    label: string;
    icon: React.ElementType;
    activeColor: string;
    activeBg: string;
}[] = [
    {
        type: "trading",
        label: "Trading",
        icon: BarChart3,
        activeColor: "text-primary dark:text-emerald-400",
        activeBg:
            "bg-primary/10 dark:bg-primary/15 border-primary/25 dark:border-primary/20",
    },
    {
        type: "xp",
        label: "Edge Ranking",
        icon: Trophy,
        activeColor: "text-amber-600 dark:text-amber-400",
        activeBg:
            "bg-amber-500/10 dark:bg-amber-400/10 border-amber-500/25 dark:border-amber-400/20",
    },
    {
        type: "streak",
        label: "Streak",
        icon: Flame,
        activeColor: "text-orange-600 dark:text-orange-400",
        activeBg:
            "bg-orange-500/10 dark:bg-orange-400/10 border-orange-500/25 dark:border-orange-400/20",
    },
    {
        type: "academy",
        label: "Academy",
        icon: GraduationCap,
        activeColor: "text-emerald-600 dark:text-emerald-400",
        activeBg:
            "bg-emerald-500/10 dark:bg-emerald-400/10 border-emerald-500/25 dark:border-emerald-400/20",
    },
    {
        type: "mystats",
        label: "My Stats",
        icon: User,
        activeColor: "text-sky-600 dark:text-sky-400",
        activeBg:
            "bg-sky-500/10 dark:bg-sky-400/10 border-sky-500/25 dark:border-sky-400/20",
    },
];

interface LeaderboardTabsProps {
    activeType: LeaderboardType;
    equalWidth?: boolean;
}

export function LeaderboardTabs({
    activeType,
    equalWidth = true,
}: LeaderboardTabsProps) {
    const searchParams = useSearchParams();

    return (
        <div
            className={cn(
                "bg-white dark:bg-[#1E2028] p-1.5 rounded-xl border border-dashboard dark:border-white/[0.08] shadow-sm h-auto",
                equalWidth
                    ? "w-full flex lg:w-auto lg:inline-flex"
                    : "w-auto inline-flex"
            )}
        >
            {TABS.map((tab) => {
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
                    </Link>
                );
            })}
        </div>
    );
}
