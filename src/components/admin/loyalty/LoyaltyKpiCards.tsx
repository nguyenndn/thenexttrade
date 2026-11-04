"use client";

import type { AdminLoyaltyStats } from "@/actions/admin/loyalty";
import { Clock, CheckCircle2, TrendingUp, Users } from "lucide-react";
import { AnimatedStatCard } from "@/components/admin/dashboard/AnimatedStatCard";

interface LoyaltyKpiCardsProps {
    stats: AdminLoyaltyStats;
}

export function LoyaltyKpiCards({ stats }: LoyaltyKpiCardsProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <AnimatedStatCard
                title="Pending Claims"
                value={stats.pendingCount}
                icon={Clock}
                color="amber"
                index={0}
                trendPercent={null}
            />
            <AnimatedStatCard
                title="Total Disbursed"
                value={stats.completedAmount}
                prefix="$"
                suffix="USDT"
                icon={CheckCircle2}
                color="emerald"
                index={1}
                trendPercent={null}
            />
            <AnimatedStatCard
                title="Processed Volume"
                value={stats.totalVolumeLots}
                suffix="Lots"
                icon={TrendingUp}
                color="amber"
                index={2}
                trendPercent={null}
            />
            <AnimatedStatCard
                title="High-Volume Traders"
                value={stats.topTradersCount}
                icon={Users}
                color="amber"
                index={3}
                trendPercent={null}
            />
        </div>
    );
}
