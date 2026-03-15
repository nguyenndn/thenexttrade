"use client";

import { Users, FileText, Activity, Eye, GraduationCap, BrainCircuit, MessageSquare, BarChart3 } from "lucide-react";
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
    articles: HeroStat;
    trades: HeroStat;
    views: HeroStat;
    lessonsCount: number;
    quizzesCount: number;
    commentsCount: number;
    tradingVolume: number;
}

export function AdminDashboardClient(props: Props) {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
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
                        <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tighter">
                            {greeting} 👋
                        </h1>
                    </div>
                    <p className="text-base text-gray-500 dark:text-gray-400 font-medium pl-4.5">
                        Here&apos;s what&apos;s happening in your platform today.
                    </p>
                </div>
                <div className="text-sm text-gray-400 font-medium pl-4.5 md:pl-0">
                    {dateStr}
                </div>
            </motion.div>

            {/* Hero Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    title="Published Articles"
                    value={props.articles.value}
                    sparklineData={props.articles.sparkline}
                    trendPercent={props.articles.trendPercent}
                    icon={FileText}
                    color="emerald"
                    index={1}
                />
                <AnimatedStatCard
                    title="Trading Logs"
                    value={props.trades.value}
                    sparklineData={props.trades.sparkline}
                    trendPercent={props.trades.trendPercent}
                    icon={Activity}
                    color="cyan"
                    index={2}
                />
                <AnimatedStatCard
                    title="Total Views"
                    value={props.views.value}
                    sparklineData={props.views.sparkline}
                    trendPercent={props.views.trendPercent}
                    icon={Eye}
                    color="green"
                    index={3}
                />
            </div>

            {/* Compact Secondary Stats */}
            <CompactStatsRow
                stats={[
                    { title: "Lessons", value: props.lessonsCount.toLocaleString(), icon: GraduationCap, color: "amber" },
                    { title: "Quizzes", value: props.quizzesCount.toLocaleString(), icon: BrainCircuit, color: "teal" },
                    { title: "Comments", value: props.commentsCount.toLocaleString(), icon: MessageSquare, color: "rose" },
                    { title: "Volume", value: `${props.tradingVolume.toFixed(2)} Lots`, icon: BarChart3, color: "indigo" },
                ]}
            />
        </div>
    );
}
