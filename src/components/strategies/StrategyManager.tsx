"use client";

import { useState, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Plus, Search, ArrowUpDown, ChevronDown, Check, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { StrategyModal } from "./StrategyModal";
import { StrategyPerformanceChart } from "./StrategyPerformanceChart";
import { StrategyComparisonTable } from "./StrategyComparisonTable";
import { StrategyCard } from "./StrategyCard";
import { StrategyEmptyState } from "./StrategyEmptyState";
import { StrategiesLoadingSkeleton } from "./StrategiesLoadingSkeleton";
import { PaginationControl } from "@/components/ui/PaginationControl";
import { PageHeader } from "@/components/ui/PageHeader";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { useRouter } from "next/navigation";
import {
    deleteStrategy,
    getStrategyPerformance,
    untagStrategy,
} from "@/actions/strategies";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { cn } from "@/lib/utils";

import { PlaybookComparisonCard, PlaybookSummary } from "./PlaybookComparisonCard";

export interface Strategy {
    id: string;
    name: string;
    description: string | null;
    rules: string | null;
    color: string;
    isPlaybook: boolean;
    setupType: string | null;
    timeframes: string[];
    pairs: string[];
    idealEntry: string | null;
    idealStopLoss: string | null;
    idealTakeProfit: string | null;
    riskRewardMin: number | null;
    referenceImages: string[];
}

export interface StrategyPerformance {
    strategy: string;
    totalTrades: number;
    winRate: number;
    totalPnL: number;
    avgPnL: number;
    profitFactor: number;
    color: string;
    isPlaybook?: boolean;
}

interface StrategyManagerProps {
    initialStrategies: Strategy[];
    initialPerformance?: StrategyPerformance[];
    initialSummary?: PlaybookSummary;
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export function StrategyManager({
    initialStrategies,
    meta,
    initialPerformance = [],
    initialSummary,
}: StrategyManagerProps) {
    const router = useRouter();
    const page = meta.page;
    const limit = meta.limit;

    // Use props directly, but if we need optimistic updates, we might need state.
    // For now, rely on Server Action revalidation + router.refresh() if needed.
    const strategies = initialStrategies;

    const [performance, setPerformance] =
        useState<StrategyPerformance[]>(initialPerformance);
    const [summary, setSummary] = useState<PlaybookSummary | undefined>(initialSummary);
    const [isLoadingPerformance, setIsLoadingPerformance] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [defaultPlaybook, setDefaultPlaybook] = useState(false);
    const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(
        null
    );

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [strategyToDelete, setStrategyToDelete] = useState<{
        id: string;
        name: string;
    } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState<"all" | "playbook" | "standard">("all");
    const [sortBy, setSortBy] = useState<"name" | "pnl" | "winRate" | "trades">(
        "name"
    );

    const sortOptions: { value: typeof sortBy; label: string }[] = [
        { value: "name", label: "Name" },
        { value: "pnl", label: "Profit & Loss" },
        { value: "winRate", label: "Win Rate" },
        { value: "trades", label: "Trades Count" },
    ];
    const currentSortLabel =
        sortOptions.find((o) => o.value === sortBy)?.label ?? "Name";

    // Only used for refresh after save/delete — NOT on initial load
    const fetchPerformance = async () => {
        try {
            setIsLoadingPerformance(true);
            const result = await getStrategyPerformance();
            if (result.error) throw new Error(result.error);
            setPerformance(result.performance || []);
            if (result.summary) setSummary(result.summary);
        } catch (error: any) {
            console.error(error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : error?.message || "Failed to load strategy performance"
            );
        } finally {
            setIsLoadingPerformance(false);
        }
    };

    // Merge real strategies with "ghost" strategies found in performance
    const allStrategies = [...strategies];
    const enrichedPerformance = performance.map((perf) => {
        let matchingStrategy = strategies.find((s) => s.name === perf.strategy);

        if (!matchingStrategy) {
            const tempStrategy: Strategy = {
                id: `temp-${perf.strategy}`,
                name: perf.strategy,
                description: "Unsaved strategy detected from trade history.",
                rules: null,
                color: "#9CA3AF",
                isPlaybook: false,
                setupType: null,
                timeframes: [],
                pairs: [],
                idealEntry: null,
                idealStopLoss: null,
                idealTakeProfit: null,
                riskRewardMin: null,
                referenceImages: [],
            };
            allStrategies.push(tempStrategy);
            matchingStrategy = tempStrategy;
        }

        return {
            ...perf,
            color: matchingStrategy.color,
            isPlaybook: matchingStrategy.isPlaybook,
        };
    });

    const playbookCount = allStrategies.filter((s) => s.isPlaybook).length;
    const standardCount = allStrategies.filter((s) => !s.isPlaybook).length;

    const filteredStrategies = useMemo(() => {
        let result = allStrategies.filter((s) => {
            const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
            if (!matchesSearch) return false;
            if (filterType === "playbook") return s.isPlaybook;
            if (filterType === "standard") return !s.isPlaybook;
            return true;
        });

        // PRE-COMPUTE PERFORMANCE lookup object to fix O(N^2) issue
        const perfMap = new Map<string, StrategyPerformance>();
        for (const p of enrichedPerformance) {
            perfMap.set(p.strategy, p);
        }

        const getVal = (
            perf: StrategyPerformance | undefined,
            key: keyof StrategyPerformance
        ) => (perf ? Number(perf[key] || 0) : 0);

        return result.sort((a, b) => {
            if (sortBy === "name") return a.name.localeCompare(b.name);

            const perfA = perfMap.get(a.name);
            const perfB = perfMap.get(b.name);

            if (sortBy === "trades")
                return (
                    getVal(perfB, "totalTrades") - getVal(perfA, "totalTrades")
                );
            if (sortBy === "pnl")
                return getVal(perfB, "totalPnL") - getVal(perfA, "totalPnL");
            if (sortBy === "winRate")
                return getVal(perfB, "winRate") - getVal(perfA, "winRate");

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
        <div className="space-y-4">
            {/* Page Header — same pattern as /dashboard/accounts */}
            <PageHeader
                title="Strategies"
                description="Track performance by trading strategy."
                mobileFullWidthButton
            >
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="smd"
                        onClick={() => { setDefaultPlaybook(true); setShowModal(true); }}
                        className="flex items-center justify-center gap-2 border-primary/30 text-primary hover:bg-primary/10"
                    >
                        <BookOpen size={16} strokeWidth={2.5} />
                        New Playbook
                    </Button>
                    <Button
                        variant="primary"
                        size="smd"
                        onClick={() => { setDefaultPlaybook(false); setShowModal(true); }}
                        className="flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
                    >
                        <Plus size={18} strokeWidth={2.5} />
                        New Strategy
                    </Button>
                </div>
            </PageHeader>

            {/* Performance Chart & Playbook Comparison */}
            <div className="space-y-4">
                {strategies.length > 0 &&
                    (isLoadingPerformance ? (
                        <StrategiesLoadingSkeleton />
                    ) : (
                        <>
                            {summary && <PlaybookComparisonCard summary={summary} />}
                            {enrichedPerformance.length > 0 && (
                                <>
                                    <StrategyPerformanceChart
                                        data={enrichedPerformance}
                                    />
                                    <StrategyComparisonTable
                                        data={enrichedPerformance}
                                    />
                                </>
                            )}
                        </>
                    ))}
            </div>

            {/* Toolbar */}
            {allStrategies.length > 0 && (
                <div className="bg-white dark:bg-[#0B0E14] border border-dashboard rounded-xl p-4 shadow-sm mt-6">
                    <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
                        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-1">
                            <div className="w-full sm:max-w-xs">
                                <PremiumInput
                                    icon={Search}
                                    placeholder="Search setups..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            {/* Filter Type Pills */}
                            <div className="flex items-center gap-1 p-1 bg-gray-50 dark:bg-white/5 rounded-xl border border-dashboard self-start sm:self-auto">
                                <button
                                    type="button"
                                    onClick={() => setFilterType("all")}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                                        filterType === "all"
                                            ? "bg-primary text-white shadow-sm"
                                            : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                    }`}
                                >
                                    All ({allStrategies.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFilterType("playbook")}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                                        filterType === "playbook"
                                            ? "bg-primary text-white shadow-sm"
                                            : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                    }`}
                                >
                                    <BookOpen size={13} />
                                    Playbooks ({playbookCount})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFilterType("standard")}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                                        filterType === "standard"
                                            ? "bg-primary text-white shadow-sm"
                                            : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                    }`}
                                >
                                    Standard ({standardCount})
                                </button>
                            </div>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="smd"
                                    className="flex items-center gap-2 border border-dashboard bg-white dark:bg-[#151925] text-gray-700 dark:text-gray-300 self-end lg:self-auto"
                                >
                                    <ArrowUpDown
                                        size={16}
                                        className="text-gray-500"
                                    />
                                    <span>{currentSortLabel}</span>
                                    <ChevronDown
                                        size={14}
                                        className="text-gray-500"
                                    />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="min-w-[180px]"
                            >
                                {sortOptions.map((option) => (
                                    <DropdownMenuItem
                                        key={option.value}
                                        onClick={() => setSortBy(option.value)}
                                        className={cn(
                                            "flex items-center justify-between gap-2",
                                            sortBy === option.value &&
                                                "text-primary font-semibold"
                                        )}
                                    >
                                        {option.label}
                                        {sortBy === option.value && (
                                            <Check
                                                size={14}
                                                className="text-primary"
                                            />
                                        )}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            )}

            {/* Strategy Cards */}
            {filteredStrategies.length > 0 ? (
                <div
                    id="onborda-strategy-list"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6"
                >
                    {filteredStrategies.map((strategy) => {
                        const perf = performance.find(
                            (p) => p.strategy === strategy.name
                        );
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
                                onDelete={() =>
                                    confirmDelete(strategy.id, strategy.name)
                                }
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
                    onPageChange={(p) =>
                        router.push(
                            `/dashboard/strategies?page=${p}&limit=${limit}`
                        )
                    }
                    onPageSizeChange={(l) =>
                        router.push(`/dashboard/strategies?page=1&limit=${l}`)
                    }
                    itemName="strategies"
                />
            </div>

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                <StrategyModal
                    strategy={editingStrategy}
                    defaultPlaybook={defaultPlaybook}
                    onClose={() => {
                        setShowModal(false);
                        setEditingStrategy(null);
                        setDefaultPlaybook(false);
                    }}
                    onSave={handleSave}
                />
                )}
            </AnimatePresence>

            <ConfirmDialog
                isOpen={isConfirmOpen}
                title="Delete Strategy"
                description={`Delete strategy "${strategyToDelete?.name}"? This will untag all associated trades.`}
                confirmText="Delete Strategy"
                cancelText="Cancel"
                isLoading={isDeleting}
                onConfirm={handleDelete}
                onCancel={() => {
                    setIsConfirmOpen(false);
                    setStrategyToDelete(null);
                }}
                variant="danger"
            />
        </div>
    );
}
