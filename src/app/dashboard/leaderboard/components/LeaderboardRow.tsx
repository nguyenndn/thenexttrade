"use client";

import { cn } from "@/lib/utils";
import { UserTierBadge } from "./UserTierBadge";
import type { LeaderboardEntry, LeaderboardType } from "../actions";
import { Star, Clock, FileText, Flame, Trophy, TrendingUp } from "lucide-react";

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  isCurrentUser?: boolean;
  onClick?: () => void;
  type: LeaderboardType;
}

function formatStudyTime(minutes: number): string {
  if (minutes === 0) return "0m";
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function LeaderboardRow({ entry, isCurrentUser, onClick, type }: LeaderboardRowProps) {
  return (
    <tr
      className={cn(
        "group transition-colors cursor-pointer",
        isCurrentUser
          ? "bg-primary/5 border-l-4 border-primary"
          : "hover:bg-gray-50 dark:hover:bg-white/[0.02]"
      )}
      onClick={onClick}
    >
      {/* Rank */}
      <td className="w-14 text-center py-3.5 px-3">
        <span
          className={cn(
            "font-black text-sm",
            entry.rank <= 3 ? "text-primary" : "text-gray-600 dark:text-gray-300"
          )}
        >
          #{entry.rank}
        </span>
      </td>

      {/* User */}
      <td className="py-3.5 px-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0",
              isCurrentUser
                ? "bg-primary ring-2 ring-primary/30"
                : "bg-gray-400 dark:bg-gray-600"
            )}
          >
            {entry.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={entry.avatar}
                alt={entry.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              entry.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span
              className={cn(
                "font-bold text-sm truncate",
                isCurrentUser ? "text-primary" : "text-gray-700 dark:text-white"
              )}
            >
              {entry.name}
              {isCurrentUser && (
                <span className="text-xs font-normal text-gray-500 ml-1.5">(You)</span>
              )}
            </span>
            <UserTierBadge
              tierName={entry.tier.name}
              tierColor={entry.tier.color}
              tierIcon={entry.tier.icon}
              tierLabel={entry.tier.label}
              size="sm"
            />
          </div>
        </div>
      </td>

      {/* Tab-specific columns */}
      {type === "xp" && (
        <>
          <td className="py-3.5 px-3 hidden md:table-cell">
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border"
              style={{
                color: entry.tier.color,
                borderColor: entry.tier.color + '40',
                backgroundColor: entry.tier.color + '15',
              }}
            >
              Lv.{entry.level}
            </span>
          </td>
          <td className="py-3.5 px-3 hidden sm:table-cell">
            <div className="flex items-center gap-1 text-sm font-bold text-gray-700 dark:text-white tabular-nums">
              <Star size={12} className="text-yellow-500" />
              {entry.value.toLocaleString()}
            </div>
          </td>
          <td className="py-3.5 px-3 hidden lg:table-cell">
            <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300 tabular-nums">
              <Clock size={12} />
              {formatStudyTime(entry.studyTimeMinutes)}
            </div>
          </td>
          <td className="py-3.5 px-3 hidden lg:table-cell">
            <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300 tabular-nums">
              <FileText size={12} />
              {entry.lessonsCompleted}
            </div>
          </td>
        </>
      )}

      {type === "streak" && (
        <>
          <td className="py-3.5 px-3">
            <div className="flex items-center gap-1 text-sm font-bold text-orange-500 tabular-nums">
              <Flame size={14} />
              {entry.value} days
            </div>
          </td>
          <td className="py-3.5 px-3 hidden sm:table-cell">
            <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300 tabular-nums">
              <Star size={12} className="text-yellow-500" />
              {entry.value.toLocaleString()} XP
            </div>
          </td>
        </>
      )}

      {type === "academy" && (
        <>
          <td className="py-3.5 px-3">
            <div className="flex items-center gap-1 text-sm font-bold text-gray-700 dark:text-white tabular-nums">
              <FileText size={14} className="text-green-500" />
              {entry.value}
            </div>
          </td>
          <td className="py-3.5 px-3 hidden sm:table-cell">
            <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300 tabular-nums">
              <Clock size={12} />
              {formatStudyTime(entry.studyTimeMinutes)}
            </div>
          </td>
          <td className="py-3.5 px-3 hidden md:table-cell">
            <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300 tabular-nums">
              <Star size={12} className="text-yellow-500" />
              {entry.value.toLocaleString()} XP
            </div>
          </td>
        </>
      )}

      {type === "trading" && (
        <>
          <td className="py-3.5 px-3">
            <span className={cn(
              "text-sm font-bold tabular-nums",
              entry.pnl >= 0 ? "text-green-500" : "text-red-500"
            )}>
              {entry.pnl >= 0 ? "+" : ""}${entry.pnl.toFixed(2)}
            </span>
          </td>
          <td className="py-3.5 px-3 hidden sm:table-cell">
            <div className="flex items-center gap-1 text-sm font-bold text-green-500 tabular-nums">
              <Trophy size={14} />
              {entry.value}%
            </div>
          </td>
          <td className="py-3.5 px-3 hidden md:table-cell">
            <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300 tabular-nums">
              <TrendingUp size={12} />
              {entry.totalTrades}
            </div>
          </td>
        </>
      )}

      {/* Percentile — always show */}
      <td className="py-3.5 px-3 text-right">
        <span className="text-xs font-bold text-green-500 tabular-nums">
          {entry.percentile.toFixed(1)}%
        </span>
      </td>
    </tr>
  );
}
