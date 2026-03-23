"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Trophy, Flame, GraduationCap, BarChart3 } from "lucide-react";
import type { LeaderboardType } from "../actions";

const TABS: { type: LeaderboardType; label: string; icon: React.ElementType }[] = [
  { type: "xp", label: "XP Rankings", icon: Trophy },
  { type: "streak", label: "Streak", icon: Flame },
  { type: "academy", label: "Academy", icon: GraduationCap },
  { type: "trading", label: "Trading", icon: BarChart3 },
];

interface LeaderboardTabsProps {
  activeType: LeaderboardType;
  equalWidth?: boolean;
}

export function LeaderboardTabs({ activeType, equalWidth = true }: LeaderboardTabsProps) {
  return (
    <div
      className={cn(
        "bg-[#F1F3F5] dark:bg-[#1A1D27] p-1 rounded-xl border border-gray-200 dark:border-white/10 h-auto",
        equalWidth ? "w-full flex lg:w-auto lg:inline-flex" : "w-auto inline-flex"
      )}
    >
      {TABS.map((tab) => {
        const isActive = activeType === tab.type;
        const Icon = tab.icon;

        return (
          <Link
            key={tab.type}
            href={`/dashboard/leaderboard?type=${tab.type}`}
            className={cn(
              "rounded-lg px-4 py-1.5 text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 border whitespace-nowrap",
              equalWidth && "flex-1 text-center lg:flex-none",
              isActive
                ? "bg-white dark:bg-[#262A36] text-gray-900 dark:text-white shadow-sm border-gray-200 dark:border-white/10"
                : "text-gray-500 dark:text-gray-400 border-transparent"
            )}
          >
            <Icon size={16} />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
