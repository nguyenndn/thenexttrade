"use client";

import { useState, useTransition } from "react";
import {
    Bug,
    Lightbulb,
    Clock,
    CheckCircle2,
    Loader2,
    AlertCircle,
    Trash2,
    CheckSquare,
    Square,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "sonner";
import {
    deleteUserFeedbackAction,
    deleteUserBulkFeedbackAction,
} from "@/actions/feedback";
import { motion, AnimatePresence } from "framer-motion";
import { SPRING_SOFT } from "@/lib/animations";

interface FeedbackItem {
    id: string;
    type: string;
    message: string;
    status: string;
    createdAt: string | Date;
}

interface FeedbackPageClientProps {
    feedbacks: FeedbackItem[];
}

const statusConfig: Record<
    string,
    { label: string; color: string; icon: typeof Clock }
> = {
    OPEN: { label: "Open", color: "text-blue-500 bg-blue-500/10", icon: Clock },
    IN_PROGRESS: {
        label: "In Progress",
        color: "text-amber-500 bg-amber-500/10",
        icon: Loader2,
    },
    RESOLVED: {
        label: "Resolved",
        color: "text-primary bg-primary/10",
        icon: CheckCircle2,
    },
    CLOSED: {
        label: "Closed",
        color: "text-gray-600 bg-gray-500/10",
        icon: AlertCircle,
    },
};

export default function FeedbackPageClient({
    feedbacks: initialFeedbacks,
}: FeedbackPageClientProps) {
    const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>(initialFeedbacks);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isBulkConfirmOpen, setIsBulkConfirmOpen] = useState(false);
    const [isAllConfirmOpen, setIsAllConfirmOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const isAllSelected =
        feedbacks.length > 0 && selectedIds.size === feedbacks.length;

    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(feedbacks.map((f) => f.id)));
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

    const handleDeleteSingle = async (id: string) => {
        startTransition(async () => {
            const res = await deleteUserFeedbackAction(id);
            if (res.success) {
                setFeedbacks((prev) => prev.filter((f) => f.id !== id));
                setSelectedIds((prev) => {
                    const next = new Set(prev);
                    next.delete(id);
                    return next;
                });
                toast.success("Feedback deleted successfully");
            } else {
                toast.error(res.error || "Failed to delete feedback");
            }
            setDeletingId(null);
        });
    };

    const handleDeleteSelected = async () => {
        if (selectedIds.size === 0) return;
        const idsToDelete = Array.from(selectedIds);
        startTransition(async () => {
            const res = await deleteUserBulkFeedbackAction({ ids: idsToDelete });
            if (res.success) {
                setFeedbacks((prev) =>
                    prev.filter((f) => !selectedIds.has(f.id))
                );
                setSelectedIds(new Set());
                toast.success(
                    `Deleted ${res.count || idsToDelete.length} feedback items`
                );
            } else {
                toast.error(res.error || "Failed to delete selected items");
            }
            setIsBulkConfirmOpen(false);
        });
    };

    const handleDeleteAll = async () => {
        startTransition(async () => {
            const res = await deleteUserBulkFeedbackAction({ all: true });
            if (res.success) {
                setFeedbacks([]);
                setSelectedIds(new Set());
                toast.success("All feedback requests deleted");
            } else {
                toast.error(res.error || "Failed to delete all feedback");
            }
            setIsAllConfirmOpen(false);
        });
    };

    if (feedbacks.length === 0) {
        return (
            <div className="bg-white dark:bg-[#151925] rounded-xl border border-dashboard shadow-sm">
                <div className="text-center py-20 text-gray-500">
                    <Bug size={48} className="mx-auto mb-4 opacity-50" />
                    <h3 className="text-base font-bold text-gray-700 dark:text-white">
                        No feedback yet
                    </h3>
                    <p className="text-sm mt-1">
                        Use the floating chat button to submit bug reports or
                        feature requests.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Top Toolbar / Bulk Selection Bar */}
            <div className="bg-white dark:bg-[#151925] rounded-xl border border-dashboard p-3 px-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={toggleSelectAll}
                        className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-primary transition-colors cursor-pointer"
                    >
                        {isAllSelected ? (
                            <CheckSquare size={18} className="text-primary" />
                        ) : (
                            <Square
                                size={18}
                                className="text-gray-400 dark:text-gray-500"
                            />
                        )}
                        <span>
                            {selectedIds.size > 0
                                ? `${selectedIds.size} of ${feedbacks.length} selected`
                                : `Select All (${feedbacks.length})`}
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

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <AnimatePresence>
                        {selectedIds.size > 0 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={SPRING_SOFT}
                            >
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsBulkConfirmOpen(true)}
                                    disabled={isPending}
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 border-red-200 dark:border-red-500/20 text-xs font-bold gap-1.5 h-8"
                                >
                                    {isPending ? (
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

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAllConfirmOpen(true)}
                        disabled={isPending}
                        className="text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 border-gray-200 dark:border-white/10 text-xs font-semibold gap-1.5 h-8"
                    >
                        <Trash2 size={14} />
                        Delete All
                    </Button>
                </div>
            </div>

            {/* Feedback Cards */}
            <div className="space-y-3">
                {feedbacks.map((fb) => {
                    const isBug = fb.type === "BUG";
                    const status = statusConfig[fb.status] || statusConfig.OPEN;
                    const StatusIcon = status.icon;
                    const isSelected = selectedIds.has(fb.id);

                    return (
                        <div
                            key={fb.id}
                            className={cn(
                                "bg-white dark:bg-[#151925] rounded-xl border border-dashboard p-5 shadow-sm transition-all",
                                "border-l-4",
                                isBug
                                    ? "border-l-red-500"
                                    : "border-l-amber-500",
                                isSelected &&
                                    "ring-1 ring-primary/40 bg-primary/[0.02]"
                            )}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <button
                                        type="button"
                                        onClick={() => toggleSelectItem(fb.id)}
                                        className="mt-0.5 text-gray-400 hover:text-primary transition-colors cursor-pointer"
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

                                    <div>
                                        <div className="flex items-center gap-2.5 mb-1.5">
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
                                        </div>

                                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mt-1">
                                            {fb.message}
                                        </p>

                                        <p className="text-[11px] text-gray-500 mt-2">
                                            {formatDistanceToNow(
                                                new Date(fb.createdAt)
                                            )}{" "}
                                            ago
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <div
                                        className={cn(
                                            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold",
                                            status.color
                                        )}
                                    >
                                        <StatusIcon size={12} />
                                        {status.label}
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setDeletingId(fb.id)}
                                        disabled={isPending}
                                        className="w-7 h-7 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 border-gray-200 dark:border-white/10 rounded-lg transition-colors"
                                        aria-label="Delete feedback"
                                    >
                                        <Trash2 size={13} />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Confirm Dialog: Single Delete */}
            <ConfirmDialog
                isOpen={!!deletingId}
                title="Delete Feedback"
                description="Are you sure you want to delete this feedback item? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
                isLoading={isPending}
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
                isLoading={isPending}
                onConfirm={handleDeleteSelected}
                onCancel={() => setIsBulkConfirmOpen(false)}
            />

            {/* Confirm Dialog: Delete All */}
            <ConfirmDialog
                isOpen={isAllConfirmOpen}
                title="Delete All Feedback"
                description="Are you sure you want to permanently delete all your submitted feedback requests? This action cannot be undone."
                confirmText="Delete All"
                cancelText="Cancel"
                variant="danger"
                isLoading={isPending}
                onConfirm={handleDeleteAll}
                onCancel={() => setIsAllConfirmOpen(false)}
            />
        </div>
    );
}
