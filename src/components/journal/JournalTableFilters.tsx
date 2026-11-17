import { Search, ChevronDown, Settings2, Plus, SlidersHorizontal } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/Button";

interface JournalTableFiltersProps {
    searchTerm: string;
    setSearchTerm: (value: string) => void;
    handleSearch: (value: string) => void;
    filterType: string;
    filterTag: string;
    filterResult: string;
    filterStrategy: string;
    userTags: string[];
    strategies: string[];
    updateParams: (updates: Record<string, string | null | undefined>) => void;
    isColumnMenuOpen: boolean;
    setIsColumnMenuOpen: (open: boolean) => void;
    visibleColumns: Set<string>;
    toggleColumn: (id: string) => void;
    columnsConfig: { id: string; label: string }[];
    onLogTrade?: () => void;
}

export function JournalTableFilters({
    searchTerm,
    setSearchTerm,
    handleSearch,
    filterType,
    filterTag,
    filterResult,
    filterStrategy,
    userTags,
    strategies,
    updateParams,
    isColumnMenuOpen,
    setIsColumnMenuOpen,
    visibleColumns,
    toggleColumn,
    columnsConfig,
    onLogTrade,
}: JournalTableFiltersProps) {
    const activeFilterCount =
        (filterType && filterType !== "ALL" ? 1 : 0) +
        (userTags.length > 0 && filterTag && filterTag !== "ALL" ? 1 : 0) +
        (filterResult && filterResult !== "ALL" ? 1 : 0) +
        (strategies.length > 0 && filterStrategy ? 1 : 0);

    const renderSecondaryFilters = (isMobilePopover = false) => (
        <>
            {/* Type Filter */}
            <DropdownMenu className={isMobilePopover ? "w-full" : undefined}>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className={`flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300 ${
                            isMobilePopover ? "w-full justify-between h-9" : ""
                        }`}
                    >
                        <span className="whitespace-nowrap">
                            Type:{" "}
                            <span className="text-gold dark:text-amber-400 font-semibold">
                                {filterType === "ALL" ? "All" : filterType}
                            </span>
                        </span>
                        <ChevronDown size={14} className="shrink-0" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="start"
                    data-journal-filter-dropdown="true"
                >
                    {["ALL", "BUY", "SELL"].map((s) => (
                        <DropdownMenuItem
                            key={s}
                            onClick={() => updateParams({ type: s })}
                        >
                            {s === "ALL" ? "All Types" : s}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Tag Filter */}
            {userTags.length > 0 && (
                <DropdownMenu className={isMobilePopover ? "w-full" : undefined}>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className={`flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300 ${
                                isMobilePopover
                                    ? "w-full justify-between h-9"
                                    : ""
                            }`}
                        >
                            <span className="whitespace-nowrap truncate">
                                Tag:{" "}
                                <span className="text-gold dark:text-amber-400 font-semibold">
                                    {filterTag === "ALL" ? "All" : filterTag}
                                </span>
                            </span>
                            <ChevronDown size={14} className="shrink-0" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="start"
                        className="max-h-[250px] overflow-y-auto"
                        data-journal-filter-dropdown="true"
                    >
                        <DropdownMenuItem
                            onClick={() => updateParams({ tag: "ALL" })}
                        >
                            All Tags
                        </DropdownMenuItem>
                        {userTags.map((t) => (
                            <DropdownMenuItem
                                key={t}
                                onClick={() => updateParams({ tag: t })}
                            >
                                {t}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}

            {/* Result Filter */}
            <DropdownMenu className={isMobilePopover ? "w-full" : undefined}>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className={`flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300 ${
                            isMobilePopover ? "w-full justify-between h-9" : ""
                        }`}
                    >
                        <span className="whitespace-nowrap">
                            Result:{" "}
                            <span
                                className={
                                    filterResult === "WIN"
                                        ? "text-emerald-500 font-semibold"
                                        : filterResult === "LOSS"
                                          ? "text-red-500 font-semibold"
                                          : "text-gold dark:text-amber-400 font-semibold"
                                }
                            >
                                {filterResult === "ALL"
                                    ? "All"
                                    : filterResult === "BREAK_EVEN"
                                      ? "BE"
                                      : filterResult}
                            </span>
                        </span>
                        <ChevronDown size={14} className="shrink-0" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="start"
                    data-journal-filter-dropdown="true"
                >
                    {["ALL", "WIN", "LOSS", "BREAK_EVEN"].map((s) => (
                        <DropdownMenuItem
                            key={s}
                            onClick={() =>
                                updateParams({
                                    status: s === "ALL" ? null : s,
                                })
                            }
                        >
                            {s === "ALL"
                                ? "All Results"
                                : s === "BREAK_EVEN"
                                  ? "Break Even"
                                  : s}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Strategy Filter */}
            {strategies.length > 0 && (
                <DropdownMenu className={isMobilePopover ? "w-full" : undefined}>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className={`flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300 ${
                                isMobilePopover
                                    ? "w-full justify-between h-9"
                                    : ""
                            }`}
                        >
                            <span className="inline-flex items-center gap-1 min-w-0">
                                <span className="whitespace-nowrap">
                                    Strategy:
                                </span>
                                <span
                                    className={`text-gold dark:text-amber-400 font-semibold truncate ${
                                        isMobilePopover
                                            ? "max-w-[140px]"
                                            : "max-w-[80px]"
                                    }`}
                                >
                                    {filterStrategy || "All"}
                                </span>
                            </span>
                            <ChevronDown size={14} className="shrink-0" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="start"
                        className="max-h-[250px] overflow-y-auto"
                        data-journal-filter-dropdown="true"
                    >
                        <DropdownMenuItem
                            onClick={() => updateParams({ strategy: null })}
                        >
                            All Strategies
                        </DropdownMenuItem>
                        {strategies.map((s) => (
                            <DropdownMenuItem
                                key={s}
                                onClick={() => updateParams({ strategy: s })}
                            >
                                {s}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </>
    );

    return (
        <div className="flex items-center justify-between gap-2 md:gap-4 bg-white dark:bg-[#1E2028] p-3 sm:p-4 rounded-xl shadow-sm border border-dashboard">
            <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
                {/* Search */}
                <div className="flex items-center gap-2 px-3 md:px-4 h-9 md:h-auto md:py-2 bg-gray-50/80 dark:bg-[#151925] rounded-lg border border-dashboard focus-within:border-gold focus-within:ring-2 focus-within:ring-amber-500/20 transition-all flex-1 md:flex-none md:w-56 min-w-0">
                    <Search size={16} className="text-gray-500 shrink-0" />
                    <input
                        type="text"
                        aria-label="Filter by Pair or Symbol"
                        className="bg-transparent text-sm focus:outline-none w-full min-w-0 text-gray-700 dark:text-white"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            handleSearch(e.target.value);
                        }}
                    />
                </div>

                {/* Mobile Compact Filters Popover (< md) */}
                <div className="md:hidden shrink-0">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                size="smd"
                                className="px-2.5 sm:px-3 gap-1.5 font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap"
                            >
                                <SlidersHorizontal size={14} />
                                <span>Filters</span>
                                {activeFilterCount > 0 && (
                                    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-gold text-white text-[10px] font-black tabular-nums">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent
                            align="end"
                            className="w-64 p-3 rounded-xl bg-white dark:bg-[#1E2028] border border-dashboard shadow-xl space-y-2 md:hidden"
                            onPointerDownOutside={(e) => {
                                const target = e.target as HTMLElement | null;
                                if (
                                    target?.closest(
                                        '[data-journal-filter-dropdown="true"]'
                                    )
                                ) {
                                    e.preventDefault();
                                }
                            }}
                            onInteractOutside={(e) => {
                                const target = e.target as HTMLElement | null;
                                if (
                                    target?.closest(
                                        '[data-journal-filter-dropdown="true"]'
                                    )
                                ) {
                                    e.preventDefault();
                                }
                            }}
                        >
                            <div className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 pb-1">
                                Filter Trades
                            </div>
                            <div className="flex flex-col gap-2">
                                {renderSecondaryFilters(true)}
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Desktop Filters Group (>= md) */}
                <div className="hidden md:flex items-center gap-2 flex-wrap">
                    {renderSecondaryFilters(false)}
                </div>
            </div>

            {/* Action Buttons Group */}
            <div className="flex items-center gap-2 md:gap-3 shrink-0">
                <div className="hidden md:block">
                    <DropdownMenu
                        open={isColumnMenuOpen}
                        onOpenChange={setIsColumnMenuOpen}
                    >
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="smd"
                                className="flex items-center gap-2 font-medium text-gray-700 dark:text-gray-300"
                            >
                                <Settings2 size={16} />
                                Columns
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="w-56 bg-white dark:bg-[#1E2028] border border-dashboard max-h-[300px] overflow-y-auto"
                        >
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

                {onLogTrade && (
                    <Button
                        variant="primary"
                        onClick={onLogTrade}
                        className="shrink-0 whitespace-nowrap shadow-sm px-3 md:px-4"
                        size="smd"
                    >
                        <Plus size={16} strokeWidth={2.5} />
                        Log Trade
                    </Button>
                )}
            </div>
        </div>
    );
}
