"use client";

import { useState } from "react";
import { Trophy, Medal } from "lucide-react";
import { TopPodium } from "./TopPodium";
import { LeaderboardTable } from "./LeaderboardTable";
import { UserProfileCard } from "./UserProfileCard";
import type { LeaderboardEntry, LeaderboardType } from "../actions";

const TAB_TITLES: Record<string, string> = {
  xp: "XP Rankings",
  streak: "Streak Leaderboard",
  academy: "Academy Leaderboard",
  trading: "Trading Leaderboard",
};

interface LeaderboardContentProps {
  entries: LeaderboardEntry[];
  currentUserId?: string | null;
  myEntry?: LeaderboardEntry | null;
  type: LeaderboardType;
}

export function LeaderboardContent({
  entries,
  currentUserId,
  myEntry,
  type,
}: LeaderboardContentProps) {
  const [selectedUser, setSelectedUser] = useState<LeaderboardEntry | null>(null);

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="space-y-6">
      {/* Top 3 Podium Section */}
      <div className="bg-white dark:bg-[#151925] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-white/5">
          <div className="w-8 h-8 rounded-lg bg-yellow-50 dark:bg-yellow-500/10 flex items-center justify-center">
            <Trophy size={16} className="text-yellow-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Top 3</h3>
            <p className="text-xs text-gray-400">Hall of Fame</p>
          </div>
        </div>
        <div className="p-6">
          <TopPodium
            entries={top3}
            currentUserId={currentUserId}
            onUserClick={setSelectedUser}
            type={type}
          />
        </div>
      </div>

      {/* Rankings Table Section */}
      <div className="bg-white dark:bg-[#151925] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-white/5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
            <Medal size={16} className="text-emerald-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">{TAB_TITLES[type] || "Rankings"}</h3>
            <p className="text-xs text-gray-400">All participants ranked by performance</p>
          </div>
        </div>
        <div className="p-0">
          <LeaderboardTable
            entries={rest}
            currentUserId={currentUserId}
            myEntry={
              entries.some((e) => e.userId === currentUserId)
                ? null
                : myEntry
            }
            onUserClick={setSelectedUser}
            type={type}
          />
        </div>
      </div>

      {selectedUser && (
        <UserProfileCard
          entry={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}
