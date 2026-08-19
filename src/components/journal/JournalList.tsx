"use client";

import { TabBar } from "@/components/ui/TabBar";
import { FileText, Clock } from "lucide-react";

import { useState, useEffect, useMemo } from "react";
import { Edit2, ArrowUpDown, Activity, Zap, Brain } from "lucide-react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { utcTime, cn } from "@/lib/utils";
import { TradePlanList } from "./TradePlanList";
import { isTradePlansEnabled } from "@/lib/feature-flags";
import JournalStats from "@/components/journal/JournalStats";
import { Modal } from "@/components/ui/Modal";
import { StrategyCell } from "@/components/journal/cells/StrategyCell";
import { MindsetCell } from "@/components/journal/cells/MindsetCell";
import { TagsCell } from "@/components/journal/cells/TagsCell";
import { MistakesCell } from "@/components/journal/cells/MistakesCell";
import { DashboardFilter } from "@/components/dashboard/DashboardFilter";
import { PaginationControl } from "@/components/ui/PaginationControl";
import { TradeTypeBadge } from "@/components/ui/TradeTypeBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PnLDisplay } from "@/components/ui/PnLDisplay";
import { useDebouncedCallback } from "use-debounce";
import dynamic from "next/dynamic";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyStateCTAs } from "@/components/ui/EmptyStateCTAs";
import { JournalTableFilters } from "@/components/journal/JournalTableFilters";
import { FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
    TooltipProvider,
} from "@/components/ui/tooltip";

// Dynamic Imports for Modals
const JournalForm = dynamic(() => import("@/components/journal/JournalForm"), {
    loading: () => (
        <div className="p-8 text-center text-gray-600">Loading form...</div>
    ),
    ssr: false,
});
import { TradeDetailSheet } from "./TradeDetailSheet";

import { updateJournalEntry } from "@/actions/journal";

// --- COLUMN STYLE HELPERS ---
const getColumnWidthClass = (colId: string) => {
    switch (colId) {
        case "pnl":
            return "w-[140px] min-w-[140px] max-w-[140px] text-right";
        case "tp":
        case "sl":
            return "w-[120px] min-w-[120px] max-w-[120px] text-right";
        case "strategy":
        case "mindset":
        case "customTags":
        case "mistakes":
            return "text-left min-w-[200px]";
        case "openTime":
        case "closeTime":
            return "text-center min-w-[130px]";
        case "type":
        case "volume":
            return "text-center min-w-[100px]";
        default:
            return "text-left min-w-[120px]";
    }
};

const getColumnAlignmentClass = (colId: string) => {
    if (["pnl", "tp", "sl"].includes(colId)) return "justify-end pr-2";
    if (["openTime", "closeTime", "type", "volume", "mindset"].includes(colId))
        return "justify-center whitespace-nowrap";
    return "justify-start whitespace-nowrap";
};

// Types
interface JournalEntry {
    id: string;
    entryDate: string;
    exitDate: string | null;
    symbol: string;
    type: "BUY" | "SELL";
    pnl: number | null;
    status: "OPEN" | "CLOSED";
    result: "WIN" | "LOSS" | "BREAK_EVEN" | null;
    entryPrice: number;
    exitPrice: number | null;
    stopLoss: number | null;
    takeProfit: number | null;
    lotSize: number;
    strategy: string | null;
    tags: string[];
    mistakes: string[];
    emotionBefore: string | null;
    accountId: string | null;
    [key: string]: any; // Allow loose typing for now
}

interface Meta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

interface JournalListProps {
    initialEntries: any[];
    meta: Meta;
    initialStats?: any;
    strategies: any[];
    userTags?: string[];
    hasTradeData?: boolean;
    initialTradePlans?: any[];
}

export default function JournalList({
    initialEntries,
    meta,
    initialStats,
    strategies: initialStrategies,
    userTags = [],
    hasTradeData = true,
    initialTradePlans = [],
}: JournalListProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Parse URL Params for State
    const accountId = searchParams.get("accountId");
    const page = parseInt(searchParams.get("page") || "1");
    // const pageSize = parseInt(searchParams.get("limit") || "10"); // We can parse this
    const [pageSize, setPageSize] = useState(10); // Keep local for component control, or push to URL

    // Filters from URL
    const filterSymbol = searchParams.get("symbol") || "";
    const filterType = searchParams.get("type") || "ALL";
    const filterStatus = searchParams.get("status") || "ALL";
    const filterTag = searchParams.get("tag") || "ALL";

    // Sub-tabs & Trade plans state
    const [activeSubTab, setActiveSubTab] = useState<
        "trades" | "plans" | "open" | "reviews"
    >("trades");
    const [tradePlans, setTradePlans] = useState<any[]>(initialTradePlans);

    const refreshPlans = async () => {
        try {
            const res = await fetch("/api/trade-plans");
            if (res.ok) {
                const data = await res.json();
                setTradePlans(data);
            }
        } catch (err) {
            console.error("Failed to refresh plans", err);
        }
    };

    // Convert initial data
    const [entries, setEntries] = useState<any[]>(initialEntries);
    const [stats, setStats] = useState<any>(initialStats);

    // Sync entries when initialEntries change (e.g. after server refetch)
    useEffect(() => {
        setEntries(initialEntries);
        setStats(initialStats);
    }, [initialEntries, initialStats]);

    // Sync tradePlans when initialTradePlans change
    useEffect(() => {
        setTradePlans(initialTradePlans);
    }, [initialTradePlans]);

    // Fallback active tab if trade plans are disabled
    useEffect(() => {
        if (
            !isTradePlansEnabled() &&
            (activeSubTab === "plans" || activeSubTab === "reviews")
        ) {
            setActiveSubTab("trades");
        }
    }, [activeSubTab]);

    const strategies = initialStrategies || [];
    const [isLoading, setIsLoading] = useState(false);

    const displayedEntries = useMemo(() => {
        if (activeSubTab === "open") {
            return entries.filter((e) => e.status === "OPEN");
        }
        if (activeSubTab === "reviews") {
            return entries.filter((e) => e.tradePlan);
        }
        return entries;
    }, [entries, activeSubTab]);

    // Column Visibility State
    const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
        new Set([
            "symbol",
            "type",
            "volume",
            "pnl",
            "strategy",
            "mindset",
            "customTags",
            "mistakes",
        ])
    );
    const [isColumnsLoaded, setIsColumnsLoaded] = useState(false);

    // Fetch Strategies on mount - REMOVED (Passed via props)

    // Available Columns Configuration
    const columnsConfig = [
        { id: "date", label: "Date" },
        { id: "symbol", label: "Symbol" },
        { id: "type", label: "Type" },
        { id: "openTime", label: "Open Time" },
        { id: "closeTime", label: "Close Time" },
        { id: "volume", label: "Volume" },
        { id: "pnl", label: "Net Profit" },
        { id: "tp", label: "Take Profit" },
        { id: "sl", label: "Stop Loss" },
        { id: "strategy", label: "Strategy Tags" },
        { id: "mindset", label: "Mindset" },
        { id: "customTags", label: "Custom Tags" },
        { id: "mistakes", label: "Mistake Tags" },
    ];

    const toggleColumn = (id: string) => {
        const newSet = new Set(visibleColumns);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setVisibleColumns(newSet);
    };

    // Load saved columns from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem("journal_columns");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setVisibleColumns(new Set(parsed));
                }
            } catch (e) {
                console.error("Failed to parse saved columns", e);
            }
        }
        setIsColumnsLoaded(true);
    }, []);

    // Save columns when changed
    useEffect(() => {
        if (isColumnsLoaded) {
            localStorage.setItem(
                "journal_columns",
                JSON.stringify(Array.from(visibleColumns))
            );
        }
    }, [visibleColumns, isColumnsLoaded]);

    // Helper to update URL params
    const updateParams = (
        updates: Record<string, string | null | undefined>
    ) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(updates).forEach(([key, value]) => {
            if (value === null || value === undefined || value === "") {
                params.delete(key);
            } else {
                params.set(key, value);
            }
        });
        // Reset to page 1 on filter change usually, except if explicit page update
        if (
            !updates.page &&
            (updates.symbol !== undefined ||
                updates.type !== undefined ||
                updates.status !== undefined ||
                updates.strategy !== undefined ||
                updates.tag !== undefined)
        ) {
            params.set("page", "1");
        }
        router.push(`?${params.toString()}`);
    };

    // Handlers
    const handleSort = (colId: string) => {
        const currentSort = searchParams.get("sort");
        const currentDir = searchParams.get("dir");
        const newDir =
            currentSort === colId && currentDir === "desc" ? "asc" : "desc";
        updateParams({ sort: colId, dir: newDir });
    };

    const renderSortIcon = (colId: string) => {
        const sort = searchParams.get("sort");
        const dir = searchParams.get("dir");
        if (sort === colId) {
            return dir === "asc" ? (
                <ArrowUpDown size={14} className="text-primary rotate-180" />
            ) : (
                <ArrowUpDown size={14} className="text-primary" />
            );
        }
        return <ArrowUpDown size={14} className="text-gray-300 opacity-50" />;
    };

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

    // Trade Detail Sheet State
    const [selectedDetailEntry, setSelectedDetailEntry] =
        useState<JournalEntry | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const handleCreate = () => {
        setEditingEntry(null);
        setIsModalOpen(true);
    };

    // Auto-open trade log modal from ?action=log-trade. Depend on the action
    // param value (not searchParams itself) so a client-side navigation to the
    // same journal page — e.g. the empty-state "Log a New Trade" link — re-opens
    // the modal instead of only firing on mount.
    const autoLogAction = searchParams.get("action");
    useEffect(() => {
        if (autoLogAction !== "log-trade") return;
        handleCreate();
        const params = new URLSearchParams(searchParams.toString());
        params.delete("action");
        router.replace(
            params.toString()
                ? `?${params.toString()}`
                : "/dashboard/journal",
            { scroll: false }
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoLogAction]);

    const handleEdit = (entry: JournalEntry) => {
        setEditingEntry(entry);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingEntry(null);
    };

    const handleSuccess = () => {
        setIsModalOpen(false);
        setEditingEntry(null);
        toast.success(
            editingEntry
                ? "Trade updated successfully"
                : "Trade logged successfully"
        );
        router.refresh();
    };

    const handleEntryUpdate = async (id: string, data: any) => {
        // Optimistic Update
        const previousEntries = [...entries];
        setEntries((prev) =>
            prev.map((entry) =>
                entry.id === id ? { ...entry, ...data } : entry
            )
        );

        try {
            const res = await updateJournalEntry(id, data);
            if (res.error) throw new Error(res.error);
        } catch (error: any) {
            console.error("Update failed", error);
            setEntries(previousEntries);
            toast.error(
                error instanceof Error
                    ? error.message
                    : error?.message || "Failed to update entry"
            );
        }
    };

    // Search State
    const [searchTerm, setSearchTerm] = useState(filterSymbol);

    const handleSearch = useDebouncedCallback((value: string) => {
        updateParams({ symbol: value });
    }, 500);

    // Sync local search when URL changes
    useEffect(() => {
        if (searchTerm !== filterSymbol) {
            setSearchTerm(filterSymbol);
        }
    }, [filterSymbol]);

    const journalTabs = [
        { label: "Trades", href: "/dashboard/journal", icon: FileText },
        { label: "Sessions", href: "/dashboard/sessions", icon: Clock },
    ];

    return (
        <>
            {/* Compact Header: Description + TabBar + Filters */}
            <PageHeader
                title="Journal"
                description="Track your trades and analyze your performance."
            />
            <div
                id="onborda-journal-filters"
                className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4"
            >
                <TabBar tabs={journalTabs} />
                <DashboardFilter
                    currentAccountId={accountId || undefined}
                    equalWidth
                    className="order-first lg:order-none"
                />
            </div>

            {stats && (
                <div id="onborda-journal-stats">
                    <JournalStats stats={stats} />
                </div>
            )}

            {/* Inner sub-tabs: Trades, Plans, Open, Reviews */}
            <div className="flex border-b border-dashboard mt-6 mb-4 gap-6 text-sm font-black">
                {(
                    [
                        { id: "trades", label: "Trades" },
                        isTradePlansEnabled() && {
                            id: "plans",
                            label: "Trade Plans",
                        },
                        { id: "open", label: "Open Positions" },
                        isTradePlansEnabled() && {
                            id: "reviews",
                            label: "Plan Reviews",
                        },
                    ].filter(Boolean) as {
                        id: "trades" | "plans" | "open" | "reviews";
                        label: string;
                    }[]
                ).map((tab) => {
                    const isActive = activeSubTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveSubTab(tab.id)}
                            className={cn(
                                "pb-3 border-b-2 transition-all relative -mb-[2px]",
                                isActive
                                    ? "border-primary text-primary"
                                    : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            )}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {activeSubTab === "plans" ? (
                <TradePlanList
                    plans={tradePlans}
                    onRefresh={refreshPlans}
                    onLogTrade={(plan) => {
                        setEditingEntry({
                            symbol: plan.symbol,
                            type: plan.type || "BUY",
                            entryPrice: plan.plannedEntry || "",
                            stopLoss: plan.plannedStopLoss || "",
                            takeProfit: plan.plannedTakeProfit || "",
                            lotSize: plan.plannedLotSize || "",
                            emotionBefore: plan.emotionBefore || null,
                            confidenceLevel: plan.confidenceLevel || null,
                            accountId: plan.accountId || "",
                            tradePlan: plan,
                            tags: plan.tags || [],
                            notes: plan.thesis || "",
                            tradePlanId: plan.id,
                        } as any);
                        setIsModalOpen(true);
                    }}
                    onViewActual={(journalEntryId) => {
                        const matchingEntry = entries.find(
                            (e) => e.id === journalEntryId
                        );
                        if (matchingEntry) {
                            setSelectedDetailEntry(matchingEntry);
                            setIsDetailOpen(true);
                        } else {
                            toast.error(
                                "Trade entry not found in the current page."
                            );
                        }
                    }}
                />
            ) : (
                <>
                    <JournalTableFilters
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        handleSearch={handleSearch}
                        filterType={filterType}
                        filterTag={filterTag}
                        filterResult={filterStatus}
                        filterStrategy={searchParams.get("strategy") || ""}
                        userTags={userTags}
                        strategies={[
                            ...new Set(
                                entries
                                    .map((e: any) => e.strategy)
                                    .filter(Boolean)
                            ),
                        ]}
                        updateParams={updateParams}
                        isColumnMenuOpen={isColumnMenuOpen}
                        setIsColumnMenuOpen={setIsColumnMenuOpen}
                        visibleColumns={visibleColumns}
                        toggleColumn={toggleColumn}
                        columnsConfig={columnsConfig}
                        onLogTrade={handleCreate}
                    />

                    {displayedEntries.length === 0 ? (
                        <div className="text-center py-16 bg-white dark:bg-[#1E2028] rounded-xl border-2 border-dashed border-dashboard mt-6 shadow-sm">
                            {/* Animated Folder Icon */}
                            <div className="relative w-20 h-20 mb-6 mx-auto">
                                <div className="absolute inset-0 rounded-full bg-primary/10 dark:bg-primary/5 animate-[journal-ping_3s_cubic-bezier(0,0,0.2,1)_infinite]" />
                                <div className="relative w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center animate-[journal-float_3s_ease-in-out_infinite]">
                                    <FolderOpen
                                        size={32}
                                        className="text-gray-500 dark:text-gray-300 relative z-10"
                                        strokeWidth={1.5}
                                    />
                                    {/* Sliding paper sheet */}
                                    <div className="absolute w-5 h-6 bg-primary/20 dark:bg-primary/10 rounded-lg border border-primary/30 top-4 left-7 animate-[journal-paper_3s_ease-in-out_infinite]" />
                                    {/* Sparkle dots */}
                                    <div className="absolute -top-2 left-3 w-1.5 h-1.5 rounded-full bg-primary/40 animate-[journal-sparkle_2.5s_ease-in-out_infinite_1.2s]" />
                                    <div className="absolute -bottom-1 -right-1 w-1 h-1 rounded-full bg-primary/30 animate-[journal-sparkle_3s_ease-in-out_infinite_0.8s]" />
                                    <div className="absolute top-0 -right-2 w-1 h-1 rounded-full bg-primary/25 animate-[journal-sparkle_2s_ease-in-out_infinite_1.5s]" />
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-gray-700 dark:text-white mb-2">
                                {hasTradeData
                                    ? "No Trades Found"
                                    : "Your Journal is Empty"}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 px-6 max-w-sm mx-auto mb-2 font-medium">
                                {hasTradeData
                                    ? "You haven't recorded any trades matching the current filters."
                                    : "Start your trading journal to track your trades, analyze performance, and find your trading edge."}
                            </p>

                            <EmptyStateCTAs
                                primaryLabel={
                                    hasTradeData
                                        ? "Log a New Trade"
                                        : "Log Your First Trade"
                                }
                            />

                            <style jsx>{`
                                @keyframes slow-current {
                                    0%,
                                    100% {
                                        opacity: 0.6;
                                        filter: drop-shadow(
                                            0 0 2px
                                                theme("colors.primary.DEFAULT")
                                        );
                                        color: theme("colors.primary.DEFAULT");
                                    }
                                    50% {
                                        opacity: 1;
                                        filter: drop-shadow(
                                                0 0 6px theme("colors.blue.400")
                                            )
                                            drop-shadow(
                                                0 0 12px
                                                    theme("colors.blue.400")
                                            );
                                        color: theme("colors.blue.300");
                                    }
                                }
                                .animate-current {
                                    animation: slow-current 3s ease-in-out
                                        infinite;
                                }
                                @keyframes journal-float {
                                    0%,
                                    100% {
                                        transform: translateY(0px);
                                    }
                                    50% {
                                        transform: translateY(-6px);
                                    }
                                }
                                @keyframes journal-ping {
                                    0% {
                                        transform: scale(1);
                                        opacity: 0.3;
                                    }
                                    75%,
                                    100% {
                                        transform: scale(1.3);
                                        opacity: 0;
                                    }
                                }
                                @keyframes journal-paper {
                                    0%,
                                    100% {
                                        transform: translateY(0px) rotate(5deg);
                                    }
                                    50% {
                                        transform: translateY(-5px)
                                            rotate(12deg);
                                    }
                                }
                                @keyframes journal-sparkle {
                                    0%,
                                    100% {
                                        opacity: 0;
                                        transform: scale(0);
                                    }
                                    50% {
                                        opacity: 1;
                                        transform: scale(1);
                                    }
                                }
                                @keyframes slow-current {
                                    0%,
                                    100% {
                                        opacity: 0.6;
                                        filter: drop-shadow(
                                            0 0 2px
                                                theme("colors.primary.DEFAULT")
                                        );
                                        color: theme("colors.primary.DEFAULT");
                                    }
                                    50% {
                                        opacity: 1;
                                        filter: drop-shadow(
                                                0 0 6px theme("colors.blue.400")
                                            )
                                            drop-shadow(
                                                0 0 12px
                                                    theme("colors.blue.400")
                                            );
                                        color: theme("colors.blue.300");
                                    }
                                }
                                .animate-current {
                                    animation: slow-current 3s ease-in-out
                                        infinite;
                                }
                            `}</style>
                        </div>
                    ) : (
                        <div
                            id="onborda-journal-list"
                            className="bg-white dark:bg-[#1E2028] mt-6 rounded-xl shadow-sm border border-dashboard overflow-x-auto custom-scrollbar"
                        >
                            {/* Desktop View */}
                            <div className="hidden md:block overflow-x-auto w-full">
                                <table className="w-auto min-w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-gray-50 dark:bg-white/5 text-xs uppercase text-gray-500 font-bold tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4 w-14"></th>
                                            {columnsConfig.map(
                                                (col) =>
                                                    visibleColumns.has(
                                                        col.id
                                                    ) && (
                                                        <th
                                                            key={col.id}
                                                            className={`px-6 py-4 cursor-pointer hover:text-gray-600 dark:hover:text-gray-200 group/th ${getColumnWidthClass(col.id)}`}
                                                            onClick={() =>
                                                                [
                                                                    "date",
                                                                    "symbol",
                                                                    "type",
                                                                    "openTime",
                                                                    "closeTime",
                                                                    "volume",
                                                                    "pnl",
                                                                    "tp",
                                                                    "sl",
                                                                    "status",
                                                                ].includes(
                                                                    col.id
                                                                )
                                                                    ? handleSort(
                                                                          col.id ===
                                                                              "volume"
                                                                              ? "lotSize"
                                                                              : col.id ===
                                                                                  "tp"
                                                                                ? "takeProfit"
                                                                                : col.id ===
                                                                                    "sl"
                                                                                  ? "stopLoss"
                                                                                  : col.id
                                                                      )
                                                                    : null
                                                            }
                                                        >
                                                            <div
                                                                className={`flex items-center gap-1 w-full ${getColumnAlignmentClass(col.id)}`}
                                                            >
                                                                {col.label}
                                                                {[
                                                                    "date",
                                                                    "symbol",
                                                                    "type",
                                                                    "openTime",
                                                                    "closeTime",
                                                                    "volume",
                                                                    "pnl",
                                                                    "tp",
                                                                    "sl",
                                                                    "status",
                                                                ].includes(
                                                                    col.id
                                                                ) &&
                                                                    renderSortIcon(
                                                                        col.id ===
                                                                            "volume"
                                                                            ? "lotSize"
                                                                            : col.id ===
                                                                                "tp"
                                                                              ? "takeProfit"
                                                                              : col.id ===
                                                                                  "sl"
                                                                                ? "stopLoss"
                                                                                : col.id
                                                                    )}
                                                            </div>
                                                        </th>
                                                    )
                                            )}
                                            <th className="px-6 py-4 w-14"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-dashboard">
                                        {isLoading ? (
                                            <tr>
                                                <td
                                                    colSpan={14}
                                                    className="px-6 py-8 text-center text-gray-600"
                                                >
                                                    Loading...
                                                </td>
                                            </tr>
                                        ) : (
                                            displayedEntries.map((entry) => (
                                                <tr
                                                    key={entry.id}
                                                    className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <TooltipProvider
                                                                delayDuration={
                                                                    200
                                                                }
                                                            >
                                                                <Tooltip>
                                                                    <TooltipTrigger
                                                                        asChild
                                                                    >
                                                                        <Button
                                                                            variant="outline"
                                                                            size="icon"
                                                                            aria-label={`View Details for ${entry.symbol}`}
                                                                            onClick={() => {
                                                                                setSelectedDetailEntry(
                                                                                    entry
                                                                                );
                                                                                setIsDetailOpen(
                                                                                    true
                                                                                );
                                                                            }}
                                                                            className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/[0.03] border border-dashboard flex items-center justify-center text-gray-400 hover:text-primary hover:border-primary/30 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all group/detail"
                                                                        >
                                                                            <Zap
                                                                                size={
                                                                                    14
                                                                                }
                                                                                className="animate-current transition-all duration-300 group-hover/detail:scale-110"
                                                                            />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent
                                                                        side="bottom"
                                                                        className="bg-gray-700 dark:bg-gray-800 text-white border border-gray-600/20 shadow-md font-bold"
                                                                    >
                                                                        Details
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        </div>
                                                    </td>
                                                    {columnsConfig.map(
                                                        (col) =>
                                                            visibleColumns.has(
                                                                col.id
                                                            ) && (
                                                                <td
                                                                    key={col.id}
                                                                    className={`px-6 py-4
 ${col.id === "pnl" ? "w-[140px] min-w-[140px] max-w-[140px] text-right" : col.id === "tp" || col.id === "sl" ? "w-[120px] min-w-[120px] max-w-[120px] text-right" : col.id === "strategy" || col.id === "mindset" || col.id === "customTags" || col.id === "mistakes" ? "text-left min-w-[200px]" : col.id.toLowerCase().includes("time") ? "text-center min-w-[130px]" : col.id === "type" || col.id === "volume" || col.id === "status" ? "text-center min-w-[100px]" : "text-left min-w-[120px]"}
 `}
                                                                >
                                                                    <div
                                                                        className={`w-full ${col.id === "pnl" || col.id === "tp" || col.id === "sl" ? "flex justify-end pr-2" : ""}`}
                                                                    >
                                                                        {col.id ===
                                                                            "date" &&
                                                                            utcTime(
                                                                                entry.entryDate,
                                                                                "dd MMM yyyy"
                                                                            )}
                                                                        {col.id ===
                                                                            "symbol" && (
                                                                            <span className="flex flex-col items-start gap-1">
                                                                                <span className="font-bold text-gray-700 dark:text-white">
                                                                                    {
                                                                                        entry.symbol
                                                                                    }
                                                                                </span>
                                                                                {entry.autopilotStatus ===
                                                                                    "PROCESSED" && (
                                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-500 border border-violet-500/20 text-[9px] font-black uppercase tracking-wider">
                                                                                        <Brain
                                                                                            size={
                                                                                                10
                                                                                            }
                                                                                        />
                                                                                        AI
                                                                                        Autopilot
                                                                                    </span>
                                                                                )}
                                                                            </span>
                                                                        )}
                                                                        {col.id ===
                                                                            "type" && (
                                                                            <TradeTypeBadge
                                                                                type={
                                                                                    entry.type
                                                                                }
                                                                            />
                                                                        )}
                                                                        {col.id ===
                                                                            "openTime" &&
                                                                            utcTime(
                                                                                entry.entryDate
                                                                            )}
                                                                        {col.id ===
                                                                            "closeTime" &&
                                                                            (entry.exitDate
                                                                                ? utcTime(
                                                                                      entry.exitDate
                                                                                  )
                                                                                : "-")}
                                                                        {col.id ===
                                                                            "volume" && (
                                                                            <span className="font-mono text-gray-600">
                                                                                {(
                                                                                    entry as any
                                                                                )
                                                                                    .lotSize ||
                                                                                    "0.00"}
                                                                            </span>
                                                                        )}
                                                                        {col.id ===
                                                                            "pnl" && (
                                                                            <PnLDisplay
                                                                                value={
                                                                                    entry.pnl
                                                                                }
                                                                            />
                                                                        )}
                                                                        {col.id ===
                                                                            "tp" && (
                                                                            <span className="font-mono text-primary font-medium">
                                                                                {(
                                                                                    entry as any
                                                                                )
                                                                                    .takeProfit ||
                                                                                    "-"}
                                                                            </span>
                                                                        )}
                                                                        {col.id ===
                                                                            "sl" && (
                                                                            <span className="font-mono text-red-500 font-medium">
                                                                                {(
                                                                                    entry as any
                                                                                )
                                                                                    .stopLoss ||
                                                                                    "-"}
                                                                            </span>
                                                                        )}
                                                                        {col.id ===
                                                                            "strategy" && (
                                                                            <div className="w-full text-left inline-block">
                                                                                <StrategyCell
                                                                                    entry={
                                                                                        entry
                                                                                    }
                                                                                    strategies={
                                                                                        strategies
                                                                                    }
                                                                                    onUpdate={
                                                                                        handleEntryUpdate
                                                                                    }
                                                                                />
                                                                            </div>
                                                                        )}
                                                                        {col.id ===
                                                                            "mindset" && (
                                                                            <div className="w-full text-left inline-block">
                                                                                <MindsetCell
                                                                                    entry={
                                                                                        entry
                                                                                    }
                                                                                    onUpdate={
                                                                                        handleEntryUpdate
                                                                                    }
                                                                                />
                                                                            </div>
                                                                        )}
                                                                        {col.id ===
                                                                            "customTags" && (
                                                                            <div className="w-full text-left inline-block">
                                                                                <TagsCell
                                                                                    entry={
                                                                                        entry
                                                                                    }
                                                                                    onUpdate={
                                                                                        handleEntryUpdate
                                                                                    }
                                                                                />
                                                                            </div>
                                                                        )}
                                                                        {col.id ===
                                                                            "mistakes" && (
                                                                            <div className="w-full text-left inline-block">
                                                                                <MistakesCell
                                                                                    entry={
                                                                                        entry
                                                                                    }
                                                                                    onUpdate={
                                                                                        handleEntryUpdate
                                                                                    }
                                                                                />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            )
                                                    )}
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                onClick={() =>
                                                                    handleEdit(
                                                                        entry
                                                                    )
                                                                }
                                                                className="text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                            >
                                                                <Edit2
                                                                    size={16}
                                                                />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile View */}
                            <div className="md:hidden flex flex-col gap-2.5 p-3">
                                {isLoading ? (
                                    <div className="text-center text-gray-600 py-8">
                                        Loading...
                                    </div>
                                ) : (
                                    displayedEntries.map((entry) => (
                                        <div
                                            key={entry.id}
                                            className="bg-gray-50 dark:bg-white/5 p-3 sm:p-4 rounded-xl border relative transition-all duration-200 hover:shadow-md active:scale-[0.98] border-dashboard"
                                        >
                                            {/* Header Row */}
                                            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                                                <div className="flex items-center gap-2 flex-1">
                                                    <span className="font-bold text-gray-700 dark:text-white text-base sm:text-lg">
                                                        {entry.symbol}
                                                    </span>
                                                    <TradeTypeBadge
                                                        type={entry.type}
                                                    />
                                                    <StatusBadge
                                                        status={entry.status}
                                                    />
                                                    {entry.autopilotStatus ===
                                                        "PROCESSED" && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-500 border border-violet-500/20 text-[9px] font-black uppercase tracking-wider">
                                                            <Brain
                                                                size={10}
                                                            />
                                                            AI Autopilot
                                                        </span>
                                                    )}
                                                </div>
                                                <TooltipProvider
                                                    delayDuration={200}
                                                >
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                aria-label={`View Details for ${entry.symbol}`}
                                                                onClick={() => {
                                                                    setSelectedDetailEntry(
                                                                        entry
                                                                    );
                                                                    setIsDetailOpen(
                                                                        true
                                                                    );
                                                                }}
                                                                className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/[0.03] border border-dashboard flex items-center justify-center text-gray-400 hover:text-primary hover:border-primary/30 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all"
                                                            >
                                                                <Zap
                                                                    size={14}
                                                                    className="animate-current transition-all duration-300 hover:scale-110"
                                                                />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent
                                                            side="bottom"
                                                            className="bg-gray-700 dark:bg-gray-800 text-white border border-gray-600/20 shadow-md font-bold"
                                                        >
                                                            Details
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>

                                            {/* Info Grid */}
                                            <div className="grid grid-cols-2 gap-y-3 text-sm mb-3">
                                                <div>
                                                    <p className="text-xs text-gray-500 mb-0.5">
                                                        Open Time
                                                    </p>
                                                    <p className="font-medium text-gray-700 dark:text-gray-300">
                                                        {utcTime(
                                                            entry.entryDate,
                                                            "dd MMM HH:mm"
                                                        )}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 mb-0.5">
                                                        Net Profit
                                                    </p>
                                                    <PnLDisplay
                                                        value={entry.pnl}
                                                    />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 mb-0.5">
                                                        Volume
                                                    </p>
                                                    <p className="font-mono text-gray-700 dark:text-gray-300">
                                                        {(entry as any)
                                                            .lotSize || "0.00"}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 mb-0.5">
                                                        Close Time
                                                    </p>
                                                    <p className="font-medium text-gray-700 dark:text-gray-300">
                                                        {entry.exitDate
                                                            ? utcTime(
                                                                  entry.exitDate
                                                              )
                                                            : "-"}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Tags & Mistakes Summary (Simulated simple view) */}
                                            <div className="flex flex-wrap gap-1 mb-3">
                                                {entry.strategy && (
                                                    <span className="px-2 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 rounded-lg border border-blue-100 dark:border-blue-500/20">
                                                        {entry.strategy}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Footer Actions */}
                                            <div className="pt-3 border-t border-dashboard flex justify-end">
                                                <Button
                                                    variant="outline"
                                                    onClick={() =>
                                                        handleEdit(entry)
                                                    }
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                >
                                                    <Edit2 size={14} />
                                                    Edit Trade
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* New Pagination Control */}
                            <div className="p-4 md:px-6 md:py-4 border-t border-dashboard bg-gray-50/50 dark:bg-white/[0.02]">
                                <PaginationControl
                                    currentPage={meta.page}
                                    totalPages={meta.totalPages}
                                    pageSize={meta.limit}
                                    totalItems={meta.total}
                                    onPageChange={(page) =>
                                        updateParams({ page: page.toString() })
                                    }
                                    onPageSizeChange={(size) =>
                                        updateParams({ limit: size.toString() })
                                    }
                                    itemName="trades"
                                />
                            </div>
                        </div>
                    )}
                </>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                title={editingEntry ? "Edit Trade" : "Log New Trade"}
            >
                <JournalForm
                    initialData={
                        editingEntry || { accountId: accountId || undefined }
                    } // Ensure undefined if null
                    isEditMode={!!editingEntry}
                    onSuccess={handleSuccess}
                    onCancel={handleModalClose}
                />
            </Modal>

            {(() => {
                const currentEntryIndex = selectedDetailEntry
                    ? displayedEntries.findIndex(
                          (e) => e.id === selectedDetailEntry.id
                      )
                    : -1;
                const hasNext =
                    currentEntryIndex >= 0 &&
                    currentEntryIndex < displayedEntries.length - 1;
                const hasPrev = currentEntryIndex > 0;

                const handleNextEntry = () => {
                    if (hasNext)
                        setSelectedDetailEntry(
                            displayedEntries[currentEntryIndex + 1]
                        );
                };

                const handlePrevEntry = () => {
                    if (hasPrev)
                        setSelectedDetailEntry(
                            displayedEntries[currentEntryIndex - 1]
                        );
                };

                return (
                    <TradeDetailSheet
                        entry={selectedDetailEntry}
                        strategies={strategies}
                        isOpen={isDetailOpen}
                        onClose={() => {
                            setIsDetailOpen(false);
                            setSelectedDetailEntry(null);
                        }}
                        onNext={handleNextEntry}
                        onPrev={handlePrevEntry}
                        hasNext={hasNext}
                        hasPrev={hasPrev}
                    />
                );
            })()}
        </>
    );
}
