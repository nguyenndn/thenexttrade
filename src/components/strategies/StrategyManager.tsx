"use client";

import { useState, useMemo, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
    Plus,
    Search,
    ArrowUpDown,
    ChevronDown,
    Check,
    Shield,
    ClipboardCheck,
    Route,
    LayoutTemplate,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { StrategyModal } from "./StrategyModal";
import { StrategyCard } from "./StrategyCard";
import { StrategyEmptyState } from "./StrategyEmptyState";
import { GlobalRulesPanel } from "./GlobalRulesPanel";
import { PlaybookGalleryPanel } from "./PlaybookGalleryPanel";
import { PLAYBOOK_PRESETS } from "@/lib/strategies/playbook-presets";
import {
    StrategyCompliancePanel,
    RuleComplianceStat,
} from "./StrategyCompliancePanel";
import { TradingRuleModal } from "@/components/rules/TradingRuleModal";
import type { TradingRuleItem } from "@/components/rules/TradingRuleCard";
import { PaginationControl } from "@/components/ui/PaginationControl";
import { PageHeader } from "@/components/ui/PageHeader";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { useRouter, useSearchParams } from "next/navigation";
import {
    deleteStrategy,
    getStrategyPerformance,
    untagStrategy,
} from "@/actions/strategies";
import { getRulesComplianceStats } from "@/actions/rulebook";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { cn } from "@/lib/utils";
import type { PlaybookSummary } from "./PlaybookComparisonCard";

export type StrategiesHubTab =
    | "strategies"
    | "templates"
    | "global-rules"
    | "compliance";

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
    tradingRules?: Array<{
        id: string;
        title: string;
        description?: string | null;
        category: string;
        severity: string;
        isActive: boolean;
        sortOrder?: number;
        strategyId?: string | null;
    }>;
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
    currency?: string;
    initialTab?: StrategiesHubTab;
    initialRules?: TradingRuleItem[];
    initialComplianceStats?: RuleComplianceStat[];
    accounts?: Array<{ id: string; name: string; accountNumber: string | null }>;
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
    currency = "USD",
    initialTab = "strategies",
    initialRules = [],
    initialComplianceStats = [],
    accounts = [],
}: StrategyManagerProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const page = meta.page;
    const limit = meta.limit;

    const strategies = initialStrategies;

    const [activeTab, setActiveTab] = useState<StrategiesHubTab>(initialTab);
    const [performance, setPerformance] =
        useState<StrategyPerformance[]>(initialPerformance);
    const [summary, setSummary] = useState<PlaybookSummary | undefined>(
        initialSummary
    );
    const [complianceStats, setComplianceStats] = useState<RuleComplianceStat[]>(
        initialComplianceStats
    );
    const [isLoadingPerformance, setIsLoadingPerformance] = useState(false);

    const [showModal, setShowModal] = useState(false);
    const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(
        null
    );

    const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
    const [ruleToEdit, setRuleToEdit] = useState<TradingRuleItem | null>(null);

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [strategyToDelete, setStrategyToDelete] = useState<{
        id: string;
        name: string;
    } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<"name" | "pnl" | "winRate" | "trades">(
        "name"
    );

    const urlTab = searchParams.get("tab");
    useEffect(() => {
        if (
            urlTab === "strategies" ||
            urlTab === "templates" ||
            urlTab === "global-rules" ||
            urlTab === "compliance"
        ) {
            setActiveTab(urlTab);
        }
    }, [urlTab]);

    useEffect(() => {
        setComplianceStats(initialComplianceStats);
    }, [initialComplianceStats]);

    const handleTabChange = (nextTab: string) => {
        const typedTab = nextTab as StrategiesHubTab;
        setActiveTab(typedTab);
        const params = new URLSearchParams(searchParams.toString());
        if (typedTab === "strategies") {
            params.delete("tab");
        } else {
            params.set("tab", typedTab);
        }
        const qs = params.toString();
        router.replace(qs ? `/dashboard/strategies?${qs}` : "/dashboard/strategies", {
            scroll: false,
        });
    };

    const sortOptions: { value: typeof sortBy; label: string }[] = [
        { value: "name", label: "Name" },
        { value: "pnl", label: "Profit & Loss" },
        { value: "winRate", label: "Win Rate" },
        { value: "trades", label: "Trades Count" },
    ];
    const currentSortLabel =
        sortOptions.find((o) => o.value === sortBy)?.label ?? "Name";

    const fetchPerformanceAndCompliance = async () => {
        try {
            setIsLoadingPerformance(true);
            const [perfResult, nextCompliance] = await Promise.all([
                getStrategyPerformance(),
                getRulesComplianceStats(),
            ]);
            if (perfResult.error) throw new Error(perfResult.error);
            setPerformance(perfResult.performance || []);
            if (perfResult.summary) setSummary(perfResult.summary);
            setComplianceStats(nextCompliance);
        } catch (error: unknown) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to load strategy performance"
            );
        } finally {
            setIsLoadingPerformance(false);
        }
    };

    const { allStrategies, enrichedPerformance } = useMemo(() => {
        const merged = [...strategies];
        const enriched = performance.map((perf) => {
            let matchingStrategy = strategies.find(
                (s) => s.name === perf.strategy
            );

            if (!matchingStrategy) {
                const tempStrategy: Strategy = {
                    id: `temp-${perf.strategy}`,
                    name: perf.strategy,
                    description:
                        "Unsaved strategy detected from trade history.",
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
                    tradingRules: [],
                };
                merged.push(tempStrategy);
                matchingStrategy = tempStrategy;
            }

            return {
                ...perf,
                color: matchingStrategy.color,
                isPlaybook: matchingStrategy.isPlaybook,
            };
        });
        return { allStrategies: merged, enrichedPerformance: enriched };
    }, [strategies, performance]);

    const globalRulesCount = useMemo(
        () => initialRules.filter((r) => !r.strategyId).length,
        [initialRules]
    );

    const filteredStrategies = useMemo(() => {
        const result = allStrategies.filter((s) =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

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
            if (strategyToDelete.id.startsWith("temp-")) {
                const result = await untagStrategy(strategyToDelete.name);
                if (result.error) throw new Error(result.error);
                router.refresh();
                fetchPerformanceAndCompliance();
            } else {
                const result = await deleteStrategy(strategyToDelete.id);
                if (result.error) throw new Error(result.error);
                toast.success("Strategy deleted");
                router.refresh();
                fetchPerformanceAndCompliance();
            }
        } catch (error: unknown) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to delete strategy"
            );
        } finally {
            setIsDeleting(false);
            setIsConfirmOpen(false);
            setStrategyToDelete(null);
        }
    };

    const handleSave = () => {
        setShowModal(false);
        setEditingStrategy(null);
        router.refresh();
        fetchPerformanceAndCompliance();
    };

    const handleRuleRefresh = () => {
        router.refresh();
        fetchPerformanceAndCompliance();
    };

    return (
        <div className="space-y-2 md:space-y-4">
            <PageHeader
                title="Strategies & Rules"
                description="Define systematic trade setups, enforce global risk rules, and audit compliance."
                mobileFullWidthButton
            >
                {activeTab === "strategies" && (
                    <Button
                        variant="primary"
                        size="smd"
                        onClick={() => {
                            setEditingStrategy(null);
                            setShowModal(true);
                        }}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25"
                    >
                        <Plus size={18} strokeWidth={2.5} />
                        <span>New Strategy</span>
                    </Button>
                )}
                {activeTab === "global-rules" && (
                    <Button
                        variant="primary"
                        size="smd"
                        onClick={() => {
                            setRuleToEdit(null);
                            setIsRuleModalOpen(true);
                        }}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25"
                    >
                        <Plus size={16} strokeWidth={2.5} />
                        <span>Add Global Rule</span>
                    </Button>
                )}
            </PageHeader>

            <Tabs
                value={activeTab}
                onValueChange={handleTabChange}
                tabsId="strategies-hub-tabs"
            >
                <TabsList className="w-full grid grid-cols-4 gap-0 bg-transparent dark:bg-transparent p-0 rounded-none border-0 border-b border-dashboard overflow-visible sm:w-auto sm:inline-flex sm:bg-[#F1F3F5] sm:dark:bg-[#1A1D27] sm:border sm:rounded-lg sm:p-1 sm:gap-1">
                    <TabsTrigger
                        value="strategies"
                        className="w-full sm:w-auto justify-center rounded-none sm:rounded-lg px-2 sm:px-4 py-2.5 sm:py-1.5 text-xs sm:text-sm font-bold transition-all duration-300 flex items-center gap-1.5 sm:gap-2 border-0 sm:border whitespace-nowrap border-transparent hover:border-transparent min-w-0"
                        activeIndicatorClassName="inset-[auto_0_0_0] h-[2px] !bg-gold shadow-none rounded-full border-0 sm:!-inset-[1px] sm:h-auto sm:rounded-lg sm:shadow-md sm:shadow-amber-500/20"
                        activeTextClassName="text-amber-600 dark:text-amber-400 sm:!text-white"
                    >
                        <Route className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                        <span className="truncate">Strategies</span>
                        <span className="hidden sm:inline font-mono tabular-nums text-xs opacity-80">
                            ({allStrategies.length})
                        </span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="templates"
                        className="w-full sm:w-auto justify-center rounded-none sm:rounded-lg px-2 sm:px-4 py-2.5 sm:py-1.5 text-xs sm:text-sm font-bold transition-all duration-300 flex items-center gap-1.5 sm:gap-2 border-0 sm:border whitespace-nowrap border-transparent hover:border-transparent min-w-0"
                        activeIndicatorClassName="inset-[auto_0_0_0] h-[2px] !bg-gold shadow-none rounded-full border-0 sm:!-inset-[1px] sm:h-auto sm:rounded-lg sm:shadow-md sm:shadow-amber-500/20"
                        activeTextClassName="text-amber-600 dark:text-amber-400 sm:!text-white"
                    >
                        <LayoutTemplate className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                        <span className="sm:hidden truncate">Templates</span>
                        <span className="hidden sm:inline">Template Gallery</span>
                        <span className="hidden sm:inline font-mono tabular-nums text-xs opacity-80">
                            ({PLAYBOOK_PRESETS.length})
                        </span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="global-rules"
                        className="w-full sm:w-auto justify-center rounded-none sm:rounded-lg px-2 sm:px-4 py-2.5 sm:py-1.5 text-xs sm:text-sm font-bold transition-all duration-300 flex items-center gap-1.5 sm:gap-2 border-0 sm:border whitespace-nowrap border-transparent hover:border-transparent min-w-0"
                        activeIndicatorClassName="inset-[auto_0_0_0] h-[2px] !bg-gold shadow-none rounded-full border-0 sm:!-inset-[1px] sm:h-auto sm:rounded-lg sm:shadow-md sm:shadow-amber-500/20"
                        activeTextClassName="text-amber-600 dark:text-amber-400 sm:!text-white"
                    >
                        <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                        <span className="truncate">Global Rules</span>
                        <span className="hidden sm:inline font-mono tabular-nums text-xs opacity-80">
                            ({globalRulesCount})
                        </span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="compliance"
                        className="w-full sm:w-auto justify-center rounded-none sm:rounded-lg px-2 sm:px-4 py-2.5 sm:py-1.5 text-xs sm:text-sm font-bold transition-all duration-300 flex items-center gap-1.5 sm:gap-2 border-0 sm:border whitespace-nowrap border-transparent hover:border-transparent min-w-0"
                        activeIndicatorClassName="inset-[auto_0_0_0] h-[2px] !bg-gold shadow-none rounded-full border-0 sm:!-inset-[1px] sm:h-auto sm:rounded-lg sm:shadow-md sm:shadow-amber-500/20"
                        activeTextClassName="text-amber-600 dark:text-amber-400 sm:!text-white"
                    >
                        <ClipboardCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                        <span className="sm:hidden truncate">Compliance</span>
                        <span className="hidden sm:inline">
                            Performance & Compliance
                        </span>
                    </TabsTrigger>
                </TabsList>

                {/* TAB 1: STRATEGIES */}
                <TabsContent value="strategies" className="mt-2 md:mt-6 space-y-2 md:space-y-6">
                    {allStrategies.length > 0 && (
                        <div className="bg-white dark:bg-[#1E2028] border border-dashboard rounded-xl p-2.5 sm:p-4 shadow-sm">
                            <div className="flex items-center justify-between gap-2 sm:gap-4">
                                <div className="flex-1 min-w-0 sm:max-w-xs">
                                    <PremiumInput
                                        icon={Search}
                                        aria-label="Search strategies"
                                        value={searchQuery}
                                        onChange={(e) =>
                                            setSearchQuery(e.target.value)
                                        }
                                        className="py-2 sm:py-2.5 text-xs sm:text-sm"
                                    />
                                </div>

                                <div className="shrink-0">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="smd"
                                                aria-label="Sort strategies"
                                                className="flex items-center gap-1.5 sm:gap-2 border border-dashboard bg-white dark:bg-[#1E2028] text-xs sm:text-sm text-gray-700 dark:text-gray-300"
                                            >
                                                <ArrowUpDown
                                                    size={15}
                                                    className="text-gray-500 shrink-0"
                                                />
                                                <span className="max-w-[90px] sm:max-w-none truncate">
                                                    {currentSortLabel}
                                                </span>
                                                <ChevronDown
                                                    size={14}
                                                    className="text-gray-500 shrink-0"
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
                                                    onClick={() =>
                                                        setSortBy(option.value)
                                                    }
                                                    className={cn(
                                                        "flex items-center justify-between gap-2",
                                                        sortBy ===
                                                            option.value &&
                                                            "text-primary font-semibold"
                                                    )}
                                                >
                                                    {option.label}
                                                    {sortBy ===
                                                        option.value && (
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
                        </div>
                    )}

                    {filteredStrategies.length > 0 ? (
                        <div
                            id="onborda-strategy-list"
                            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3"
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
                                        currency={currency}
                                        onEdit={() => {
                                            setEditingStrategy(strategy);
                                            setShowModal(true);
                                        }}
                                        onDelete={() =>
                                            confirmDelete(
                                                strategy.id,
                                                strategy.name
                                            )
                                        }
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        <StrategyEmptyState
                            onAdd={() => setShowModal(true)}
                            onBrowseTemplates={() => handleTabChange("templates")}
                        />
                    )}

                    <div className="mt-0 md:mt-8">
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
                                router.push(
                                    `/dashboard/strategies?page=1&limit=${l}`
                                )
                            }
                            itemName="strategies"
                        />
                    </div>
                </TabsContent>

                {/* TAB 2: ILLUSTRATED TEMPLATE GALLERY */}
                <TabsContent value="templates" className="mt-2 md:mt-6">
                    <PlaybookGalleryPanel
                        existingStrategyNames={strategies.map((s) => s.name)}
                        onCloned={() => {
                            router.refresh();
                            fetchPerformanceAndCompliance();
                        }}
                    />
                </TabsContent>

                {/* TAB 3: GLOBAL RULES */}
                <TabsContent value="global-rules" className="mt-2 md:mt-6">
                    <GlobalRulesPanel
                        rules={initialRules}
                        onAddRule={() => {
                            setRuleToEdit(null);
                            setIsRuleModalOpen(true);
                        }}
                        onEditRule={(rule) => {
                            setRuleToEdit(rule);
                            setIsRuleModalOpen(true);
                        }}
                        onRefresh={handleRuleRefresh}
                    />
                </TabsContent>

                {/* TAB 3: PERFORMANCE & COMPLIANCE */}
                <TabsContent value="compliance" className="mt-2 md:mt-6">
                    <StrategyCompliancePanel
                        summary={summary}
                        enrichedPerformance={enrichedPerformance}
                        isLoadingPerformance={isLoadingPerformance}
                        currency={currency}
                        complianceStats={complianceStats}
                    />
                </TabsContent>
            </Tabs>

            <AnimatePresence>
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
            </AnimatePresence>

            <TradingRuleModal
                isOpen={isRuleModalOpen}
                onClose={() => {
                    setIsRuleModalOpen(false);
                    setRuleToEdit(null);
                }}
                onSuccess={handleRuleRefresh}
                ruleToEdit={ruleToEdit}
                accounts={accounts}
                strategies={strategies.map((s) => ({ id: s.id, name: s.name }))}
                lockGlobalStrategy
            />

            <ConfirmDialog
                isOpen={isConfirmOpen}
                title="Delete Strategy"
                description={`Delete strategy "${strategyToDelete?.name}"? This will untag associated trades and remove strategy-specific rules.`}
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
