"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, TrendingUp, TrendingDown, Calendar, Search, Settings2, ArrowUpDown, ChevronLeft, ChevronRight, ScrollText } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import JournalForm from "@/components/journal/JournalForm";
import JournalStats from "@/components/journal/JournalStats";
import { Modal } from "@/components/ui/Modal";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { StrategyCell } from "@/components/journal/cells/StrategyCell";
import { MindsetCell } from "@/components/journal/cells/MindsetCell";
import { TagsCell } from "@/components/journal/cells/TagsCell";
import { MistakesCell } from "@/components/journal/cells/MistakesCell";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MISTAKES, getMistakeSeverityColor } from "@/lib/mistakes";
import psychologyData from "@/data/psychology.json";
import { TradeDetailSheet } from "./TradeDetailSheet";

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
}



import { DashboardFilter } from "@/components/dashboard/DashboardFilter";

export default function JournalList() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const accountId = searchParams.get("accountId");

    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [strategies, setStrategies] = useState<any[]>([]); // Store strategies locally
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
    // Column Visibility State
    const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set([
        "symbol", "type", "volume", "pnl", "strategy", "mindset", "customTags", "mistakes"
    ]));
    
    // Date Filter (From URL - Global Header)
    const paramFrom = searchParams.get("from");
    const paramTo = searchParams.get("to");
    const dateRange = {
        start: paramFrom ? new Date(paramFrom) : undefined,
        end: paramTo ? new Date(paramTo) : undefined
    };

    // Fetch Strategies on mount
    useEffect(() => {
        fetch("/api/strategies")
            .then(res => res.json())
            .then(data => {
                if (data.strategies) setStrategies(data.strategies);
            })
            .catch(err => console.error("Failed to load strategies", err));
    }, []);

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

    // Filter State
    const [filter, setFilter] = useState({ symbol: "" });
    // Sort State
    const [sort, setSort] = useState<{ col: string; dir: "asc" | "desc" }>({ col: "entryDate", dir: "desc" });

    // Modal State
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

    // Trade Detail Sheet State
    const [selectedDetailEntry, setSelectedDetailEntry] = useState<JournalEntry | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    // Client-side Sorting Logic
    const sortedEntries = entries.slice().sort((a, b) => {
        const { col, dir } = sort;
        const multiplier = dir === "asc" ? 1 : -1;

        const getVal = (obj: any, key: string) => {
            if (key === "date" || key === "openTime") return new Date(obj.entryDate).getTime();
            if (key === "closeTime") return obj.exitDate ? new Date(obj.exitDate).getTime() : 0;
            if (key === "lotSize") return Number(obj.lotSize || 0);
            if (key === "pnl") return Number(obj.pnl || 0);
            if (key === "takeProfit") return Number(obj.takeProfit || 0);
            if (key === "stopLoss") return Number(obj.stopLoss || 0);
            return obj[key];
        };

        const valA = getVal(a, col);
        const valB = getVal(b, col);

        if (valA < valB) return -1 * multiplier;
        if (valA > valB) return 1 * multiplier;
        return 0;
    });

    const fetchEntries = async (page = 1) => {
        try {
            setIsLoading(true);
            const query = new URLSearchParams({
                page: page.toString(),
                limit: "10",
                ...(filter.symbol && { symbol: filter.symbol }),
                ...(accountId && { accountId }),
                // Add Date Filtering
                ...(dateRange?.start && { startDate: dateRange.start.toISOString() }),
                ...(dateRange?.end && { endDate: dateRange.end.toISOString() })
            });

            console.log("Journal Fetch Query:", query.toString()); // DEBUG LOG

            const res = await fetch(`/api/journal-entries?${query}`);
            const data = await res.json();

            if (data.data) {
                setEntries(data.data);
                setPagination({ page: data.meta.page, totalPages: data.meta.totalPages });
                if (data.stats) setStats(data.stats);
            }
        } catch (error) {
            toast.error("Failed to load journal entries");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchEntries(1);
        }, 500);
        return () => clearTimeout(timeout);
    }, [filter, accountId, paramFrom, paramTo]); // Re-fetch when URL Date/Account changes

    const handleSort = (colId: string) => {
        setSort(prev => ({
            col: colId,
            dir: prev.col === colId && prev.dir === "desc" ? "asc" : "desc"
        }));
    };

    const renderSortIcon = (colId: string) => {
        if (sort.col === colId) {
            return sort.dir === "asc" ? <TrendingUp size={14} className="text-primary" /> : <TrendingDown size={14} className="text-primary" />;
        }
        return <ArrowUpDown size={14} className="text-gray-300" />;
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this trade?")) return;

        try {
            const res = await fetch(`/api/journal-entries/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete");
            toast.success("Entry deleted");
            fetchEntries(pagination.page);
        } catch (error) {
            toast.error("Could not delete entry");
        }
    };

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
        fetchEntries(pagination.page);
        toast.success(editingEntry ? "Trade updated successfully" : "Trade logged successfully");
    };

    const handleEntryUpdate = async (id: string, data: any) => {
        // 1. Optimistic Update
        const previousEntries = [...entries];
        setEntries(prev => prev.map(entry =>
            entry.id === id ? { ...entry, ...data } : entry
        ));

        try {
            // 2. Call API quietly
            const res = await fetch(`/api/journal-entries/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) throw new Error("Failed to update");

            // Success: No need to reload or toast, it's instant.
            // fetchEntries(pagination.page); // Removed to prevent reload
        } catch (error) {
            // 3. Revert on failure
            console.error("Update failed", error);
            setEntries(previousEntries);
            toast.error("Failed to update entry");
        }
    };

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
                    <div className="flex items-center gap-3">
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

            {/* Filters & Controls */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white dark:bg-[#1E2028] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-white/5 rounded-xl border border-transparent focus-within:border-primary transition-colors w-full md:w-64">
                    <Search size={18} className="text-gray-400" />
                    <input
                        type="text"
                        placeholder="Filter by Pair (e.g. XAUUSD)"
                        className="bg-transparent text-sm focus:outline-none w-full text-gray-900 dark:text-white placeholder:text-gray-400"
                        value={filter.symbol}
                        onChange={(e) => setFilter({ symbol: e.target.value })}
                    />
                </div>

                {/* Reusable Filter Component moved to Header */}
                
                {/* Log Trade Button */}
                {/* Reusable Filter Component moved to Header */}

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
            <div className="bg-white dark:bg-[#1E2028] rounded-xl md:rounded-[2.5rem] p-4 md:p-8 shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-50 dark:bg-white/5 text-xs uppercase text-gray-400 font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-4 rounded-l-xl w-14"></th>
                                {columnsConfig.map((col) => (
                                    visibleColumns.has(col.id) && (
                                        <th
                                            key={col.id}
                                            className={`px-6 py-4 ${col.id === 'pnl' || col.id === 'tp' || col.id === 'sl' ? 'text-right' : col.id.toLowerCase().includes("time") || col.id === 'type' || col.id === 'volume' || col.id === 'mindset' ? 'text-center' : ''} cursor-pointer hover:text-gray-600 dark:hover:text-gray-200 group/th`}
                                            onClick={() => ["date", "symbol", "type", "openTime", "closeTime", "volume", "pnl", "tp", "sl"].includes(col.id) ? handleSort(col.id === "volume" ? "lotSize" : col.id === "tp" ? "takeProfit" : col.id === "sl" ? "stopLoss" : col.id) : null}
                                        >
                                            <div className={`flex items-center gap-1 ${col.id === 'pnl' || col.id === 'tp' || col.id === 'sl' ? 'justify-end' : col.id.toLowerCase().includes("time") || col.id === 'type' || col.id === 'volume' || col.id === 'mindset' ? 'justify-center' : ''}`}>
                                                {col.label}
                                                {["date", "symbol", "type", "openTime", "closeTime", "volume", "pnl", "tp", "sl"].includes(col.id) && renderSortIcon(col.id === "volume" ? "lotSize" : col.id === "tp" ? "takeProfit" : col.id === "sl" ? "stopLoss" : col.id)}
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
                                sortedEntries.map((entry) => (
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
                                                <td key={col.id} className={`px-6 py-4 ${col.id === 'pnl' || col.id === 'tp' || col.id === 'sl' ? 'text-right' : col.id.toLowerCase().includes("time") || col.id === 'type' || col.id === 'volume' || col.id === 'mindset' ? 'text-center' : ''}`}>
                                                    {col.id === "date" && format(new Date(entry.entryDate), "dd MMM yyyy")}
                                                    {col.id === "symbol" && <span className="font-bold text-gray-900 dark:text-white">{entry.symbol}</span>}
                                                    {col.id === "type" && (
                                                        <span className={`text-xs font-bold ${entry.type === 'BUY' ? 'text-blue-500' : 'text-red-500'}`}>
                                                            {entry.type}
                                                        </span>
                                                    )}
                                                    {col.id === "openTime" && format(new Date(entry.entryDate), "HH:mm")}
                                                    {col.id === "closeTime" && (entry.exitDate ? format(new Date(entry.exitDate), "HH:mm") : "-")}
                                                    {col.id === "volume" && <span className="font-mono text-gray-500">{(entry as any).lotSize || "0.00"}</span>}
                                                    {col.id === "pnl" && (
                                                        <span className={`font-mono font-bold ${entry.pnl && entry.pnl > 0 ? 'text-blue-500' : entry.pnl && entry.pnl < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                                                            {entry.pnl ? entry.pnl.toFixed(2) : "-"}
                                                        </span>
                                                    )}
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

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="flex justify-end mt-4">
                        <div className="flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-[#1E2028] border border-gray-100 dark:border-white/5 shadow-sm">
                            <button
                                disabled={pagination.page <= 1}
                                onClick={() => fetchEntries(pagination.page - 1)}
                                className="p-1.5 rounded-lg transition-all text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={16} />
                            </button>

                            <div className="flex items-center gap-1">
                                {(() => {
                                    const { page, totalPages } = pagination;
                                    const buttons = [];

                                    if (totalPages <= 7) {
                                        for (let i = 1; i <= totalPages; i++) buttons.push(i);
                                    } else {
                                        buttons.push(1);
                                        if (page > 3) buttons.push('...');

                                        let start = Math.max(2, page - 1);
                                        let end = Math.min(totalPages - 1, page + 1);

                                        if (page < 3) end = 4;
                                        if (page > totalPages - 2) start = totalPages - 3;

                                        for (let i = start; i <= end; i++) buttons.push(i);

                                        if (page < totalPages - 2) buttons.push('...');
                                        buttons.push(totalPages);
                                    }

                                    return buttons.map((p, idx) => (
                                        typeof p === 'number' ? (
                                            <button
                                                key={idx}
                                                onClick={() => fetchEntries(p)}
                                                className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold text-xs transition-all ${p === pagination.page
                                                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
                                                    }`}
                                            >
                                                {p}
                                            </button>
                                        ) : (
                                            <span key={idx} className="w-8 h-8 flex items-center justify-center text-gray-400 font-bold text-xs">...</span>
                                        )
                                    ));
                                })()}
                            </div>

                            <button
                                disabled={pagination.page >= pagination.totalPages}
                                onClick={() => fetchEntries(pagination.page + 1)}
                                className="p-1.5 rounded-lg transition-all text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                title={editingEntry ? "Edit Trade" : "Log New Trade"}
            >
                <JournalForm
                    initialData={editingEntry || { accountId }}
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
