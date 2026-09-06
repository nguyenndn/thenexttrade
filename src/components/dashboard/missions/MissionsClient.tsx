"use client";

import { useState, useCallback } from "react";
import { CalendarCheck, Target, Trophy, Zap, BookOpen, CheckCircle2 } from "lucide-react";
import { MissionCard } from "./MissionCard";
import { NextBestActionCard } from "./NextBestActionCard";
import { StreakCalendarGrid } from "./StreakCalendarGrid";
import { getMyMissions } from "@/actions/edge-missions";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { cn } from "@/lib/utils";
import type { MissionProgressItem } from "@/lib/services/edge-missions.service";

interface MissionsClientProps {
    initialMissions: MissionProgressItem[];
    userXp: number;
}

const CATEGORY_TABS = [
    { key: "ALL", label: "All Missions", icon: Target },
    { key: "DAILY", label: "Daily", icon: CalendarCheck },
    { key: "ONBOARDING", label: "Onboarding", icon: Zap },
    { key: "WEEKLY", label: "Weekly", icon: Trophy },
    { key: "MASTERY", label: "Mastery", icon: BookOpen },
] as const;

type CategoryFilter = (typeof CATEGORY_TABS)[number]["key"];

function getNextBestMission(missions: MissionProgressItem[]) {
    const claimable = missions
        .filter((m) => m.completed && !m.claimed)
        .sort((a, b) => a.def.priority - b.def.priority);

    if (claimable.length > 0) return claimable[0];

    const inProgress = missions
        .filter((m) => !m.completed && m.progress > 0)
        .sort((a, b) => {
            const aPct = a.progress / a.target;
            const bPct = b.progress / b.target;
            return bPct - aPct || a.def.priority - b.def.priority;
        });

    if (inProgress.length > 0) return inProgress[0];

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
    const [activeTab, setActiveTab] = useState<CategoryFilter>("ALL");

    const totalXpEarned = missions
        .filter((m) => m.claimed)
        .reduce((sum, m) => sum + m.def.xpReward, 0);

    const completedCount = missions.filter((m) => m.claimed).length;
    const claimableCount = missions.filter(
        (m) => m.completed && !m.claimed
    ).length;

    const filtered =
        activeTab === "ALL"
            ? missions
            : missions.filter((m) => m.def.category === activeTab);

    const handleClaimed = useCallback(async () => {
        const result = await getMyMissions();
        if (result.missions) setMissions(result.missions);
        if (result.xp !== undefined) setXp(result.xp);
    }, []);

    const nextBestMission = getNextBestMission(missions);

    return (
        <div className="space-y-8">
            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                    label="Total Edge"
                    value={xp.toLocaleString()}
                    icon={Zap}
                    color="text-amber-500"
                />
                <StatCard
                    label="Missions Completed"
                    value={`${completedCount}/${missions.length}`}
                    icon={Trophy}
                    color="text-emerald-500"
                />
                <StatCard
                    label="Edge Earned"
                    value={totalXpEarned.toLocaleString()}
                    icon={Target}
                    color="text-primary"
                />
                <StatCard
                    label="Ready to Claim"
                    value={String(claimableCount)}
                    icon={CheckCircle2}
                    color="text-amber-500"
                />
            </div>

            {/* Next Best Action */}
            <NextBestActionCard
                mission={nextBestMission}
                onClaimed={handleClaimed}
            />

            {/* Visual Streak Contribution Grid */}
            <StreakCalendarGrid />

            {/* Explore Missions */}
            <div className="space-y-6">
                <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight mb-4">
                        Explore Missions
                    </h2>
                    <Tabs
                        value={activeTab}
                        onValueChange={(v) => setActiveTab(v as CategoryFilter)}
                        tabsId="edge-missions"
                    >
                        <div className="overflow-x-auto scrollbar-hide flex mb-6">
                            <TabsList className="bg-[#F1F3F5] dark:bg-[#1A1D27] p-1 rounded-xl border border-dashboard h-auto overflow-x-auto scrollbar-hide flex gap-1 shrink-0">
                                {CATEGORY_TABS.map((tab) => (
                                    <TabsTrigger
                                        key={tab.key}
                                        value={tab.key}
                                        className="px-3 sm:px-4 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap border border-transparent hover:border-dashboard dark:hover:border-white/10 gap-1.5 sm:gap-2"
                                        activeIndicatorClassName="!bg-gradient-to-r from-primary to-teal-500 shadow-md border-transparent"
                                        activeTextClassName="!text-white"
                                    >
                                        <tab.icon
                                            size={14}
                                            className="sm:w-4 sm:h-4"
                                        />
                                        <span>{tab.label}</span>
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>

                        {/* Mission Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filtered.map((mission) => (
                                <MissionCard
                                    key={mission.missionId}
                                    mission={mission}
                                    onClaimed={handleClaimed}
                                />
                            ))}
                        </div>

                        {filtered.length === 0 && (
                            <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                                <Target
                                    size={32}
                                    className="mx-auto mb-3 opacity-50"
                                />
                                <p className="text-sm font-medium">
                                    No missions in this category yet.
                                </p>
                            </div>
                        )}
                    </Tabs>
                </div>
            </div>
        </div>
    );
}

function StatCard({
    label,
    value,
    icon: Icon,
    color,
}: {
    label: string;
    value: string;
    icon: React.ElementType;
    color: string;
}) {
    return (
        <div className="rounded-xl border border-dashboard dark:border-white/[0.08] bg-white dark:bg-[#1E2028] p-4 shadow-sm">
            <div className="flex items-center gap-3">
                <div
                    className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center bg-gray-50 dark:bg-white/5 shrink-0",
                        color
                    )}
                >
                    <Icon size={16} />
                </div>
                <div>
                    <p className="text-xl font-bold text-gray-900 dark:text-white tabular-nums">
                        {value}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                        {label}
                    </p>
                </div>
            </div>
        </div>
    );
}
