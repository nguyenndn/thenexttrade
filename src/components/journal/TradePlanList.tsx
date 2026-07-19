"use client";

import { useState } from "react";
import { Plus, ListFilter, ClipboardCheck, Ban } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { TradePlanCard } from "./TradePlanCard";
import { TradePlanModal } from "./TradePlanModal";

interface TradePlanListProps {
    plans: any[];
    onRefresh: () => void;
    onLogTrade: (plan: any) => void;
    onViewActual?: (journalEntryId: string) => void;
}

export function TradePlanList({
    plans,
    onRefresh,
    onLogTrade,
    onViewActual,
}: TradePlanListProps) {
    const [filter, setFilter] = useState<
        "ALL" | "PLANNED" | "ACTIVE" | "MATCHED" | "CANCELLED"
    >("ALL");
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const filteredPlans = plans.filter((plan) => {
        if (filter === "ALL") return true;
        return plan.status === filter;
    });

    return (
        <div className="space-y-6">
            {/* Filters & Actions Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                {/* Status filters */}
                <div className="flex flex-wrap gap-1.5 p-1 bg-gray-50 dark:bg-black/20 border border-dashboard rounded-xl">
                    {(
                        [
                            "ALL",
                            "PLANNED",
                            "ACTIVE",
                            "MATCHED",
                            "CANCELLED",
                        ] as const
                    ).map((status) => {
                        const isActive = filter === status;
                        const count =
                            status === "ALL"
                                ? plans.length
                                : plans.filter((p) => p.status === status)
                                      .length;

                        return (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                                    isActive
                                        ? "bg-white dark:bg-[#1E2028] text-primary shadow-sm border border-dashboard"
                                        : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                }`}
                            >
                                {status}{" "}
                                <span className="opacity-60 ml-0.5">
                                    ({count})
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Add Plan Action */}
                <Button
                    size="smd"
                    onClick={() => setIsCreateOpen(true)}
                    className="flex items-center gap-2 w-full sm:w-auto"
                >
                    <Plus size={16} />
                    Create Trade Plan
                </Button>
            </div>

            {/* Grid of plans */}
            {filteredPlans.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-[#1E2028] rounded-xl border border-dashboard shadow-sm">
                    <div className="w-16 h-16 rounded-full bg-purple-50 dark:bg-purple-500/5 flex items-center justify-center mx-auto mb-4 border border-purple-100 dark:border-purple-500/15">
                        <ClipboardCheck size={28} className="text-purple-500" />
                    </div>
                    <h4 className="text-base font-bold text-gray-700 dark:text-white mb-1">
                        No Trade Plans Found
                    </h4>
                    <p className="text-xs text-gray-500 max-w-xs mx-auto mb-5">
                        {filter === "ALL"
                            ? "You haven't created any trade plans yet. Build discipline by planning setup details prior to trading."
                            : `No setups matching the ${filter.toLowerCase()} filter.`}
                    </p>
                    {filter === "ALL" && (
                        <Button
                            variant="outline"
                            onClick={() => setIsCreateOpen(true)}
                            className="text-xs py-1.5 h-auto rounded-lg border-purple-200 hover:bg-purple-50 dark:border-purple-500/20 dark:hover:bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold"
                        >
                            Log Your First Setup Plan
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredPlans.map((plan) => (
                        <TradePlanCard
                            key={plan.id}
                            plan={plan}
                            onRefresh={onRefresh}
                            onLogTrade={onLogTrade}
                            onViewActual={onViewActual}
                        />
                    ))}
                </div>
            )}

            {/* Create Modal */}
            <Modal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                title="Create Trade Plan"
            >
                <TradePlanModal
                    onSuccess={() => {
                        setIsCreateOpen(false);
                        onRefresh();
                    }}
                    onCancel={() => setIsCreateOpen(false)}
                />
            </Modal>
        </div>
    );
}
