"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { PlaybookFilters } from "./PlaybookFilters";
import { PlaybookGrid } from "./PlaybookGrid";
import { TradeQuickView } from "./TradeQuickView";

export function PlaybookDashboard() {
    const [trades, setTrades] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<"ALL" | "WIN" | "LOSS">("ALL");
    const [selectedTrade, setSelectedTrade] = useState<any | null>(null);

    useEffect(() => {
        fetchTrades();
    }, []);

    const fetchTrades = async () => {
        try {
            setIsLoading(true);
            // Fetch all trades, filter client-side for now or add API params later
            // We specifically need trades with images
            const res = await fetch("/api/journal-entries");
            if (!res.ok) throw new Error("Failed to fetch trades");

            const json = await res.json();
            // Filter only trades with images
            const tradesWithImages = json.data.filter((t: any) => t.images && t.images.length > 0);

            setTrades(tradesWithImages);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load playbook");
        } finally {
            setIsLoading(false);
        }
    };

    // Client-side filtering
    const filteredTrades = trades.filter(trade => {
        const matchesSearch = trade.symbol.toLowerCase().includes(search.toLowerCase());
        const matchesFilter =
            filter === "ALL" ? true :
                filter === "WIN" ? (trade.pnl || 0) > 0 :
                    filter === "LOSS" ? (trade.pnl || 0) < 0 : true;

        return matchesSearch && matchesFilter;
    });

    // Navigation handlers
    const handleNext = () => {
        if (!selectedTrade) return;
        const currentIndex = filteredTrades.findIndex(t => t.id === selectedTrade.id);
        if (currentIndex < filteredTrades.length - 1) {
            setSelectedTrade(filteredTrades[currentIndex + 1]);
        }
    };

    const handlePrev = () => {
        if (!selectedTrade) return;
        const currentIndex = filteredTrades.findIndex(t => t.id === selectedTrade.id);
        if (currentIndex > 0) {
            setSelectedTrade(filteredTrades[currentIndex - 1]);
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
                search={search}
                setSearch={setSearch}
                filter={filter}
                setFilter={setFilter}
            />

            <PlaybookGrid
                trades={filteredTrades}
                isLoading={isLoading}
                onTradeClick={setSelectedTrade}
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
