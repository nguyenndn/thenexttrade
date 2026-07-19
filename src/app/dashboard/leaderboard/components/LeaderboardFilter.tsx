"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface LeaderboardFilterProps {
    currentSortBy: "percentage" | "currency";
}

export function LeaderboardFilter({ currentSortBy }: LeaderboardFilterProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const handleSortChange = (sortBy: "percentage" | "currency") => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("sortBy", sortBy);
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="flex items-center bg-gray-50 dark:bg-white/5 p-1 rounded-xl border border-dashboard shrink-0 select-none gap-1">
            <button
                onClick={() => handleSortChange("percentage")}
                className={cn(
                    "rounded-lg px-4 py-2 text-xs font-bold transition-all duration-200 whitespace-nowrap",
                    currentSortBy === "percentage"
                        ? "bg-[#00C888] text-white shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5"
                )}
            >
                Percentage
            </button>
            <button
                onClick={() => handleSortChange("currency")}
                className={cn(
                    "rounded-lg px-4 py-2 text-xs font-bold transition-all duration-200 whitespace-nowrap",
                    currentSortBy === "currency"
                        ? "bg-[#00C888] text-white shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5"
                )}
            >
                Currency
            </button>
        </div>
    );
}
