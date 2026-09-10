"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import {
    Bug,
    Lightbulb,
    Search,
    Clock,
    Loader2,
    CheckCircle2,
    AlertCircle,
    ChevronDown,
    MessageSquare,
    Trash2,
    CheckSquare,
    Square,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { Button } from "@/components/ui/Button";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AnimatedStatCard } from "@/components/admin/dashboard/AnimatedStatCard";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { SPRING_SOFT } from "@/lib/animations";

const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to load data");
    return res.json();
};

interface Feedback {
    id: string;
    type: string;
    message: string;
    status: string;
    createdAt: string;
    user: {
        name: string | null;
        email: string | null;
        image: string | null;
    };
}

const statusOptions = [
    {
        value: "OPEN",
        label: "Open",
        color: "text-blue-500 bg-blue-500/10",
        icon: Clock,
    },
    {
        value: "IN_PROGRESS",
        label: "In Progress",
        color: "text-amber-500 bg-amber-500/10",
        icon: Loader2,
    },
    {
        value: "RESOLVED",
        label: "Resolved",
        color: "text-primary bg-primary/10",
        icon: CheckCircle2,
    },
    {
        value: "CLOSED",
        label: "Closed",
        color: "text-gray-600 bg-gray-500/10",
        icon: AlertCircle,
    },
];

type FilterType = "ALL" | "BUG" | "FEATURE";
type FilterStatus = "ALL" | "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export default function AdminFeedbackPage() {
    const { data, error, isLoading, mutate } = useSWR(
        "/api/admin/feedback",
        fetcher,
        {
            onError: (err) => {
                toast.error(err.message || "Error fetching feedback");
            },
        }
    );

    const feedbacks: Feedback[] = data?.feedbacks || [];
    const stats = data?.stats || {
        OPEN: 0,
        IN_PROGRESS: 0,
        RESOLVED: 0,
        CLOSED: 0,
    };

    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState<FilterType>("ALL");
    const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    // Selection & Bulk Action States
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isBulkConfirmOpen, setIsBulkConfirmOpen] = useState(false);
    const [isAllConfirmOpen, setIsAllConfirmOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const filtered = useMemo(() => {
        return feedbacks.filter((fb) => {
            const matchesSearch =
                !searchQuery ||
                fb.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                fb.user.name
                    ?.toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                fb.user.email
                    ?.toLowerCase()
                    .includes(searchQuery.toLowerCase());
            const matchesType = filterType === "ALL" || fb.type === filterType;
            const matchesStatus =
                filterStatus === "ALL" || fb.status === filterStatus;
            return matchesSearch && matchesType && matchesStatus;
        });
    }, [feedbacks, searchQuery, filterType, filterStatus]);

    const isAllSelected =
        filtered.length > 0 && filtered.every((fb) => selectedIds.has(fb.id));

    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filtered.map((fb) => fb.id)));
        }
    };

    const toggleSelectItem = (id: string) => {
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

    const handleStatusChange = async (id: string, newStatus: string) => {
        setUpdatingId(id);
        try {
            const res = await fetch("/api/admin/feedback", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status: newStatus }),
            });
            if (res.ok) {
                toast.success("Status updated");
                mutate();
            } else {
                toast.error("Failed to update status");
            }
        } catch {
            toast.error("Failed to update status");
        } finally {
            setUpdatingId(null);
        }
    };

    const handleDeleteSingle = async (id: string) => {
        setIsDeleting(true);
        try {
            const res = await fetch("/api/admin/feedback", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
            const resData = await res.json();
            if (res.ok && resData.success) {
                toast.success("Feedback deleted successfully");
                setSelectedIds((prev) => {
                    const next = new Set(prev);
                    next.delete(id);
                    return next;
                });
                mutate();
            } else {
                toast.error(resData.error || "Failed to delete feedback");
            }
        } catch {
            toast.error("Failed to delete feedback");
        } finally {
            setIsDeleting(false);
            setDeletingId(null);
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedIds.size === 0) return;
        setIsDeleting(true);
        try {
            const res = await fetch("/api/admin/feedback", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: Array.from(selectedIds) }),
            });
            const resData = await res.json();
            if (res.ok && resData.success) {
                toast.success(
                    `Deleted ${resData.count || selectedIds.size} feedback items`
                );
                setSelectedIds(new Set());
                mutate();
            } else {
                toast.error(resData.error || "Failed to delete selected items");
            }
        } catch {
            toast.error("Failed to delete selected items");
        } finally {
            setIsDeleting(false);
            setIsBulkConfirmOpen(false);
        }
    };

    const handleDeleteAll = async () => {
        setIsDeleting(true);
        try {
            const res = await fetch("/api/admin/feedback", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ all: true }),
            });
            const resData = await res.json();
            if (res.ok && resData.success) {
                toast.success("All feedback requests deleted");
                setSelectedIds(new Set());
                mutate();
            } else {
                toast.error(
                    resData.error || "Failed to delete feedback requests"
                );
            }
        } catch {
            toast.error("Failed to delete feedback requests");
        } finally {
            setIsDeleting(false);
            setIsAllConfirmOpen(false);
        }
    };

    const totalCount = feedbacks.length;

    return (
        <div className="space-y-4 pb-10">
            <AdminPageHeader
                title="Feedback & Support"
                description="Review bug reports and feature requests from users."
            />

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <AnimatedStatCard
                    title="Open"
                    value={stats.OPEN}
                    icon={Clock}
                    color="blue"
                    trendPercent={null}
                />
                <AnimatedStatCard
                    title="In Progress"
                    value={stats.IN_PROGRESS}
                    icon={Loader2}
                    color="amber"
                    trendPercent={null}
                />
                <AnimatedStatCard
                    title="Resolved"
                    value={stats.RESOLVED}
                    icon={CheckCircle2}
                    color="emerald"
                    trendPercent={null}
                />
                <AnimatedStatCard
                    title="Total"
                    value={totalCount}
                    icon={MessageSquare}
                    color="cyan"
                    trendPercent={null}
                />
            </div>

            {/* Unified Toolbar: Search + Filters + Actions */}
            <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-4 shadow-sm flex flex-col gap-4">
                <div className="flex flex-1 gap-4 flex-col lg:flex-row justify-between w-full lg:items-center">
                    <div className="flex flex-1 gap-2 flex-col sm:flex-row w-full lg:max-w-xl">
                        <div className="flex-1 w-full sm:max-w-md">
                            <PremiumInput
                                icon={Search}
                                placeholder="Search feedback..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Type Filter */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="flex items-center gap-2 h-[42px] text-xs font-medium text-gray-700 dark:text-gray-300 w-full sm:w-auto shrink-0 justify-between sm:justify-center"
                                >
                                    <span>
                                        Type:{" "}
                                        <span className="text-primary">
                                            {filterType === "ALL"
                                                ? "All"
                                                : filterType === "BUG"
                                                  ? "Bug"
                                                  : "Feature"}
                                        </span>
                                    </span>
                                    <ChevronDown size={14} aria-hidden="true" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="w-44 rounded-xl border-gray-200 dark:border-white/10"
                            >
                                <DropdownMenuItem
                                    onClick={() => setFilterType("ALL")}
                                >
                                    All Types
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setFilterType("BUG")}
                                >
                                    Bug Reports
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setFilterType("FEATURE")}
                                >
                                    Feature Requests
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Status Filter */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="flex items-center gap-2 h-[42px] text-xs font-medium text-gray-700 dark:text-gray-300 w-full sm:w-auto shrink-0 justify-between sm:justify-center"
                                >
                                    <span>
                                        Status:{" "}
                                        <span className="text-primary">
                                            {filterStatus === "ALL"
                                                ? "All"
                                                : statusOptions.find(
                                                      (s) =>
                                                          s.value ===
                                                          filterStatus
                                                  )?.label}
                                        </span>
                                    </span>
                                    <ChevronDown size={14} aria-hidden="true" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="w-44 rounded-xl border-gray-200 dark:border-white/10"
                            >
                                <DropdownMenuItem
                                    onClick={() => setFilterStatus("ALL")}
                                >
                                    All Status
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setFilterStatus("OPEN")}
                                >
                                    Open
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() =>
                                        setFilterStatus("IN_PROGRESS")
                                    }
                                >
                                    In Progress
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setFilterStatus("RESOLVED")}
                                >
                                    Resolved
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setFilterStatus("CLOSED")}
                                >
                                    Closed
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Delete All Button (Always available to Admin if feedbacks exist) */}
                    {feedbacks.length > 0 && (
                        <div className="flex items-center gap-2 shrink-0 justify-end">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsAllConfirmOpen(true)}
                                disabled={isDeleting}
                                className="text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 border-gray-200 dark:border-white/10 text-xs font-semibold gap-1.5 h-[42px] px-3.5"
                            >
                                <Trash2 size={14} />
                                Delete All
                            </Button>
                        </div>
                    )}
                </div>

                {/* Selection Bar & Bulk Actions */}
                {filtered.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-3 border-t border-gray-100 dark:border-white/5 gap-3">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={toggleSelectAll}
                                className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-primary transition-colors cursor-pointer"
                            >
                                {isAllSelected ? (
                                    <CheckSquare
                                        size={18}
                                        className="text-primary"
                                    />
                                ) : (
                                    <Square
                                        size={18}
                                        className="text-gray-400 dark:text-gray-500"
                                    />
                                )}
                                <span>
                                    {selectedIds.size > 0
                                        ? `${selectedIds.size} of ${filtered.length} selected`
                                        : `Select All (${filtered.length})`}
                                </span>
                            </button>
                            {selectedIds.size > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setSelectedIds(new Set())}
                                    className="text-[11px] font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline cursor-pointer"
                                >
                                    Deselect all
                                </button>
                            )}
                        </div>

                        <AnimatePresence>
                            {selectedIds.size > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={SPRING_SOFT}
                                    className="flex items-center gap-2"
                                >
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            setIsBulkConfirmOpen(true)
                                        }
                                        disabled={isDeleting}
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 border-red-200 dark:border-red-500/20 text-xs font-bold gap-1.5 h-8"
                                    >
                                        {isDeleting ? (
                                            <Loader2
                                                size={14}
                                                className="animate-spin"
                                            />
                                        ) : (
                                            <Trash2 size={14} />
                                        )}
                                        Delete Selected ({selectedIds.size})
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="bg-red-50 dark:bg-red-500/10 rounded-xl p-6 text-center text-red-600 dark:text-red-400">
                    <AlertCircle className="mx-auto mb-2" size={24} />
                    <p className="text-sm font-medium">
                        Failed to load feedback
                    </p>
                </div>
            )}

            {/* Empty */}
            {!isLoading && !error && filtered.length === 0 && (
                <div className="bg-white dark:bg-[#151925] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm text-center py-20">
                    <MessageSquare
                        size={48}
                        className="mx-auto mb-4 text-gray-300"
                    />
                    <h3 className="text-base font-bold text-gray-700 dark:text-white">
                        No feedback found
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                        {searchQuery ||
                        filterType !== "ALL" ||
                        filterStatus !== "ALL"
                            ? "Try adjusting your filters."
                            : "No feedback has been submitted yet."}
                    </p>
                </div>
            )}

            {/* List */}
            {!isLoading && !error && filtered.length > 0 && (
                <div className="space-y-3">
                    {filtered.map((fb) => {
                        const isBug = fb.type === "BUG";
                        const currentStatus =
                            statusOptions.find((s) => s.value === fb.status) ||
                            statusOptions[0];
                        const StatusIcon = currentStatus.icon;
                        const isSelected = selectedIds.has(fb.id);

                        return (
                            <div
                                key={fb.id}
                                className={cn(
                                    "bg-white dark:bg-[#151925] rounded-xl border border-gray-200 dark:border-white/10 p-5 shadow-sm transition-all",
                                    "border-l-4",
                                    isBug
                                        ? "border-l-red-500"
                                        : "border-l-amber-500",
                                    isSelected &&
                                        "ring-1 ring-primary/40 bg-primary/[0.02]"
                                )}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                toggleSelectItem(fb.id)
                                            }
                                            className="mt-0.5 text-gray-400 hover:text-primary transition-colors cursor-pointer shrink-0"
                                            aria-label={
                                                isSelected
                                                    ? "Deselect item"
                                                    : "Select item"
                                            }
                                        >
                                            {isSelected ? (
                                                <CheckSquare
                                                    size={18}
                                                    className="text-primary"
                                                />
                                            ) : (
                                                <Square size={18} />
                                            )}
                                        </button>

                                        <div className="flex-1 min-w-0">
                                            {/* Type + User */}
                                            <div className="flex items-center gap-2.5 mb-2">
                                                <div
                                                    className={cn(
                                                        "p-1.5 rounded-lg",
                                                        isBug
                                                            ? "bg-red-500/10 text-red-500"
                                                            : "bg-amber-500/10 text-amber-500"
                                                    )}
                                                >
                                                    {isBug ? (
                                                        <Bug size={16} />
                                                    ) : (
                                                        <Lightbulb size={16} />
                                                    )}
                                                </div>
                                                <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
                                                    {isBug
                                                        ? "Bug Report"
                                                        : "Feature Request"}
                                                </span>
                                                <span className="text-[11px] text-gray-500">
                                                    ·
                                                </span>
                                                <div className="flex items-center gap-1.5">
                                                    {fb.user.image && (
                                                        <img
                                                            src={fb.user.image}
                                                            alt=""
                                                            className="w-4 h-4 rounded-full"
                                                        />
                                                    )}
                                                    <span className="text-xs text-gray-600 font-medium truncate">
                                                        {fb.user.name ||
                                                            fb.user.email ||
                                                            "Unknown"}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Message */}
                                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                                {fb.message}
                                            </p>

                                            {/* Time */}
                                            <p className="text-[11px] text-gray-500 mt-2">
                                                {formatDistanceToNow(
                                                    new Date(fb.createdAt)
                                                )}{" "}
                                                ago
                                            </p>
                                        </div>
                                    </div>

                                    {/* Status Dropdown & Delete Action */}
                                    <div className="shrink-0 flex items-center gap-2">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        "flex items-center gap-2 h-8 text-xs font-bold px-3",
                                                        currentStatus.color,
                                                        updatingId === fb.id &&
                                                            "opacity-50"
                                                    )}
                                                >
                                                    <StatusIcon size={12} />
                                                    {currentStatus.label}
                                                    <ChevronDown size={12} />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent
                                                align="end"
                                                className="w-40 rounded-xl border-gray-200 dark:border-white/10"
                                            >
                                                {statusOptions.map((opt) => (
                                                    <DropdownMenuItem
                                                        key={opt.value}
                                                        onClick={() =>
                                                            handleStatusChange(
                                                                fb.id,
                                                                opt.value
                                                            )
                                                        }
                                                        className="text-xs font-medium"
                                                    >
                                                        {opt.label}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>

                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setDeletingId(fb.id)}
                                            disabled={isDeleting}
                                            className="w-8 h-8 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 border-gray-200 dark:border-white/10 rounded-lg transition-colors"
                                            aria-label="Delete feedback"
                                            title="Delete feedback"
                                        >
                                            <Trash2 size={13} />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Confirm Dialog: Single Delete */}
            <ConfirmDialog
                isOpen={!!deletingId}
                title="Delete Feedback"
                description="Are you sure you want to delete this feedback item? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
                isLoading={isDeleting}
                onConfirm={() => {
                    if (deletingId) handleDeleteSingle(deletingId);
                }}
                onCancel={() => setDeletingId(null)}
            />

            {/* Confirm Dialog: Selected Bulk Delete */}
            <ConfirmDialog
                isOpen={isBulkConfirmOpen}
                title="Delete Selected Feedback"
                description={`Are you sure you want to delete ${selectedIds.size} selected feedback item${selectedIds.size > 1 ? "s" : ""}? This action cannot be undone.`}
                confirmText={`Delete (${selectedIds.size})`}
                cancelText="Cancel"
                variant="danger"
                isLoading={isDeleting}
                onConfirm={handleDeleteSelected}
                onCancel={() => setIsBulkConfirmOpen(false)}
            />

            {/* Confirm Dialog: Delete All */}
            <ConfirmDialog
                isOpen={isAllConfirmOpen}
                title="Delete All Feedback"
                description={`Are you sure you want to permanently delete all ${feedbacks.length} feedback requests? This action cannot be undone.`}
                confirmText="Delete All"
                cancelText="Cancel"
                variant="danger"
                isLoading={isDeleting}
                onConfirm={handleDeleteAll}
                onCancel={() => setIsAllConfirmOpen(false)}
            />
        </div>
    );
}
