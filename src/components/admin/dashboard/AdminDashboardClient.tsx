"use client";

import {
    Users,
    Activity,
    Crown,
    Magnet,
    ShieldCheck,
    GraduationCap,
    BarChart3,
} from "lucide-react";
import { AnimatedStatCard } from "./AnimatedStatCard";
import { CompactStatsRow } from "./CompactStatsRow";
import { motion } from "framer-motion";

interface HeroStat {
    value: number;
    sparkline: number[];
    trendPercent: number | null;
}

interface Props {
    users: HeroStat;
    tradingAccounts: HeroStat;
    vipRequests: HeroStat;
    ibLeadsCount: number;
    proEntitlementsCount: number;
    tradingVolume: number;
    lessonsCount: number;
}

export function AdminDashboardClient(props: Props) {
    const hour = new Date().getHours();
    const greeting =
        hour < 12
            ? "Good morning"
            : hour < 17
              ? "Good afternoon"
              : "Good evening";
    const dateStr = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    return (
        <div className="space-y-4">
            {/* Welcome Banner */}
            <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 dark:border-white/10 pb-8"
            >
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 bg-primary rounded-full" />
                        <h1 className="text-xl font-black text-gray-700 dark:text-white tracking-tighter">
                            {greeting}
                        </h1>
                    </div>
                    <p className="text-base text-gray-600 dark:text-gray-300 font-medium pl-4.5">
                        Here&apos;s what&apos;s happening in your CRM today.
                    </p>
                </div>
                <div className="text-sm text-gray-500 font-medium pl-4.5 md:pl-0">
                    {dateStr}
                </div>
            </motion.div>

            {/* Hero Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatedStatCard
                    title="Total Users"
                    value={props.users.value}
                    sparklineData={props.users.sparkline}
                    trendPercent={props.users.trendPercent}
                    icon={Users}
                    color="blue"
                    index={0}
                />
                <AnimatedStatCard
                    title="Trading Accounts"
                    value={props.tradingAccounts.value}
                    sparklineData={props.tradingAccounts.sparkline}
                    trendPercent={props.tradingAccounts.trendPercent}
                    icon={Activity}
                    color="emerald"
                    index={1}
                />
                <AnimatedStatCard
                    title="Pending VIPs"
                    value={props.vipRequests.value}
                    sparklineData={props.vipRequests.sparkline}
                    trendPercent={props.vipRequests.trendPercent}
                    icon={Crown}
                    color="cyan"
                    index={2}
                />
            </div>

            {/* Compact Secondary Stats */}
            <CompactStatsRow
                stats={[
                    {
                        title: "IB Leads",
                        value: props.ibLeadsCount.toLocaleString(),
                        icon: Magnet,
                        color: "amber",
                    },
                    {
                        title: "Pro Users",
                        value: props.proEntitlementsCount.toLocaleString(),
                        icon: ShieldCheck,
                        color: "teal",
                    },
                    {
                        title: "Volume",
                        value: `${props.tradingVolume.toFixed(2)} Lots`,
                        icon: BarChart3,
                        color: "indigo",
                    },
                    {
                        title: "Lessons",
                        value: props.lessonsCount.toLocaleString(),
                        icon: GraduationCap,
                        color: "rose",
                    },
                ]}
            />
        </div>
    );
}
