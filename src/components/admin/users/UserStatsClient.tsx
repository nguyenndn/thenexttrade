"use client";

import { Users, UserPlus, Zap } from "lucide-react";
import { AnimatedStatCard } from "@/components/admin/dashboard/AnimatedStatCard";

interface HeroStat {
 value: number;
 sparkline: number[];
 trendPercent: number | null;
}

interface UserStatsClientProps {
 totalUsers: HeroStat;
 newUsers: HeroStat;
 activeTraders: HeroStat;
}

export function UserStatsClient({
 totalUsers,
 newUsers,
 activeTraders,
}: UserStatsClientProps) {
 return (
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <AnimatedStatCard
 title="Total Users"
 value={totalUsers.value}
 sparklineData={totalUsers.sparkline}
 trendPercent={totalUsers.trendPercent}
 icon={Users}
 color="blue"
 index={0}
 />
 <AnimatedStatCard
 title="New (Last 7 Days)"
 value={newUsers.value}
 sparklineData={newUsers.sparkline}
 trendPercent={newUsers.trendPercent}
 icon={UserPlus}
 color="green"
 index={1}
 />
 <AnimatedStatCard
 title="Active Traders"
 value={activeTraders.value}
 sparklineData={activeTraders.sparkline}
 trendPercent={activeTraders.trendPercent}
 icon={Zap}
 color="amber"
 index={2}
 />
 </div>
 );
}
