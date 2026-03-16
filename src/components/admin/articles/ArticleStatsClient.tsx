"use client";

import { Eye, BarChart2, Globe, Clock } from "lucide-react";
import { AnimatedStatCard } from "@/components/admin/dashboard/AnimatedStatCard";

interface HeroStat {
    value: number;
    sparkline: number[];
    trendPercent: number | null;
}

interface ArticleStatsClientProps {
    totalViews: HeroStat;
    avgViews: HeroStat;
    published: HeroStat;
    pending: HeroStat;
}

export function ArticleStatsClient({
    totalViews,
    avgViews,
    published,
    pending,
}: ArticleStatsClientProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <AnimatedStatCard
                title="Total Views"
                value={totalViews.value}
                sparklineData={totalViews.sparkline}
                trendPercent={totalViews.trendPercent}
                icon={Eye}
                color="blue"
                index={0}
            />
            <AnimatedStatCard
                title="Avg. Read"
                value={avgViews.value}
                sparklineData={avgViews.sparkline}
                trendPercent={avgViews.trendPercent}
                icon={BarChart2}
                color="cyan"
                index={1}
            />
            <AnimatedStatCard
                title="Published"
                value={published.value}
                sparklineData={published.sparkline}
                trendPercent={published.trendPercent}
                icon={Globe}
                color="green"
                index={2}
            />
            <AnimatedStatCard
                title="Pending"
                value={pending.value}
                sparklineData={pending.sparkline}
                trendPercent={pending.trendPercent}
                icon={Clock}
                color="amber"
                index={3}
            />
        </div>
    );
}
