"use client";

import { AlertCircle, CheckCircle2, Clock, Flame } from "lucide-react";
import { AnimatedStatCard } from "@/components/admin/dashboard/AnimatedStatCard";

interface BehaviorMetricsSummary {
    needsAttentionCount: number;
    valueTradersCount: number;
    lossStreakCount: number;
    steadyTradersCount: number;
    registeredNeverTradedCount: number;
}

interface BehaviorStatsGridProps {
    summary?: BehaviorMetricsSummary | null;
}

export function BehaviorStatsGrid({ summary }: BehaviorStatsGridProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <AnimatedStatCard
                title="Needs Attention"
                value={summary?.needsAttentionCount ?? 0}
                trendPercent={null}
                icon={AlertCircle}
                color="amber"
                index={0}
            />
            <AnimatedStatCard
                title="Steady Active"
                value={summary?.steadyTradersCount ?? 0}
                trendPercent={null}
                icon={CheckCircle2}
                color="emerald"
                index={1}
            />
            <AnimatedStatCard
                title="Loss Streaks"
                value={summary?.lossStreakCount ?? 0}
                trendPercent={null}
                icon={Flame}
                color="amber"
                index={2}
            />
            <AnimatedStatCard
                title="Never Synced"
                value={summary?.registeredNeverTradedCount ?? 0}
                trendPercent={null}
                icon={Clock}
                color="blue"
                index={3}
            />
        </div>
    );
}
