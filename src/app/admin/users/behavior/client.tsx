"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
    Activity,
    AlertCircle,
    CheckCircle2,
    Clock,
    ExternalLink,
    Filter,
    Flame,
    HelpCircle,
    Layers,
    Search,
    ShieldAlert,
    TrendingDown,
    TrendingUp,
    Users,
    UserCheck,
    MessageSquare,
    Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { buttonVariants } from "@/components/ui/button-variants";
import {
    getBehaviorSegments,
    GetBehaviorSegmentsResult,
} from "./actions";
import {
    UserBehaviorSegmentItem,
    BehaviorGroup,
    StatusDotColor,
} from "@/lib/admin/behavior/types";
import {
    markUserContacted,
    dismissUserSignal,
} from "@/actions/admin-activation";

export function BehaviorConsoleClient() {
    const [activeTab, setActiveTab] = useState<"needs-attention" | "value">("needs-attention");
    const [searchQuery, setSearchQuery] = useState("");
    const [groupFilter, setGroupFilter] = useState("ALL");
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<GetBehaviorSegmentsResult["data"] | null>(null);
    const [isPending, startTransition] = useTransition();

    const fetchSegments = async () => {
        setIsLoading(true);
        try {
            const res = await getBehaviorSegments({
                tab: activeTab,
                search: searchQuery,
                groupFilter,
                page,
                pageSize: 20,
            });
            if (res.success && res.data) {
                setData(res.data);
            } else {
                toast.error(res.error || "Failed to load behavior telemetry");
            }
        } catch (err: any) {
            toast.error(err.message || "Network error loading data");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSegments();
    }, [activeTab, groupFilter, page]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchSegments();
    };

    const handleMarkContacted = (userId: string, signalId?: string) => {
        if (!signalId) {
            toast.info("No active signal ID for this user event.");
            return;
        }
        startTransition(async () => {
            const res = await markUserContacted(signalId);
            if (res.success) {
                toast.success("Trader marked as contacted.");
                fetchSegments();
            } else {
                toast.error(res.error || "Failed to mark contacted.");
            }
        });
    };

    const renderDot = (color: StatusDotColor) => {
        switch (color) {
            case "RED":
                return (
                    <span className="relative flex h-2.5 w-2.5" title="Critical Attention">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500"></span>
                    </span>
                );
            case "YELLOW":
                return (
                    <span className="relative flex h-2.5 w-2.5" title="Needs Monitoring">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500"></span>
                    </span>
                );
            case "GREEN":
                return (
                    <span className="relative flex h-2.5 w-2.5" title="Healthy Steady">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                    </span>
                );
            default:
                return (
                    <span
                        className="inline-flex h-2.5 w-2.5 rounded-full bg-zinc-400 dark:bg-zinc-600"
                        title="Neutral"
                    ></span>
                );
        }
    };

    const renderGroupBadge = (group: BehaviorGroup) => {
        switch (group) {
            case "REGISTERED_NEVER_TRADED":
                return (
                    <span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
                        Never Synced
                    </span>
                );
            case "LOSING_STREAK":
                return (
                    <span className="inline-flex items-center rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
                        Loss Streak
                    </span>
                );
            case "WINNING_STREAK":
                return (
                    <span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
                        Win Streak
                    </span>
                );
            case "TRADING_WELL":
                return (
                    <span className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                        Steady Trader
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-400">
                        Neutral
                    </span>
                );
        }
    };

    const summary = data?.metricsSummary;

    return (
        <div className="space-y-6">
            {/* Top Stat Matrix Cards */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                            Needs Attention
                        </span>
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">
                        {summary?.needsAttentionCount ?? 0}
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-400">Critical & follow-up queue</p>
                </div>

                <div className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                            Steady Active
                        </span>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">
                        {summary?.steadyTradersCount ?? 0}
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-400">Consistent execution</p>
                </div>

                <div className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                            Loss Streaks
                        </span>
                        <Flame className="h-4 w-4 text-rose-500" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">
                        {summary?.lossStreakCount ?? 0}
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-400">≥3 consecutive losses</p>
                </div>

                <div className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                            Never Synced
                        </span>
                        <Clock className="h-4 w-4 text-zinc-400" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">
                        {summary?.registeredNeverTradedCount ?? 0}
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-400">Account linked &gt;72h, 0 trades</p>
                </div>
            </div>

            {/* Navigation Tabs & Search Controls */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* 2 Primary Tabs */}
                <div className="inline-flex rounded-xl border border-zinc-200/80 bg-zinc-100/80 p-1 dark:border-zinc-800 dark:bg-zinc-800/80">
                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab("needs-attention");
                            setPage(1);
                        }}
                        className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                            activeTab === "needs-attention"
                                ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-900 dark:text-white"
                                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                        }`}
                    >
                        Needs Attention
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab("value");
                            setPage(1);
                        }}
                        className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                            activeTab === "value"
                                ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-900 dark:text-white"
                                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                        }`}
                    >
                        Value Radar
                    </button>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                    <form onSubmit={handleSearchSubmit} className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-9 w-60 rounded-xl border border-zinc-200/80 bg-white pl-9 pr-3 text-xs text-zinc-900 outline-hidden focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                            aria-label="Search traders by name or email"
                        />
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                    </form>

                    <select
                        value={groupFilter}
                        onChange={(e) => {
                            setGroupFilter(e.target.value);
                            setPage(1);
                        }}
                        aria-label="Filter by behavior group"
                        className="h-9 rounded-xl border border-zinc-200/80 bg-white px-3 text-xs font-medium text-zinc-700 outline-hidden dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                    >
                        <option value="ALL">All Groups</option>
                        <option value="REGISTERED_NEVER_TRADED">Never Synced</option>
                        <option value="LOSING_STREAK">Losing Streak</option>
                        <option value="WINNING_STREAK">Winning Streak</option>
                        <option value="TRADING_WELL">Steady Trader</option>
                        <option value="NEUTRAL">Neutral</option>
                    </select>
                </div>
            </div>

            {/* Table Presentation */}
            <div className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                {isLoading ? (
                    <div className="flex h-64 items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                    </div>
                ) : !data || data.items.length === 0 ? (
                    <div className="p-12 text-center text-xs text-zinc-500 dark:text-zinc-400">
                        No trader records matching current filter criteria.
                    </div>
                ) : activeTab === "needs-attention" ? (
                    /* TAB A: Needs Attention Table */
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="border-b border-zinc-200/80 bg-zinc-50/70 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-400">
                                <tr>
                                    <th className="py-3 pl-4 pr-3">Status</th>
                                    <th className="px-3 py-3">Trader</th>
                                    <th className="px-3 py-3">Behavior Group</th>
                                    <th className="px-3 py-3">Telemetry Diagnosis</th>
                                    <th className="px-3 py-3">Tempo (30d)</th>
                                    <th className="px-3 py-3">Last Recorded Activity</th>
                                    <th className="py-3 pl-3 pr-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
                                {data.items.map((item) => {
                                    const c = item.classification;
                                    const m = c.metrics;
                                    return (
                                        <tr
                                            key={item.userId}
                                            className="transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40"
                                        >
                                            <td className="py-3.5 pl-4 pr-3 align-middle">
                                                {renderDot(c.dotColor)}
                                            </td>
                                            <td className="px-3 py-3.5 align-middle">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8 rounded-lg">
                                                        <AvatarImage
                                                            src={item.user.image || undefined}
                                                            alt={item.user.name || "User"}
                                                        />
                                                        <AvatarFallback className="rounded-lg text-xs font-bold">
                                                            {item.user.name?.[0]?.toUpperCase() ||
                                                                "U"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0">
                                                        <Link
                                                            href={`/admin/users/${item.userId}`}
                                                            className="truncate font-semibold text-zinc-900 hover:underline dark:text-white"
                                                        >
                                                            {item.user.name || "Unnamed Trader"}
                                                        </Link>
                                                        <p className="truncate text-[11px] text-zinc-500">
                                                            {item.user.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3.5 align-middle">
                                                {renderGroupBadge(c.group)}
                                            </td>
                                            <td className="max-w-xs px-3 py-3.5 align-middle">
                                                <p className="line-clamp-2 text-zinc-700 dark:text-zinc-300">
                                                    {c.reasons[0] ||
                                                        c.narrativeParagraphs[0] ||
                                                        "Normal execution pattern"}
                                                </p>
                                            </td>
                                            <td className="px-3 py-3.5 align-middle font-medium text-zinc-800 dark:text-zinc-200">
                                                {m.activeDays30} active days
                                                <span className="block text-[11px] font-normal text-zinc-400">
                                                    {m.closedTrades30} trades logged
                                                </span>
                                            </td>
                                            <td className="px-3 py-3.5 align-middle text-zinc-500">
                                                {item.lastActivityAt
                                                    ? formatDistanceToNow(
                                                          new Date(item.lastActivityAt),
                                                          { addSuffix: true }
                                                      )
                                                    : "No telemetry"}
                                            </td>
                                            <td className="py-3.5 pl-3 pr-4 text-right align-middle">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleMarkContacted(
                                                                item.userId,
                                                                item.classification.primarySignal ||
                                                                    undefined
                                                            )
                                                        }
                                                        disabled={isPending}
                                                        className="h-7 text-xs"
                                                    >
                                                        Contacted
                                                    </Button>
                                                    <Link
                                                        href={`/admin/users/${item.userId}`}
                                                        className={buttonVariants({
                                                            variant: "outline",
                                                            size: "sm",
                                                            className: "h-7 text-xs",
                                                        })}
                                                    >
                                                        Detail
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    /* TAB B: Value Radar Table */
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="border-b border-zinc-200/80 bg-zinc-50/70 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-400">
                                <tr>
                                    <th className="py-3 pl-4 pr-3">Trader</th>
                                    <th className="px-3 py-3">Group</th>
                                    <th className="px-3 py-3">Real Account</th>
                                    <th className="px-3 py-3">Tempo (30d)</th>
                                    <th className="px-3 py-3">Trend</th>
                                    <th className="px-3 py-3">Product Adoption</th>
                                    <th className="px-3 py-3">Stayed After Loss</th>
                                    <th className="px-3 py-3">Last Activity</th>
                                    <th className="py-3 pl-3 pr-4 text-right">View</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
                                {data.items.map((item) => {
                                    const c = item.classification;
                                    const m = c.metrics;
                                    return (
                                        <tr
                                            key={item.userId}
                                            className="transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40"
                                        >
                                            <td className="py-3.5 pl-4 pr-3 align-middle">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8 rounded-lg">
                                                        <AvatarImage
                                                            src={item.user.image || undefined}
                                                            alt={item.user.name || "User"}
                                                        />
                                                        <AvatarFallback className="rounded-lg text-xs font-bold">
                                                            {item.user.name?.[0]?.toUpperCase() ||
                                                                "U"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0">
                                                        <Link
                                                            href={`/admin/users/${item.userId}`}
                                                            className="truncate font-semibold text-zinc-900 hover:underline dark:text-white"
                                                        >
                                                            {item.user.name || "Unnamed Trader"}
                                                        </Link>
                                                        <p className="truncate text-[11px] text-zinc-500">
                                                            {item.user.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3.5 align-middle">
                                                {renderGroupBadge(c.group)}
                                            </td>
                                            <td className="px-3 py-3.5 align-middle">
                                                {m.hasLiveAccount ? (
                                                    <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                                                        Live Real
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center rounded-md border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-400">
                                                        Demo / None
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-3 py-3.5 align-middle font-medium text-zinc-800 dark:text-zinc-200">
                                                {m.activeDays30} days / 30d
                                                <span className="block text-[11px] font-normal text-zinc-400">
                                                    {m.closedTrades30} closed trades
                                                </span>
                                            </td>
                                            <td className="px-3 py-3.5 align-middle">
                                                {m.trend === "UP" ? (
                                                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                                                        <TrendingUp className="h-3.5 w-3.5" />
                                                        Accelerating
                                                    </span>
                                                ) : m.trend === "DOWN" ? (
                                                    <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                                                        <TrendingDown className="h-3.5 w-3.5" />
                                                        Slowing
                                                    </span>
                                                ) : (
                                                    <span className="text-zinc-500 font-medium">
                                                        → Steady
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-3 py-3.5 align-middle">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                                                        {m.productAdoptionCount} / 8
                                                    </span>
                                                    <span className="text-[11px] text-zinc-400">
                                                        modules
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3.5 align-middle">
                                                {m.stayedAfterLoss === true ? (
                                                    <span className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                                                        Stayed
                                                    </span>
                                                ) : m.stayedAfterLoss === false ? (
                                                    <span className="inline-flex items-center rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
                                                        No Trade Since
                                                    </span>
                                                ) : (
                                                    <span className="text-zinc-400 text-xs">
                                                        No Loss Logged
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-3 py-3.5 align-middle text-zinc-500">
                                                {item.lastActivityAt
                                                    ? formatDistanceToNow(
                                                          new Date(item.lastActivityAt),
                                                          { addSuffix: true }
                                                      )
                                                    : "No telemetry"}
                                            </td>
                                            <td className="py-3.5 pl-3 pr-4 text-right align-middle">
                                                <Link
                                                    href={`/admin/users/${item.userId}`}
                                                    className={buttonVariants({
                                                        variant: "outline",
                                                        size: "sm",
                                                        className: "h-7 text-xs",
                                                    })}
                                                >
                                                    Detail
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination Controls */}
                {data && data.totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-zinc-200/80 px-4 py-3 dark:border-zinc-800">
                        <span className="text-xs text-zinc-500">
                            Page {data.page} of {data.totalPages} ({data.totalCount} traders)
                        </span>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={data.page <= 1}
                                className="h-8 text-xs"
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                                disabled={data.page >= data.totalPages}
                                className="h-8 text-xs"
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
