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
    Zap,
    Activity,
    ShieldAlert,
} from "lucide-react";
import { AnimatedStatCard } from "@/components/admin/dashboard/AnimatedStatCard";
import { AnimatedSection } from "@/components/admin/dashboard/AnimatedSection";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { BrokerLogo } from "@/components/ui/BrokerLogo";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
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
        title: "License Accounts",
        description: "View & manage active licenses",
        href: "/admin/trading-systems/accounts",
        icon: Users,
        textColor: "text-blue-500",
        bgColor: "bg-blue-50 dark:bg-blue-500/10",
        borderColor: "hover:border-blue-500/30",
    },
    {
        title: "Trading Systems",
        description: "Configure EAs & Indicators",
        href: "/admin/trading-systems/products",
        icon: Bot,
        textColor: "text-cyan-500",
        bgColor: "bg-cyan-50 dark:bg-cyan-500/10",
        borderColor: "hover:border-cyan-500/30",
    },
    {
        title: "Partner Brokers",
        description: "Broker integrations & setup",
        href: "/admin/trading-systems/brokers",
        icon: Briefcase,
        textColor: "text-amber-500",
        bgColor: "bg-amber-50 dark:bg-amber-500/10",
        borderColor: "hover:border-amber-500/30",
    },
    {
        title: "System Settings",
        description: "Global licensing rules",
        href: "/admin/trading-systems/settings",
        icon: Settings,
        textColor: "text-emerald-500",
        bgColor: "bg-emerald-50 dark:bg-emerald-500/10",
        borderColor: "hover:border-emerald-500/30",
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
                    {/* Hero Stat Cards */}
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
                            title="Trading Systems"
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

                    {/* 2-Column Main Content Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Left Column: Quick Actions & Pending Requests Queue (7 cols) */}
                        <div className="lg:col-span-7 space-y-6">
                            {/* Management Shortcuts */}
                            <AnimatedSection delay={0.2}>
                                <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                            <Zap className="text-amber-500" size={16} />
                                            Management Shortcuts
                                        </h3>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {quickActions.map((action) => (
                                            <Link
                                                key={action.href}
                                                href={action.href}
                                                className={`group p-4 rounded-xl bg-gray-50/70 dark:bg-white/[0.03] border border-gray-200/60 dark:border-white/10 ${action.borderColor} hover:bg-white dark:hover:bg-white/[0.06] hover:shadow-md transition-all flex items-start gap-3.5`}
                                            >
                                                <div
                                                    className={`p-3 rounded-xl ${action.bgColor} ${action.textColor} group-hover:scale-110 transition-transform shrink-0`}
                                                >
                                                    <action.icon size={20} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                                                            {action.title}
                                                        </h4>
                                                        <ArrowRight
                                                            size={14}
                                                            className="text-gray-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
                                                        />
                                                    </div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                                                        {action.description}
                                                    </p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </AnimatedSection>

                            {/* Pending License Queue Widget */}
                            <AnimatedSection delay={0.3}>
                                <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                <ShieldAlert className="text-amber-500" size={18} />
                                                Pending Verification Queue
                                            </h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                License requests waiting for admin approval
                                            </p>
                                        </div>
                                        <Link href="/admin/trading-systems/accounts/pending">
                                            <Button variant="outline" size="sm" className="text-xs font-bold rounded-xl">
                                                Manage All ({recentPending.length})
                                            </Button>
                                        </Link>
                                    </div>

                                    {recentPending.length === 0 ? (
                                        <div className="text-center py-10 px-4 border border-dashed border-gray-200 dark:border-white/10 rounded-xl bg-gray-50/50 dark:bg-white/[0.02]">
                                            <CheckCircle2 size={36} className="mx-auto mb-2 text-emerald-500/70" />
                                            <p className="text-sm font-bold text-gray-800 dark:text-white">
                                                Queue is Empty
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                No pending EA license verification requests right now.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {recentPending.slice(0, 4).map((license) => (
                                                <div
                                                    key={license.id}
                                                    className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50/80 dark:bg-white/[0.03] border border-gray-200/60 dark:border-white/10 hover:border-amber-500/30 transition-all"
                                                >
                                                    <div className="flex items-center gap-3.5">
                                                        <div className="p-2 bg-white dark:bg-[#151925] rounded-xl shadow-sm border border-gray-200/50 dark:border-white/10 shrink-0">
                                                            <BrokerLogo broker={license.broker} size={32} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-bold text-sm text-gray-900 dark:text-white font-mono">
                                                                #{license.accountNumber}
                                                            </p>
                                                            <p className="text-xs text-gray-500 truncate mt-0.5">
                                                                {license.user.name || license.user.email}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <span className="text-[11px] font-medium text-gray-400 block mb-1">
                                                            {formatDistanceToNow(new Date(license.createdAt), { addSuffix: true, locale: enUS })}
                                                        </span>
                                                        <StatusBadge status={license.status} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </AnimatedSection>
                        </div>

                        {/* Right Column: Broker Breakdown & Activity Timeline (5 cols) */}
                        <div className="lg:col-span-5 space-y-6">
                            {/* Active Licenses by Broker */}
                            <AnimatedSection delay={0.2}>
                                <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                            <Briefcase className="text-emerald-500" size={16} />
                                            Active Licenses by Broker
                                        </h3>
                                        <Link
                                            href="/admin/trading-systems/brokers"
                                            className="text-xs font-bold text-primary hover:underline"
                                        >
                                            View All
                                        </Link>
                                    </div>

                                    {brokerStats.length === 0 ? (
                                        <div className="text-center py-6 text-gray-500 dark:text-gray-400 border border-dashed border-gray-200 dark:border-white/10 rounded-xl">
                                            <p className="text-xs font-medium">No active license breakdown yet</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {brokerStats.slice(0, 4).map((stat) => {
                                                const maxCount = brokerStats[0]._count.id || 1;
                                                const percentage = (stat._count.id / maxCount) * 100;

                                                return (
                                                    <div key={stat.broker} className="space-y-1.5">
                                                        <div className="flex justify-between items-center text-xs">
                                                            <div className="flex items-center gap-2">
                                                                <BrokerLogo broker={stat.broker} size={22} />
                                                                <span className="font-bold text-gray-800 dark:text-white capitalize">
                                                                    {stat.broker.toLowerCase()}
                                                                </span>
                                                            </div>
                                                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                                                {stat._count.id} active
                                                            </span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                                                                style={{ width: `${percentage}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </AnimatedSection>

                            {/* Recent Activity Feed */}
                            <AnimatedSection delay={0.3}>
                                <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                            <Activity className="text-blue-500" size={16} />
                                            Recent Activity Feed
                                        </h3>
                                        <Link
                                            href="/admin/trading-systems/accounts"
                                            className="text-xs font-bold text-primary hover:underline"
                                        >
                                            View All
                                        </Link>
                                    </div>

                                    {recentActivity.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500 dark:text-gray-400 border border-dashed border-gray-200 dark:border-white/10 rounded-xl">
                                            <CheckCircle2 size={28} className="mx-auto mb-2 text-emerald-500/50" />
                                            <p className="text-xs font-medium">No recent license decisions</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {recentActivity.slice(0, 5).map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50/50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10"
                                                >
                                                    <div
                                                        className={`p-1.5 rounded-lg shrink-0 ${
                                                            item.action === "APPROVED"
                                                                ? "bg-emerald-500/10 text-emerald-500"
                                                                : "bg-red-500/10 text-red-500"
                                                        }`}
                                                    >
                                                        {item.action === "APPROVED" ? (
                                                            <CheckCircle2 size={14} />
                                                        ) : (
                                                            <XCircle size={14} />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0 text-xs">
                                                        <p className="font-bold text-gray-800 dark:text-white truncate">
                                                            Acc #{item.accountNumber} ({item.broker})
                                                        </p>
                                                        <p className="text-[11px] text-gray-500 truncate">
                                                            {item.userName || "User"} • {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true, locale: enUS })}
                                                        </p>
                                                    </div>
                                                    <span
                                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase ${
                                                            item.action === "APPROVED"
                                                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                                : "bg-red-500/10 text-red-600 dark:text-red-400"
                                                        }`}
                                                    >
                                                        {item.action}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </AnimatedSection>
                        </div>
                    </div>
                </TabsContent>

                {/* ── Tab 2: Pending Review ── */}
                <TabsContent
                    value="pending"
                    className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300"
                >
                    <AnimatedSection delay={0.1}>
                        <div className="bg-white dark:bg-[#1E2028] rounded-xl p-6 border border-gray-200 dark:border-white/10 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <Clock className="text-amber-500" size={18} />
                                        Pending License Verification Requests
                                    </h2>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        Review user account details before granting EA trading access
                                    </p>
                                </div>
                                <Link
                                    href="/admin/trading-systems/accounts/pending"
                                    className="text-xs font-bold text-primary flex items-center gap-1 bg-primary/10 hover:bg-primary/20 px-3.5 py-2 rounded-xl transition-colors"
                                >
                                    Manage Queue <ArrowRight size={14} />
                                </Link>
                            </div>

                            <div className="space-y-3">
                                {recentPending.length === 0 ? (
                                    <div className="text-center py-16 text-gray-500 dark:text-gray-400 border border-dashed border-gray-200 dark:border-white/10 rounded-xl">
                                        <CheckCircle
                                            size={44}
                                            className="mx-auto mb-3 text-emerald-500/70"
                                        />
                                        <p className="text-base font-bold text-gray-800 dark:text-white">
                                            Queue Cleared!
                                        </p>
                                        <p className="text-xs mt-1 text-gray-500">
                                            No pending EA license requests require approval right now.
                                        </p>
                                    </div>
                                ) : (
                                    recentPending.map((license) => (
                                        <div
                                            key={license.id}
                                            className="flex items-center justify-between p-4 rounded-xl bg-gray-50/80 dark:bg-white/[0.03] border border-gray-200/60 dark:border-white/10 hover:border-amber-500/30 transition-all"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="p-2.5 bg-white dark:bg-[#151925] rounded-xl shadow-sm border border-gray-200/50 dark:border-white/10">
                                                    <BrokerLogo
                                                        broker={license.broker}
                                                        size={36}
                                                    />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-base text-gray-900 dark:text-white font-mono">
                                                        #{license.accountNumber}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                        Requested by: <span className="font-medium text-gray-700 dark:text-gray-300">{license.user.name || license.user.email}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right flex flex-col items-end gap-1.5">
                                                <span className="text-xs font-medium text-gray-400">
                                                    {formatDistanceToNow(
                                                        new Date(license.createdAt),
                                                        { addSuffix: true, locale: enUS }
                                                    )}
                                                </span>
                                                <StatusBadge status={license.status} />
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
                        <div className="bg-white dark:bg-[#1E2028] rounded-xl p-6 border border-gray-200 dark:border-white/10 shadow-sm">
                            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
                                <Briefcase className="text-primary" size={18} />
                                Active Licenses Distribution by Broker
                            </h2>

                            <div className="space-y-5">
                                {brokerStats.length === 0 ? (
                                    <div className="text-center py-16 text-gray-500 dark:text-gray-400 border border-dashed border-gray-200 dark:border-white/10 rounded-xl">
                                        <p className="text-sm font-medium">
                                            No active broker license data available yet.
                                        </p>
                                    </div>
                                ) : (
                                    brokerStats.map((stat) => {
                                        const maxCount = brokerStats[0]._count.id || 1;
                                        const percentage = (stat._count.id / maxCount) * 100;

                                        return (
                                            <div
                                                key={stat.broker}
                                                className="space-y-2 group/stat"
                                            >
                                                <div className="flex justify-between items-center text-sm">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-1.5 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200/60 dark:border-white/10">
                                                            <BrokerLogo
                                                                broker={stat.broker}
                                                                size={28}
                                                            />
                                                        </div>
                                                        <span className="font-bold text-gray-800 dark:text-white capitalize">
                                                            {stat.broker.toLowerCase()}
                                                        </span>
                                                    </div>
                                                    <span className="px-3 py-1 rounded-lg text-xs font-bold tracking-wider uppercase inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                        {stat._count.id} ACTIVE
                                                    </span>
                                                </div>
                                                <div className="h-2.5 w-full bg-gray-100 dark:bg-[#151925] rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-1000"
                                                        style={{ width: `${percentage}%` }}
                                                    ></div>
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
