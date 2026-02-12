"use client";

import { PlaybookCard } from "./PlaybookCard";
import { ImageOff } from "lucide-react";

interface PlaybookGridProps {
    trades: any[];
    isLoading: boolean;
    onTradeClick: (trade: any) => void;
}

export function PlaybookGrid({ trades, isLoading, onTradeClick }: PlaybookGridProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="aspect-[16/9] bg-gray-100 dark:bg-[#1E2028] rounded-xl animate-pulse border border-gray-100 dark:border-white/5" />
                ))}
            </div>
        );
    }

    if (trades.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white dark:bg-[#1E2028] rounded-xl border border-dashed border-gray-200 dark:border-white/10">
                <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-4 text-gray-400">
                    <ImageOff size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    No Screenshots Found
                </h3>
                <p className="text-gray-500 max-w-sm">
                    Trades with screenshots will appear here automatically. Add images to your journal entries to build your playbook.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {trades.map((trade) => (
                <PlaybookCard
                    key={trade.id}
                    trade={trade}
                    onClick={() => onTradeClick(trade)}
                />
            ))}
        </div>
    );
}
