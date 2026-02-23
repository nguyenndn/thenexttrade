import { Search, ChevronDown, Settings2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu";

interface JournalTableFiltersProps {
    searchTerm: string;
    setSearchTerm: (value: string) => void;
    handleSearch: (value: string) => void;
    filterType: string;
    filterTag: string;
    userTags: string[];
    updateParams: (updates: Record<string, string | null | undefined>) => void;
    isColumnMenuOpen: boolean;
    setIsColumnMenuOpen: (open: boolean) => void;
    visibleColumns: Set<string>;
    toggleColumn: (id: string) => void;
    columnsConfig: { id: string; label: string }[];
}

export function JournalTableFilters({
    searchTerm,
    setSearchTerm,
    handleSearch,
    filterType,
    filterTag,
    userTags,
    updateParams,
    isColumnMenuOpen,
    setIsColumnMenuOpen,
    visibleColumns,
    toggleColumn,
    columnsConfig
}: JournalTableFiltersProps) {
    return (
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
    );
}
