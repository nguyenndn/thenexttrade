"use client";

import { cn } from "@/lib/utils";
import { UserTierBadge } from "./UserTierBadge";
import type { LeaderboardEntry } from "../actions";

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  isCurrentUser?: boolean;
}

export function LeaderboardRow({ entry, isCurrentUser }: LeaderboardRowProps) {
  return (
    <tr
      className={cn(
        "group transition-colors",
        isCurrentUser
          ? "bg-primary/5 border-l-4 border-primary"
          : "hover:bg-gray-50 dark:hover:bg-white/[0.02]"
      )}
    >
      {/* Rank */}
      <td className="w-16 text-center py-4 px-3">
        <span
          className={cn(
            "font-black text-sm",
            entry.rank <= 3
              ? "text-primary"
              : "text-gray-500 dark:text-gray-400"
          )}
        >
          {isCurrentUser && (
            <span className="text-primary mr-1">&#9733;</span>
          )}
          #{entry.rank}
        </span>
      </td>

      {/* User */}
      <td className="py-4 px-3">
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
          <span
            className={cn(
              "font-bold text-sm truncate max-w-[160px]",
              isCurrentUser
                ? "text-primary"
                : "text-gray-900 dark:text-white"
            )}
          >
            {entry.name}
            {isCurrentUser && (
              <span className="text-xs font-normal text-gray-400 ml-1.5">
                (You)
              </span>
            )}
          </span>
        </div>
      </td>

      {/* Tier */}
      <td className="py-4 px-3 hidden sm:table-cell">
        <UserTierBadge
          tierName={entry.tier.name}
          tierColor={entry.tier.color}
          tierIcon={entry.tier.icon}
          tierLabel={entry.tier.label}
          size="sm"
        />
      </td>

      {/* Value */}
      <td className="py-4 px-3 text-right">
        <span className="font-black text-sm text-gray-900 dark:text-white tabular-nums">
          {entry.value.toLocaleString()}
        </span>
        <span className="text-xs text-gray-400 ml-1">{entry.label}</span>
      </td>
    </tr>
  );
}
