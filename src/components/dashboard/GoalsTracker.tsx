"use client";

import { useState } from "react";
import { Target, Plus, Trash2, TrendingUp, Trophy, AlertTriangle, X } from "lucide-react";
import { toast } from "sonner";
import { createTradingGoal, deleteTradingGoal, type TradingGoal } from "@/actions/goals";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

interface GoalWithProgress extends TradingGoal {
    currentValue: number;
    progress: number;
    isCompleted: boolean;
}

interface GoalsTrackerProps {
    goals: GoalWithProgress[];
}

const METRIC_CONFIG: Record<string, { label: string; unit: string; icon: typeof TrendingUp }> = {
    pnl: { label: "Profit/Loss", unit: "$", icon: TrendingUp },
    trades: { label: "Total Trades", unit: "", icon: Target },
    winRate: { label: "Win Rate", unit: "%", icon: Trophy },
    maxLoss: { label: "Max Loss", unit: "$", icon: AlertTriangle },
};

const FORM_INPUT_CLASSES = "px-3 py-2 bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-primary focus:border-primary";

export function GoalsTracker({ goals: initialGoals }: GoalsTrackerProps) {
    const router = useRouter();
    const [goals, setGoals] = useState<GoalWithProgress[]>(initialGoals);
    const [showForm, setShowForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState({
        type: "weekly" as "weekly" | "monthly",
        metric: "pnl" as "pnl" | "trades" | "winRate" | "maxLoss",
        targetValue: "",
    });

    const handleCreate = async () => {
        if (!form.targetValue || Number(form.targetValue) <= 0) {
            toast.error("Target value must be positive");
            return;
        }

        setIsSubmitting(true);
        const config = METRIC_CONFIG[form.metric];
        const result = await createTradingGoal({
            type: form.type,
            metric: form.metric,
            label: `${form.type === "weekly" ? "Weekly" : "Monthly"} ${config.label}`,
            targetValue: Number(form.targetValue),
        });

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Goal created!");
            setShowForm(false);
            setForm({ type: "weekly", metric: "pnl", targetValue: "" });
            router.refresh();
        }
        setIsSubmitting(false);
    };

    const handleDelete = async (goalId: string) => {
        const result = await deleteTradingGoal(goalId);
        if (result.error) {
            toast.error(result.error);
        } else {
            setGoals(prev => prev.filter(g => g.id !== goalId));
            toast.success("Goal removed");
        }
    };

    function formatValue(metric: string, value: number): string {
        switch (metric) {
            case "pnl":
            case "maxLoss":
                return `$${value.toFixed(0)}`;
            case "winRate":
                return `${value.toFixed(1)}%`;
            case "trades":
                return value.toString();
            default:
                return value.toString();
        }
    }

    return (
        <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <Target size={18} className="text-primary" />
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">Trading Goals</h3>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-lg"
                >
                    {showForm ? <X size={14} /> : <Plus size={14} />}
                    {showForm ? "Cancel" : "Add"}
                </Button>
            </div>

            {/* Create Form */}
            {showForm && (
                <div className="p-4 bg-gray-50 dark:bg-white/[0.02] border-b border-gray-200 dark:border-white/10">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                        <select
                            value={form.type}
                            onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value as any }))}
                            className={FORM_INPUT_CLASSES}
                        >
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                        </select>
                        <select
                            value={form.metric}
                            onChange={(e) => setForm(prev => ({ ...prev, metric: e.target.value as any }))}
                            className={FORM_INPUT_CLASSES}
                        >
                            {Object.entries(METRIC_CONFIG).map(([key, cfg]) => (
                                <option key={key} value={key}>{cfg.label}</option>
                            ))}
                        </select>
                        <input
                            type="number"
                            placeholder="Target"
                            value={form.targetValue}
                            onChange={(e) => setForm(prev => ({ ...prev, targetValue: e.target.value }))}
                            className={`${FORM_INPUT_CLASSES} placeholder:text-gray-400`}
                        />
                    </div>
                    <Button
                        variant="primary"
                        onClick={handleCreate}
                        disabled={isSubmitting}
                        className="w-full rounded-lg py-2"
                    >
                        {isSubmitting ? "Creating..." : "Create Goal"}
                    </Button>
                </div>
            )}

            {/* Goals List */}
            <div className="divide-y divide-gray-100 dark:divide-white/5">
                {goals.length === 0 && !showForm ? (
                    <div className="p-8 text-center">
                        <Target size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                        <p className="text-sm text-gray-400">No goals yet</p>
                        <p className="text-xs text-gray-400 mt-1">Set weekly or monthly targets to stay disciplined</p>
                    </div>
                ) : (
                    goals.map((goal) => {
                        const config = METRIC_CONFIG[goal.metric];
                        const isMaxLoss = goal.metric === "maxLoss";
                        // For maxLoss: green if below target, red if above
                        const barColor = isMaxLoss
                            ? (goal.isCompleted ? "bg-emerald-500" : "bg-red-500")
                            : (goal.progress >= 100 ? "bg-emerald-500" : "bg-primary");

                        return (
                            <div key={goal.id} className="px-5 py-4 group">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${goal.type === "weekly"
                                                ? "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400"
                                                : "bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400"
                                            }`}>
                                            {goal.type === "weekly" ? "W" : "M"}
                                        </span>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                            {config.label}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                                            {formatValue(goal.metric, goal.currentValue)}
                                            <span className="text-gray-400 font-normal"> / {formatValue(goal.metric, goal.targetValue)}</span>
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            aria-label="Delete Goal"
                                            onClick={() => handleDelete(goal.id)}
                                            className="w-7 h-7 p-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/30 transition-all rounded-lg"
                                        >
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                                        style={{ width: `${Math.min(goal.progress, 100)}%` }}
                                    />
                                </div>

                                {/* Status */}
                                {goal.isCompleted && (
                                    <div className="flex items-center gap-1 mt-1.5">
                                        <Trophy size={12} className="text-emerald-500" />
                                        <span className="text-xs font-medium text-emerald-500">
                                            {isMaxLoss ? "Within limit" : "Goal reached!"}
                                        </span>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
