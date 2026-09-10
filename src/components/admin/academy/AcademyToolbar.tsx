import {
    Search,
    X,
    LayoutGrid,
    List,
    FolderTree,
    Plus,
    ArrowUpDown,
    Check,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AccessFilter, SortOption, ViewMode } from "./types";

interface AcademyToolbarProps {
    searchQuery: string;
    onSearchChange: (q: string) => void;
    accessFilter: AccessFilter;
    onAccessFilterChange: (f: AccessFilter) => void;
    sortOption: SortOption;
    onSortOptionChange: (s: SortOption) => void;
    viewMode: ViewMode;
    onViewModeChange: (v: ViewMode) => void;
    totalCount: number;
    filteredCount: number;
    onAddNew: () => void;
}

const SORT_LABELS: Record<SortOption, string> = {
    ORDER_ASC: "Level: Ascending (1 → 12)",
    ORDER_DESC: "Level: Descending (12 → 1)",
    LESSONS_DESC: "Most Lessons",
    MODULES_DESC: "Most Modules",
    TITLE_ASC: "Alphabetical (A → Z)",
};

export function AcademyToolbar({
    searchQuery,
    onSearchChange,
    accessFilter,
    onAccessFilterChange,
    sortOption,
    onSortOptionChange,
    viewMode,
    onViewModeChange,
    totalCount,
    filteredCount,
    onAddNew,
}: AcademyToolbarProps) {
    return (
        <div className="space-y-3">
            {/* Main Action & Search Bar */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                {/* Search Bar */}
                <div className="relative flex-1 min-w-[280px]">
                    <Search
                        size={18}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search levels, modules, lessons..."
                        aria-label="Search levels, modules, lessons"
                        className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-800 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => onSearchChange("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded-lg transition-colors"
                            aria-label="Clear search"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                {/* Right controls: Filter, Sort, View, Add */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Access Filter Pills */}
                    <div className="flex items-center p-1 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl">
                        <button
                            type="button"
                            onClick={() => onAccessFilterChange("ALL")}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                accessFilter === "ALL"
                                    ? "bg-white dark:bg-[#1e2330] text-gray-900 dark:text-white shadow-sm"
                                    : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                            }`}
                        >
                            All ({totalCount})
                        </button>
                        <button
                            type="button"
                            onClick={() => onAccessFilterChange("PUBLIC")}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                accessFilter === "PUBLIC"
                                    ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
                                    : "text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400"
                            }`}
                        >
                            Public
                        </button>
                        <button
                            type="button"
                            onClick={() => onAccessFilterChange("MEMBER")}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                accessFilter === "MEMBER"
                                    ? "bg-primary text-white shadow-sm shadow-primary/30"
                                    : "text-gray-500 hover:text-primary dark:hover:text-primary"
                            }`}
                        >
                            Member
                        </button>
                    </div>

                    {/* Sort Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-10 px-3.5 gap-2 border-gray-200 dark:border-white/10 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200"
                                aria-label="Sort options"
                            >
                                <ArrowUpDown size={14} className="text-gray-500" />
                                <span className="hidden sm:inline">Sort:</span>
                                <span className="font-bold">
                                    {SORT_LABELS[sortOption]}
                                </span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 p-1 rounded-xl">
                            {(Object.keys(SORT_LABELS) as SortOption[]).map(
                                (option) => (
                                    <DropdownMenuItem
                                        key={option}
                                        onClick={() => onSortOptionChange(option)}
                                        className="flex items-center justify-between py-2 text-xs font-medium cursor-pointer rounded-lg"
                                    >
                                        <span>{SORT_LABELS[option]}</span>
                                        {sortOption === option && (
                                            <Check size={14} className="text-primary" />
                                        )}
                                    </DropdownMenuItem>
                                )
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* View Mode Switcher */}
                    <div className="flex items-center p-1 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl">
                        <button
                            type="button"
                            onClick={() => onViewModeChange("grid")}
                            className={`p-2 rounded-lg transition-all ${
                                viewMode === "grid"
                                    ? "bg-white dark:bg-[#1e2330] text-primary shadow-sm"
                                    : "text-gray-400 hover:text-gray-700 dark:hover:text-white"
                            }`}
                            aria-label="Grid view"
                            title="Grid View"
                        >
                            <LayoutGrid size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={() => onViewModeChange("table")}
                            className={`p-2 rounded-lg transition-all ${
                                viewMode === "table"
                                    ? "bg-white dark:bg-[#1e2330] text-primary shadow-sm"
                                    : "text-gray-400 hover:text-gray-700 dark:hover:text-white"
                            }`}
                            aria-label="Table view"
                            title="Table View"
                        >
                            <List size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={() => onViewModeChange("tree")}
                            className={`p-2 rounded-lg transition-all ${
                                viewMode === "tree"
                                    ? "bg-white dark:bg-[#1e2330] text-primary shadow-sm"
                                    : "text-gray-400 hover:text-gray-700 dark:hover:text-white"
                            }`}
                            aria-label="Hierarchy tree view"
                            title="Curriculum Tree View"
                        >
                            <FolderTree size={16} />
                        </button>
                    </div>

                    {/* Add New Level Button */}
                    <Button
                        onClick={onAddNew}
                        className="h-10 px-4 gap-2 font-bold shadow-md shadow-primary/20 rounded-xl"
                    >
                        <Plus size={16} strokeWidth={2.5} />
                        <span>Add Level</span>
                    </Button>
                </div>
            </div>

            {/* Results Feedback Bar */}
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
                <span>
                    Showing{" "}
                    <strong className="text-gray-800 dark:text-white font-bold">
                        {filteredCount}
                    </strong>{" "}
                    of {totalCount} levels
                    {searchQuery && (
                        <span>
                            {" "}
                            matching &quot;
                            <span className="text-primary font-medium">
                                {searchQuery}
                            </span>
                            &quot;
                        </span>
                    )}
                </span>
                {searchQuery && (
                    <button
                        type="button"
                        onClick={() => onSearchChange("")}
                        className="text-xs font-semibold text-primary hover:underline"
                    >
                        Reset search
                    </button>
                )}
            </div>
        </div>
    );
}
