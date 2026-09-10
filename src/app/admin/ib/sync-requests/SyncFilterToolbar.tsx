"use client";

import { Search, X, RefreshCw, ChevronDown, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { cn } from "@/lib/utils";

export interface StatusFilterOption {
    key: string;
    label: string;
    count: number;
    icon?: LucideIcon;
}

export interface RangeOption {
    value: string;
    label: string;
}

export interface TypeFilterOption {
    value: string;
    label: string;
}

interface SyncFilterToolbarProps {
    search: string;
    onSearchChange: (val: string) => void;
    onSearchSubmit?: () => void;
    onClearSearch?: () => void;
    searchPlaceholder?: string;
    statusTabs: StatusFilterOption[];
    activeStatus: string;
    onStatusChange: (statusKey: string) => void;
    typeValue?: string;
    typeOptions?: TypeFilterOption[];
    onTypeChange?: (type: string) => void;
    rangeValue?: string;
    rangeOptions?: RangeOption[];
    onRangeChange?: (range: string) => void;
    onRefresh: () => void;
    isRefreshing?: boolean;
    tabsId?: string;
}

export function SyncFilterToolbar({
    search,
    onSearchChange,
    onSearchSubmit,
    onClearSearch,
    searchPlaceholder = "Search...",
    statusTabs,
    activeStatus,
    onStatusChange,
    typeValue,
    typeOptions,
    onTypeChange,
    rangeValue,
    rangeOptions,
    onRangeChange,
    onRefresh,
    isRefreshing = false,
    tabsId = "sync-filter-status-tabs",
}: SyncFilterToolbarProps) {
    const selectedRange =
        rangeOptions?.find((option) => option.value === rangeValue) || rangeOptions?.[0];
    const selectedType =
        typeOptions?.find((option) => option.value === typeValue) || typeOptions?.[0];

    return (
        <div className="space-y-4">
            {/* Standardized Tab Navigation (Breek UI Guide Section 14) */}
            {statusTabs && statusTabs.length > 0 && (
                <Tabs
                    value={activeStatus}
                    onValueChange={onStatusChange}
                    tabsId={tabsId}
                >
                    <div className="overflow-x-auto scrollbar-hide flex">
                        <TabsList className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-1 gap-1 shrink-0">
                            {statusTabs.map((tab) => {
                                const isActive = activeStatus === tab.key;
                                const Icon = tab.icon;
                                return (
                                    <TabsTrigger
                                        key={tab.key}
                                        value={tab.key}
                                        className="px-4 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap border border-transparent hover:border-gray-200 dark:hover:border-white/10 flex items-center gap-2 cursor-pointer transition-colors"
                                        activeIndicatorClassName="!bg-gradient-to-r from-primary to-teal-500 shadow-md border-0"
                                        activeTextClassName="!text-white"
                                    >
                                        {Icon && (
                                            <Icon
                                                size={15}
                                                className={cn(
                                                    isActive
                                                        ? "text-white"
                                                        : "text-gray-400 dark:text-gray-500"
                                                )}
                                            />
                                        )}
                                        <span>{tab.label}</span>
                                        <span
                                            className={cn(
                                                "text-[11px] px-2 py-0.5 rounded-full font-mono font-bold tabular-nums transition-colors",
                                                isActive
                                                    ? "bg-white/20 text-white"
                                                    : "bg-gray-200/80 text-gray-600 dark:bg-white/10 dark:text-gray-300"
                                            )}
                                        >
                                            {tab.count}
                                        </span>
                                    </TabsTrigger>
                                );
                            })}
                        </TabsList>
                    </div>
                </Tabs>
            )}

            {/* Standalone Toolbar Card (Breek UI Guide Section 13.4, 13.5, 13.6) */}
            <div className="bg-white dark:bg-[#1E2028] p-4 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
                {/* Search Input (Section 13.4: 38px height) */}
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        onSearchSubmit?.();
                    }}
                    className="w-full md:w-96"
                >
                    <div className="flex items-center gap-2 px-3.5 py-2 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-colors w-full h-[38px]">
                        <Search size={16} className="text-gray-400 shrink-0" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => onSearchChange(e.target.value)}
                            aria-label="Search items"
                            placeholder={searchPlaceholder}
                            className="bg-transparent text-xs focus:outline-none w-full text-gray-800 dark:text-white placeholder:text-gray-400"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => {
                                    onSearchChange("");
                                    onClearSearch?.();
                                }}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5 rounded-full hover:bg-gray-200/50 dark:hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
                                aria-label="Clear search"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </form>

                <div className="flex items-center gap-2 self-end md:self-auto">
                    {/* Type Dropdown (Section 13.5) */}
                    {typeOptions && typeOptions.length > 0 && onTypeChange && (
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-gray-400">Type:</span>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="h-[38px] gap-1.5 rounded-xl px-3 text-xs font-bold"
                                    >
                                        {selectedType?.label || "All Types"}
                                        <ChevronDown size={14} className="opacity-60" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-52">
                                    {typeOptions.map((option) => (
                                        <DropdownMenuItem
                                            key={option.value}
                                            onClick={() => onTypeChange(option.value)}
                                            className={cn(
                                                "cursor-pointer text-xs font-semibold",
                                                typeValue === option.value &&
                                                    "bg-primary/10 text-primary font-bold"
                                            )}
                                        >
                                            {option.label}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}

                    {/* Range Dropdown (Section 13.5) */}
                    {rangeOptions && rangeOptions.length > 0 && onRangeChange && (
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-gray-400">Range:</span>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="h-[38px] gap-1.5 rounded-xl px-3 text-xs font-bold"
                                    >
                                        {selectedRange?.label || "All Time"}
                                        <ChevronDown size={14} className="opacity-60" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44">
                                    {rangeOptions.map((option) => (
                                        <DropdownMenuItem
                                            key={option.value}
                                            onClick={() => onRangeChange(option.value)}
                                            className={cn(
                                                "cursor-pointer text-xs font-semibold",
                                                rangeValue === option.value &&
                                                    "bg-primary/10 text-primary font-bold"
                                            )}
                                        >
                                            {option.label}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}

                    {/* Refresh Button */}
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={onRefresh}
                        aria-label="Refresh list"
                        className="h-[38px] w-[38px] min-w-[38px] aspect-square rounded-xl shrink-0 cursor-pointer"
                    >
                        <RefreshCw
                            size={14}
                            className={cn(isRefreshing && "animate-spin text-primary")}
                        />
                    </Button>
                </div>
            </div>
        </div>
    );
}
