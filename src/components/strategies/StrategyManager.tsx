"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Plus, Search, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StrategyModal } from "./StrategyModal";
import { StrategyPerformanceChart } from "./StrategyPerformanceChart";
import { StrategyComparisonTable } from "./StrategyComparisonTable";
import { StrategyCard } from "./StrategyCard";
import { StrategyEmptyState } from "./StrategyEmptyState";
import { StrategiesLoadingSkeleton } from "./StrategiesLoadingSkeleton";
import { PaginationControl } from "@/components/ui/PaginationControl";
import { PageHeader } from "@/components/ui/PageHeader";
import { useRouter } from "next/navigation";
import { deleteStrategy, getStrategyPerformance, untagStrategy } from "@/actions/strategies";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export interface Strategy {
    id: string;
    name: string;
    description: string | null;
    rules: string | null;
    color: string;
}

export interface StrategyPerformance {
    strategy: string;
    color: string;
    totalTrades: number;
    winRate: number;
    totalPnL: number;
    avgPnL: number;
    profitFactor: number;
}

interface StrategyManagerProps {
    initialStrategies: Strategy[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export function StrategyManager({ initialStrategies, meta }: StrategyManagerProps) {
    const router = useRouter();
    const page = meta.page;
    const limit = meta.limit;

    // Use props directly, but if we need optimistic updates, we might need state.
    // For now, rely on Server Action revalidation + router.refresh() if needed.
    const strategies = initialStrategies;

    const [performance, setPerformance] = useState<StrategyPerformance[]>([]);
    const [isLoadingPerformance, setIsLoadingPerformance] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [strategyToDelete, setStrategyToDelete] = useState<{ id: string, name: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<"name" | "pnl" | "winRate" | "trades">("name");

    const fetchPerformance = async () => {
        try {
            setIsLoadingPerformance(true);
            const result = await getStrategyPerformance();
            if (result.error) throw new Error(result.error);
            setPerformance(result.performance || []);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load strategy performance");
        } finally {
            setIsLoadingPerformance(false);
        }
    };

    useEffect(() => {
        fetchPerformance();
    }, []);

    // Merge real strategies with "ghost" strategies found in performance
    const allStrategies = [...strategies];
    const enrichedPerformance = performance.map(perf => {
        let matchingStrategy = strategies.find(s => s.name === perf.strategy);
        
        if (!matchingStrategy) {
            const tempStrategy = {
                id: `temp-${perf.strategy}`,
                name: perf.strategy,
                description: "Unsaved strategy detected from trade history.",
                rules: null,
                color: "#9CA3AF" // Grey for unsaved
            };
            allStrategies.push(tempStrategy);
            matchingStrategy = tempStrategy;
        }

        return {
            ...perf,
            color: matchingStrategy.color
        };
    });

    const filteredStrategies = useMemo(() => {
        let result = allStrategies.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
        
        // PRE-COMPUTE PERFORMANCE lookup object to fix O(N^2) issue
        const perfMap = new Map<string, StrategyPerformance>();
        for (const p of enrichedPerformance) {
            perfMap.set(p.strategy, p);
        }

        const getVal = (perf: StrategyPerformance | undefined, key: keyof StrategyPerformance) => perf ? Number(perf[key] || 0) : 0;

        return result.sort((a, b) => {
            if (sortBy === "name") return a.name.localeCompare(b.name);
            
            const perfA = perfMap.get(a.name);
            const perfB = perfMap.get(b.name);
            
            if (sortBy === "trades") return getVal(perfB, "totalTrades") - getVal(perfA, "totalTrades");
            if (sortBy === "pnl") return getVal(perfB, "totalPnL") - getVal(perfA, "totalPnL");
            if (sortBy === "winRate") return getVal(perfB, "winRate") - getVal(perfA, "winRate");
            
            return 0;
        });
    }, [allStrategies, searchQuery, sortBy, enrichedPerformance]);

    const confirmDelete = (id: string, name: string) => {
        setStrategyToDelete({ id, name });
        setIsConfirmOpen(true);
    };

    const handleDelete = async () => {
        if (!strategyToDelete) return;
        setIsDeleting(true);

        try {
            // Check if it's a temporary strategy (ghost)
            if (strategyToDelete.id.startsWith("temp-")) {
                const result = await untagStrategy(strategyToDelete.name);
                if (result.error) throw new Error(result.error);

                router.refresh(); // Refresh to update list if needed
                fetchPerformance(); // Re-fetch performance to clear ghost
            } else {
                // Real strategy deletion via Server Action
                const result = await deleteStrategy(strategyToDelete.id);
                if (result.error) throw new Error(result.error);
                toast.success("Strategy deleted");
                // No need to manually fetchStrategies, revalidatePath in action handles it.
                // But we might want to refresh performance stats too.
                router.refresh(); // Syncs server component
                fetchPerformance();
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to delete strategy");
        } finally {
            setIsDeleting(false);
            setIsConfirmOpen(false);
            setStrategyToDelete(null);
        }
    };

    const handleSave = () => {
        setShowModal(false);
        setEditingStrategy(null);
        router.refresh(); // Refresh server data
        fetchPerformance();
    };

    return (

        <>
            {/* Header */}
            <PageHeader 
                title="Strategies"
                description="Track performance by trading strategy."
            >
                <Button
                    variant="primary"
                    onClick={() => setShowModal(true)}
                    className="flex-1 md:flex-none"
                >
                    <Plus size={18} strokeWidth={2.5} />
                    New Strategy
                </Button>
            </PageHeader>

            {/* Performance Chart - Only show when strategies exist */}
            <div className="space-y-6 mt-6">
                {strategies.length > 0 && (
                    isLoadingPerformance ? (
                        <StrategiesLoadingSkeleton />
                    ) : enrichedPerformance.length > 0 ? (
                        <>
                            <StrategyPerformanceChart data={enrichedPerformance} />
                            <StrategyComparisonTable data={enrichedPerformance} />
                        </>
                    ) : null
                )}
            </div>

            {/* Toolbar */}
            {allStrategies.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mt-6">
                    <div className="relative w-full sm:w-64 group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={16} className="text-gray-400 group-focus-within:text-primary transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search strategies..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-400"
                        />
                    </div>
                    
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <ArrowUpDown size={16} className="text-gray-400" />
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as "name" | "pnl" | "winRate" | "trades")}
                            className="w-full sm:w-auto appearance-none rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#151925] px-4 py-2.5 pr-8 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-gray-700 dark:text-gray-300 cursor-pointer"
                        >
                            <option value="name">Sort by Name</option>
                            <option value="pnl">Sort by Profit & Loss</option>
                            <option value="winRate">Sort by Win Rate</option>
                            <option value="trades">Sort by Trades Count</option>
                        </select>
                    </div>
                </div>
            )}

            {/* Strategy Cards */}
            {filteredStrategies.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                    {filteredStrategies.map((strategy) => {
                        const perf = performance.find(p => p.strategy === strategy.name);
                        const isGhost = strategy.id.startsWith("temp-");

                        return (
                            <StrategyCard
                                key={strategy.id}
                                strategy={strategy}
                                performance={perf}
                                isGhost={isGhost}
                                onEdit={() => {
                                    setEditingStrategy(strategy);
                                    setShowModal(true);
                                }}
                                onDelete={() => confirmDelete(strategy.id, strategy.name)}
                            />
                        );
                    })}
                </div>
            ) : (
                <StrategyEmptyState onAdd={() => setShowModal(true)} />
            )}

            <div className="mt-8">
                <PaginationControl
                    currentPage={page}
                    totalPages={meta.totalPages}
                    pageSize={limit}
                    totalItems={meta.total}
                    onPageChange={(p) => router.push(`/dashboard/strategies?page=${p}&limit=${limit}`)}
                    onPageSizeChange={(l) => router.push(`/dashboard/strategies?page=1&limit=${l}`)}
                    itemName="strategies"
                />
            </div>

            {/* Modal */}
            {showModal && (
                <StrategyModal
                    strategy={editingStrategy}
                    onClose={() => {
                        setShowModal(false);
                        setEditingStrategy(null);
                    }}
                    onSave={handleSave}
                />
            )}

            <ConfirmDialog
                isOpen={isConfirmOpen}
                title="Delete Strategy"
                description={`Delete strategy "${strategyToDelete?.name}"? This will untag all associated trades.`}
                confirmText="Delete Strategy"
                cancelText="Cancel"
                isLoading={isDeleting}
                onConfirm={handleDelete}
                onCancel={() => { setIsConfirmOpen(false); setStrategyToDelete(null); }}
                variant="danger"
            />
        </>
    );
}

