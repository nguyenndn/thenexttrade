"use client";

import { useState, useTransition, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    SPRING_SOFT,
    backdropVariants,
    panelVariants,
} from "@/lib/animations";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
    Crown,
    Clock,
    CheckCircle2,
    XCircle,
    ShieldOff,
    Search,
    Users,
    AlertTriangle,
    Trash2,
    Eye,
    ChevronDown,
    MoreHorizontal,
    ExternalLink,
    Filter,
    Zap,
    Unlock,
    Check,
    TrendingUp,
    Link as LinkIcon,
    AlertOctagon,
} from "lucide-react";
import {
    approveVipRequest,
    rejectVipRequest,
    deleteVipRequest,
    revokeProAccess,
} from "@/actions/vip-request";
import { Button } from "@/components/ui/Button";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { AnimatedStatCard } from "@/components/admin/dashboard/AnimatedStatCard";
import { toast } from "sonner";
import { IbPipelineItem, LifecycleStage } from "@/lib/admin/ib/ib-monitor.types";

interface Props {
    items: IbPipelineItem[];
    total: number;
    stats: {
        total: number;
        pending: number;
        approved: number;
        rejected: number;
    } | null;
    currentParams: Record<string, string | undefined>;
}

function FilterMenu({
    label,
    value,
    options,
    onChange,
}: {
    label: string;
    value?: string;
    options: Array<{ value: string; label: string }>;
    onChange: (value: string) => void;
}) {
    const selected = options.find((option) => option.value === value) || options[0];
    return (
        <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-gray-400">{label}:</span>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-[38px] gap-1.5 rounded-xl px-3 text-xs font-bold">
                        {selected.label}
                        <ChevronDown size={14} className="opacity-60" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-52">
                    {options.map((option) => (
                        <DropdownMenuItem key={option.value} onClick={() => onChange(option.value)}>
                            {option.label}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

export function VipPipelineClient({
    items,
    total,
    stats,
    currentParams,
}: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const [searchInputValue, setSearchInputValue] = useState(currentParams.q || "");
    const [selectedItem, setSelectedItem] = useState<IbPipelineItem | null>(null);
    const [rejectModalId, setRejectModalId] = useState<string | null>(null);

    // Body scroll lock: lock while the reject modal is open, release after the
    // exit animation completes (in onExitComplete) so the scrollbar doesn't flash.
    useEffect(() => {
        if (rejectModalId) {
            document.body.style.overflow = "hidden";
        }
    }, [rejectModalId]);

    const releaseRejectLock = () => {
        if (!rejectModalId) {
            document.body.style.overflow = "unset";
        }
    };
    const [rejectReason, setRejectReason] = useState("");
    const [deleteModalId, setDeleteModalId] = useState<string | null>(null);

    const updateFilterParams = (updates: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(updates).forEach(([key, val]) => {
            if (val === null || val === "" || val === "ALL") {
                params.delete(key);
            } else {
                params.set(key, val);
            }
        });
        params.set("page", "1");
        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`);
        });
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateFilterParams({ q: searchInputValue.trim() });
    };

    const handleApprove = (requestId: string) => {
        startTransition(async () => {
            const result = await approveVipRequest(requestId);
            if (result.success) {
                toast.success("VIP request approved & Pro access granted");
                setSelectedItem(null);
                router.refresh();
            } else {
                toast.error(result.error || "Failed to approve request.");
            }
        });
    };

    const handleReject = (requestId: string) => {
        if (!rejectReason.trim()) return;
        startTransition(async () => {
            const result = await rejectVipRequest(requestId, rejectReason);
            if (result.success) {
                toast.success("Request rejected");
                setRejectModalId(null);
                setRejectReason("");
                setSelectedItem(null);
                router.refresh();
            } else {
                toast.error(result.error || "Failed to reject request");
            }
        });
    };


    const handleRevoke = (userId: string, tradingAccountId?: string | null) => {
        startTransition(async () => {
            const result = await revokeProAccess(userId, undefined, tradingAccountId || undefined);
            if (result.success) {
                toast.success("Pro access revoked");
                router.refresh();
            }
        });
    };

    const handleDelete = () => {
        if (!deleteModalId) return;
        startTransition(async () => {
            const result = await deleteVipRequest(deleteModalId);
            if (result.success) {
                toast.success("Request deleted");
                setDeleteModalId(null);
                setSelectedItem(null);
                router.refresh();
            } else {
                toast.error(result.error || "Failed to delete");
            }
        });
    };

    const lifecycleBadge = (stage: LifecycleStage) => {
        switch (stage) {
            case "TOOL_ACTIVE":
                return (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20 inline-flex items-center gap-1">
                        <Zap size={10} />
                        Tool Active
                    </span>
                );
            case "TOOL_UNLOCKED":
                return (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-50 text-cyan-700 border border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-300 dark:border-cyan-500/20 inline-flex items-center gap-1">
                        <Unlock size={10} />
                        Tool Unlocked
                    </span>
                );
            case "VIP_APPROVED":
                return (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20 inline-flex items-center gap-1">
                        <Check size={10} />
                        VIP Approved
                    </span>
                );
            case "VIP_REQUESTED":
                return (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20 inline-flex items-center gap-1">
                        <Clock size={10} />
                        VIP Requested
                    </span>
                );
            case "FIRST_TRADE":
                return (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-500/10 dark:text-purple-300 dark:border-purple-500/20 inline-flex items-center gap-1">
                        <TrendingUp size={10} />
                        First Trade
                    </span>
                );
            case "ACCOUNT_CONNECTED":
                return (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-500/10 dark:text-teal-300 dark:border-teal-500/20 inline-flex items-center gap-1">
                        <LinkIcon size={10} />
                        Account Connected
                    </span>
                );
            case "AT_RISK":
                return (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20 inline-flex items-center gap-1">
                        <AlertOctagon size={10} />
                        At Risk
                    </span>
                );
            default:
                return (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gray-50 text-gray-600 border border-gray-200 dark:bg-white/5 dark:text-gray-400 dark:border-white/10">
                        {stage}
                    </span>
                );
        }
    };

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <AnimatedStatCard
                        title="Total Requests"
                        value={stats.total}
                        icon={Users}
                        color="blue"
                        index={0}
                        trendPercent={null}
                    />
                    <AnimatedStatCard
                        title="Pending"
                        value={stats.pending}
                        icon={Clock}
                        color="amber"
                        index={1}
                        trendPercent={null}
                    />
                    <AnimatedStatCard
                        title="Approved"
                        value={stats.approved}
                        icon={CheckCircle2}
                        color="green"
                        index={2}
                        trendPercent={null}
                    />
                    <AnimatedStatCard
                        title="Rejected"
                        value={stats.rejected}
                        icon={XCircle}
                        color="amber"
                        index={3}
                        trendPercent={null}
                    />
                </div>
            )}

            {/* Filter & Controls Bar */}
            <div className="bg-white dark:bg-[#1E2028] p-4 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm space-y-4">
                <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3 items-center">
                    <div className="w-full md:w-96">
                        <PremiumInput
                            placeholder="Search name, email, Telegram, account #..."
                            value={searchInputValue}
                            onChange={(e) => setSearchInputValue(e.target.value)}
                            icon={Search}
                            className="w-full"
                        />
                    </div>
                    <Button type="submit" variant="outline" className="h-[42px] px-5 font-bold text-xs">
                        Search
                    </Button>
                    {currentParams.q && (
                        <Button
                            type="button"
                            variant="ghost"
                            className="h-[42px] px-4 font-bold text-xs"
                            onClick={() => {
                                setSearchInputValue("");
                                updateFilterParams({ q: null });
                            }}
                        >
                            Clear
                        </Button>
                    )}
                </form>

                 <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 dark:border-white/5">
                    {/* Lifecycle stage filter */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-gray-400">Stage:</span>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="text-xs font-bold h-[38px] gap-1.5 px-3 rounded-xl">
                                    {currentParams.stage && currentParams.stage !== "ALL" ? currentParams.stage.replaceAll("_", " ") : "All Stages"}
                                    <ChevronDown size={14} className="opacity-60" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-52">
                                <DropdownMenuItem onClick={() => updateFilterParams({ stage: "ALL" })}>All Stages</DropdownMenuItem>
                                {[
                                    "SIGNED_UP", "VERIFIED", "ACCOUNT_CONNECTED", "FIRST_SYNC", "FIRST_TRADE",
                                    "VIP_REQUESTED", "VIP_APPROVED", "TOOL_UNLOCKED", "TOOL_ACTIVE", "AT_RISK",
                                ].map((stage) => (
                                    <DropdownMenuItem key={stage} onClick={() => updateFilterParams({ stage })}>
                                        {stage.replaceAll("_", " ")}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Product evidence filter */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-gray-400">Product:</span>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="text-xs font-bold h-[38px] gap-1.5 px-3 rounded-xl">
                                    {currentParams.product && currentParams.product !== "ALL" ? currentParams.product : "All Products"}
                                    <ChevronDown size={14} className="opacity-60" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-52">
                                <DropdownMenuItem onClick={() => updateFilterParams({ product: "ALL" })}>All Products</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateFilterParams({ product: "goldscalperninja" })}>GoldScalperNinja</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateFilterParams({ product: "trade-manager" })}>Trade Manager</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateFilterParams({ product: "gsn-phoenix-grid" })}>GSN Phoenix Grid</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-gray-400">Status:</span>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="text-xs font-bold h-[38px] gap-1.5 px-3 rounded-xl">
                                    {currentParams.status === "PENDING"
                                        ? "Pending"
                                        : currentParams.status === "APPROVED"
                                        ? "Approved"
                                        : currentParams.status === "REJECTED"
                                        ? "Rejected"
                                        : "All Statuses"}
                                    <ChevronDown size={14} className="opacity-60" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-44">
                                <DropdownMenuItem onClick={() => updateFilterParams({ status: "ALL" })}>
                                    All Statuses
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateFilterParams({ status: "PENDING" })}>
                                    Pending
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateFilterParams({ status: "APPROVED" })}>
                                    Approved
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateFilterParams({ status: "REJECTED" })}>
                                    Rejected
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Broker Filter */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-gray-400">Broker:</span>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="text-xs font-bold h-[38px] gap-1.5 px-3 rounded-xl">
                                    {currentParams.broker && currentParams.broker !== "ALL"
                                        ? currentParams.broker
                                        : "All Brokers"}
                                    <ChevronDown size={14} className="opacity-60" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-44">
                                <DropdownMenuItem onClick={() => updateFilterParams({ broker: "ALL" })}>
                                    All Brokers
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateFilterParams({ broker: "Exness" })}>
                                    Exness
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateFilterParams({ broker: "XM" })}>
                                    XM
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateFilterParams({ broker: "IC Markets" })}>
                                    IC Markets
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 pt-3 dark:border-white/5">
                    <FilterMenu
                        label="Health"
                        value={currentParams.accountHealth}
                        options={[
                            { value: "ALL", label: "All Health" },
                            { value: "CONNECTED", label: "Connected (<24h)" },
                            { value: "STALE", label: "Sync Overdue (1-7d)" },
                            { value: "DISCONNECTED", label: "Disconnected (>7d)" },
                        ]}
                        onChange={(value) => updateFilterParams({ accountHealth: value })}
                    />
                    <FilterMenu
                        label="Capital"
                        value={currentParams.capitalBand}
                        options={[
                            { value: "ALL", label: "All Capital" },
                            { value: "0_1K", label: "Under $1K" },
                            { value: "1K_10K", label: "$1K-$10K" },
                            { value: "10K_50K", label: "$10K-$50K" },
                            { value: "50K_PLUS", label: "$50K+" },
                        ]}
                        onChange={(value) => updateFilterParams({ capitalBand: value })}
                    />
                    <FilterMenu
                        label="Request Age"
                        value={
                            currentParams.minAgeHours === "0" && currentParams.maxAgeHours === "24"
                                ? "FRESH"
                                : currentParams.minAgeHours === "24" && !currentParams.maxAgeHours
                                  ? "FOLLOW_UP"
                                  : currentParams.minAgeHours === "72" && !currentParams.maxAgeHours
                                    ? "OVERDUE"
                                    : "ALL"
                        }
                        options={[
                            { value: "ALL", label: "Any Request Age" },
                            { value: "FRESH", label: "Under 24h" },
                            { value: "FOLLOW_UP", label: "24h+ Follow-up" },
                            { value: "OVERDUE", label: "72h+ Overdue" },
                        ]}
                        onChange={(value) => {
                            if (value === "FRESH") updateFilterParams({ minAgeHours: "0", maxAgeHours: "24" });
                            else if (value === "FOLLOW_UP") updateFilterParams({ minAgeHours: "24", maxAgeHours: "" });
                            else if (value === "OVERDUE") updateFilterParams({ minAgeHours: "72", maxAgeHours: "" });
                            else updateFilterParams({ minAgeHours: "", maxAgeHours: "" });
                        }}
                    />
                </div>
            </div>

            {/* Pipeline Table */}
            <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] text-[11px] font-black uppercase text-gray-500 tracking-wider">
                                <th className="py-3 px-4">Trader / Request</th>
                                <th className="py-3 px-4">Lifecycle Stage</th>
                                <th className="py-3 px-4">Broker & Account</th>
                                <th className="py-3 px-4">Submitted vs Live Capital</th>
                                <th className="py-3 px-4">Age / Time</th>
                                <th className="py-3 text-right px-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-sm">
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-gray-400">
                                        No pipeline requests found.
                                    </td>
                                </tr>
                            ) : (
                                items.map((req) => (
                                    <tr key={req.requestId} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                        {/* Trader Info */}
                                        <td className="py-3.5 px-4">
                                            <div>
                                                <Link
                                                    href={`/admin/users/${req.userId}`}
                                                    className="font-bold text-gray-900 dark:text-white hover:text-primary transition-colors flex items-center gap-1.5"
                                                >
                                                    {req.userName}
                                                    <ExternalLink size={12} className="opacity-50" />
                                                </Link>
                                                <p className="text-xs text-gray-500 font-mono">
                                                    {req.userEmail} | TG: {req.telegramId}
                                                </p>
                                            </div>
                                        </td>

                                        {/* Lifecycle Stage */}
                                        <td className="py-3.5 px-4">
                                            {lifecycleBadge(req.lifecycleStage)}
                                        </td>

                                        {/* Broker & Masked Account */}
                                        <td className="py-3.5 px-4">
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white text-xs">
                                                    {req.broker}
                                                </p>
                                                <p className="font-mono text-xs text-gray-500">
                                                    #{req.accountNumber}
                                                </p>
                                            </div>
                                        </td>

                                        {/* Capital Comparison */}
                                        <td className="py-3.5 px-4">
                                            <div>
                                                <p className="text-xs text-gray-500 font-medium">
                                                    Sub: <span className="font-mono font-bold text-gray-800 dark:text-white">${req.submittedBalance}</span>
                                                </p>
                                                <p className="text-xs text-gray-500 font-medium">
                                                    Live: {req.liveBalance !== null ? (
                                                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">${req.liveBalance.toLocaleString("en-US")} {req.liveCurrency || "UNKNOWN"}</span>
                                                    ) : (
                                                        <span className="text-gray-400 italic">Not Linked</span>
                                                    )}
                                                </p>
                                            </div>
                                        </td>

                                        {/* Age */}
                                        <td className="py-3.5 px-4">
                                            <span className="text-xs text-gray-500 font-medium">
                                                {req.requestAgeHours}h ago
                                            </span>
                                        </td>

                                        {/* Actions */}
                                        <td className="py-3.5 px-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {req.vipStatus === "PENDING" && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="primary"
                                                            disabled={isPending}
                                                            onClick={() => handleApprove(req.requestId)}
                                                        >
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            disabled={isPending}
                                                            onClick={() => setRejectModalId(req.requestId)}
                                                        >
                                                            Reject
                                                        </Button>
                                                    </>
                                                )}
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" aria-label="More actions">
                                                            <MoreHorizontal size={16} />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40">
                                                        <DropdownMenuItem
                                                            onClick={() => setDeleteModalId(req.requestId)}
                                                            className="text-red-600 dark:text-red-400"
                                                        >
                                                            <Trash2 size={14} className="mr-2" /> Delete Request
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Reject Modal */}
            <AnimatePresence onExitComplete={releaseRejectLock}>
            {rejectModalId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        variants={backdropVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ type: "tween", duration: 0.2 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div
                        variants={panelVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={SPRING_SOFT}
                        className="relative bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 p-6 max-w-md w-full space-y-4 shadow-xl"
                    >
                        <h3 className="text-lg font-black text-gray-900 dark:text-white">
                            Reject VIP Request
                        </h3>
                        <p className="text-sm text-gray-500">
                            Please specify a reason for rejecting this request. The trader will receive a notification with this explanation.
                        </p>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Reason for rejection (e.g. Account number does not match IB partner link)..."
                            className="w-full h-24 p-3 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="ghost" onClick={() => setRejectModalId(null)}>
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                disabled={!rejectReason.trim() || isPending}
                                onClick={() => handleReject(rejectModalId)}
                            >
                                Confirm Rejection
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
            </AnimatePresence>

            {/* Delete Confirm Modal */}
            {deleteModalId && (
                <ConfirmDialog
                    isOpen={!!deleteModalId}
                    title="Delete Request"
                    description="Are you sure you want to delete this VIP request? Associated entitlements will be removed."
                    confirmText="Delete"
                    onConfirm={handleDelete}
                    onCancel={() => setDeleteModalId(null)}
                />
            )}
        </div>
    );
}
