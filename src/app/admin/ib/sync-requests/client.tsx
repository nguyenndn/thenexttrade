"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    CloudSync,
    CheckCircle2,
    XCircle,
    Clock,
    RefreshCw,
    Server,
    Check,
    Trash2,
    X,
    Eye,
    Copy,
    Terminal,
    AlertTriangle,
    LifeBuoy,
    KeyRound,
    ExternalLink,
    CheckSquare,
    Square,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AnimatedStatCard } from "@/components/admin/dashboard/AnimatedStatCard";
import { PaginationControl } from "@/components/ui/PaginationControl";
import {
    retrySyncJobAdmin,
    cancelSyncJobAdmin,
    deleteSyncJobAdmin,
    deleteBulkSyncRequestsAdmin,
    UnifiedSyncItem,
} from "@/actions/admin-sync-requests";
import { SyncFilterToolbar, TypeFilterOption, RangeOption } from "./SyncFilterToolbar";
import { AdminTicketDetailDrawer } from "./AdminTicketDetailDrawer";
import { toast } from "sonner";
import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/Avatar";
import { motion, AnimatePresence } from "framer-motion";
import { SPRING_SOFT, backdropVariants, panelVariants } from "@/lib/animations";
import { formatDistanceToNow } from "date-fns";

interface SyncRequestsClientProps {
    initialData: {
        success: boolean;
        items: UnifiedSyncItem[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        stats: {
            totalAll: number;
            completedCount: number;
            failedCount: number;
            queueCount: number;
            cloudTotal: number;
            supportTotal: number;
            successRate: string;
        } | null;
    };
    currentParams: {
        page: string;
        limit: string;
        type: string;
        status: string;
        q: string;
        range: string;
    };
}

export function SyncRequestsClient({
    initialData,
    currentParams,
}: SyncRequestsClientProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const [search, setSearch] = useState(currentParams.q || "");
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
    const [selectedSupportTicket, setSelectedSupportTicket] = useState<UnifiedSyncItem | null>(null);
    const [deleteTargetJob, setDeleteTargetJob] = useState<{
        id: string;
        accountNumber?: string;
        trader?: string;
        type?: string;
    } | null>(null);
    const [diagnosticsJob, setDiagnosticsJob] = useState<UnifiedSyncItem | null>(null);
    const [copiedId, setCopiedId] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const initialRender = useRef(true);

    const handleCopyId = (id: string) => {
        if (typeof navigator !== "undefined" && navigator.clipboard) {
            navigator.clipboard.writeText(id);
            setCopiedId(true);
            toast.success("ID copied to clipboard.");
            setTimeout(() => setCopiedId(false), 2000);
        }
    };

    const isAllSelected =
        initialData.items.length > 0 && selectedIds.size === initialData.items.length;

    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(initialData.items.map((item) => item.id)));
        }
    };

    const toggleSelect = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const stats = initialData.stats || {
        totalAll: initialData.total,
        completedCount: 0,
        failedCount: 0,
        queueCount: 0,
        cloudTotal: 0,
        supportTotal: 0,
        successRate: "100.0",
    };

    const updateFilters = (newParams: Partial<typeof currentParams>) => {
        setSelectedIds(new Set());
        const merged = { ...currentParams, ...newParams };
        const query = new URLSearchParams();
        if (merged.page && merged.page !== "1") query.set("page", merged.page);
        if (merged.limit && merged.limit !== "20") query.set("limit", merged.limit);
        if (merged.type && merged.type !== "ALL") query.set("type", merged.type);
        if (merged.status && merged.status !== "ALL") query.set("status", merged.status);
        if (merged.q) query.set("q", merged.q);
        if (merged.range && merged.range !== "all") query.set("range", merged.range);

        startTransition(() => {
            router.push(`/admin/ib/sync-requests?${query.toString()}`);
        });
    };

    // Sync search state if currentParams.q changes externally
    useEffect(() => {
        setSearch(currentParams.q || "");
        setSelectedIds(new Set());
    }, [currentParams.q, currentParams.page, currentParams.status, currentParams.type, currentParams.range]);

    // Real-time debounced search
    useEffect(() => {
        if (initialRender.current) {
            initialRender.current = false;
            return;
        }
        const timer = setTimeout(() => {
            if (search.trim() !== (currentParams.q || "")) {
                updateFilters({ q: search.trim(), page: "1" });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        setIsBulkDeleting(true);
        try {
            const idsToDelete = Array.from(selectedIds);
            const res = await deleteBulkSyncRequestsAdmin(idsToDelete);
            if (res.success) {
                toast.success(
                    `Deleted ${res.deletedCount || idsToDelete.length} sync requests successfully.`
                );
                setSelectedIds(new Set());
                setIsBulkDeleteModalOpen(false);
                router.refresh();
            } else {
                toast.error(res.error || "Failed to delete selected requests.");
            }
        } catch (err: any) {
            toast.error(err?.message || "Failed to delete selected requests.");
        } finally {
            setIsBulkDeleting(false);
        }
    };

    const handleDelete = async (id: string) => {
        setActionLoadingId(id);
        try {
            const res = await deleteSyncJobAdmin(id);
            if (res.success) {
                toast.success("Request deleted successfully.");
                setDeleteTargetJob(null);
                router.refresh();
            } else {
                toast.error(res.error || "Failed to delete request.");
            }
        } catch (err: any) {
            toast.error(err?.message || "Failed to delete request.");
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleRetry = async (jobId: string) => {
        setActionLoadingId(jobId);
        try {
            const res = await retrySyncJobAdmin(jobId);
            if (res.success) {
                toast.success("Job re-queued for worker pickup.");
                router.refresh();
            } else {
                toast.error(res.error || "Failed to retry job.");
            }
        } catch (err: any) {
            toast.error(err?.message || "Failed to retry job.");
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleCancel = async (jobId: string) => {
        setActionLoadingId(jobId);
        try {
            const res = await cancelSyncJobAdmin(jobId);
            if (res.success) {
                toast.info("Job marked as cancelled.");
                router.refresh();
            } else {
                toast.error(res.error || "Failed to cancel job.");
            }
        } catch (err: any) {
            toast.error(err?.message || "Failed to cancel job.");
        } finally {
            setActionLoadingId(null);
        }
    };

    const typeOptions: TypeFilterOption[] = [
        { value: "ALL", label: "All Types" },
        { value: "CLOUD", label: "Cloud Sync (Worker)" },
        { value: "SUPPORT", label: "Support Tickets (Manual)" },
    ];

    const statusTabs = [
        { key: "ALL", label: "All Requests", count: stats.totalAll, icon: CloudSync },
        { key: "QUEUE", label: "In Queue / Pending", count: stats.queueCount, icon: Clock },
        { key: "COMPLETED", label: "Completed / Verified", count: stats.completedCount, icon: CheckCircle2 },
        { key: "FAILED", label: "Failed", count: stats.failedCount, icon: XCircle },
    ];

    const rangeOptions: RangeOption[] = [
        { value: "all", label: "All Time" },
        { value: "today", label: "Today" },
        { value: "7d", label: "Last 7 Days" },
        { value: "30d", label: "Last 30 Days" },
    ];

    return (
        <div className="space-y-6">
            {/* Top Metric Cards with AnimatedStatCard (matching pipeline) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <AnimatedStatCard
                    title="Total Requests"
                    value={stats.totalAll}
                    icon={CloudSync}
                    color="blue"
                    index={0}
                    trendPercent={null}
                />
                <AnimatedStatCard
                    title="Success Rate"
                    value={parseFloat(stats.successRate) || 100}
                    suffix="%"
                    decimals={1}
                    icon={CheckCircle2}
                    color="emerald"
                    index={1}
                    trendPercent={null}
                />
                <AnimatedStatCard
                    title="Failed / Timeouts"
                    value={stats.failedCount}
                    icon={XCircle}
                    color="amber"
                    index={2}
                    trendPercent={null}
                />
                <AnimatedStatCard
                    title="Active Queue / Pending"
                    value={stats.queueCount}
                    icon={RefreshCw}
                    color="cyan"
                    index={3}
                    trendPercent={null}
                />
            </div>

            {/* Filter and Search Bar Container (Shared Component with Type Filter) */}
            <SyncFilterToolbar
                search={search}
                onSearchChange={setSearch}
                onSearchSubmit={() => updateFilters({ q: search.trim(), page: "1" })}
                onClearSearch={() => {
                    setSearch("");
                    updateFilters({ q: "", page: "1" });
                }}
                searchPlaceholder="Search trader, email, MT5 #, server, notes..."
                statusTabs={statusTabs}
                activeStatus={currentParams.status || "ALL"}
                onStatusChange={(val) => updateFilters({ status: val, page: "1" })}
                typeValue={currentParams.type || "ALL"}
                typeOptions={typeOptions}
                onTypeChange={(val) => updateFilters({ type: val, page: "1" })}
                rangeValue={currentParams.range || "all"}
                rangeOptions={rangeOptions}
                onRangeChange={(val) => updateFilters({ range: val, page: "1" })}
                onRefresh={() => router.refresh()}
                isRefreshing={isPending}
                tabsId="unified-sync-status-tabs"
            />

            {/* Bulk Selection Bar */}
            {selectedIds.size > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 px-4 rounded-xl bg-primary/10 border border-primary/20 text-xs shadow-sm">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 dark:text-white">
                            {selectedIds.size} of {initialData.items.length} {selectedIds.size === 1 ? "request" : "requests"} selected
                        </span>
                        <span className="text-gray-400">•</span>
                        <button
                            type="button"
                            onClick={() => setSelectedIds(new Set())}
                            className="text-primary hover:underline font-semibold cursor-pointer"
                        >
                            Deselect all
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setIsBulkDeleteModalOpen(true)}
                            className="rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-500/10 gap-1.5 h-8 px-3.5"
                        >
                            <Trash2 size={13} />
                            Delete Selected ({selectedIds.size})
                        </Button>
                    </div>
                </div>
            )}

            {/* Unified Data Table Card */}
            <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
                        <thead className="border-b border-gray-100 bg-gray-50/80 text-[11px] uppercase tracking-wider font-bold text-gray-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-400">
                            <tr>
                                <th className="px-3 py-3.5 w-10 text-center">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={toggleSelectAll}
                                        className="w-auto h-auto p-0 text-gray-400 hover:bg-transparent hover:text-primary cursor-pointer"
                                        aria-label="Select all requests on this page"
                                    >
                                        {isAllSelected ? (
                                            <CheckSquare size={16} className="text-primary" />
                                        ) : (
                                            <Square size={16} />
                                        )}
                                    </Button>
                                </th>
                                <th className="px-4 py-3.5">Trader</th>
                                <th className="px-4 py-3.5">Type</th>
                                <th className="px-4 py-3.5">MT5 Account & Server</th>
                                <th className="px-4 py-3.5">Telemetry / Notes</th>
                                <th className="px-4 py-3.5">Status</th>
                                <th className="px-4 py-3.5">Requested</th>
                                <th className="px-4 py-3.5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {initialData.items.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-16 text-center text-gray-400 dark:text-gray-500">
                                        <CloudSync className="h-10 w-10 mx-auto mb-2 opacity-30 text-primary" />
                                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300">No sync requests found</p>
                                        <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                                            Sync jobs from Cloud Sync worker and trader support tickets will appear here.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                initialData.items.map((item) => {
                                    const isSupport = item.type === "SUPPORT_TICKET";
                                    const isFailed = item.unifiedStatus === "FAILED";
                                    const isCompleted = item.unifiedStatus === "COMPLETED";
                                    const isQueue = item.unifiedStatus === "QUEUE";
                                    const isSelected = selectedIds.has(item.id);

                                    return (
                                        <tr
                                            key={item.id}
                                            onClick={() => {
                                                if (isSupport) {
                                                    setSelectedSupportTicket(item);
                                                }
                                            }}
                                            className={`hover:bg-gray-50/70 dark:hover:bg-white/[0.02] transition-colors ${
                                                isSelected ? "bg-primary/5 dark:bg-primary/[0.04]" : ""
                                            } ${isSupport ? "cursor-pointer" : ""}`}
                                        >
                                            {/* Selection Checkbox */}
                                            <td className="px-3 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => toggleSelect(item.id, e)}
                                                    className={`w-auto h-auto p-0 hover:bg-transparent cursor-pointer ${
                                                        isSelected
                                                            ? "text-primary"
                                                            : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                                    }`}
                                                    aria-label={`Select request #${item.account?.accountNumber || item.id}`}
                                                >
                                                    {isSelected ? (
                                                        <CheckSquare size={16} className="text-primary" />
                                                    ) : (
                                                        <Square size={16} />
                                                    )}
                                                </Button>
                                            </td>
                                            {/* Trader */}
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-2.5">
                                                    {item.user?.id ? (
                                                        <Link
                                                            href={`/admin/users/${item.user.id}`}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="shrink-0 group"
                                                            title="View User Profile"
                                                        >
                                                            <Avatar className="h-8 w-8 rounded-full border border-gray-100 dark:border-white/10 group-hover:ring-2 group-hover:ring-primary/40 transition-all">
                                                                <AvatarImage
                                                                    src={item.user.image || undefined}
                                                                    alt={item.user.name || "Trader"}
                                                                />
                                                                <AvatarFallback className="rounded-full bg-primary/10 text-primary font-black text-xs">
                                                                    {(item.user.name || item.user.email || "T")[0].toUpperCase()}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                        </Link>
                                                    ) : (
                                                        <Avatar className="h-8 w-8 rounded-full border border-gray-100 dark:border-white/10 shrink-0">
                                                            <AvatarImage
                                                                src={item.user?.image || undefined}
                                                                alt={item.user?.name || "Trader"}
                                                            />
                                                            <AvatarFallback className="rounded-full bg-primary/10 text-primary font-black text-xs">
                                                                {(item.user?.name || item.user?.email || "T")[0].toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    )}
                                                    <div className="min-w-0">
                                                        {item.user?.id ? (
                                                            <Link
                                                                href={`/admin/users/${item.user.id}`}
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="font-bold text-gray-900 dark:text-white truncate max-w-[140px] block hover:text-primary hover:underline transition-colors"
                                                            >
                                                                {item.user.name || "Trader"}
                                                            </Link>
                                                        ) : (
                                                            <div className="font-bold text-gray-900 dark:text-white truncate max-w-[140px]">
                                                                {item.user?.name || "Trader"}
                                                            </div>
                                                        )}
                                                        <p className="text-[11px] text-gray-400 truncate max-w-[160px]">
                                                            {item.user?.email || "No email"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Type */}
                                            <td className="px-4 py-3.5">
                                                {isSupport ? (
                                                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 inline-flex items-center gap-1.5 shrink-0">
                                                        <LifeBuoy size={12} className="text-amber-600 dark:text-amber-400" />
                                                        Support Ticket
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20 inline-flex items-center gap-1.5 shrink-0">
                                                        <CloudSync size={12} className="text-cyan-600 dark:text-cyan-400" />
                                                        Cloud Sync
                                                    </span>
                                                )}
                                            </td>

                                            {/* MT5 Account & Server */}
                                            <td className="px-4 py-3.5">
                                                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white">
                                                    #{item.account?.accountNumber || "N/A"}
                                                </span>
                                                <div className="mt-1 flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
                                                    <Server className="h-3 w-3 shrink-0 opacity-60" />
                                                    <span className="truncate max-w-[180px]">
                                                        {item.account?.server || item.account?.broker || "Server N/A"}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Telemetry / Notes */}
                                            <td className="px-4 py-3.5">
                                                {isSupport ? (
                                                    <div className="space-y-1">
                                                        {item.supportTicket?.notes ? (
                                                            <p
                                                                className="text-xs text-gray-700 dark:text-gray-300 italic truncate max-w-[200px]"
                                                                title={item.supportTicket.notes}
                                                            >
                                                                &ldquo;{item.supportTicket.notes}&rdquo;
                                                            </p>
                                                        ) : (
                                                            <p className="text-xs text-gray-400 italic">No notes provided</p>
                                                        )}
                                                        <div>
                                                            {item.supportTicket?.hasInvestorPassword ? (
                                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                                                    <KeyRound size={10} /> Passview Ready
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 text-[10px] text-gray-400">
                                                                    No Passview
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-0.5">
                                                        <span className="font-bold text-gray-800 dark:text-gray-200 capitalize text-xs block">
                                                            {item.cloudJob?.mode === "custom"
                                                                ? "Custom Range"
                                                                : `${item.cloudJob?.mode || "30"} Days`}
                                                        </span>
                                                        {item.cloudJob?.rangeFrom ? (
                                                            <p className="text-[10px] text-gray-400">
                                                                From {new Date(item.cloudJob.rangeFrom).toLocaleDateString()}
                                                            </p>
                                                        ) : (
                                                            <p className="text-[10px] text-gray-400">Worker sync job</p>
                                                        )}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Status Badge */}
                                            <td className="px-4 py-3.5">
                                                {isCompleted && (
                                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20 inline-flex items-center gap-1">
                                                        <CheckCircle2 size={12} />
                                                        {isSupport
                                                            ? "VERIFIED"
                                                            : `${item.cloudJob?.dealsReceived || 0} deals`}
                                                    </span>
                                                )}
                                                {isFailed && (
                                                    <div className="space-y-0.5">
                                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20 inline-flex items-center gap-1">
                                                            <XCircle size={12} />
                                                            {item.cloudJob?.errorCode || "FAILED"}
                                                        </span>
                                                        {item.cloudJob?.errorMessage && (
                                                            <p
                                                                className="text-[10px] text-rose-600 dark:text-rose-400 max-w-[180px] truncate"
                                                                title={item.cloudJob.errorMessage}
                                                            >
                                                                {item.cloudJob.errorMessage}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                                {isQueue && (
                                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20 inline-flex items-center gap-1.5">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                        {item.status}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Requested */}
                                            <td className="px-4 py-3.5">
                                                <div className="text-[11px] text-gray-700 dark:text-gray-300 flex items-center gap-1 font-medium">
                                                    <Clock className="h-3 w-3 text-gray-400" />
                                                    <span>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
                                                </div>
                                                <p className="text-[10px] text-gray-400 mt-0.5 font-mono">
                                                    {isSupport
                                                        ? `Ticket #${item.supportTicket?.ticketNumber || item.id.slice(-8).toUpperCase()}`
                                                        : `Worker: ${item.cloudJob?.workerId || "unassigned"}`}
                                                </p>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {isSupport ? (
                                                        <>
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => setSelectedSupportTicket(item)}
                                                                className="h-8 px-3 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-50 dark:hover:bg-amber-500/10 gap-1.5"
                                                            >
                                                                <LifeBuoy size={12} className="text-amber-600 dark:text-amber-400" />
                                                                Inspect &amp; Resolve
                                                            </Button>

                                                            {item.account?.id && (
                                                                <Link
                                                                    href={`/admin/ib/traders?search=${item.account.accountNumber || ""}`}
                                                                    className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 inline-flex items-center transition-colors"
                                                                    title="View in Trader Monitor"
                                                                >
                                                                    <ExternalLink className="h-3.5 w-3.5" />
                                                                </Link>
                                                            )}

                                                            <Button
                                                                type="button"
                                                                size="icon"
                                                                variant="outline"
                                                                disabled={actionLoadingId === item.id}
                                                                onClick={() =>
                                                                    setDeleteTargetJob({
                                                                        id: item.id,
                                                                        accountNumber: item.account?.accountNumber,
                                                                        trader: item.user?.name || item.user?.email || undefined,
                                                                        type: "Support Ticket",
                                                                    })
                                                                }
                                                                className="h-8 w-8 min-w-8 aspect-square rounded-xl text-gray-400 hover:text-rose-600 hover:border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors shrink-0"
                                                                title="Delete support ticket"
                                                                aria-label="Delete support ticket"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            {isFailed && (
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="outline"
                                                                    disabled={actionLoadingId === item.id}
                                                                    onClick={() => handleRetry(item.id)}
                                                                    className="h-8 px-3 rounded-xl text-xs font-bold text-primary hover:text-primary/80"
                                                                >
                                                                    <RefreshCw
                                                                        className={`h-3 w-3 mr-1 ${
                                                                            actionLoadingId === item.id ? "animate-spin" : ""
                                                                        }`}
                                                                    />
                                                                    Retry
                                                                </Button>
                                                            )}

                                                            {isQueue && (
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="outline"
                                                                    disabled={actionLoadingId === item.id}
                                                                    onClick={() => handleCancel(item.id)}
                                                                    className="h-8 px-3 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 border-rose-500/30"
                                                                >
                                                                    Cancel
                                                                </Button>
                                                            )}

                                                            {item.account?.id && (
                                                                <Link
                                                                    href={`/admin/ib/traders?search=${item.account.accountNumber || ""}`}
                                                                    className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 inline-flex items-center transition-colors"
                                                                    title="View in Trader Monitor"
                                                                >
                                                                    <ExternalLink className="h-3.5 w-3.5" />
                                                                </Link>
                                                            )}

                                                            <Button
                                                                type="button"
                                                                size="icon"
                                                                variant="outline"
                                                                onClick={() => setDiagnosticsJob(item)}
                                                                className="h-8 w-8 min-w-8 aspect-square rounded-xl text-gray-400 hover:text-primary hover:border-primary/30 hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors shrink-0"
                                                                title="Inspect sync request details"
                                                                aria-label="Inspect sync request details"
                                                            >
                                                                <Eye className="h-3.5 w-3.5" />
                                                            </Button>

                                                            <Button
                                                                type="button"
                                                                size="icon"
                                                                variant="outline"
                                                                disabled={actionLoadingId === item.id}
                                                                onClick={() =>
                                                                    setDeleteTargetJob({
                                                                        id: item.id,
                                                                        accountNumber: item.account?.accountNumber,
                                                                        trader: item.user?.name || item.user?.email || undefined,
                                                                        type: "Cloud Sync Job",
                                                                    })
                                                                }
                                                                className="h-8 w-8 min-w-8 aspect-square rounded-xl text-gray-400 hover:text-rose-600 hover:border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors shrink-0"
                                                                title="Delete sync request"
                                                                aria-label="Delete sync request"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {initialData.totalPages > 1 && (
                    <div className="border-t border-gray-100 dark:border-white/10 p-3 flex justify-end bg-gray-50/40 dark:bg-white/[0.01]">
                        <PaginationControl
                            currentPage={initialData.page}
                            totalPages={initialData.totalPages}
                            pageSize={initialData.limit}
                            totalItems={initialData.total}
                            onPageChange={(p) => updateFilters({ page: String(p) })}
                            onPageSizeChange={(size) => updateFilters({ limit: String(size), page: "1" })}
                        />
                    </div>
                )}
            </div>

            {/* Slide-over Drawer for Support Ticket */}
            <AdminTicketDetailDrawer
                item={selectedSupportTicket}
                isOpen={Boolean(selectedSupportTicket)}
                onClose={() => setSelectedSupportTicket(null)}
                onUpdated={() => router.refresh()}
            />

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteTargetJob && (
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
                            <div className="flex items-start gap-3">
                                <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/20 shrink-0">
                                    <Trash2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                        Delete {deleteTargetJob.type || "Sync Request"}
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Are you sure you want to permanently delete this request for{" "}
                                        <span className="font-bold text-gray-800 dark:text-gray-200">
                                            #{deleteTargetJob.accountNumber || deleteTargetJob.id}
                                        </span>
                                        {deleteTargetJob.trader ? ` (${deleteTargetJob.trader})` : ""}?
                                        This action cannot be undone.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-white/5">
                                <Button
                                    variant="outline"
                                    disabled={actionLoadingId === deleteTargetJob.id}
                                    onClick={() => setDeleteTargetJob(null)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    disabled={actionLoadingId === deleteTargetJob.id}
                                    onClick={() => handleDelete(deleteTargetJob.id)}
                                    className="bg-rose-600 hover:bg-rose-500 text-white font-bold"
                                >
                                    {actionLoadingId === deleteTargetJob.id ? (
                                        <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                                    ) : (
                                        <Trash2 className="h-4 w-4 mr-1" />
                                    )}
                                    Delete Request
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bulk Delete Confirmation Modal */}
            <AnimatePresence>
                {isBulkDeleteModalOpen && (
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
                            <div className="flex items-start gap-3">
                                <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/20 shrink-0">
                                    <Trash2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                        Delete {selectedIds.size} Selected {selectedIds.size === 1 ? "Request" : "Requests"}
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Are you sure you want to permanently delete{" "}
                                        <span className="font-bold text-gray-800 dark:text-gray-200">
                                            {selectedIds.size}
                                        </span>{" "}
                                        selected sync {selectedIds.size === 1 ? "request" : "requests"}?
                                        Both worker sync jobs and support tickets in this selection will be permanently removed. This action cannot be undone.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-white/5">
                                <Button
                                    variant="outline"
                                    disabled={isBulkDeleting}
                                    onClick={() => setIsBulkDeleteModalOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    disabled={isBulkDeleting}
                                    onClick={handleBulkDelete}
                                    className="bg-rose-600 hover:bg-rose-500 text-white font-bold"
                                >
                                    {isBulkDeleting ? (
                                        <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                                    ) : (
                                        <Trash2 className="h-4 w-4 mr-1" />
                                    )}
                                    Delete {selectedIds.size} {selectedIds.size === 1 ? "Request" : "Requests"}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Diagnostics Inspector Modal */}
            <AnimatePresence>
                {diagnosticsJob && (
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
                            className="w-full max-w-xl rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] p-6 shadow-2xl space-y-5"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 shrink-0">
                                        <Terminal className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                            Sync Request Diagnostics
                                        </h3>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="font-mono text-xs text-gray-400">
                                                ID: {diagnosticsJob.id}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleCopyId(diagnosticsJob.id)}
                                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 inline-flex items-center"
                                                aria-label="Copy request ID"
                                            >
                                                {copiedId ? (
                                                    <Check size={12} className="text-emerald-500" />
                                                ) : (
                                                    <Copy size={12} />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 rounded-xl"
                                    onClick={() => setDiagnosticsJob(null)}
                                    aria-label="Close modal"
                                >
                                    <X size={16} />
                                </Button>
                            </div>

                            {/* 2x2 Matrix Card */}
                            <div className="grid grid-cols-2 divide-x divide-y divide-gray-100 dark:divide-white/5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] text-xs">
                                <div className="p-3">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                                        Broker & Server
                                    </span>
                                    <span className="font-bold text-gray-800 dark:text-gray-200 mt-0.5 block truncate">
                                        {diagnosticsJob.account?.broker || "Unknown Broker"} (
                                        {diagnosticsJob.account?.server || "Unknown Server"})
                                    </span>
                                </div>
                                <div className="p-3">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                                        Account #
                                    </span>
                                    <span className="font-mono font-bold text-gray-800 dark:text-gray-200 mt-0.5 block">
                                        {diagnosticsJob.account?.accountNumber || "N/A"}
                                    </span>
                                </div>
                                <div className="p-3 border-t">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                                        Request Type & Mode
                                    </span>
                                    <span className="font-medium text-gray-700 dark:text-gray-300 mt-0.5 block capitalize">
                                        {diagnosticsJob.type} • {diagnosticsJob.cloudJob?.mode || "Standard"}
                                    </span>
                                </div>
                                <div className="p-3 border-t">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                                        Worker & Telemetry
                                    </span>
                                    <span className="font-mono text-gray-700 dark:text-gray-300 mt-0.5 block">
                                        {diagnosticsJob.cloudJob?.workerId || "unassigned"}
                                    </span>
                                </div>
                            </div>

                            {/* Failure Reason Alert */}
                            {diagnosticsJob.unifiedStatus === "FAILED" && (
                                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 space-y-1">
                                    <div className="flex items-center gap-1.5 font-bold">
                                        <AlertTriangle size={14} className="shrink-0" />
                                        <span>
                                            Failure Reason ({diagnosticsJob.cloudJob?.errorCode || "SYNC_ERROR"})
                                        </span>
                                    </div>
                                    <p className="font-mono text-[11px] leading-relaxed break-words">
                                        {diagnosticsJob.cloudJob?.errorMessage ||
                                            diagnosticsJob.cloudJob?.message ||
                                            "Sync processing failure."}
                                    </p>
                                </div>
                            )}

                            {/* Raw Parameters JSON Block */}
                            <div>
                                <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1.5">
                                    Raw Request Metadata
                                </span>
                                <pre className="p-3 rounded-xl bg-gray-900 text-gray-200 font-mono text-[11px] overflow-x-auto max-h-48 custom-scrollbar border border-gray-800">
                                    {JSON.stringify(
                                        {
                                            id: diagnosticsJob.id,
                                            type: diagnosticsJob.type,
                                            status: diagnosticsJob.status,
                                            unifiedStatus: diagnosticsJob.unifiedStatus,
                                            account: diagnosticsJob.account,
                                            user: diagnosticsJob.user,
                                            cloudJob: diagnosticsJob.cloudJob,
                                            supportTicket: diagnosticsJob.supportTicket,
                                            createdAt: diagnosticsJob.createdAt,
                                        },
                                        null,
                                        2
                                    )}
                                </pre>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100 dark:border-white/5">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setDiagnosticsJob(null)}
                                    className="rounded-xl text-xs font-bold"
                                >
                                    Close
                                </Button>
                                {diagnosticsJob.type === "CLOUD_SYNC" && diagnosticsJob.unifiedStatus === "FAILED" && (
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        disabled={actionLoadingId === diagnosticsJob.id}
                                        onClick={async () => {
                                            const jobId = diagnosticsJob.id;
                                            setDiagnosticsJob(null);
                                            await handleRetry(jobId);
                                        }}
                                        className="rounded-xl text-xs font-bold gap-1.5"
                                    >
                                        <RefreshCw
                                            className={`h-3.5 w-3.5 ${
                                                actionLoadingId === diagnosticsJob.id
                                                    ? "animate-spin"
                                                    : ""
                                            }`}
                                        />
                                        Retry Sync Job
                                    </Button>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
