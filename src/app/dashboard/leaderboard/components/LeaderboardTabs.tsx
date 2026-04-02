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
  activeGlow: string;
}[] = [
  {
    type: "xp",
    label: "XP Rankings",
    icon: Trophy,
    activeColor: "text-yellow-600 dark:text-yellow-400",
    activeBg: "bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/20",
    activeGlow: "shadow-[0_0_12px_rgba(234,179,8,0.15)]",
  },
  {
    type: "streak",
    label: "Streak",
    icon: Flame,
    activeColor: "text-orange-600 dark:text-orange-400",
    activeBg: "bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20",
    activeGlow: "shadow-[0_0_12px_rgba(249,115,22,0.15)]",
  },
  {
    type: "academy",
    label: "Academy",
    icon: GraduationCap,
    activeColor: "text-emerald-600 dark:text-emerald-400",
    activeBg: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20",
    activeGlow: "shadow-[0_0_12px_rgba(16,185,129,0.15)]",
  },
  {
    type: "trading",
    label: "Trading",
    icon: BarChart3,
    activeColor: "text-blue-600 dark:text-blue-400",
    activeBg: "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20",
    activeGlow: "shadow-[0_0_12px_rgba(59,130,246,0.15)]",
  },
  {
    type: "mystats",
    label: "My Stats",
    icon: User,
    activeColor: "text-cyan-600 dark:text-cyan-400",
    activeBg: "bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20",
    activeGlow: "shadow-[0_0_12px_rgba(6,182,212,0.15)]",
  },
];

interface LeaderboardTabsProps {
  activeType: LeaderboardType;
  equalWidth?: boolean;
}

export function LeaderboardTabs({ activeType, equalWidth = true }: LeaderboardTabsProps) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-[#151925] p-1.5 rounded-xl border border-gray-200 dark:border-white/10 h-auto",
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
              "rounded-lg px-4 py-2 text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 border whitespace-nowrap relative",
              equalWidth && "flex-1 text-center lg:flex-none",
              isActive
                ? cn(tab.activeBg, tab.activeColor, tab.activeGlow)
                : "text-gray-600 dark:text-gray-300 border-transparent hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-white/5"
            )}
          >
            <Icon
              size={16}
              className={cn(
                "transition-transform duration-300",
                isActive && "scale-110"
              )}
            />
            <span>{tab.label}</span>
            {isActive && (
              <span className="absolute -bottom-[7px] left-1/2 -translate-x-1/2 w-6 h-1 rounded-full bg-current opacity-60" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
