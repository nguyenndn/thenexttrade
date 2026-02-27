"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { PlaybookFilters } from "./PlaybookFilters";
import { PlaybookGrid } from "./PlaybookGrid";
import { PaginationControl } from "@/components/ui/PaginationControl";
import { PageHeader } from "@/components/ui/PageHeader";
import dynamic from "next/dynamic";
import { useDebounce } from "@/hooks/useDebounce";

const TradeQuickView = dynamic(() => import("./TradeQuickView").then(mod => mod.TradeQuickView), {
    ssr: false,
    loading: () => null
});

export interface PlaybookTrade {
    id: string;
    symbol: string;
    type: "BUY" | "SELL";
    pnl: number | null;
    entryDate: string | Date;
    images: string[];
    notes?: string;
    emotionBefore?: string;
    emotionAfter?: string;
    entryReason?: string;
    exitReason?: string;
    entryPrice?: number | string;
    exitPrice?: number | string;
    strategy?: string;
    lotSize?: number | string;
}

interface PlaybookDashboardProps {
    initialEntries: PlaybookTrade[];
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

    const [trades, setTrades] = useState<PlaybookTrade[]>(initialEntries);
    const [selectedTrade, setSelectedTrade] = useState<PlaybookTrade | null>(null);
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
    const debouncedSearch = useDebounce(localSearch, 500);

    useEffect(() => {
        if (debouncedSearch !== searchParam) {
            updateParams({ search: debouncedSearch });
        }
    }, [debouncedSearch]);

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
            <PageHeader 
                title="Trading Playbook" 
                description="Visual library of your past setups."
                className="mb-8"
            />

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
