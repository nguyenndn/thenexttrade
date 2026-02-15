"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { PlaybookFilters } from "./PlaybookFilters";
import { PlaybookGrid } from "./PlaybookGrid";
import { PaginationControl } from "@/components/ui/PaginationControl";
import dynamic from "next/dynamic";

const TradeQuickView = dynamic(() => import("./TradeQuickView").then(mod => mod.TradeQuickView), {
    ssr: false,
    loading: () => null
});

interface PlaybookDashboardProps {
    initialEntries: any[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export function PlaybookDashboard({ initialEntries, meta }: PlaybookDashboardProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // URL Params
    const searchParam = searchParams.get("search") || "";
    const filter = searchParams.get("filter") || "ALL";

    const [trades, setTrades] = useState<any[]>(initialEntries);
    const [selectedTrade, setSelectedTrade] = useState<any | null>(null);
    const [localSearch, setLocalSearch] = useState(searchParam);

    // Sync local search with URL param if it changes externally
    useEffect(() => {
        setLocalSearch(searchParam);
    }, [searchParam]);

    useEffect(() => {
        setTrades(initialEntries);
    }, [initialEntries]);

    // Update URL helper
    const updateParams = (updates: Record<string, string | null | undefined>) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(updates).forEach(([key, value]) => {
            if (value === null || value === undefined || value === "") {
                params.delete(key);
            } else {
                params.set(key, value);
            }
        });
        if (!updates.page && (updates.search !== undefined || updates.filter !== undefined)) {
            params.set("page", "1");
        }
        router.push(`?${params.toString()}`);
    };

    // Debounce Search
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (localSearch !== searchParam) {
                updateParams({ search: localSearch });
            }
        }, 500);
        return () => clearTimeout(timeout);
    }, [localSearch]);

    // Handlers
    const setSearch = (value: string) => {
        setLocalSearch(value);
    };

    const setFilter = (value: string) => {
        updateParams({ filter: value });
    };

    // Navigation handlers
    const handleNext = () => {
        if (!selectedTrade) return;
        const currentIndex = trades.findIndex(t => t.id === selectedTrade.id);
        if (currentIndex < trades.length - 1) {
            setSelectedTrade(trades[currentIndex + 1]);
        }
    };

    const handlePrev = () => {
        if (!selectedTrade) return;
        const currentIndex = trades.findIndex(t => t.id === selectedTrade.id);
        if (currentIndex > 0) {
            setSelectedTrade(trades[currentIndex - 1]);
        }
    };

    return (
        <div className="min-h-screen pb-20">
            <div className="flex flex-col gap-2 border-b border-gray-100 dark:border-white/5 pb-8 mb-8">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 bg-primary rounded-full"></div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">
                            Trading Playbook
                        </h1>
                    </div>
                </div>
                <p className="text-lg text-gray-500 dark:text-gray-400 font-medium pl-4.5">
                    Visual library of your past setups.
                </p>
            </div>

            <PlaybookFilters
                search={localSearch}
                setSearch={setSearch}
                filter={filter as "ALL" | "WIN" | "LOSS"}
                setFilter={setFilter}
            />

            <PlaybookGrid
                trades={trades}
                isLoading={false}
                onTradeClick={setSelectedTrade}
            />

            {/* Pagination */}
            <PaginationControl
                currentPage={meta.page}
                totalPages={meta.totalPages}
                pageSize={meta.limit}
                totalItems={meta.total}
                onPageChange={(page) => updateParams({ page: page.toString() })}
                onPageSizeChange={(size) => updateParams({ limit: size.toString() })}
                itemName="playbook entries"
                pageSizeOptions={[12, 24, 48, 96]}
            />

            {/* Quick View Modal */}
            {selectedTrade && (
                <TradeQuickView
                    trade={selectedTrade}
                    onClose={() => setSelectedTrade(null)}
                    onNext={handleNext}
                    onPrev={handlePrev}
                />
            )}
        </div>
    );
}
