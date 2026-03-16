"use client";

import Link from "next/link";
import {
    Clock,
    CheckCircle,
    Bot,
    Download,
    Users,
    Briefcase,
    Settings,
    CheckCircle2,
    XCircle,
    ArrowRight,
} from "lucide-react";
import { AnimatedStatCard } from "@/components/admin/dashboard/AnimatedStatCard";
import { AnimatedSection } from "@/components/admin/dashboard/AnimatedSection";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";

interface HeroStat {
    value: number;
    sparkline: number[];
    trendPercent: number | null;
}

interface ActivityItem {
    id: string;
    action: "APPROVED" | "REJECTED";
    accountNumber: string;
    broker: string;
    userName: string | null;
    timestamp: Date;
}

interface EADashboardClientProps {
    pending: HeroStat;
    active: HeroStat;
    products: HeroStat;
    downloads: HeroStat;
    recentActivity: ActivityItem[];
}

const quickActions = [
    {
        title: "All Licenses",
        href: "/admin/ea/accounts",
        icon: Users,
        textColor: "text-blue-500",
        bgColor: "bg-blue-50 dark:bg-blue-500/10",
    },
    {
        title: "EA Products",
        href: "/admin/ea/products",
        icon: Bot,
        textColor: "text-cyan-500",
        bgColor: "bg-cyan-50 dark:bg-cyan-500/10",
    },
    {
        title: "Brokers",
        href: "/admin/ea/brokers",
        icon: Briefcase,
        textColor: "text-amber-500",
        bgColor: "bg-amber-50 dark:bg-amber-500/10",
    },
    {
        title: "Settings",
        href: "/admin/ea/settings",
        icon: Settings,
        textColor: "text-emerald-500",
        bgColor: "bg-emerald-50 dark:bg-emerald-500/10",
    },
];

export function EADashboardClient({
    pending,
    active,
    products,
    downloads,
    recentActivity,
}: EADashboardClientProps) {
    return (
        <div className="space-y-4">
            {/* ── Zone A: Hero Stats ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <AnimatedStatCard
                    title="Pending Requests"
                    value={pending.value}
                    sparklineData={pending.sparkline}
                    trendPercent={pending.trendPercent}
                    icon={Clock}
                    color="amber"
                    index={0}
                />
                <AnimatedStatCard
                    title="Active Licenses"
                    value={active.value}
                    sparklineData={active.sparkline}
                    trendPercent={active.trendPercent}
                    icon={CheckCircle}
                    color="green"
                    index={1}
                />
                <AnimatedStatCard
                    title="Active Products"
                    value={products.value}
                    sparklineData={products.sparkline}
                    trendPercent={products.trendPercent}
                    icon={Bot}
                    color="cyan"
                    index={2}
                />
                <AnimatedStatCard
                    title="Total Downloads"
                    value={downloads.value}
                    sparklineData={downloads.sparkline}
                    trendPercent={downloads.trendPercent}
                    icon={Download}
                    color="blue"
                    index={3}
                />
            </div>

            {/* ── Zone B: Quick Actions Strip ── */}
            <AnimatedSection delay={0.3}>
                <div className="bg-white dark:bg-[#0B0E14] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {quickActions.map((action) => (
                            <Link
                                key={action.href}
                                href={action.href}
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-white/10 group"
                            >
                                <div className={`p-2.5 rounded-xl ${action.bgColor} ${action.textColor} group-hover:scale-110 transition-transform`}>
                                    <action.icon size={18} aria-hidden="true" />
                                </div>
                                <span className="font-bold text-sm text-gray-900 dark:text-white">{action.title}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </AnimatedSection>

            {/* ── Zone C: Activity Timeline ── */}
            {recentActivity.length > 0 && (
                <AnimatedSection delay={0.5}>
                    <div className="bg-white dark:bg-[#0B0E14] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                                Recent Activity
                            </h2>
                            <Link
                                href="/admin/ea/accounts"
                                className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                            >
                                View All <ArrowRight size={14} />
                            </Link>
                        </div>
                        <div className="space-y-0">
                            {recentActivity.map((item, idx) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, x: -12 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.6 + idx * 0.08, duration: 0.3 }}
                                    className="flex items-center gap-4 py-3 border-b border-gray-100 dark:border-white/5 last:border-0"
                                >
                                    {/* Status Icon */}
                                    <div className={`p-2 rounded-xl shrink-0 ${
                                        item.action === "APPROVED"
                                            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500"
                                            : "bg-red-50 dark:bg-red-500/10 text-red-500"
                                    }`}>
                                        {item.action === "APPROVED" ? (
                                            <CheckCircle2 size={16} />
                                        ) : (
                                            <XCircle size={16} />
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-900 dark:text-white font-medium truncate">
                                            <span className="font-mono text-xs text-gray-500 dark:text-gray-400 mr-1.5">
                                                {item.accountNumber}
                                            </span>
                                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                                                item.action === "APPROVED"
                                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                                                    : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                                            }`}>
                                                {item.action}
                                            </span>
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                                            {item.userName || "Unknown"} · {item.broker}
                                        </p>
                                    </div>

                                    {/* Time */}
                                    <span className="text-xs text-gray-400 shrink-0">
                                        {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true, locale: enUS })}
                                    </span>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </AnimatedSection>
            )}
        </div>
    );
}
