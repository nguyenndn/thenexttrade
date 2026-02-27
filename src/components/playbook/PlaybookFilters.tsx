"use client";

import { Search, Filter, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";

interface PlaybookFiltersProps {
    search: string;
    setSearch: (value: string) => void;
    filter: "ALL" | "WIN" | "LOSS";
    setFilter: (value: "ALL" | "WIN" | "LOSS") => void;
}

export function PlaybookFilters({ search, setSearch, filter, setFilter }: PlaybookFiltersProps) {
    return (
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
            {/* Search */}
            <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                <input
                    type="text"
                    aria-label="Search trading symbol"
                    placeholder="Search symbol..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full h-full bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/5 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all text-gray-900 dark:text-white placeholder-gray-400 caret-primary"
                />
            </div>

            {/* Filter Tabs */}
            <div className="grid grid-cols-3 p-1 bg-gray-100 dark:bg-[#1E2028] border border-gray-200 dark:border-white/5 rounded-xl min-w-[300px]">
                {(["ALL", "WIN", "LOSS"] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all text-center ${filter === f
                            ? "bg-white dark:bg-[#2A2D36] text-gray-900 dark:text-white shadow-sm"
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                            }`}
                    >
                        {f === "ALL" ? "All Trades" : f === "WIN" ? "Winning" : "Losing"}
                    </button>
                ))}
            </div>
        </div>
    );
}
