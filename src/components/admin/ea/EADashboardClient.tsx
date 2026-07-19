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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { BrokerLogo } from "@/components/ui/BrokerLogo";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AccountStatus } from "@prisma/client";

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

interface PendingLicense {
    id: string;
    broker: string;
    accountNumber: string;
    status: AccountStatus;
    createdAt: Date;
    user: {
        name: string | null;
        email: string | null;
    };
}

interface BrokerStat {
    broker: string;
    _count: {
        id: number;
    };
}

interface EADashboardClientProps {
    pending: HeroStat;
    active: HeroStat;
    products: HeroStat;
    downloads: HeroStat;
    recentActivity: ActivityItem[];
    recentPending: PendingLicense[];
    brokerStats: BrokerStat[];
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
    recentPending,
    brokerStats,
}: EADashboardClientProps) {
    return (
        <div className="space-y-6">
            <Tabs
                defaultValue="overview"
                className="mt-2"
                tabsId="ea-dashboard-tabs"
            >
                <div className="overflow-x-auto scrollbar-hide pb-2 flex">
                    <TabsList className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-1 gap-1 shrink-0">
                        {[
                            { id: "overview", label: "Overview" },
                            { id: "pending", label: "Pending Review" },
                            { id: "analytics", label: "Analytics" },
                        ].map((t) => (
                            <TabsTrigger
                                key={t.id}
                                value={t.id}
                                className="px-4 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-colors"
                                activeIndicatorClassName="!bg-gradient-to-r from-primary to-teal-500 shadow-md border-0"
                                activeTextClassName="!text-white"
                            >
                                {t.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                {/* ── Tab 1: Overview ── */}
                <TabsContent
                    value="overview"
                    className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300"
                >
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

                    <AnimatedSection delay={0.3}>
                        <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-5 group hover:shadow-md transition-shadow">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {quickActions.map((action) => (
                                    <Link
                                        key={action.href}
                                        href={action.href}
                                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-white/10 group/item"
                                    >
                                        <div
                                            className={`p-2.5 rounded-xl ${action.bgColor} ${action.textColor} group-hover/item:scale-110 transition-transform`}
                                        >
                                            <action.icon
                                                size={18}
                                                aria-hidden="true"
                                            />
                                        </div>
                                        <span className="font-bold text-sm text-gray-700 dark:text-white">
                                            {action.title}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </AnimatedSection>

                    {recentActivity.length > 0 && (
                        <AnimatedSection delay={0.5}>
                            <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-6 group hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-sm font-bold text-gray-700 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                        <Clock
                                            className="text-primary"
                                            size={18}
                                        />
                                        Recent Activity
                                    </h2>
                                    <Link
                                        href="/admin/ea/accounts"
                                        className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg"
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
                                            transition={{
                                                delay: 0.6 + idx * 0.08,
                                                duration: 0.3,
                                            }}
                                            className="flex items-center gap-4 py-4 border-b border-gray-100 dark:border-white/5 last:border-0 hover:bg-gray-50 dark:hover:bg-white/[0.02] px-2 -mx-2 rounded-xl transition-colors"
                                        >
                                            {/* Status Icon */}
                                            <div
                                                className={`p-2 rounded-xl shrink-0 ${
                                                    item.action === "APPROVED"
                                                        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500"
                                                        : "bg-red-50 dark:bg-red-500/10 text-red-500"
                                                }`}
                                            >
                                                {item.action === "APPROVED" ? (
                                                    <CheckCircle2 size={16} />
                                                ) : (
                                                    <XCircle size={16} />
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-gray-700 dark:text-white font-medium truncate flex items-center gap-2">
                                                    <span className="font-mono text-sm font-bold text-gray-800 dark:text-gray-200">
                                                        {item.accountNumber}
                                                    </span>
                                                    <span
                                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wider ${
                                                            item.action ===
                                                            "APPROVED"
                                                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                                                                : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                                                        }`}
                                                    >
                                                        {item.action}
                                                    </span>
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1 truncate">
                                                    <span className="font-medium text-gray-600 dark:text-gray-400">
                                                        {item.userName ||
                                                            "Unknown"}
                                                    </span>{" "}
                                                    • {item.broker}
                                                </p>
                                            </div>

                                            {/* Time */}
                                            <span className="text-xs font-medium text-gray-400 shrink-0">
                                                {formatDistanceToNow(
                                                    new Date(item.timestamp),
                                                    {
                                                        addSuffix: true,
                                                        locale: enUS,
                                                    }
                                                )}
                                            </span>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </AnimatedSection>
                    )}
                </TabsContent>

                {/* ── Tab 2: Pending Review ── */}
                <TabsContent
                    value="pending"
                    className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300"
                >
                    <AnimatedSection delay={0.1}>
                        <div className="bg-white dark:bg-[#1E2028] rounded-xl p-6 border border-gray-200 dark:border-white/10 shadow-sm flex flex-col group hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-sm font-bold text-gray-700 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                    <Clock
                                        className="text-amber-500"
                                        size={18}
                                    />
                                    Pending Requests
                                </h2>
                                <Link
                                    href="/admin/ea/accounts/pending"
                                    className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg"
                                >
                                    Manage Requests <ArrowRight size={14} />
                                </Link>
                            </div>

                            <div className="space-y-3 flex-1">
                                {recentPending.length === 0 ? (
                                    <div className="text-center py-16 text-gray-500 dark:text-gray-400 border border-dashed border-gray-200 dark:border-white/10 rounded-xl">
                                        <CheckCircle
                                            size={40}
                                            className="mx-auto mb-4 text-emerald-400 dark:text-emerald-500/50"
                                            aria-hidden="true"
                                        />
                                        <p className="text-base font-medium">
                                            All caught up!
                                        </p>
                                        <p className="text-sm mt-1">
                                            No pending requests require
                                            attention.
                                        </p>
                                    </div>
                                ) : (
                                    recentPending.map((license) => (
                                        <div
                                            key={license.id}
                                            className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/20 hover:shadow-sm transition-all group/item"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 bg-white dark:bg-[#151925] rounded-xl shadow-sm border border-gray-100 dark:border-white/5 group-hover/item:shadow-md transition-shadow">
                                                    <BrokerLogo
                                                        broker={license.broker}
                                                        size={40}
                                                    />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-base text-gray-800 dark:text-white font-mono">
                                                        {license.accountNumber}
                                                    </p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                                        {license.user.name ||
                                                            license.user.email}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right flex flex-col items-end gap-2">
                                                <span className="text-xs font-medium text-gray-400">
                                                    {formatDistanceToNow(
                                                        new Date(
                                                            license.createdAt
                                                        ),
                                                        {
                                                            addSuffix: true,
                                                            locale: enUS,
                                                        }
                                                    )}
                                                </span>
                                                <StatusBadge
                                                    status={license.status}
                                                />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </AnimatedSection>
                </TabsContent>

                {/* ── Tab 3: Analytics ── */}
                <TabsContent
                    value="analytics"
                    className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300"
                >
                    <AnimatedSection delay={0.1}>
                        <div className="bg-white dark:bg-[#1E2028] rounded-xl p-6 border border-gray-200 dark:border-white/10 shadow-sm group hover:shadow-md transition-shadow">
                            <h2 className="text-sm font-bold text-gray-700 dark:text-white uppercase tracking-wider flex items-center gap-2 mb-6">
                                <Briefcase className="text-primary" size={18} />
                                Active by Broker
                            </h2>

                            <div className="space-y-5">
                                {brokerStats.length === 0 ? (
                                    <div className="text-center py-16 text-gray-500 dark:text-gray-400 border border-dashed border-gray-200 dark:border-white/10 rounded-xl">
                                        <p className="text-base font-medium">
                                            No active licenses found.
                                        </p>
                                    </div>
                                ) : (
                                    brokerStats.map((stat) => {
                                        const maxCount =
                                            brokerStats[0]._count.id || 1;
                                        const percentage =
                                            (stat._count.id / maxCount) * 100;

                                        return (
                                            <div
                                                key={stat.broker}
                                                className="space-y-3 group/stat"
                                            >
                                                <div className="flex justify-between items-center text-sm">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-1.5 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/5 group-hover/stat:border-gray-300 dark:group-hover/stat:border-white/20 transition-colors">
                                                            <BrokerLogo
                                                                broker={
                                                                    stat.broker
                                                                }
                                                                size={28}
                                                            />
                                                        </div>
                                                        <span className="font-bold text-gray-700 dark:text-white capitalize group-hover/stat:text-primary transition-colors">
                                                            {stat.broker.toLowerCase()}
                                                        </span>
                                                    </div>
                                                    <span className="px-3 py-1 rounded-lg text-xs font-bold tracking-wider uppercase inline-flex items-center gap-2 select-none bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20 shadow-sm">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                        {stat._count.id} ACTIVE
                                                    </span>
                                                </div>
                                                <div className="h-2 w-full bg-gray-100 dark:bg-[#151925] rounded-full overflow-hidden shadow-inner">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-primary to-teal-400 rounded-full transition-all duration-1000 relative"
                                                        style={{
                                                            width: `${percentage}%`,
                                                        }}
                                                    >
                                                        <div
                                                            className="absolute inset-0 bg-white/20 w-full h-full"
                                                            style={{
                                                                background:
                                                                    "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
                                                            }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </AnimatedSection>
                </TabsContent>
            </Tabs>
        </div>
    );
}
