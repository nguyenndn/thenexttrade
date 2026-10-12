"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { PeriodFilter } from "../actions";

interface LeaderboardFilterProps {
    currentSortBy: "percentage" | "currency";
    currentPeriod?: PeriodFilter;
    onOpenMethodology?: () => void;
}

const PERIODS: { value: PeriodFilter; label: string }[] = [
    { value: "7D", label: "7D" },
    { value: "30D", label: "30D" },
    { value: "90D", label: "90D" },
    { value: "ALL", label: "All" },
];

export function LeaderboardFilter({
    currentSortBy,
    currentPeriod = "30D",
    onOpenMethodology,
}: LeaderboardFilterProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const handleParamChange = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set(key, value);
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="flex flex-wrap items-center gap-2">
            {/* Period Selector */}
            <div className="flex items-center bg-gray-50 dark:bg-white/5 p-1 rounded-lg border border-dashboard shrink-0 select-none gap-1">
                {PERIODS.map((p) => (
                    <Button
                        key={p.value}
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleParamChange("period", p.value)}
                        className={cn(
                            "rounded-lg px-2.5 py-1.5 h-auto text-xs font-bold transition-all duration-200 whitespace-nowrap",
                            currentPeriod === p.value
                                ? "bg-gold text-white shadow-sm hover:bg-gold"
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5"
                        )}
                    >
                        {p.label}
                    </Button>
                ))}
            </div>

            {/* SortBy Selector */}
            <div className="flex items-center bg-gray-50 dark:bg-white/5 p-1 rounded-lg border border-dashboard shrink-0 select-none gap-1">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleParamChange("sortBy", "percentage")}
                    className={cn(
                        "rounded-lg px-3 py-1.5 h-auto text-xs font-bold transition-all duration-200 whitespace-nowrap",
                        currentSortBy === "percentage"
                            ? "bg-gold text-white shadow-sm hover:bg-gold"
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5"
                    )}
                >
                    Win Rate (%)
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleParamChange("sortBy", "currency")}
                    className={cn(
                        "rounded-lg px-3 py-1.5 h-auto text-xs font-bold transition-all duration-200 whitespace-nowrap",
                        currentSortBy === "currency"
                            ? "bg-gold text-white shadow-sm hover:bg-gold"
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5"
                    )}
                >
                    Net P&L ($)
                </Button>
            </div>

            {/* Methodology Info Button */}
            {onOpenMethodology && (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onOpenMethodology}
                    className="p-2 h-auto rounded-lg bg-gray-50 dark:bg-white/5 border border-dashboard hover:bg-amber-50 dark:hover:bg-amber-500/10 text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors flex items-center gap-1.5 text-xs font-semibold"
                    title="Methodology & Rules"
                    aria-label="Methodology & Rules"
                >
                    <HelpCircle size={15} />
                    <span className="hidden sm:inline">Rules</span>
                </Button>
            )}
        </div>
    );
}
