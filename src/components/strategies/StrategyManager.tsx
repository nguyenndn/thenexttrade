"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Target, TrendingUp, Percent, Search, ArrowUpDown, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StrategyModal } from "./StrategyModal";
import { StrategyPerformanceChart } from "./StrategyPerformanceChart";
import { StrategyComparisonTable } from "./StrategyComparisonTable";
import { PaginationControl } from "@/components/ui/PaginationControl";
import { PageHeader } from "@/components/ui/PageHeader";
import { useRouter, useSearchParams } from "next/navigation";
import { deleteStrategy, getStrategyPerformance, untagStrategy } from "@/actions/strategies";

interface Strategy {
    id: string;
    name: string;
    description: string | null;
    rules: string | null;
    color: string;
}

interface StrategyPerformance {
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
    const searchParams = useSearchParams();
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
        
        result.sort((a, b) => {
            if (sortBy === "name") {
                return a.name.localeCompare(b.name);
            }
            
            const perfA = enrichedPerformance.find(p => p.strategy === a.name);
            const perfB = enrichedPerformance.find(p => p.strategy === b.name);
            
            const getVal = (perf: StrategyPerformance | undefined, key: keyof StrategyPerformance) => perf ? Number(perf[key] || 0) : 0;

            if (sortBy === "trades") return getVal(perfB, "totalTrades") - getVal(perfA, "totalTrades");
            if (sortBy === "pnl") return getVal(perfB, "totalPnL") - getVal(perfA, "totalPnL");
            if (sortBy === "winRate") return getVal(perfB, "winRate") - getVal(perfA, "winRate");
            
            return 0;
        });
        
        return result;
    }, [allStrategies, searchQuery, sortBy, enrichedPerformance]);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Delete strategy "${name}"? This will untag all associated trades.`)) return;

        try {
            // Check if it's a temporary strategy (ghost)
            if (id.startsWith("temp-")) {
                const result = await untagStrategy(name);
                if (result.error) throw new Error(result.error);

                router.refresh(); // Refresh to update list if needed
                fetchPerformance(); // Re-fetch performance to clear ghost
            } else {
                // Real strategy deletion via Server Action
                const result = await deleteStrategy(id);
                if (result.error) throw new Error(result.error);
                toast.success("Strategy deleted");
                // No need to manually fetchStrategies, revalidatePath in action handles it.
                // But we might want to refresh performance stats too.
                router.refresh(); // Syncs server component
                fetchPerformance();
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to delete strategy");
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
                    onClick={() => setShowModal(true)}
                    className="flex flex-1 md:flex-none items-center justify-center gap-2 bg-primary hover:bg-[#00B078] text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-primary/25 active:scale-95"
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
                            onChange={(e) => setSortBy(e.target.value as any)}
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
                                onDelete={() => handleDelete(strategy.id, strategy.name)}
                            />
                        );
                    })}
                </div>
            ) : (
                <EmptyState onAdd={() => setShowModal(true)} />
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
        </>
    );
}

function StrategyCard({
    strategy,
    performance,
    isGhost,
    onEdit,
    onDelete,
}: {
    strategy: Strategy;
    performance?: StrategyPerformance;
    isGhost?: boolean;
    onEdit: () => void;
    onDelete: () => void;
}) {
    return (
        <div className={`bg-white dark:bg-[#1E2028] p-6 rounded-xl border shadow-sm group hover:border-[#00C888]/50 hover:shadow-md transition-shadow ${isGhost ? 'border-dashed border-gray-300 dark:border-white/20' : 'border-gray-100 dark:border-white/5'
            }`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: strategy.color }}
                    />
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                        {strategy.name}
                        {isGhost && (
                            <span className="text-[10px] bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-full text-gray-500 font-medium">Unsaved</span>
                        )}
                    </h3>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={onEdit}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-white"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors text-gray-400 hover:text-red-500"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            {/* Description */}
            <div className="min-h-[40px] mb-4">
                {strategy.description ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                        {strategy.description}
                    </p>
                ) : (
                    <p className="text-sm text-gray-400 italic">No description</p>
                )}
            </div>

            {/* Rules */}
            {strategy.rules && (
                <div className="mb-4">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Rules</p>
                    <div className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-white/5 p-3 rounded-lg border border-gray-100 dark:border-white/5 whitespace-pre-line max-h-[100px] overflow-y-auto custom-scrollbar">
                        {strategy.rules}
                    </div>
                </div>
            )}

            {/* Stats */}
            {performance ? (
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-50 dark:border-white/5">
                    <div className="text-center p-2 bg-gray-50 dark:bg-white/5 rounded-xl">
                        <Target size={16} className="mx-auto mb-1 text-purple-500" />
                        <p className="text-base font-bold text-gray-900 dark:text-white">
                            {(performance.winRate ?? 0).toFixed(0)}%
                        </p>
                        <p className="text-[10px] uppercase font-bold text-gray-400">Win Rate</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 dark:bg-white/5 rounded-xl">
                        <TrendingUp size={16} className={`mx-auto mb-1 ${performance.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                        <p className={`text-base font-bold ${performance.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            ${Math.abs(performance.totalPnL ?? 0).toFixed(0)}
                        </p>
                        <p className="text-[10px] uppercase font-bold text-gray-400">P&L</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 dark:bg-white/5 rounded-xl">
                        <Percent size={16} className="mx-auto mb-1 text-blue-500" />
                        <p className="text-base font-bold text-gray-900 dark:text-white">
                            {performance.profitFactor === Infinity ? "∞" : (performance.profitFactor ?? 0).toFixed(1)}
                        </p>
                        <p className="text-[10px] uppercase font-bold text-gray-400">PF</p>
                    </div>
                </div>
            ) : (
                <div className="py-6 text-center bg-gray-50 dark:bg-white/5 rounded-xl border border-dashed border-gray-200 dark:border-white/10">
                    <p className="text-sm text-gray-400">
                        No trades recorded
                    </p>
                </div>
            )}

            {/* Save Ghost Button */}
            {isGhost && (
                <div className="mt-4 border-t border-gray-50 dark:border-white/5 pt-4">
                    <Button 
                        variant="ghost" 
                        onClick={onEdit} 
                        className="w-full bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary font-bold border border-primary/20 transition-colors"
                    >
                        <Save size={16} />
                        <span>Save to Library</span>
                    </Button>
                </div>
            )}
        </div>
    );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
    return (
        <div className="text-center py-16 bg-white dark:bg-[#1E2028] rounded-xl border-2 border-dashed border-gray-200 dark:border-white/10 mt-8">
            <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target size={32} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                No strategies yet
            </h3>
            <p className="text-gray-500 px-6 max-w-sm mx-auto">
                Create strategies to track which setups work best for you.
                Tag your trades and analyze their performance.
            </p>
        </div>
    );
}

function StrategiesLoadingSkeleton() {
    return (
        <div className="space-y-6 animate-pulse mt-6">
            <div className="h-[300px] bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5" />
            <div className="h-64 bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5" />
        </div>
    );
}
