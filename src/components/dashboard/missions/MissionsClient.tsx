"use client";

import { useState, useCallback, useMemo } from "react";
import {
    CalendarCheck,
    Target,
    Trophy,
    Zap,
    BookOpen,
    CheckCircle2,
    Sparkles,
    Clock,
} from "lucide-react";
import { MissionCard } from "./MissionCard";
import { NextBestActionCard } from "./NextBestActionCard";
import { StreakCalendarGrid } from "./StreakCalendarGrid";
import { TraderTierCard } from "./TraderTierCard";
import { getMyMissions } from "@/actions/edge-missions";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { cn } from "@/lib/utils";
import type { MissionProgressItem } from "@/lib/services/edge-missions.service";

interface MissionsClientProps {
    initialMissions: MissionProgressItem[];
    userXp: number;
}

const CATEGORY_TABS = [
    { key: "ALL", label: "All Missions", icon: Target },
    { key: "DAILY", label: "Daily Sprint", icon: CalendarCheck },
    { key: "ONBOARDING", label: "Onboarding", icon: Zap },
    { key: "WEEKLY", label: "Weekly Routine", icon: Trophy },
    { key: "MASTERY", label: "Mastery", icon: BookOpen },
] as const;

type CategoryFilter = (typeof CATEGORY_TABS)[number]["key"];
type StatusFilter = "ALL" | "CLAIMABLE" | "IN_PROGRESS" | "CLAIMED";

function getNextBestMission(missions: MissionProgressItem[]) {
    // 1. Prioritize claimable missions
    const claimable = missions
        .filter((m) => m.completed && !m.claimed)
        .sort((a, b) => a.def.priority - b.def.priority);

    if (claimable.length > 0) return claimable[0];

    // 2. In-progress missions with actual activity
    const inProgress = missions
        .filter((m) => !m.completed && m.progress > 0)
        .sort((a, b) => {
            const aPct = a.progress / a.target;
            const bPct = b.progress / b.target;
            return bPct - aPct || a.def.priority - b.def.priority;
        });

    if (inProgress.length > 0) return inProgress[0];

    // 3. First unclaimed mission by priority
    return (
        missions
            .filter((m) => !m.claimed)
            .sort((a, b) => a.def.priority - b.def.priority)[0] ?? null
    );
}

export function MissionsClient({
    initialMissions,
    userXp,
}: MissionsClientProps) {
    const [missions, setMissions] = useState(initialMissions);
    const [xp, setXp] = useState(userXp);
    const [activeCategory, setActiveCategory] = useState<CategoryFilter>("ALL");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

    const totalXpEarned = useMemo(
        () =>
            missions
                .filter((m) => m.claimed)
                .reduce((sum, m) => sum + m.def.xpReward, 0),
        [missions]
    );

    const completedCount = useMemo(
        () => missions.filter((m) => m.claimed).length,
        [missions]
    );

    const claimableCount = useMemo(
        () => missions.filter((m) => m.completed && !m.claimed).length,
        [missions]
    );

    const inProgressCount = useMemo(
        () => missions.filter((m) => !m.completed).length,
        [missions]
    );

    const filteredMissions = useMemo(() => {
        return missions.filter((m) => {
            // Category filter
            if (activeCategory !== "ALL" && m.def.category !== activeCategory) {
                return false;
            }

            // Status filter
            if (statusFilter === "CLAIMABLE") {
                return m.completed && !m.claimed;
            }
            if (statusFilter === "IN_PROGRESS") {
                return !m.completed;
            }
            if (statusFilter === "CLAIMED") {
                return m.claimed;
            }

            return true;
        });
    }, [missions, activeCategory, statusFilter]);

    const handleClaimed = useCallback(async () => {
        const result = await getMyMissions();
        if (result.missions) setMissions(result.missions);
        if (result.xp !== undefined) setXp(result.xp);
    }, []);

    const nextBestMission = useMemo(
        () => getNextBestMission(missions),
        [missions]
    );

    return (
        <div className="space-y-8">
            {/* Main Command Center Layout (2 Columns) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left / Primary Column: Active Focus Sprint + Missions Explorer */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Active Focus Sprint (Next Best Action Hero) */}
                    <NextBestActionCard
                        mission={nextBestMission}
                        onClaimed={handleClaimed}
                    />

                    {/* Missions Explorer Header & Filter Tabs */}
                    <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-dashboard dark:border-white/[0.08] p-5 sm:p-6 shadow-sm space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <h2 className="text-base font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                                    <Sparkles size={16} className="text-gold" />
                                    Explore Milestones
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Complete disciplined execution tasks to level up your trader tier.
                                </p>
                            </div>

                            {/* Status Filter Pills */}
                            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setStatusFilter("ALL")}
                                    className={cn(
                                        "px-2.5 py-1 h-auto rounded-lg text-xs font-bold transition-colors whitespace-nowrap",
                                        statusFilter === "ALL"
                                            ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-xs hover:bg-gray-900 dark:hover:bg-white"
                                            : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
                                    )}
                                >
                                    All ({missions.length})
                                </Button>
                                {claimableCount > 0 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setStatusFilter("CLAIMABLE")}
                                        className={cn(
                                            "px-2.5 py-1 h-auto rounded-lg text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1",
                                            statusFilter === "CLAIMABLE"
                                                ? "bg-gold text-white shadow-xs hover:bg-gold"
                                                : "text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20"
                                        )}
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                        Ready ({claimableCount})
                                    </Button>
                                )}
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setStatusFilter("IN_PROGRESS")}
                                    className={cn(
                                        "px-2.5 py-1 h-auto rounded-lg text-xs font-bold transition-colors whitespace-nowrap",
                                        statusFilter === "IN_PROGRESS"
                                            ? "bg-gold text-white shadow-xs hover:bg-gold"
                                            : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
                                    )}
                                >
                                    In Progress ({inProgressCount})
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setStatusFilter("CLAIMED")}
                                    className={cn(
                                        "px-2.5 py-1 h-auto rounded-lg text-xs font-bold transition-colors whitespace-nowrap",
                                        statusFilter === "CLAIMED"
                                            ? "bg-amber-600 text-white shadow-xs hover:bg-amber-600"
                                            : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
                                    )}
                                >
                                    Claimed ({completedCount})
                                </Button>
                            </div>
                        </div>

                        {/* Category Tabs */}
                        <Tabs
                            value={activeCategory}
                            onValueChange={(v) => setActiveCategory(v as CategoryFilter)}
                            tabsId="missions-category-tabs"
                        >
                            <div className="overflow-x-auto scrollbar-hide flex">
                                <TabsList className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-1 gap-1 shrink-0 h-auto overflow-x-auto scrollbar-hide flex">
                                    {CATEGORY_TABS.map((tab) => (
                                        <TabsTrigger
                                            key={tab.key}
                                            value={tab.key}
                                            className="px-3 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap border border-transparent hover:border-dashboard dark:hover:border-white/10 gap-1.5"
                                            activeIndicatorClassName="!bg-gradient-to-r from-gold to-amber-600 shadow-md shadow-amber-500/20 border-transparent"
                                            activeTextClassName="!text-white"
                                        >
                                            <tab.icon size={14} className="shrink-0" />
                                            <span>{tab.label}</span>
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </div>

                            {/* Mission Cards Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                {filteredMissions.map((mission) => (
                                    <MissionCard
                                        key={mission.missionId}
                                        mission={mission}
                                        onClaimed={handleClaimed}
                                    />
                                ))}
                            </div>

                            {filteredMissions.length === 0 && (
                                <div className="text-center py-12 rounded-xl border border-dashed border-dashboard dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.01]">
                                    <Target
                                        size={32}
                                        className="mx-auto mb-2 text-gray-400 opacity-60"
                                    />
                                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                        No missions match this filter
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        Try switching to a different category or status above.
                                    </p>
                                </div>
                            )}
                        </Tabs>
                    </div>
                </div>

                {/* Right / Side Column: Trader Tier Card + Quick Stats Matrix */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Trader Tier Progression Card */}
                    <TraderTierCard userXp={xp} />

                    {/* Quick Stats Matrix */}
                    <div className="rounded-xl border border-dashboard dark:border-white/[0.08] bg-white dark:bg-[#1E2028] p-5 shadow-sm space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                            Discipline Matrix
                        </h4>

                        <div className="grid grid-cols-2 gap-2.5">
                            {/* Card 1: Completed */}
                            <div className="p-3 rounded-lg bg-gray-50/80 dark:bg-white/[0.03] border border-dashboard dark:border-white/[0.05]">
                                <div className="flex items-center gap-1.5 text-gray-400 text-[11px] font-semibold mb-1">
                                    <CheckCircle2 size={13} className="text-gold" />
                                    <span>Completed</span>
                                </div>
                                <span className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">
                                    {completedCount}/{missions.length}
                                </span>
                            </div>

                            {/* Card 2: Ready to Claim */}
                            <div className="p-3 rounded-lg bg-gray-50/80 dark:bg-white/[0.03] border border-dashboard dark:border-white/[0.05]">
                                <div className="flex items-center gap-1.5 text-gray-400 text-[11px] font-semibold mb-1">
                                    <Zap size={13} className="text-amber-500" />
                                    <span>Unclaimed</span>
                                </div>
                                <span className="text-lg font-bold text-amber-500 tabular-nums">
                                    {claimableCount}
                                </span>
                            </div>

                            {/* Card 3: Total Edge Earned */}
                            <div className="p-3 rounded-lg bg-gray-50/80 dark:bg-white/[0.03] border border-dashboard dark:border-white/[0.05]">
                                <div className="flex items-center gap-1.5 text-gray-400 text-[11px] font-semibold mb-1">
                                    <Trophy size={13} className="text-gold" />
                                    <span>Edge Earned</span>
                                </div>
                                <span className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">
                                    +{totalXpEarned.toLocaleString()}
                                </span>
                            </div>

                            {/* Card 4: Active Milestones */}
                            <div className="p-3 rounded-lg bg-gray-50/80 dark:bg-white/[0.03] border border-dashboard dark:border-white/[0.05]">
                                <div className="flex items-center gap-1.5 text-gray-400 text-[11px] font-semibold mb-1">
                                    <Clock size={13} className="text-sky-500" />
                                    <span>In Progress</span>
                                </div>
                                <span className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">
                                    {inProgressCount}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Full-Width Row: Trading Consistency Calendar */}
            <div className="w-full pt-2">
                <StreakCalendarGrid />
            </div>
        </div>
    );
}
