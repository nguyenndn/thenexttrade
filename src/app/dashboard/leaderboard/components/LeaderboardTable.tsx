"use client";

import { LeaderboardRow } from "./LeaderboardRow";
import type { LeaderboardEntry, LeaderboardType } from "../actions";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserId?: string | null;
  myEntry?: LeaderboardEntry | null;
  onUserClick?: (entry: LeaderboardEntry) => void;
  type: LeaderboardType;
}

// Tab-specific column headers
function getHeaders(type: LeaderboardType) {
  switch (type) {
    case "xp":
      return [
        { label: "Level", className: "hidden md:table-cell" },
        { label: "XP Earned", className: "hidden sm:table-cell" },
        { label: "Study Time", className: "hidden lg:table-cell" },
        { label: "Lessons", className: "hidden lg:table-cell" },
      ];
    case "streak":
      return [
        { label: "Streak", className: "" },
        { label: "XP", className: "hidden sm:table-cell" },
      ];
    case "academy":
      return [
        { label: "Lessons", className: "" },
        { label: "Study Time", className: "hidden sm:table-cell" },
        { label: "XP", className: "hidden md:table-cell" },
      ];
    case "trading":
      return [
        { label: "PnL", className: "" },
        { label: "Win Rate", className: "hidden sm:table-cell" },
        { label: "Trades", className: "hidden md:table-cell" },
      ];
    default:
      return [];
  }
}

// Get colSpan for separator row
function getColSpan(type: LeaderboardType) {
  return 3 + getHeaders(type).length; // rank + user + dynamic cols + percentile
}

export function LeaderboardTable({
  entries,
  currentUserId,
  myEntry,
  onUserClick,
  type,
}: LeaderboardTableProps) {
  const isUserInTop = entries.some((e) => e.userId === currentUserId);
  const headers = getHeaders(type);

  if (entries.length === 0 && !myEntry) {
    return (
      <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-12 text-center">
        <div className="inline-flex items-center justify-center p-3 rounded-xl bg-cyan-500/10 text-cyan-500 mb-4 ring-4 ring-cyan-500/5">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No rankings yet</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Be the first to claim the top spot! Start learning, trading, and building your streak.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#151925] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 dark:bg-white/5 text-[11px] uppercase text-gray-400 font-bold tracking-wider">
            <tr>
              <th className="w-14 text-center py-3 px-3">Rank</th>
              <th className="py-3 px-3">User</th>
              {headers.map((h) => (
                <th key={h.label} className={cn("py-3 px-3", h.className)}>
                  {h.label}
                </th>
              ))}
              <th className="py-3 px-3 text-right">%</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {entries.map((entry) => (
              <LeaderboardRow
                key={entry.userId}
                entry={entry}
                isCurrentUser={entry.userId === currentUserId}
                onClick={() => onUserClick?.(entry)}
                type={type}
              />
            ))}

            {!isUserInTop && currentUserId && myEntry && (
              <>
                <tr>
                  <td colSpan={getColSpan(type)} className="py-2 px-6">
                    <div className="border-t-2 border-dashed border-gray-200 dark:border-white/10" />
                  </td>
                </tr>
                <LeaderboardRow
                  entry={myEntry}
                  isCurrentUser={true}
                  onClick={() => onUserClick?.(myEntry)}
                  type={type}
                />
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
