"use client";

import type { LeaderboardEntry, LeaderboardType } from "../actions";
import { cn } from "@/lib/utils";
import { Clock, Crown, FileText, Star, Flame, Trophy, TrendingUp } from "lucide-react";

interface TopPodiumProps {
  entries: LeaderboardEntry[];
  currentUserId?: string | null;
  onUserClick?: (entry: LeaderboardEntry) => void;
  type: LeaderboardType;
}

function formatStudyTime(minutes: number): string {
  if (minutes === 0) return "0m";
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// Podium config per position: [Silver #2, Gold #1, Bronze #3]
const PODIUM = [
  {
    // Silver #2
    avatarRing: "ring-0",
    avatarSize: "w-16 h-16 text-lg",
    medalBg: "bg-gradient-to-br from-gray-300 to-gray-500",
    hasGradientRing: false,
    glowShadow: "0 0 24px 10px rgba(156,163,175,0.45), 0 0 48px 20px rgba(156,163,175,0.15)",
    xpColor: "text-gray-500 dark:text-gray-400",
    podiumBg: "bg-gradient-to-t from-gray-400 to-gray-300 dark:from-gray-600 dark:to-gray-500",
    podiumH: "h-20",
    cardMt: "mt-8",
    cardBg: "bg-gradient-to-b from-slate-50 to-white dark:from-slate-800/40 dark:to-[#1E2028]",
    borderColor: "border-slate-200 dark:border-slate-600/30",
    nameColor: "text-slate-700 dark:text-slate-200",
  },
  {
    // Gold #1
    avatarRing: "ring-0",
    avatarSize: "w-20 h-20 text-2xl",
    medalBg: "bg-gradient-to-br from-yellow-400 to-amber-500",
    hasGradientRing: true,
    glowShadow: "0 0 30px 12px rgba(251,191,36,0.5), 0 0 60px 24px rgba(251,191,36,0.2)",
    xpColor: "text-amber-600 dark:text-yellow-400",
    podiumBg: "bg-gradient-to-t from-yellow-500 to-amber-400 dark:from-yellow-600 dark:to-yellow-500",
    podiumH: "h-28",
    cardMt: "mt-0",
    cardBg: "bg-gradient-to-b from-amber-50 via-yellow-50/50 to-white dark:from-amber-900/30 dark:via-yellow-900/10 dark:to-[#1E2028]",
    borderColor: "border-amber-200 dark:border-amber-500/30",
    nameColor: "text-amber-800 dark:text-amber-200",
  },
  {
    // Bronze #3
    avatarRing: "ring-0",
    avatarSize: "w-14 h-14 text-base",
    medalBg: "bg-gradient-to-br from-orange-400 to-orange-600",
    hasGradientRing: false,
    glowShadow: "0 0 24px 10px rgba(251,146,60,0.45), 0 0 48px 20px rgba(251,146,60,0.15)",
    xpColor: "text-orange-600 dark:text-orange-400",
    podiumBg: "bg-gradient-to-t from-orange-400 to-orange-300 dark:from-orange-600 dark:to-orange-500",
    podiumH: "h-14",
    cardMt: "mt-12",
    cardBg: "bg-gradient-to-b from-orange-50 to-white dark:from-orange-900/20 dark:to-[#1E2028]",
    borderColor: "border-orange-200 dark:border-orange-500/25",
    nameColor: "text-orange-800 dark:text-orange-200",
  },
];

// Get tab-specific stats for podium cards
function getTabStats(entry: LeaderboardEntry, type: LeaderboardType) {
  switch (type) {
    case "xp":
      return [
        { icon: Clock, text: formatStudyTime(entry.studyTimeMinutes) },
        { icon: FileText, text: `${entry.lessonsCompleted} lessons` },
      ];
    case "streak":
      return [
        { icon: Star, text: `${entry.value} XP` },
        { icon: Flame, text: `${entry.value} days streak` },
      ];
    case "academy":
      return [
        { icon: Clock, text: formatStudyTime(entry.studyTimeMinutes) },
        { icon: FileText, text: `${entry.lessonsCompleted} lessons` },
      ];
    case "trading":
      return [
        { icon: Trophy, text: `${entry.value}% Win Rate` },
        { icon: TrendingUp, text: `${entry.totalTrades} trades` },
      ];
    default:
      return [
        { icon: Clock, text: formatStudyTime(entry.studyTimeMinutes) },
        { icon: FileText, text: `${entry.lessonsCompleted} lessons` },
      ];
  }
}

// Get main value display for podium
function getMainValue(entry: LeaderboardEntry, type: LeaderboardType) {
  switch (type) {
    case "xp":
      return `${entry.value.toLocaleString()} XP`;
    case "streak":
      return `${entry.value} days`;
    case "academy":
      return `${entry.value} lessons`;
    case "trading": {
      const pnl = entry.pnl >= 0 ? `+$${entry.pnl.toFixed(2)}` : `-$${Math.abs(entry.pnl).toFixed(2)}`;
      return pnl;
    }
    default:
      return `${entry.value.toLocaleString()} ${entry.label}`;
  }
}

export function TopPodium({ entries, currentUserId, onUserClick, type }: TopPodiumProps) {
  // Pad entries to 3 with placeholders
  const padded: (LeaderboardEntry | null)[] = [
    entries[0] ?? null,
    entries[1] ?? null,
    entries[2] ?? null,
  ];

  // Reorder: [#2 left, #1 center, #3 right]
  const podiumOrder = [padded[1], padded[0], padded[2]];

  return (
    <div className="relative py-4 mb-4">
      <div className="grid grid-cols-3 gap-3 items-end">
        {podiumOrder.map((entry, i) => {
          const isCenter = i === 1;
          const config = PODIUM[i];
          const rank = [2, 1, 3][i];

          // Placeholder for empty slot
          if (!entry) {
            return (
              <div
                key={`empty-${i}`}
                className={cn("flex flex-col items-center opacity-40", config.cardMt)}
              >
                {isCenter && <div className="text-2xl mb-1"><Crown size={24} className="text-yellow-400" /></div>}

                <div className="relative mb-2">
                  <div
                    className={cn(
                      "rounded-full flex items-center justify-center font-bold text-gray-300 dark:text-gray-600 border-[3px] border-dashed border-gray-300 dark:border-gray-600",
                      config.avatarSize
                    )}
                  >
                    ?
                  </div>
                  <div
                    className={cn(
                      "absolute -bottom-1 -right-1 flex items-center justify-center rounded-full text-white/60 font-black shadow-lg border-2 border-white dark:border-[#1E2028] bg-gray-300 dark:bg-gray-600",
                      isCenter ? "w-7 h-7 text-xs" : "w-6 h-6 text-[10px]"
                    )}
                  >
                    {rank}
                  </div>
                </div>

                <p className="font-bold text-base text-gray-300 dark:text-gray-600 mb-0.5">Waiting...</p>
                <div className="text-xs text-gray-300 dark:text-gray-600 mb-2">---</div>

                <div
                  className={cn(
                    "w-full rounded-t-lg flex items-center justify-center font-black text-white/30 text-lg mt-0 bg-gray-200 dark:bg-gray-700",
                    config.podiumH
                  )}
                >
                  #{rank}
                </div>
              </div>
            );
          }

          // Real entry
          const isCurrentUser = entry.userId === currentUserId;
          const stats = getTabStats(entry, type);

          return (
            <div
              key={entry.userId}
              className={cn("flex flex-col items-center cursor-pointer group", config.cardMt)}
              onClick={() => onUserClick?.(entry)}
            >
              {isCenter && (
                <div className="mb-1 animate-bounce" style={{ animationDuration: '2s' }}>
                  <Crown size={24} className="text-yellow-400" />
                </div>
              )}

              {/* Unified card + podium */}
              <div className={cn("w-full shadow-md rounded-xl", isCenter ? "border-2" : "border", config.borderColor)}>
                {/* User info section */}
                <div className={cn("rounded-t-xl pt-12 pb-3 px-3 flex flex-col items-center relative", config.cardBg)}>
                  {/* Avatar floating on top of card */}
                  <div className="absolute -top-10">
                    <div className="relative">
                      <div
                        className="rounded-full transition-transform group-hover:scale-105"
                        style={{ boxShadow: config.glowShadow }}
                      >
                        <div
                          className={cn(
                            "rounded-full flex items-center justify-center font-bold text-white bg-gray-400 dark:bg-gray-600 overflow-hidden ring-[4px] ring-white dark:ring-[#1E2028]",
                            config.avatarSize
                          )}
                        >
                          {entry.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={entry.avatar} alt={entry.name} className="w-full h-full object-cover" />
                          ) : (
                            entry.name.charAt(0).toUpperCase()
                          )}
                        </div>
                      </div>

                      <div
                        className={cn(
                          "absolute -bottom-1 -right-1 flex items-center justify-center rounded-full text-white font-black shadow-lg border-2 border-white dark:border-[#1E2028]",
                          config.medalBg,
                          isCenter ? "w-7 h-7 text-xs" : "w-6 h-6 text-[10px]"
                        )}
                      >
                        {entry.rank}
                      </div>
                    </div>
                  </div>

                  {/* Name */}
                  <p
                    className={cn(
                      "font-bold text-base text-center truncate max-w-full mb-0.5",
                      isCurrentUser ? "text-primary" : config.nameColor
                    )}
                  >
                    {entry.name}
                  </p>

                  {/* Main Value */}
                  <div className={cn("flex items-center gap-1 text-sm font-bold mb-2", config.xpColor)}>
                    <Star size={14} />
                    <span>{getMainValue(entry, type)}</span>
                  </div>

                  {/* Divider */}
                  <div className="w-full border-t border-gray-100 dark:border-white/10 mb-2" />

                  {/* Tab-specific stats */}
                  {stats.map((stat, si) => (
                    <div key={si} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <stat.icon size={13} />
                      <span>{stat.text}</span>
                    </div>
                  ))}
                </div>

                {/* Podium rank bar — seamlessly connected */}
                <div
                  className={cn(
                    "w-full rounded-b-xl flex items-center justify-center font-black text-white/90 text-lg shadow-inner",
                    config.podiumBg,
                    config.podiumH
                  )}
                >
                  #{entry.rank}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
