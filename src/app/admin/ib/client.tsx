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
    TrendingUp,
    Users,
    DollarSign,
    Briefcase,
    Zap,
    AlertTriangle,
    ShieldCheck,
    CheckCircle2,
    XCircle,
    ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { SPRING_SOFT, backdropVariants, panelVariants } from "@/lib/animations";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import { AnimatedStatCard } from "@/components/admin/dashboard/AnimatedStatCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { CANONICAL_PRODUCTS } from "@/lib/admin/ib/ib-monitor.constants";
import { approveVipRequest, rejectVipRequest } from "@/actions/vip-request";
import { toast } from "sonner";
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
    reportedCapitalUSD?: number | null;
    freshCapitalUSD?: number | null;
    reportedEquityUSD?: number | null;
    staleAccounts?: number;
    disconnectedAccounts?: number;
    vipUsersWithoutFirstSync?: number;
    activeToolUsers?: number;
    duplicateAccountWarnings?: number;
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
    range: "7d" | "30d" | "all";
    overview: OverviewStats | null;
    leadStats: LeadStats | null;
    vipStats: VipStats | null;
    pendingRequests?: IbPipelineItem[];
}

const rangeOptions = [
    { value: "7d", label: "7D" },
    { value: "30d", label: "30D" },
    { value: "all", label: "All time" },
] as const;

export function IbOverviewClient({
    range,
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
        range === "7d"
            ? "last 7 days"
            : range === "30d"
              ? "last 30 days"
              : "all time";

    const formatUsd = (value: number | null | undefined) =>
        value === null || value === undefined
            ? "Mixed"
            : `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

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
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                    <Clock size={13} /> Updated as of{" "}
                    <span className="font-mono text-gray-700 dark:text-gray-300">
                        {asOfTimestamp}
                    </span>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] p-1 shadow-sm">
                    {rangeOptions.map((option) => (
                        <Link
                            key={option.value}
                            href={`/admin/ib?range=${option.value}`}
                            className={`rounded-lg px-4 py-2 text-xs font-black transition-colors ${
                                range === option.value
                                    ? "bg-primary text-white shadow-sm"
                                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
                            }`}
                        >
                            {option.label}
                        </Link>
                    ))}
                </div>
            </div>

            {/* 10 Operational KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <AnimatedStatCard
                    title="Total Leads"
                    value={leadStats.totalLeads}
                    icon={Users}
                    color="blue"
                    index={0}
                    trendPercent={null}
                />
                <AnimatedStatCard
                    title="Active VIP Users"
                    value={overview.activeProUsers}
                    icon={Crown}
                    color="amber"
                    index={1}
                    trendPercent={null}
                />
                <AnimatedStatCard
                    title="Connected Accounts"
                    value={overview.activeAccounts || 0}
                    icon={Briefcase}
                    color="cyan"
                    index={2}
                    trendPercent={null}
                />
                <AnimatedStatCard
                    title="Pending Requests"
                    value={overview.pendingRequests}
                    icon={Clock}
                    color="amber"
                    index={3}
                    trendPercent={null}
                />
                <AnimatedStatCard
                    title="Conversion Rate"
                    value={Math.round(leadStats.conversionRate)}
                    icon={TrendingUp}
                    color="green"
                    index={4}
                    trendPercent={null}
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="rounded-xl border border-amber-200/70 bg-amber-50/60 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">
                        <DollarSign size={15} /> Reported Capital
                    </div>
                    <p className="mt-2 text-2xl font-black text-gray-900 dark:text-white">
                        {formatUsd(overview.reportedCapitalUSD)}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Equity {formatUsd(overview.reportedEquityUSD)}
                    </p>
                </div>
                <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/60 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                        <ShieldCheck size={15} /> Fresh Capital
                    </div>
                    <p className="mt-2 text-2xl font-black text-gray-900 dark:text-white">
                        {formatUsd(overview.freshCapitalUSD)}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Accounts updated within 24h
                    </p>
                </div>
                <div className="rounded-xl border border-orange-200/70 bg-orange-50/60 p-4 dark:border-orange-500/20 dark:bg-orange-500/10">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-orange-700 dark:text-orange-300">
                        <AlertTriangle size={15} /> Data Quality
                    </div>
                    <p className="mt-2 text-2xl font-black text-gray-900 dark:text-white">
                        {overview.staleAccounts || 0} sync overdue
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {overview.disconnectedAccounts || 0} disconnected ·{" "}
                        {overview.duplicateAccountWarnings || 0} duplicate
                        warning{overview.duplicateAccountWarnings === 1 ? "" : "s"}
                    </p>
                </div>
                <div className="rounded-xl border border-cyan-200/70 bg-cyan-50/60 p-4 dark:border-cyan-500/20 dark:bg-cyan-500/10">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-cyan-700 dark:text-cyan-300">
                        <Zap size={15} /> Tool Activity
                    </div>
                    <p className="mt-2 text-2xl font-black text-gray-900 dark:text-white">
                        {overview.activeToolUsers || 0}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        users with product activity in 24h
                    </p>
                </div>
            </div>

            {(overview.vipUsersWithoutFirstSync || 0) > 0 && (
                <Link
                    href="/admin/ib/traders?vip=ACTIVE&accountHealth=NEVER_SYNCED"
                    className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm transition-colors hover:bg-amber-100 dark:border-amber-500/20 dark:bg-amber-500/10 dark:hover:bg-amber-500/15"
                >
                    <span className="font-bold text-amber-800 dark:text-amber-200">
                        {overview.vipUsersWithoutFirstSync} active VIP user
                        {overview.vipUsersWithoutFirstSync === 1 ? "" : "s"} have
                        not completed a first sync.
                    </span>
                    <span className="text-xs font-black text-amber-700 dark:text-amber-300">
                        Review traders →
                    </span>
                </Link>
            )}

            <Tabs
                defaultValue="overview"
                className="mt-2"
                tabsId="ib-overview-tabs"
            >
                <div className="overflow-x-auto scrollbar-hide pb-2 flex">
                    <TabsList className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-1 gap-1 shrink-0">
                        {[
                            { id: "overview", label: "Command Center" },
                            { id: "products", label: "Product Adoption" },
                            { id: "analytics", label: "Lead Analytics" },
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

                <TabsContent
                    value="overview"
                    className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300"
                >
                    {/* Hero North Star */}
                    <div className="rounded-xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-amber-50/60 p-6 shadow-sm dark:border-emerald-500/20 dark:from-emerald-500/10 dark:via-[#11151F] dark:to-amber-500/10">
                        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                            <div className="max-w-xl">
                                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-700 dark:border-emerald-500/20 dark:bg-white/5 dark:text-emerald-300">
                                    <Crown size={13} />
                                    North star: active Pro traders
                                </div>
                                <div className="flex items-end gap-3">
                                    <p className="text-5xl font-black tracking-tight text-gray-900 dark:text-white">
                                        {overview.activeProUsers}
                                    </p>
                                    <p className="pb-2 text-sm font-bold text-gray-500 dark:text-gray-400">
                                        distinct active users
                                    </p>
                                </div>
                                <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
                                    Use this page as the command center: review
                                    pending requests, monitor Pro activation,
                                    and spot funnel drops before revenue leaks.
                                </p>
                            </div>
                            <div className="grid flex-1 gap-3 sm:grid-cols-3">
                                <div className="rounded-xl border border-white/70 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                                    <p className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Leads
                                    </p>
                                    <p className="mt-2 text-2xl font-black text-gray-900 dark:text-white">
                                        {leadStats.totalLeads}
                                    </p>
                                    <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                                        {rangeLabel}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-white/70 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                                    <p className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Requests
                                    </p>
                                    <p className="mt-2 text-2xl font-black text-gray-900 dark:text-white">
                                        {vipStats.total}
                                    </p>
                                    <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                                        submitted in range
                                    </p>
                                </div>
                                <div className="rounded-xl border border-white/70 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                                    <p className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Conversion
                                    </p>
                                    <p className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-300">
                                        {leadStats.conversionRate.toFixed(1)}%
                                    </p>
                                    <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                                        lead to request
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pending VIP Requests — Direct Quick Action Section */}
                    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                                    <Crown size={20} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        Pending VIP Requests
                                        {pendingRequests.length > 0 && (
                                            <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
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
                            <div className="py-8 flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400 border border-dashed border-gray-200 dark:border-white/10 rounded-xl">
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
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 dark:bg-white/5 text-[11px] uppercase text-gray-500 font-bold tracking-wider rounded-lg">
                                        <tr>
                                            <th className="px-4 py-3 rounded-l-lg">
                                                Trader
                                            </th>
                                            <th className="px-4 py-3">
                                                Broker & Account
                                            </th>
                                            <th className="px-4 py-3">
                                                Balance
                                            </th>
                                            <th className="px-4 py-3">
                                                Submitted
                                            </th>
                                            <th className="px-4 py-3 text-right rounded-r-lg">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                        {pendingRequests.map((req) => (
                                            <tr
                                                key={req.requestId}
                                                className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                            >
                                                <td className="px-4 py-3.5">
                                                    <div className="font-bold text-gray-900 dark:text-white text-xs">
                                                        {req.userName}
                                                    </div>
                                                    <div className="text-[11px] text-gray-500 truncate max-w-[180px]">
                                                        {req.userEmail}
                                                    </div>
                                                    {req.telegramId && (
                                                        <div className="text-[10px] text-primary">
                                                            @{req.telegramId}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-200">
                                                        {req.broker}
                                                    </span>
                                                    <div className="font-mono text-xs font-bold text-gray-700 dark:text-gray-300 mt-1">
                                                        {req.rawAccountNumber ||
                                                            req.accountNumber}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <span className="font-mono font-bold text-xs text-gray-900 dark:text-white">
                                                        {req.submittedBalance
                                                            ? `$${Number(req.submittedBalance).toLocaleString()}`
                                                            : "N/A"}
                                                    </span>
                                                    {req.liveBalance !==
                                                        null && (
                                                        <div className="text-[10px] text-gray-400">
                                                            Live: $
                                                            {req.liveBalance.toLocaleString()}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5 text-xs text-gray-400 whitespace-nowrap">
                                                    {formatDistanceToNow(
                                                        new Date(req.createdAt),
                                                        {
                                                            addSuffix: true,
                                                            locale: enUS,
                                                        }
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="primary"
                                                            disabled={isPending}
                                                            onClick={() =>
                                                                handleApprove(
                                                                    req.requestId
                                                                )
                                                            }
                                                        >
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            disabled={isPending}
                                                            onClick={() =>
                                                                setRejectModalId(
                                                                    req.requestId
                                                                )
                                                            }
                                                        >
                                                            Reject
                                                        </Button>
                                                        <Link
                                                            href={`/admin/ib/pipeline?q=${req.rawAccountNumber || req.accountNumber}`}
                                                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                                                            title="View in Pipeline"
                                                        >
                                                            <ExternalLink
                                                                size={15}
                                                            />
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Operational Action Cards */}
                    <div className="grid gap-4 lg:grid-cols-3">
                        {nextActions.map((action) => {
                            const Icon = action.icon;
                            const toneClass =
                                action.tone === "amber"
                                    ? "bg-amber-50 text-amber-700 ring-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300"
                                    : action.tone === "cyan"
                                      ? "bg-cyan-50 text-cyan-700 ring-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-300"
                                      : "bg-red-50 text-red-700 ring-red-500/20 dark:bg-red-500/10 dark:text-red-300";

                            return (
                                <Link
                                    key={action.title}
                                    href={action.href}
                                    className="group rounded-xl border border-gray-200 dark:border-white/10 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:bg-[#1E2028]"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div
                                            className={`rounded-xl p-3 ring-1 ${toneClass}`}
                                        >
                                            <Icon size={20} strokeWidth={2.5} />
                                        </div>
                                        <span className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                                            {action.value}
                                        </span>
                                    </div>
                                    <h2 className="mt-5 text-sm font-black text-gray-800 dark:text-white">
                                        {action.title}
                                    </h2>
                                    <p className="mt-1 min-h-[40px] text-sm leading-5 text-gray-500 dark:text-gray-400">
                                        {action.description}
                                    </p>
                                    <div className="mt-4 inline-flex items-center gap-2 text-xs font-black text-primary">
                                        {action.cta}
                                        <ArrowRight
                                            size={14}
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
                                className="p-5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] shadow-sm space-y-3"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                                        {prod.slug}
                                    </span>
                                    <Zap size={16} className="text-amber-500" />
                                </div>
                                <h3 className="font-bold text-gray-900 dark:text-white">
                                    {prod.name}
                                </h3>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    {prod.description}
                                </p>
                                <div className="pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs font-medium text-gray-500">
                                    <span>Monitoring Active</span>
                                    <Link
                                        href={`/admin/ib/traders?product=${prod.slug}`}
                                        className="text-primary font-bold hover:underline"
                                    >
                                        View Users &rarr;
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="analytics" className="mt-6 space-y-6">
                    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] p-6 shadow-sm">
                        <h3 className="font-black text-gray-900 dark:text-white mb-4">
                            Broker Referral Breakdown
                        </h3>
                        <div className="space-y-3">
                            {leadStats.leadsByBroker.map((item) => (
                                <div
                                    key={item.broker}
                                    className="flex items-center justify-between text-sm"
                                >
                                    <span className="font-bold text-gray-800 dark:text-gray-200">
                                        {item.broker}
                                    </span>
                                    <span className="font-mono font-bold text-primary">
                                        {item.count} leads
                                    </span>
                                </div>
                            ))}
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
                            placeholder="e.g. Account not under our IB tag, deposit below minimum..."
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
                                className="bg-red-600 hover:bg-red-500 text-white"
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
