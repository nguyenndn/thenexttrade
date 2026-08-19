"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Trophy, Medal } from "lucide-react";
import { TopMedalStrip } from "./TopMedalStrip";
import { LeaderboardTable } from "./LeaderboardTable";
import { UserProfileCard } from "./UserProfileCard";
import { LeaderboardFilter } from "./LeaderboardFilter";
import { LeaderboardMethodologyModal } from "./LeaderboardMethodologyModal";
import type { LeaderboardEntry, LeaderboardType, PeriodFilter } from "../actions";

const TAB_TITLES: Record<string, string> = {
    xp: "Edge Ranking",
    streak: "Streak Leaderboard",
    academy: "Academy Leaderboard",
    trading: "Trading Leaderboard",
};

interface LeaderboardContentProps {
    entries: LeaderboardEntry[];
    currentUserId?: string | null;
    myEntry?: LeaderboardEntry | null;
    type: LeaderboardType;
    sortBy?: "percentage" | "currency";
    period?: PeriodFilter;
}

export function LeaderboardContent({
    entries,
    currentUserId,
    myEntry,
    type,
    sortBy = "currency",
    period = "30D",
}: LeaderboardContentProps) {
    const [selectedUser, setSelectedUser] = useState<LeaderboardEntry | null>(
        null
    );
    const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);

    const top3 = entries.slice(0, 3);
    const rest = entries.slice(3);

    return (
        <div className="space-y-6">
            {/* Top Performers Section */}
            <div className="bg-white dark:bg-[#151925] rounded-2xl border border-dashboard shadow-sm overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 border-b border-dashboard">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-yellow-50 dark:bg-yellow-500/10 flex items-center justify-center">
                            <Trophy size={16} className="text-yellow-500" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-700 dark:text-white">
                                Top Performers
                            </h3>
                            <p className="text-xs text-gray-500">
                                The current leaders in this ranking ({period}).
                            </p>
                        </div>
                    </div>
                    {type === "trading" && (
                        <div className="shrink-0">
                            <LeaderboardFilter
                                currentSortBy={sortBy}
                                currentPeriod={period}
                                onOpenMethodology={() => setIsMethodologyOpen(true)}
                            />
                        </div>
                    )}
                </div>
                <div className="p-4">
                    <TopMedalStrip
                        entries={top3}
                        currentUserId={currentUserId}
                        onUserClick={setSelectedUser}
                        type={type}
                        sortBy={sortBy}
                    />
                </div>
            </div>

            {/* Rankings Table Section */}
            <div className="bg-white dark:bg-[#151925] rounded-2xl border border-dashboard shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-dashboard flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                            <Medal size={16} className="text-emerald-500" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-700 dark:text-white">
                                {TAB_TITLES[type] || "Rankings"}
                            </h3>
                            <p className="text-xs text-gray-500">
                                All participants with min. 10 closed trades ({period})
                            </p>
                        </div>
                    </div>
                    {type !== "trading" && (
                        <button
                            onClick={() => setIsMethodologyOpen(true)}
                            className="text-xs text-gray-400 hover:text-amber-500 font-semibold transition-colors"
                        >
                            Methodology & Rules
                        </button>
                    )}
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
                        sortBy={sortBy}
                    />
                </div>
            </div>

            <AnimatePresence>
                {selectedUser && (
                    <UserProfileCard
                        entry={selectedUser}
                        onClose={() => setSelectedUser(null)}
                    />
                )}
            </AnimatePresence>

            <LeaderboardMethodologyModal
                isOpen={isMethodologyOpen}
                onClose={() => setIsMethodologyOpen(false)}
            />
        </div>
    );
}
