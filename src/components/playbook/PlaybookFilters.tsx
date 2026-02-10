"use client";

import { Search, Filter, Calendar as CalendarIcon, ArrowDownUp } from "lucide-react";

interface PlaybookFiltersProps {
    search: string;
    setSearch: (value: string) => void;
    filter: "ALL" | "WIN" | "LOSS";
    setFilter: (value: "ALL" | "WIN" | "LOSS") => void;
}

export function PlaybookFilters({ search, setSearch, filter, setFilter }: PlaybookFiltersProps) {
    return (
        <div className="flex flex-col md:flex-row gap-4 mb-8">
            {/* Search */}
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Search symbol..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white dark:bg-[#1E2028] border border-gray-100 dark:border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all text-gray-900 dark:text-white placeholder-gray-400"
                />
            </div>

            {/* Filter Tabs */}
            <div className="grid grid-cols-3 p-1 bg-gray-100 dark:bg-[#1E2028] border border-gray-200 dark:border-white/5 rounded-xl w-full md:w-auto">
                {(["ALL", "WIN", "LOSS"] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-2 md:px-4 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all text-center ${filter === f
                            ? "bg-white dark:bg-[#2A2D36] text-gray-900 dark:text-white shadow-sm"
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                            }`}
                    >
                        {f === "ALL" ? "All" : f === "WIN" ? "Wins" : "Losses"}
                    </button>
                ))}
            </div>

            {/* Sort (Placeholder for now) */}
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#1E2028] border border-gray-100 dark:border-white/5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <ArrowDownUp size={16} />
                <span className="hidden md:inline">Newest First</span>
            </button>
        </div>
    );
}
