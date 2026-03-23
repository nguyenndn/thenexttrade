"use client";

import { UserTierBadge } from "./UserTierBadge";
import type { LeaderboardEntry } from "../actions";
import { cn } from "@/lib/utils";

interface TopPodiumProps {
  entries: LeaderboardEntry[];
  currentUserId?: string | null;
}

// Rank themes: index 0 = Silver (#2), index 1 = Gold (#1), index 2 = Bronze (#3)
const RANK_THEMES = [
  {
    // #2 Silver
    bg: "bg-gradient-to-b from-slate-50 to-white dark:from-[#1c1e26] dark:to-[#1E2028]",
    border: "border-slate-300 dark:border-slate-500/40",
    ring: "ring-1 ring-slate-200/60 dark:ring-slate-600/20",
    glow: "bg-slate-300/10",
    medalBg: "bg-gradient-to-br from-slate-400 to-slate-500",
    avatarRing: "ring-[3px] ring-slate-300 dark:ring-slate-500/60",
    rankTextColor: "text-slate-500",
  },
  {
    // #1 Gold
    bg: "bg-gradient-to-b from-amber-50/80 to-white dark:from-[#201d14] dark:to-[#1E2028]",
    border: "border-yellow-300 dark:border-yellow-500/40",
    ring: "ring-2 ring-yellow-200/40 dark:ring-yellow-500/15",
    glow: "bg-yellow-300/15",
    medalBg: "bg-gradient-to-br from-yellow-400 to-amber-500",
    avatarRing: "ring-[3px] ring-yellow-400 dark:ring-yellow-500/70",
    rankTextColor: "text-yellow-600 dark:text-yellow-400",
  },
  {
    // #3 Bronze
    bg: "bg-gradient-to-b from-orange-50/60 to-white dark:from-[#201a14] dark:to-[#1E2028]",
    border: "border-orange-200 dark:border-orange-500/30",
    ring: "ring-1 ring-orange-200/50 dark:ring-orange-600/15",
    glow: "bg-orange-300/8",
    medalBg: "bg-gradient-to-br from-orange-400 to-orange-600",
    avatarRing: "ring-[3px] ring-orange-300 dark:ring-orange-500/60",
    rankTextColor: "text-orange-500",
  },
];

export function TopPodium({ entries, currentUserId }: TopPodiumProps) {
  if (entries.length < 3) return null;

  // Reorder: [2nd, 1st, 3rd] for podium layout
  const podiumOrder = [entries[1], entries[0], entries[2]];

  return (
    <div className="grid grid-cols-3 gap-3 mb-6 items-end">
      {podiumOrder.map((entry, i) => {
        const isCenter = i === 1;
        const isCurrentUser = entry.userId === currentUserId;
        const theme = RANK_THEMES[i];

        return (
          <div
            key={entry.userId}
            className={cn(
              "relative rounded-xl border shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5",
              theme.bg,
              theme.border,
              theme.ring,
              isCenter ? "pt-6 pb-5 px-4" : "pt-5 pb-4 px-3",
              isCurrentUser && "!border-primary/60 !ring-primary/30"
            )}
          >
            {/* Subtle glow */}
            <div
              className={cn(
                "absolute inset-0 opacity-60 pointer-events-none",
                theme.glow
              )}
              style={{ filter: "blur(40px)" }}
            />

            {/* Content: vertical flow, no absolute overlap */}
            <div className="relative z-10 flex flex-col items-center gap-2">
              {/* Avatar with medal badge overlay */}
              <div className="relative">
                <div
                  className={cn(
                    "rounded-full flex items-center justify-center text-white font-bold overflow-hidden",
                    isCenter ? "w-16 h-16 text-xl" : "w-12 h-12 text-sm",
                    "bg-gray-400 dark:bg-gray-600",
                    theme.avatarRing,
                    isCurrentUser && "!ring-primary/70"
                  )}
                >
                  {entry.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={entry.avatar}
                      alt={entry.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    entry.name.charAt(0).toUpperCase()
                  )}
                </div>

                {/* Medal badge — pinned to bottom-right of avatar */}
                <div
                  className={cn(
                    "absolute -bottom-1 -right-1 flex items-center justify-center rounded-full text-white font-black shadow-md border-2 border-white dark:border-[#1E2028]",
                    theme.medalBg,
                    isCenter ? "w-7 h-7 text-xs" : "w-6 h-6 text-[10px]"
                  )}
                >
                  {entry.rank}
                </div>
              </div>

              {/* Name */}
              <p
                className={cn(
                  "font-bold text-sm text-gray-900 dark:text-white truncate max-w-full text-center mt-1",
                  isCurrentUser && "text-primary"
                )}
              >
                {entry.name}
              </p>

              {/* Tier badge */}
              <UserTierBadge
                tierName={entry.tier.name}
                tierColor={entry.tier.color}
                tierIcon={entry.tier.icon}
                tierLabel={entry.tier.label}
                size="sm"
              />

              {/* Value */}
              <p className="font-black text-sm text-gray-900 dark:text-white tabular-nums">
                {entry.value.toLocaleString()}
                <span className="text-xs font-normal text-gray-400 ml-1">
                  {entry.label}
                </span>
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
