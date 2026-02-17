"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Search, Settings2, ArrowUpDown, ScrollText, ChevronDown, CalendarDays, List } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import JournalStats from "@/components/journal/JournalStats";
import { Modal } from "@/components/ui/Modal";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { StrategyCell } from "@/components/journal/cells/StrategyCell";
import { MindsetCell } from "@/components/journal/cells/MindsetCell";
import { TagsCell } from "@/components/journal/cells/TagsCell";
import { MistakesCell } from "@/components/journal/cells/MistakesCell";
import { DashboardFilter } from "@/components/dashboard/DashboardFilter";
import { PaginationControl } from "@/components/ui/PaginationControl";
import { TradeTypeBadge } from "@/components/ui/TradeTypeBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PnLDisplay } from "@/components/ui/PnLDisplay";
import dynamic from "next/dynamic";
import { useDebouncedCallback } from "use-debounce";
import { CalendarHeatmap } from "@/components/journal/CalendarHeatmap";
import { getDailyPnlForCalendar } from "@/actions/journal";

// Dynamic Imports for Modals
const JournalForm = dynamic(() => import("@/components/journal/JournalForm"), {
    loading: () => <div className="p-8 text-center text-gray-500">Loading form...</div>,
    ssr: false
});
const TradeDetailSheet = dynamic(() => import("./TradeDetailSheet").then(mod => mod.TradeDetailSheet), {
    ssr: false
});

import { updateJournalEntry, deleteJournalEntry } from "@/actions/journal";

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
    strategies: any[];
    userTags?: string[];
}

export default function JournalList({ initialEntries, meta, strategies: initialStrategies, userTags = [] }: JournalListProps) {
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

    // Convert initial data
    const [entries, setEntries] = useState<any[]>(initialEntries);
    // Sync entries when initialEntries change (e.g. after server refetch)
    useEffect(() => {
        setEntries(initialEntries);
    }, [initialEntries]);

    const strategies = initialStrategies || [];
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    // View Mode: list or calendar
    const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
    const [calendarData, setCalendarData] = useState<{ date: string; pnl: number; tradeCount: number }[]>([]);
    const [isCalendarLoading, setIsCalendarLoading] = useState(false);

    // Fetch calendar data when switching to calendar view
    useEffect(() => {
        if (viewMode === "calendar" && calendarData.length === 0) {
            setIsCalendarLoading(true);
            getDailyPnlForCalendar(accountId || undefined)
                .then(data => setCalendarData(data))
                .finally(() => setIsCalendarLoading(false));
        }
    }, [viewMode, accountId]);

    // Column Visibility State
    const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set([
        "symbol", "type", "volume", "pnl", "strategy", "mindset", "customTags", "mistakes", "status"
    ]));

    // Fetch Strategies on mount - REMOVED (Passed via props)

    // Available Columns Configuration
    const columnsConfig = [
        { id: "date", label: "Date" },
        { id: "symbol", label: "Symbol" },
        { id: "type", label: "Type" },
        { id: "status", label: "Status" },
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
                setVisibleColumns(new Set(parsed));
            } catch (e) {
                console.error("Failed to parse saved columns", e);
            }
        }
    }, []);

    // Save columns when changed
    useEffect(() => {
        localStorage.setItem("journal_columns", JSON.stringify(Array.from(visibleColumns)));
    }, [visibleColumns]);

    // Helper to update URL params
    const updateParams = (updates: Record<string, string | null | undefined>) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(updates).forEach(([key, value]) => {
            if (value === null || value === undefined || value === "") {
                params.delete(key);
            } else {
                params.set(key, value);
            }
        });
        // Reset to page 1 on filter change usually, except if explicit page update
        if (!updates.page && (updates.symbol !== undefined || updates.type !== undefined || updates.status !== undefined)) {
            params.set("page", "1");
        }
        router.push(`?${params.toString()}`);
    };

    // Handlers
    const handleSort = (colId: string) => {
        const currentSort = searchParams.get("sort");
        const currentDir = searchParams.get("dir");
        const newDir = currentSort === colId && currentDir === "desc" ? "asc" : "desc";
        updateParams({ sort: colId, dir: newDir });
    };

    const renderSortIcon = (colId: string) => {
        const sort = searchParams.get("sort");
        const dir = searchParams.get("dir");
        if (sort === colId) {
            return dir === "asc" ? <ArrowUpDown size={14} className="text-primary rotate-180" /> : <ArrowUpDown size={14} className="text-primary" />;
        }
        return <ArrowUpDown size={14} className="text-gray-300 opacity-50" />;
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this trade?")) return;
        try {
            const res = await deleteJournalEntry(id);
            if (res.error) throw new Error(res.error);
            toast.success("Entry deleted");
            // Server action revalidates path, Router refresh will happen automatically or we can force it
            router.refresh();
        } catch (error) {
            toast.error("Could not delete entry");
        }
    };

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

    // Trade Detail Sheet State
    const [selectedDetailEntry, setSelectedDetailEntry] = useState<JournalEntry | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const handleCreate = () => {
        setEditingEntry(null);
        setIsModalOpen(true);
    };

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
        toast.success(editingEntry ? "Trade updated successfully" : "Trade logged successfully");
        router.refresh();
    };

    const handleEntryUpdate = async (id: string, data: any) => {
        // Optimistic Update
        const previousEntries = [...entries];
        setEntries(prev => prev.map(entry =>
            entry.id === id ? { ...entry, ...data } : entry
        ));

        try {
            const res = await updateJournalEntry(id, data);
            if (res.error) throw new Error(res.error);
        } catch (error) {
            console.error("Update failed", error);
            setEntries(previousEntries);
            toast.error("Failed to update entry");
        }
    };

    // Search State
    const [searchTerm, setSearchTerm] = useState(filterSymbol);

    const handleSearch = useDebouncedCallback((value: string) => {
        updateParams({ symbol: value });
    }, 500);

    // Sync local search when URL changes
    useEffect(() => {
        setSearchTerm(filterSymbol);
    }, [filterSymbol]);

    return (
        <>
            {/* Header */}
            <div className="flex flex-col gap-2 border-b border-gray-100 dark:border-white/5 pb-8">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 bg-primary rounded-full"></div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">
                            Trading Journal
                        </h1>
                    </div>
                    {/* Filter (Account + Date) - Matched to Dashboard Layout */}
                    <div className="flex items-center gap-2">
                        {/* View Toggle */}
                        <div className="hidden sm:flex items-center bg-gray-100 dark:bg-white/5 rounded-lg p-0.5">
                            <button
                                onClick={() => setViewMode("list")}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === "list"
                                    ? "bg-white dark:bg-[#1E2028] text-gray-900 dark:text-white shadow-sm"
                                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                    }`}
                            >
                                <List size={14} />
                                List
                            </button>
                            <button
                                onClick={() => setViewMode("calendar")}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === "calendar"
                                    ? "bg-white dark:bg-[#1E2028] text-gray-900 dark:text-white shadow-sm"
                                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                    }`}
                            >
                                <CalendarDays size={14} />
                                Calendar
                            </button>
                        </div>
                        <DashboardFilter currentAccountId={accountId || undefined} />
                        <button
                            onClick={handleCreate}
                            className="bg-primary hover:bg-[#00a872] text-white border-none shadow-lg shadow-primary/30 rounded-xl px-4 py-2 h-10 text-sm font-bold flex items-center gap-2 hover:-translate-y-1 transition-all active:scale-95 whitespace-nowrap"
                        >
                            <Plus size={18} strokeWidth={2.5} />
                            Log Trade
                        </button>
                    </div>
                </div>
                <p className="text-lg text-gray-500 dark:text-gray-400 font-medium pl-4.5">
                    Track your trades and analyze your performance.
                </p>
            </div>

            {stats && <JournalStats stats={stats} />}

            {/* Calendar View */}
            {viewMode === "calendar" ? (
                <div className="mt-2">
                    {isCalendarLoading ? (
                        <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-100 dark:border-gray-800 p-12 text-center">
                            <div className="animate-pulse text-gray-400">Loading calendar data...</div>
                        </div>
                    ) : (
                        <CalendarHeatmap
                            dailyData={calendarData}
                            onDayClick={(date) => {
                                updateParams({ from: date, to: date });
                                setViewMode("list");
                            }}
                        />
                    )}
                </div>
            ) : (
                <>
                    {/* Filters & Controls */}
                    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white dark:bg-[#1E2028] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/5">
                        <div className="flex flex-col md:flex-row items-center gap-4 flex-1">
                            {/* Search */}
                            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-white/5 rounded-xl border border-transparent focus-within:border-primary transition-colors w-full md:w-64">
                                <Search size={18} className="text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Filter by Pair (e.g. XAUUSD)"
                                    className="bg-transparent text-sm focus:outline-none w-full text-gray-900 dark:text-white placeholder:text-gray-400"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        handleSearch(e.target.value);
                                    }}
                                />
                            </div>

                            {/* Filters Group */}
                            <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
                                {/* Type Filter */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors whitespace-nowrap">
                                            Type: <span className="text-primary">{filterType === "ALL" ? "All" : filterType}</span>
                                            <ChevronDown size={14} />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                        {["ALL", "BUY", "SELL"].map((s) => (
                                            <DropdownMenuItem key={s} onClick={() => updateParams({ type: s })}>
                                                {s === "ALL" ? "All Types" : s}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                {/* Tag Filter */}
                                {userTags.length > 0 && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors whitespace-nowrap">
                                                Tag: <span className="text-primary">{filterTag === "ALL" ? "All" : filterTag}</span>
                                                <ChevronDown size={14} />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start" className="max-h-[250px] overflow-y-auto">
                                            <DropdownMenuItem onClick={() => updateParams({ tag: "ALL" })}>
                                                All Tags
                                            </DropdownMenuItem>
                                            {userTags.map((t) => (
                                                <DropdownMenuItem key={t} onClick={() => updateParams({ tag: t })}>
                                                    {t}
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                        </div>

                        {/* Column Toggle */}
                        <DropdownMenu open={isColumnMenuOpen} onOpenChange={setIsColumnMenuOpen}>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">
                                    <Settings2 size={16} />
                                    Columns
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-[#1E2028] border border-gray-100 dark:border-white/10 max-h-[300px] overflow-y-auto">
                                <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {columnsConfig.map((col) => (
                                    <DropdownMenuCheckboxItem
                                        key={col.id}
                                        checked={visibleColumns.has(col.id)}
                                        onCheckedChange={() => toggleColumn(col.id)}
                                    >
                                        {col.label}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Table */}
                    <div className="bg-white dark:bg-[#1E2028] rounded-xl p-4 md:p-8 shadow-sm border border-gray-100 dark:border-white/5">
                        <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-white/5">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-gray-50 dark:bg-white/5 text-xs uppercase text-gray-400 font-bold tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4 rounded-l-xl w-14"></th>
                                        {columnsConfig.map((col) => (
                                            visibleColumns.has(col.id) && (
                                                <th
                                                    key={col.id}
                                                    className={`px-6 py-4 ${col.id === 'pnl' || col.id === 'tp' || col.id === 'sl' ? 'text-right' : col.id.toLowerCase().includes("time") || col.id === 'type' || col.id === 'volume' || col.id === 'mindset' || col.id === 'status' ? 'text-center' : ''} cursor-pointer hover:text-gray-600 dark:hover:text-gray-200 group/th`}
                                                    onClick={() => ["date", "symbol", "type", "openTime", "closeTime", "volume", "pnl", "tp", "sl", "status"].includes(col.id) ? handleSort(col.id === "volume" ? "lotSize" : col.id === "tp" ? "takeProfit" : col.id === "sl" ? "stopLoss" : col.id) : null}
                                                >
                                                    <div className={`flex items-center gap-1 ${col.id === 'pnl' || col.id === 'tp' || col.id === 'sl' ? 'justify-end' : col.id.toLowerCase().includes("time") || col.id === 'type' || col.id === 'volume' || col.id === 'mindset' || col.id === 'status' ? 'justify-center' : ''}`}>
                                                        {col.label}
                                                        {["date", "symbol", "type", "openTime", "closeTime", "volume", "pnl", "tp", "sl", "status"].includes(col.id) && renderSortIcon(col.id === "volume" ? "lotSize" : col.id === "tp" ? "takeProfit" : col.id === "sl" ? "stopLoss" : col.id)}
                                                    </div>
                                                </th>
                                            )
                                        ))}
                                        <th className="px-6 py-4 rounded-r-xl w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={14} className="px-6 py-8 text-center text-gray-500">Loading...</td>
                                        </tr>
                                    ) : entries.length === 0 ? (
                                        <tr>
                                            <td colSpan={14} className="px-6 py-8 text-center text-gray-500">No trades recorded yet.</td>
                                        </tr>
                                    ) : (
                                        entries.map((entry) => (
                                            <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedDetailEntry(entry);
                                                            setIsDetailOpen(true);
                                                        }}
                                                        className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all hover:scale-110 active:scale-95 group/icon"
                                                    >
                                                        <ScrollText size={16} className="group-hover/icon:rotate-3 transition-transform" />
                                                    </button>
                                                </td>
                                                {columnsConfig.map((col) => (
                                                    visibleColumns.has(col.id) && (
                                                        <td key={col.id} className={`px-6 py-4 ${col.id === 'pnl' || col.id === 'tp' || col.id === 'sl' ? 'text-right' : col.id.toLowerCase().includes("time") || col.id === 'type' || col.id === 'volume' || col.id === 'mindset' || col.id === 'status' ? 'text-center' : ''}`}>
                                                            {col.id === "date" && format(new Date(entry.entryDate), "dd MMM yyyy")}
                                                            {col.id === "symbol" && <span className="font-bold text-gray-900 dark:text-white">{entry.symbol}</span>}
                                                            {col.id === "type" && <TradeTypeBadge type={entry.type} />}
                                                            {col.id === "status" && <StatusBadge status={entry.status} />}
                                                            {col.id === "openTime" && format(new Date(entry.entryDate), "HH:mm")}
                                                            {col.id === "closeTime" && (entry.exitDate ? format(new Date(entry.exitDate), "HH:mm") : "-")}
                                                            {col.id === "volume" && <span className="font-mono text-gray-500">{(entry as any).lotSize || "0.00"}</span>}
                                                            {col.id === "pnl" && <PnLDisplay value={entry.pnl} />}
                                                            {col.id === "tp" && <span className="font-mono text-primary font-medium">{(entry as any).takeProfit || "-"}</span>}
                                                            {col.id === "sl" && <span className="font-mono text-red-500 font-medium">{(entry as any).stopLoss || "-"}</span>}
                                                            {col.id === "strategy" && (
                                                                <StrategyCell entry={entry} strategies={strategies} onUpdate={handleEntryUpdate} />
                                                            )}
                                                            {col.id === "mindset" && (
                                                                <MindsetCell entry={entry} onUpdate={handleEntryUpdate} />
                                                            )}
                                                            {col.id === "customTags" && (
                                                                <TagsCell entry={entry} onUpdate={handleEntryUpdate} />
                                                            )}
                                                            {col.id === "mistakes" && (
                                                                <MistakesCell entry={entry} onUpdate={handleEntryUpdate} />
                                                            )}
                                                        </td>
                                                    )
                                                ))}
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => handleEdit(entry)} className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                                                            <Edit2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* New Pagination Control */}
                        <PaginationControl
                            currentPage={meta.page}
                            totalPages={meta.totalPages}
                            pageSize={meta.limit}
                            totalItems={meta.total}
                            onPageChange={(page) => updateParams({ page: page.toString() })}
                            onPageSizeChange={(size) => updateParams({ limit: size.toString() })}
                            itemName="trades"
                        />
                    </div>
                </>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                title={editingEntry ? "Edit Trade" : "Log New Trade"}
            >
                <JournalForm
                    initialData={editingEntry || { accountId: accountId || undefined }} // Ensure undefined if null
                    isEditMode={!!editingEntry}
                    onSuccess={handleSuccess}
                    onCancel={handleModalClose}
                />
            </Modal>

            <TradeDetailSheet
                entry={selectedDetailEntry}
                strategies={strategies}
                isOpen={isDetailOpen}
                onClose={() => {
                    setIsDetailOpen(false);
                    setSelectedDetailEntry(null);
                }}
            />
        </>
    );
}
