"use client";

import { useState, useTransition, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Activity,
    ArrowRight,
    ArrowUpRight,
    Clock,
    Crown,
    ShieldOff,
    DollarSign,
    Zap,
    AlertTriangle,
    ShieldCheck,
    CheckCircle2,
    ExternalLink,
    BarChart3,
    Check,
    LayoutDashboard,
    Compass,
} from "lucide-react";
import Link from "next/link";
import { SPRING_SOFT, backdropVariants, panelVariants } from "@/lib/animations";
import { useRouter } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";
import { enUS } from "date-fns/locale";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { CANONICAL_PRODUCTS } from "@/lib/admin/ib/ib-monitor.constants";
import { approveVipRequest, rejectVipRequest } from "@/actions/vip-request";
import { toast } from "sonner";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { IbTargetTrackerHero } from "@/components/admin/ib/IbTargetTrackerHero";
import type { IbPipelineItem } from "@/lib/admin/ib/ib-monitor.types";

interface OverviewStats {
    totalLeads: number;
    pendingRequests: number;
    requestsInRange?: number;
    verifiedUsers: number;
    activeProUsers: number;
    graceUsers: number;
    revokedUsers: number;
    activeAccounts?: number;
    activeAccounts24h?: number;
    reportedCapitalUSD?: number | null;
    freshCapitalUSD?: number | null;
    reportedEquityUSD?: number | null;
    currencyBreakdown?: Record<string, number>;
    freshCurrencyBreakdown?: Record<string, number>;
    equityCurrencyBreakdown?: Record<string, number>;
    totalLots?: number;
    totalTrades?: number;
    totalLots30d?: number;
    totalTrades30d?: number;
    staleAccounts?: number;
    disconnectedAccounts?: number;
    vipUsersWithoutFirstSync?: number;
    activeToolUsers?: number;
    duplicateAccountWarnings?: number;
    rangeLabel?: string;
    averageCommissionPerLot?: number;
    outOfIbActiveRatio?: number;
    outOfIbActiveCount?: number;
    totalActiveUsers?: number;
}

interface LeadStats {
    totalLeads: number;
    leads30d: number;
    leads7d: number;
    convertedLeads: number;
    conversionRate: number;
    leadsByBroker: Array<{ broker: string; count: number }>;
    leadsBySource: Array<{ source: string; count: number }>;
}

interface VipStats {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
}

interface Props {
    rangeFilter?: {
        range?: string;
        from?: string;
        to?: string;
    };
    range?: "7d" | "30d" | "all";
    overview: OverviewStats | null;
    leadStats: LeadStats | null;
    vipStats: VipStats | null;
    pendingRequests?: IbPipelineItem[];
}

export function IbOverviewClient({
    rangeFilter,
    range = "30d",
    overview,
    leadStats,
    vipStats,
    pendingRequests = [],
}: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [rejectModalId, setRejectModalId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState("");

    // Body scroll lock while the reject modal is open.
    useEffect(() => {
        if (rejectModalId) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
    }, [rejectModalId]);

    const now = new Date();
    const currentRange = (() => {
        if (rangeFilter?.from && rangeFilter?.to) {
            const start = new Date(rangeFilter.from);
            const end = new Date(rangeFilter.to);
            if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                return { start, end };
            }
        }
        const effectiveRange = rangeFilter?.range || range || "30d";
        if (effectiveRange === "all") {
            return {
                start: new Date(2025, 0, 1),
                end: now,
            };
        }
        if (effectiveRange === "7d") {
            return {
                start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
                end: now,
            };
        }
        return {
            start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
            end: now,
        };
    })();

    const handleDateChange = (newRange: { start: Date; end: Date }) => {
        if (
            newRange.start.getFullYear() === 2025 &&
            newRange.start.getMonth() === 0 &&
            newRange.start.getDate() === 1
        ) {
            router.push("/admin/ib?range=all");
            return;
        }
        const fromStr = format(newRange.start, "yyyy-MM-dd");
        const toStr = format(newRange.end, "yyyy-MM-dd");
        router.push(`/admin/ib?from=${fromStr}&to=${toStr}`);
    };

    if (!overview || !leadStats || !vipStats) {
        return (
            <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                Unable to load IB data. Please check your admin permissions.
            </div>
        );
    }

    const asOfTimestamp = new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });

    const rangeLabel =
        overview.rangeLabel ||
        (rangeFilter?.from && rangeFilter?.to
            ? `${format(new Date(rangeFilter.from), "MMM dd, yyyy")} - ${format(new Date(rangeFilter.to), "MMM dd, yyyy")}`
            : (rangeFilter?.range || range) === "7d"
              ? "last 7 days"
              : (rangeFilter?.range || range) === "all"
                ? "all time"
                : "last 30 days");

    const formatUsd = (value: number | null | undefined) => {
        if (value === null || value === undefined) return "$0";
        return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatCurrencySubtitle = (breakdown?: Record<string, number>) => {
        if (!breakdown || Object.keys(breakdown).length === 0) return null;
        const entries = Object.entries(breakdown).filter(([curr]) => curr !== "USD");
        if (entries.length === 0) return null;
        return entries
            .map(([curr, val]) => `${val.toLocaleString("en-US", { maximumFractionDigits: 1 })} ${curr}`)
            .join(" · ");
    };

    const handleApprove = (requestId: string) => {
        startTransition(async () => {
            const result = await approveVipRequest(requestId);
            if (result.success) {
                toast.success("VIP request approved & Pro access granted");
                router.refresh();
            } else {
                toast.error(result.error || "Failed to approve request");
            }
        });
    };

    const handleReject = (requestId: string) => {
        if (!rejectReason.trim()) {
            toast.error("Please provide a rejection reason");
            return;
        }
        startTransition(async () => {
            const result = await rejectVipRequest(requestId, rejectReason);
            if (result.success) {
                toast.success("Request rejected");
                setRejectModalId(null);
                setRejectReason("");
                router.refresh();
            } else {
                toast.error(result.error || "Failed to reject request");
            }
        });
    };

    const nextActions = [
        {
            title: "Review pending Pro requests",
            description: `${overview.pendingRequests} request${overview.pendingRequests !== 1 ? "s" : ""} waiting for admin review`,
            href: "/admin/ib/pipeline?status=PENDING",
            value: overview.pendingRequests,
            tone: "amber",
            icon: Crown,
            cta: "Open pipeline",
        },
        {
            title: "Check active Pro traders",
            description: `${overview.activeProUsers} active VIP trader${overview.activeProUsers !== 1 ? "s" : ""} currently monitored`,
            href: "/admin/ib/traders?vip=ACTIVE",
            value: overview.activeProUsers,
            tone: "cyan",
            icon: Activity,
            cta: "View traders",
        },
        {
            title: "Review temporary VIP users",
            description: `${overview.graceUsers} user${overview.graceUsers !== 1 ? "s" : ""} need follow-up before access expires`,
            href: "/admin/ib/traders?vip=GRACE",
            value: overview.graceUsers,
            tone: "red",
            icon: ShieldOff,
            cta: "Review risk",
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                    <Clock size={13} /> Updated as of{" "}
                    <span className="font-mono text-gray-700 dark:text-gray-300">
                        {asOfTimestamp}
                    </span>
                    <span className="text-gray-300 dark:text-gray-600">·</span>
                    <span className="text-gray-500 dark:text-gray-400 capitalize">
                        {rangeLabel}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <DateRangePicker
                        value={currentRange}
                        onChange={handleDateChange}
                    />
                </div>
            </div>

            {/* IB Monthly Revenue Target Hero Tracker */}
            <IbTargetTrackerHero
                currentLots={overview?.totalLots ?? 0}
                rangeLabel={rangeLabel}
                targetRevenueUSD={10000}
                commissionPerLot={overview?.averageCommissionPerLot ?? 17.0}
            />

            {/* Standardized Tab Navigation (Breek UI Guide Section 14) */}
            <Tabs
                defaultValue="overview"
                className="mt-2"
                tabsId="ib-overview-tabs"
            >
                <div className="overflow-x-auto scrollbar-hide flex">
                    <TabsList className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-1 gap-1 shrink-0">
                        {[
                            { id: "overview", label: "Command Center", icon: LayoutDashboard },
                            { id: "products", label: "Product Adoption", icon: Zap },
                            { id: "analytics", label: "Lead Analytics", icon: BarChart3 },
                        ].map((t) => {
                            const Icon = t.icon;
                            return (
                                <TabsTrigger
                                    key={t.id}
                                    value={t.id}
                                    className="px-4 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap border border-transparent hover:border-gray-200 dark:border-white/10 dark:hover:border-white/10 flex items-center gap-2"
                                    activeIndicatorClassName="!bg-gradient-to-r from-primary to-teal-500 shadow-md border-0"
                                    activeTextClassName="!text-white"
                                >
                                    <Icon size={15} />
                                    <span>{t.label}</span>
                                </TabsTrigger>
                            );
                        })}
                    </TabsList>
                </div>

                <TabsContent
                    value="overview"
                    className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300"
                >
                    {/* VIP First-Sync Warning Banner */}
                    {(overview.vipUsersWithoutFirstSync || 0) > 0 && (
                        <Link
                            href="/admin/ib/traders?vip=ACTIVE&accountHealth=NEVER_SYNCED"
                            className="flex items-center justify-between gap-4 rounded-xl border border-amber-500/30 bg-white dark:bg-[#1E2028] p-4 shadow-sm hover:shadow-md hover:border-amber-500/50 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20">
                                    <AlertTriangle size={18} />
                                </div>
                                <span className="font-bold text-sm text-gray-900 dark:text-white">
                                    {overview.vipUsersWithoutFirstSync} active VIP user
                                    {overview.vipUsersWithoutFirstSync === 1 ? "" : "s"} have
                                    not completed a first sync.
                                </span>
                            </div>
                            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 group-hover:underline inline-flex items-center gap-1">
                                Review traders <ArrowRight size={13} />
                            </span>
                        </Link>
                    )}

                    {/* Operational Telemetry Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Retention & Health */}
                        <Link
                            href="/admin/ib/traders?accountHealth=STALE"
                            className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] p-5 shadow-sm hover:shadow-md hover:border-orange-500/30 transition-all space-y-2 group block"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                    Retention & Health
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 ring-1 ring-orange-500/20">
                                        <AlertTriangle size={16} />
                                    </div>
                                    <ArrowUpRight size={14} className="text-gray-400 group-hover:text-orange-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                                </div>
                            </div>
                            <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                                {overview?.staleAccounts || 0} <span className="text-sm font-bold text-orange-600 dark:text-orange-400">sync overdue</span>
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 pt-1.5 border-t border-gray-100 dark:border-white/5">
                                {overview?.disconnectedAccounts || 0} inactive (&gt;7d) · {overview?.duplicateAccountWarnings || 0} dup warnings
                            </p>
                        </Link>

                        {/* Trade Manager Active */}
                        <Link
                            href="/admin/ib/traders?syncSource=EA"
                            className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] p-5 shadow-sm hover:shadow-md hover:border-cyan-500/30 transition-all space-y-2 group block"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                    Trade Manager Active
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 ring-1 ring-cyan-500/20">
                                        <Zap size={16} />
                                    </div>
                                    <ArrowUpRight size={14} className="text-gray-400 group-hover:text-cyan-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                                </div>
                            </div>
                            <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                                {overview?.activeToolUsers || 0} <span className="text-sm font-bold text-cyan-600 dark:text-cyan-400">active EA users</span>
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 pt-1.5 border-t border-gray-100 dark:border-white/5">
                                Sending live telemetry within 24h
                            </p>
                        </Link>

                        {/* Out-of-IB Active Ratio */}
                        <Link
                            href="/admin/users/behavior?tab=radar"
                            className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] p-5 shadow-sm hover:shadow-md hover:border-emerald-500/30 transition-all space-y-2 group block"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                    Out-of-IB Active Ratio
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
                                        <Compass size={16} />
                                    </div>
                                    <ArrowUpRight size={14} className="text-gray-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                                </div>
                            </div>
                            <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                                {overview?.outOfIbActiveRatio ?? 0}% <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">non-IB active</span>
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 pt-1.5 border-t border-gray-100 dark:border-white/5">
                                {overview?.outOfIbActiveCount ?? 0} of {overview?.totalActiveUsers ?? 0} active traders · View in Value Radar
                            </p>
                        </Link>
                    </div>
                    {/* Active Pro Traders Highlight Banner (High-depth card) */}
                    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] p-6 sm:p-7 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500" />
                        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                            <div className="max-w-xl">
                                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                    <Crown size={13} />
                                    Active Pro Traders
                                </div>
                                <div className="flex items-end gap-3">
                                    <p className="text-5xl font-black tracking-tight text-gray-900 dark:text-white">
                                        {overview.activeProUsers}
                                    </p>
                                    <p className="pb-2 text-sm font-bold text-gray-500 dark:text-gray-400">
                                        distinct active traders
                                    </p>
                                </div>
                                <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
                                    Use this page as the command center: review
                                    pending requests, monitor Pro activation,
                                    and spot funnel drops before revenue leaks.
                                </p>
                            </div>
                            <div className="grid flex-1 gap-3 sm:grid-cols-3">
                                <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4 shadow-sm dark:border-white/5 dark:bg-white/[0.03]">
                                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                        Leads
                                    </p>
                                    <p className="mt-2 text-2xl font-black text-gray-900 dark:text-white">
                                        {leadStats.totalLeads}
                                    </p>
                                    <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                                        {rangeLabel}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4 shadow-sm dark:border-white/5 dark:bg-white/[0.03]">
                                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                        Requests
                                    </p>
                                    <p className="mt-2 text-2xl font-black text-gray-900 dark:text-white">
                                        {vipStats.total}
                                    </p>
                                    <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                                        submitted in range
                                    </p>
                                </div>
                                <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4 shadow-sm dark:border-white/5 dark:bg-white/[0.03]">
                                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                        Conversion
                                    </p>
                                    <p className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                        {leadStats.conversionRate.toFixed(1)}%
                                    </p>
                                    <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                                        lead to request
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pending VIP Requests Table (matching pipeline) */}
                    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20">
                                    <Crown size={20} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        Pending VIP Requests
                                        {pendingRequests.length > 0 && (
                                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20">
                                                {pendingRequests.length} Pending
                                            </span>
                                        )}
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Review and approve trader Partner Pro
                                        eligibility directly
                                    </p>
                                </div>
                            </div>
                            <Link
                                href="/admin/ib/pipeline?status=PENDING"
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                            >
                                Open Full Pipeline
                                <ArrowRight size={14} />
                            </Link>
                        </div>

                        {pendingRequests.length === 0 ? (
                            <div className="py-10 flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400 border border-dashed border-gray-200 dark:border-white/10 rounded-xl">
                                <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2 opacity-60" />
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                    All caught up!
                                </p>
                                <p className="text-xs mt-0.5">
                                    No pending VIP verification requests at the
                                    moment.
                                </p>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-gray-50/80 dark:bg-white/[0.03] text-[11px] uppercase text-gray-500 dark:text-gray-400 font-bold tracking-wider border-b border-gray-100 dark:border-white/5">
                                            <tr>
                                                <th className="px-4 py-3.5">
                                                    Trader
                                                </th>
                                                <th className="px-4 py-3.5">
                                                    Broker & Account
                                                </th>
                                                <th className="px-4 py-3.5">
                                                    Balance
                                                </th>
                                                <th className="px-4 py-3.5">
                                                    Submitted
                                                </th>
                                                <th className="px-4 py-3.5 text-right">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                            {pendingRequests.map((req) => (
                                                <tr
                                                    key={req.requestId}
                                                    className="hover:bg-gray-50/70 dark:hover:bg-white/[0.02] transition-colors"
                                                >
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-black text-xs flex items-center justify-center shrink-0">
                                                                {(req.userName || req.userEmail || "U")[0].toUpperCase()}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="font-bold text-gray-900 dark:text-white text-xs truncate max-w-[150px]">
                                                                    {req.userName}
                                                                </div>
                                                                <div className="text-[11px] text-gray-400 truncate max-w-[180px]">
                                                                    {req.userEmail}
                                                                </div>
                                                                {req.telegramId && (
                                                                    <div className="text-[10px] text-primary font-bold">
                                                                        @{req.telegramId}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white">
                                                            {req.broker}
                                                        </span>
                                                        <div className="font-mono text-xs font-bold text-gray-600 dark:text-gray-300 mt-1">
                                                            #{req.rawAccountNumber || req.accountNumber}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <span className="font-mono font-bold text-xs text-gray-900 dark:text-white">
                                                            {req.submittedBalance
                                                                ? `$${Number(req.submittedBalance).toLocaleString()}`
                                                                : "N/A"}
                                                        </span>
                                                        {req.liveBalance !== null && (
                                                            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                                                                Live: ${req.liveBalance.toLocaleString()}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-xs text-gray-400 whitespace-nowrap">
                                                        <div className="flex items-center gap-1">
                                                            <Clock size={12} className="opacity-60" />
                                                            {formatDistanceToNow(
                                                                new Date(req.createdAt),
                                                                {
                                                                    addSuffix: true,
                                                                    locale: enUS,
                                                                }
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3.5 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                disabled={isPending}
                                                                onClick={() =>
                                                                    handleApprove(
                                                                        req.requestId
                                                                    )
                                                                }
                                                                className="h-8 px-3 rounded-xl text-xs font-bold text-emerald-600 border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                                                            >
                                                                <Check size={13} className="mr-1" />
                                                                Approve
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                disabled={isPending}
                                                                onClick={() =>
                                                                    setRejectModalId(
                                                                        req.requestId
                                                                    )
                                                                }
                                                                className="h-8 px-3 rounded-xl text-xs font-bold text-rose-600 border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                                                            >
                                                                Reject
                                                            </Button>
                                                            <Link
                                                                href={`/admin/ib/pipeline?q=${req.rawAccountNumber || req.accountNumber}`}
                                                                className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                                                                title="View in Pipeline"
                                                            >
                                                                <ExternalLink
                                                                    size={14}
                                                                />
                                                            </Link>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Operational Action Cards (Elevated cards with rings) */}
                    <div className="grid gap-4 lg:grid-cols-3">
                        {nextActions.map((action) => {
                            const Icon = action.icon;
                            const toneClass =
                                action.tone === "amber"
                                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20"
                                    : action.tone === "cyan"
                                      ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 ring-1 ring-cyan-500/20"
                                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/20";

                            return (
                                <Link
                                    key={action.title}
                                    href={action.href}
                                    className="group rounded-xl border border-gray-200 dark:border-white/10 bg-white p-5 shadow-sm hover:shadow-md transition-all dark:bg-[#1E2028] hover:border-primary/30 flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-4">
                                            <div
                                                className={`rounded-xl p-3 ${toneClass}`}
                                            >
                                                <Icon size={20} strokeWidth={2.5} />
                                            </div>
                                            <span className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                                                {action.value}
                                            </span>
                                        </div>
                                        <h2 className="mt-4 text-sm font-bold text-gray-800 dark:text-white">
                                            {action.title}
                                        </h2>
                                        <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                                            {action.description}
                                        </p>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5 inline-flex items-center gap-1.5 text-xs font-bold text-primary">
                                        <span>{action.cta}</span>
                                        <ArrowRight
                                            size={13}
                                            className="transition-transform group-hover:translate-x-1"
                                        />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </TabsContent>

                <TabsContent value="products" className="mt-6 space-y-6">
                    <div className="grid gap-4 sm:grid-cols-3">
                        {CANONICAL_PRODUCTS.map((prod) => (
                            <div
                                key={prod.id}
                                className="p-5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] shadow-sm hover:shadow-md transition-all space-y-3 relative overflow-hidden group"
                            >
                                <div className="absolute top-0 inset-x-0 h-0.5 bg-primary/40 group-hover:bg-primary transition-colors" />
                                <div className="flex items-center justify-between">
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                                        {prod.slug}
                                    </span>
                                    <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                                        <Zap size={14} />
                                    </div>
                                </div>
                                <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                                    {prod.name}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed min-h-[36px]">
                                    {prod.description}
                                </p>
                                <div className="pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs font-medium text-gray-500">
                                    <span className="inline-flex items-center gap-1.5 text-[11px]">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        Active
                                    </span>
                                    <Link
                                        href={`/admin/ib/traders?product=${prod.slug}`}
                                        className="text-primary font-bold hover:underline inline-flex items-center gap-1"
                                    >
                                        View Users &rarr;
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="analytics" className="mt-6 space-y-6">
                    {/* Capital Analytics Overview Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Reported Capital */}
                        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] p-5 shadow-sm hover:shadow-md transition-all space-y-2 group">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                    Reported Capital
                                </span>
                                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20">
                                    <DollarSign size={16} />
                                </div>
                            </div>
                            <p className="text-2xl font-black text-gray-900 dark:text-white font-mono tracking-tight">
                                {formatUsd(overview.reportedCapitalUSD)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 pt-1.5 border-t border-gray-100 dark:border-white/5">
                                Equity: <span className="font-semibold text-gray-700 dark:text-gray-300">{formatUsd(overview.reportedEquityUSD)}</span>
                                {formatCurrencySubtitle(overview.currencyBreakdown) ? ` · ${formatCurrencySubtitle(overview.currencyBreakdown)}` : ""}
                            </p>
                        </div>

                        {/* Fresh Capital (24h) */}
                        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] p-5 shadow-sm hover:shadow-md transition-all space-y-2 group">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                    Fresh Capital (24h)
                                </span>
                                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
                                    <ShieldCheck size={16} />
                                </div>
                            </div>
                            <p className="text-2xl font-black text-gray-900 dark:text-white font-mono tracking-tight">
                                {formatUsd(overview.freshCapitalUSD)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 pt-1.5 border-t border-gray-100 dark:border-white/5">
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">{overview.activeAccounts24h || 0}</span> accounts active in 24h
                            </p>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] p-6 shadow-sm space-y-5">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                                Broker Referral Breakdown
                            </h3>
                            <span className="text-xs text-gray-400 font-medium">
                                Total: {leadStats.totalLeads} leads
                            </span>
                        </div>
                        <div className="space-y-4">
                            {leadStats.leadsByBroker.map((item) => {
                                const percentage = Math.min(
                                    100,
                                    Math.round((item.count / (leadStats.totalLeads || 1)) * 100)
                                );
                                return (
                                    <div
                                        key={item.broker}
                                        className="space-y-1.5"
                                    >
                                        <div className="flex items-center justify-between text-xs font-bold">
                                            <span className="text-gray-800 dark:text-gray-200">
                                                {item.broker}
                                            </span>
                                            <span className="font-mono text-primary font-bold">
                                                {item.count} leads ({percentage}%)
                                            </span>
                                        </div>
                                        <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-white/5 overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-primary transition-all duration-500"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Reject Modal */}
            <AnimatePresence>
                {rejectModalId && (
                    <motion.div
                        variants={backdropVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ type: "tween", duration: 0.2 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
                    >
                        <motion.div
                            variants={panelVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={SPRING_SOFT}
                            className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] p-6 shadow-2xl space-y-4"
                        >
                            <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                Reject VIP Request
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Please specify why this request is being rejected.
                                The user will be notified.
                            </p>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                aria-label="Rejection reason"
                                className="w-full h-24 p-3 text-xs rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                            />
                            <div className="flex items-center justify-end gap-2 pt-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setRejectModalId(null);
                                        setRejectReason("");
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    disabled={isPending || !rejectReason.trim()}
                                    onClick={() => handleReject(rejectModalId)}
                                    className="bg-red-600 hover:bg-red-500 text-white font-bold"
                                >
                                    Confirm Rejection
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
