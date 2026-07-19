"use client";

import { CheckCircle2, Trash2, XCircle } from "lucide-react";
import { useTransition, useState } from "react";
import {
    updateTraderGoalStatus,
    deleteTraderGoal,
    updateTraderGoalProgress,
} from "@/actions/rulebook";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface GoalCardProps {
    goal: any;
    onUpdate: () => void;
}

export function GoalCard({ goal, onUpdate }: GoalCardProps) {
    const [isPending, startTransition] = useTransition();
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const handleUpdateStatus = (
        status: "COMPLETED" | "CANCELLED" | "ACTIVE"
    ) => {
        startTransition(async () => {
            const res = await updateTraderGoalStatus(goal.id, status);
            if (res.success) {
                toast.success(`Goal marked as ${status.toLowerCase()}!`);
                onUpdate();
            } else {
                toast.error("Failed to update goal.");
            }
        });
    };

    const handleDelete = () => {
        setIsConfirmOpen(true);
    };

    const confirmDelete = () => {
        setIsConfirmOpen(false);
        startTransition(async () => {
            const res = await deleteTraderGoal(goal.id);
            if (res.success) {
                toast.success("Goal deleted successfully!");
                onUpdate();
            } else {
                toast.error("Failed to delete goal.");
            }
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "COMPLETED":
                return (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/20">
                        Completed
                    </span>
                );
            case "CANCELLED":
                return (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-red-50 text-red-500 border border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/20">
                        Cancelled
                    </span>
                );
            default:
                return (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/20">
                        Active
                    </span>
                );
        }
    };

    const getPeriodLabel = (period: string) => {
        switch (period) {
            case "DAILY":
                return "Daily Goal";
            case "WEEKLY":
                return "Weekly Goal";
            default:
                return "Monthly Goal";
        }
    };

    const target = goal.targetValue || 1;
    const progress = goal.progressValue || 0;
    const percent = Math.min(Math.round((progress / target) * 100), 100);
    const isManualGoal = ["STOP_AFTER_LOSSES", "STUDY", "CUSTOM"].includes(
        goal.type
    );

    const handleUpdateProgress = (newVal: number) => {
        const safeVal = Math.max(0, newVal);
        startTransition(async () => {
            const res = await updateTraderGoalProgress(goal.id, safeVal);
            if (res.success) {
                toast.success("Progress updated!");
                onUpdate();
            } else {
                toast.error("Failed to update progress.");
            }
        });
    };

    return (
        <div className="p-5 bg-white dark:bg-[#151925] border border-dashboard/80 dark:border-white/[0.08] rounded-2xl flex flex-col justify-between hover:shadow-md transition-all">
            <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
                        {getPeriodLabel(goal.period)}
                    </span>
                    {getStatusBadge(goal.status)}
                </div>

                <h4 className="text-sm font-bold text-gray-800 dark:text-white leading-snug">
                    {goal.title}
                </h4>

                {/* Progress Section */}
                {goal.status === "ACTIVE" && goal.targetValue && (
                    <div className="mt-4 space-y-2.5">
                        <div className="flex justify-between items-center text-xs font-semibold text-gray-500 dark:text-gray-400">
                            <span>Progress</span>
                            <span>
                                {progress} / {target} ({percent}%)
                            </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary rounded-full transition-all duration-500"
                                style={{ width: `${percent}%` }}
                            />
                        </div>

                        {/* Manual controls if manual goal */}
                        {isManualGoal && (
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-dashboard/50 dark:border-white/[0.04]">
                                <span className="text-[10px] uppercase font-black text-gray-400 dark:text-gray-500 flex-1">
                                    Update Progress:
                                </span>
                                <div className="flex items-center bg-gray-50 dark:bg-[#11141d] rounded-xl border border-dashboard p-0.5">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            handleUpdateProgress(progress - 1)
                                        }
                                        disabled={isPending || progress <= 0}
                                        className="w-7 h-7 p-0 rounded-lg border-none hover:bg-gray-200 dark:hover:bg-white/5 text-gray-500"
                                    >
                                        -
                                    </Button>
                                    <input
                                        type="number"
                                        min="0"
                                        max={target}
                                        value={progress}
                                        disabled={isPending}
                                        onChange={(e) => {
                                            const val = parseInt(
                                                e.target.value
                                            );
                                            if (!isNaN(val)) {
                                                handleUpdateProgress(val);
                                            }
                                        }}
                                        className="w-10 text-center bg-transparent border-none focus:outline-none text-xs font-bold text-gray-700 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            handleUpdateProgress(progress + 1)
                                        }
                                        disabled={
                                            isPending || progress >= target
                                        }
                                        className="w-7 h-7 p-0 rounded-lg border-none hover:bg-gray-200 dark:hover:bg-white/5 text-gray-500"
                                    >
                                        +
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Action panel */}
            <div className="flex items-center justify-between border-t border-dashboard/80 dark:border-white/[0.06] mt-5 pt-3">
                <span className="text-[10px] text-gray-400 dark:text-gray-500">
                    Created: {new Date(goal.createdAt).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-1.5">
                    {goal.status === "ACTIVE" && (
                        <>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleUpdateStatus("COMPLETED")}
                                disabled={isPending}
                                className="w-7 h-7 rounded-lg border-emerald-200 dark:border-emerald-500/10 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                                title="Mark Completed"
                            >
                                <CheckCircle2 size={12} />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleUpdateStatus("CANCELLED")}
                                disabled={isPending}
                                className="w-7 h-7 rounded-lg border-red-200 dark:border-red-500/10 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                                title="Cancel Goal"
                            >
                                <XCircle size={12} />
                            </Button>
                        </>
                    )}
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleDelete}
                        disabled={isPending}
                        className="w-7 h-7 rounded-lg border-gray-300 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                        title="Delete Goal"
                    >
                        <Trash2 size={12} />
                    </Button>
                </div>
            </div>
            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={isConfirmOpen}
                title="Delete Goal"
                description="Are you sure you want to delete this goal?"
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={confirmDelete}
                onCancel={() => setIsConfirmOpen(false)}
                variant="danger"
            />
        </div>
    );
}
